from __future__ import annotations

import json
from pathlib import Path
from xml.sax.saxutils import escape

from flask import Flask, Response, abort, request


APP_ROOT = Path(__file__).resolve().parent
SCENARIOS_DIR = APP_ROOT / "scenarios"
PORT = 5055

app = Flask(__name__)


def load_scenario(name: str) -> dict:
    scenario_path = SCENARIOS_DIR / f"{name}.json"
    if not scenario_path.is_file():
        abort(404, description=f"Unknown scenario '{name}'")

    with scenario_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    lines = data.get("lines")
    if not isinstance(lines, list) or not lines:
        abort(400, description=f"Scenario '{name}' has no lines")

    return data


def build_twiml(scenario: dict) -> str:
    parts = ['<?xml version="1.0" encoding="UTF-8"?>', "<Response>"]

    for line in scenario["lines"]:
        pause_before = float(line.get("pause_before", 0))
        text = str(line.get("text", "")).strip()

        if pause_before > 0:
            parts.append(f'  <Pause length="{max(1, round(pause_before))}"/>')

        if text:
            parts.append(f'  <Say voice="alice">{escape(text)}</Say>')

    parts.append("  <Hangup/>")
    parts.append("</Response>")
    return "\n".join(parts)


@app.get("/twiml")
def twiml() -> Response:
    scenario_name = request.args.get("scenario", "basic").strip().lower()
    scenario = load_scenario(scenario_name)
    return Response(build_twiml(scenario), mimetype="text/xml")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
