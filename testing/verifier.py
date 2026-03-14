from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client
from twilio.rest import Client as TwilioClient


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATHS = [
    PROJECT_ROOT / "apps" / "web" / ".env.local",
    PROJECT_ROOT / ".env.local",
    PROJECT_ROOT / ".env",
]


@dataclass
class CheckResult:
    name: str
    passed: bool
    details: str


def load_env() -> None:
    for env_path in ENV_PATHS:
        if env_path.is_file():
            load_dotenv(env_path, override=False)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def get_supabase() -> Client:
    return create_client(
        require_env("NEXT_PUBLIC_SUPABASE_URL"),
        require_env("SUPABASE_SERVICE_ROLE_KEY"),
    )


def get_twilio() -> TwilioClient:
    return TwilioClient(
        require_env("TWILIO_ACCOUNT_SID"),
        require_env("TWILIO_AUTH_TOKEN"),
    )


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def format_timestamp(value: str | None) -> str:
    parsed = parse_iso_datetime(value)
    if not parsed:
        return value or "n/a"
    return parsed.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def find_call_record(supabase: Client, call_sid: str) -> tuple[dict[str, Any] | None, str]:
    exact = (
        supabase.table("calls")
        .select(
            "id, created_at, twilio_call_sid, caller_name, caller_phone, service_needed, urgency, "
            "preferred_callback, full_transcript, sms_sent_at, notification_latency_ms"
        )
        .eq("twilio_call_sid", call_sid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if exact.data:
        return exact.data[0], "exact twilio_call_sid match"

    recent_cutoff = (utc_now() - timedelta(minutes=5)).isoformat()
    recent = (
        supabase.table("calls")
        .select(
            "id, created_at, twilio_call_sid, caller_name, caller_phone, service_needed, urgency, "
            "preferred_callback, full_transcript, sms_sent_at, notification_latency_ms"
        )
        .gte("created_at", recent_cutoff)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if recent.data:
        return recent.data[0], "fallback recent call within 5 minutes"

    return None, "no matching or recent call found"


def find_recent_sms(twilio_client: TwilioClient, from_number: str | None) -> tuple[Any | None, str]:
    sent_after = utc_now() - timedelta(minutes=10)
    kwargs: dict[str, Any] = {"date_sent_after": sent_after, "limit": 20}
    if from_number:
        kwargs["from_"] = from_number

    messages = twilio_client.messages.list(**kwargs)
    if messages:
        newest = sorted(
            messages,
            key=lambda item: item.date_sent or item.date_created or utc_now(),
            reverse=True,
        )[0]
        return newest, f"{len(messages)} message(s) found in last 10 minutes"

    return None, "no recent Twilio messages found"


def build_results(call_sid: str, sms_from_number: str | None = None) -> list[CheckResult]:
    supabase = get_supabase()
    twilio_client = get_twilio()

    call_record, call_match_reason = find_call_record(supabase, call_sid)
    call_checks: list[CheckResult] = []

    if call_record:
        transcript = (call_record.get("full_transcript") or "").strip()
        call_checks.append(
            CheckResult(
                name="Supabase call record",
                passed=True,
                details=(
                    f"{call_match_reason}; created_at={format_timestamp(call_record.get('created_at'))}; "
                    f"stored_sid={call_record.get('twilio_call_sid')}"
                ),
            )
        )
        call_checks.append(
            CheckResult(
                name="Transcript captured",
                passed=bool(transcript),
                details=f"transcript_length={len(transcript)} characters",
            )
        )
        call_checks.append(
            CheckResult(
                name="Notification timestamp recorded",
                passed=bool(call_record.get("sms_sent_at")),
                details=(
                    f"sms_sent_at={format_timestamp(call_record.get('sms_sent_at'))}; "
                    f"notification_latency_ms={call_record.get('notification_latency_ms')}"
                ),
            )
        )
    else:
        call_checks.append(
            CheckResult(
                name="Supabase call record",
                passed=False,
                details=call_match_reason,
            )
        )
        call_checks.append(
            CheckResult(
                name="Transcript captured",
                passed=False,
                details="no call record available to inspect transcript",
            )
        )
        call_checks.append(
            CheckResult(
                name="Notification timestamp recorded",
                passed=False,
                details="no call record available to inspect notification fields",
            )
        )

    recent_sms, sms_reason = find_recent_sms(twilio_client, sms_from_number)
    if recent_sms:
        sms_details = (
            f"{sms_reason}; sid={recent_sms.sid}; status={recent_sms.status}; "
            f"from={recent_sms.from_}; to={recent_sms.to}; "
            f"sent_at={format_timestamp(recent_sms.date_sent.isoformat() if recent_sms.date_sent else None)}"
        )
        call_checks.append(CheckResult(name="Recent SMS sent", passed=True, details=sms_details))
    else:
        call_checks.append(CheckResult(name="Recent SMS sent", passed=False, details=sms_reason))

    return call_checks


def print_report(call_sid: str, sms_from_number: str | None = None) -> int:
    results = build_results(call_sid, sms_from_number=sms_from_number)
    print(f"Verification report for call_sid={call_sid}")
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.name}: {result.details}")
    return 0 if all(result.passed for result in results) else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify NeverMiss post-call records and SMS notifications.")
    parser.add_argument("call_sid", help="Twilio call SID to verify.")
    parser.add_argument(
        "--sms-from-number",
        default=os.getenv("TWILIO_SMS_NUMBER", "").strip() or None,
        help="Optional SMS sender number to filter recent Twilio messages.",
    )
    return parser.parse_args()


def main() -> int:
    load_env()
    args = parse_args()
    return print_report(args.call_sid, sms_from_number=args.sms_from_number)


if __name__ == "__main__":
    raise SystemExit(main())
