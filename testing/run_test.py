from __future__ import annotations

import argparse
import os
import time
from pathlib import Path
from typing import Sequence

from dotenv import load_dotenv
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client as TwilioClient

import verifier


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATHS = [
    PROJECT_ROOT / "apps" / "web" / ".env.local",
    PROJECT_ROOT / ".env.local",
    PROJECT_ROOT / ".env",
]
NEVERMISS_NUMBER = "+16196482491"
MAX_WAIT_SECONDS = 180
POLL_INTERVAL_SECONDS = 5


def load_env() -> None:
    for env_path in ENV_PATHS:
        if env_path.is_file():
            load_dotenv(env_path, override=False)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def get_twilio_client() -> TwilioClient:
    return TwilioClient(
        require_env("TWILIO_ACCOUNT_SID"),
        require_env("TWILIO_AUTH_TOKEN"),
    )


def get_twiml_base_url() -> str:
    return os.getenv("TEST_TWIML_BASE_URL", "http://localhost:5055").rstrip("/")


def build_twiml_url(scenario: str) -> str:
    return f"{get_twiml_base_url()}/twiml?scenario={scenario}"


def create_call(client: TwilioClient, from_number: str, scenario: str):
    return client.calls.create(
        to=NEVERMISS_NUMBER,
        from_=from_number,
        url=build_twiml_url(scenario),
    )


def wait_for_completion(client: TwilioClient, call_sid: str) -> str:
    deadline = time.time() + MAX_WAIT_SECONDS
    last_status = "queued"

    while time.time() < deadline:
        call = client.calls(call_sid).fetch()
        last_status = call.status
        print(f"[poll] status={call.status} duration={call.duration}")

        if call.status in {"completed", "failed", "busy", "no-answer", "canceled"}:
            return call.status

        time.sleep(POLL_INTERVAL_SECONDS)

    raise TimeoutError(
        f"Call {call_sid} did not complete within {MAX_WAIT_SECONDS} seconds; last_status={last_status}"
    )


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Place a NeverMiss automated test call.")
    parser.add_argument(
        "--scenario",
        required=True,
        choices=["basic", "urgent", "short"],
        help="Scenario name from testing/scenarios.",
    )
    parser.add_argument(
        "--from-number",
        default="",
        help="Caller ID to use. Defaults to TWILIO_SMS_NUMBER, then TWILIO_PHONE_NUMBER.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    load_env()
    args = parse_args(argv)

    from_number = (
        args.from_number.strip()
        or os.getenv("TWILIO_SMS_NUMBER", "").strip()
        or require_env("TWILIO_PHONE_NUMBER")
    )
    twiml_base_url = get_twiml_base_url()
    twiml_url = build_twiml_url(args.scenario)

    if "localhost" in twiml_base_url or "127.0.0.1" in twiml_base_url:
        print(
            "Warning: TEST_TWIML_BASE_URL is local-only. Twilio cannot reach localhost directly. "
            "Expose port 5055 through your tunnel or set TEST_TWIML_BASE_URL to the tunnel URL."
        )

    print(f"Starting test call scenario={args.scenario}")
    print(f"From: {from_number}")
    print(f"To:   {NEVERMISS_NUMBER}")
    print(f"TwiML URL: {twiml_url}")

    client = get_twilio_client()

    try:
        call = create_call(client, from_number, args.scenario)
    except TwilioRestException as exc:
        print(f"Failed to create call: {exc}")
        return 1

    print(f"Call created: sid={call.sid} status={call.status}")

    try:
        final_status = wait_for_completion(client, call.sid)
    except TimeoutError as exc:
        print(str(exc))
        return 1

    print(f"Call finished with status={final_status}")
    print()
    return verifier.print_report(
        call.sid,
        sms_from_number=os.getenv("TWILIO_SMS_NUMBER", "").strip() or None,
    )


if __name__ == "__main__":
    raise SystemExit(main())
