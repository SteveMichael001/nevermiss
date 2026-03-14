# NeverMiss Test Caller

This directory contains an isolated Python test harness for automated inbound-call simulations against the NeverMiss phone line at `+1 619-648-2491`.

## Files

- `scenarios/basic.json`: broken furnace, callback requested
- `scenarios/urgent.json`: winter HVAC emergency
- `scenarios/short.json`: short mumbled call that hangs up quickly
- `twiml_server.py`: Flask app that serves scenario-specific TwiML on port `5055`
- `run_test.py`: CLI runner that starts an outbound Twilio call and waits for completion
- `verifier.py`: post-call verifier for Supabase call logs and recent Twilio SMS messages

## Install

Use Python 3 and install the local test dependencies:

```bash
cd ~/Projects/nevermiss/testing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The scripts load secrets from these files, in order, if present:

1. `~/Projects/nevermiss/apps/web/.env.local`
2. `~/Projects/nevermiss/.env.local`
3. `~/Projects/nevermiss/.env`

Required environment variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_SMS_NUMBER` for default caller ID and SMS verification filter
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Run The TwiML Server

Start the local Flask server:

```bash
cd ~/Projects/nevermiss/testing
python3 twiml_server.py
```

Check a scenario manually:

```bash
curl "http://localhost:5055/twiml?scenario=basic"
```

## Expose Port 5055 Through Cloudflare Tunnel

Twilio must be able to fetch the TwiML URL, so `http://localhost:5055` needs to be reachable from the public internet.

If your named tunnel `apps-dashboard` already routes a hostname to local port `5055`, export that public base URL before running the test:

```bash
export TEST_TWIML_BASE_URL="https://your-public-hostname.example.com"
```

If the tunnel config is not already pointing at port `5055`, update the `apps-dashboard` ingress to forward requests to `http://localhost:5055`, then use the resulting public hostname as `TEST_TWIML_BASE_URL`.

The runner defaults to `http://localhost:5055`, but Twilio cannot reach localhost directly, so in practice you should set `TEST_TWIML_BASE_URL` to the Cloudflare tunnel URL.

## Run A Test

From another terminal:

```bash
cd ~/Projects/nevermiss/testing
source .venv/bin/activate
python3 run_test.py --scenario basic
```

Optional caller ID override:

```bash
python3 run_test.py --scenario urgent --from-number +18339015846
```

The runner will:

1. Load Twilio credentials from env files or the current shell
2. Place an outbound call from the selected Twilio number to `+16196482491`
3. Point Twilio at `/twiml?scenario=<name>`
4. Poll the Twilio API until the call finishes or three minutes elapse
5. Run `verifier.py` and print PASS/FAIL checks

## Verify Separately

You can run verification against a known Twilio call SID:

```bash
cd ~/Projects/nevermiss/testing
source .venv/bin/activate
python3 verifier.py CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Checks performed:

- Supabase `calls` row matched by `twilio_call_sid`
- Fallback call row from the last five minutes if exact SID is missing
- Transcript presence
- `sms_sent_at` notification timestamp
- Recent Twilio SMS activity from the configured SMS number in the last ten minutes
