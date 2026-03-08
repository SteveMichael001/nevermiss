#!/bin/bash
# Test the ElevenLabs post-call webhook locally
# Usage: ./scripts/test-postcall-webhook.sh [base_url]
# Default: http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/webhook/elevenlabs?skip_hmac=1"
CONV_ID="test_conv_$(date +%s)"

echo "Sending test post-call payload to: ${ENDPOINT}"
echo "Conversation ID: ${CONV_ID}"
echo ""

HTTP_CODE=$(curl -s -o /tmp/webhook_response.json -w "%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "post_call_transcription",
  "event_timestamp": 1741464000,
  "data": {
    "agent_id": "agent_0201kk1w0yzsf6vv5aqnkcpmh6wm",
    "conversation_id": "'"${CONV_ID}"'",
    "status": "done",
    "transcript": [
      {"role": "agent", "message": "Thanks for calling Coconut Bangers Balls Home Services!", "time_in_call_secs": 0},
      {"role": "user", "message": "Hi I have a burst pipe in my basement", "time_in_call_secs": 3},
      {"role": "agent", "message": "That sounds like an emergency! Can I get your name?", "time_in_call_secs": 6},
      {"role": "user", "message": "James Mercer", "time_in_call_secs": 10}
    ],
    "metadata": {
      "start_time_unix_secs": 1741464000,
      "call_duration_secs": 97
    },
    "analysis": {
      "call_successful": "success",
      "data_collection_results": {
        "caller_name": {"value": "James Mercer"},
        "service_needed": {"value": "burst pipe, emergency"},
        "urgency": {"value": "emergency"},
        "preferred_callback": {"value": "+16099771254"}
      }
    },
    "conversation_initiation_client_data": {
      "dynamic_variables": {
        "business_name": "Coconut Bangers Balls Home Services",
        "owner_name": "Steve",
        "owner_phone": "+16099771254",
        "business_id": "3caac44c-4399-4d52-83a7-3a81ac48c39e",
        "caller_phone": "+16099771254"
      }
    }
  }
}')

BODY=$(cat /tmp/webhook_response.json)

echo "HTTP Status: ${HTTP_CODE}"
echo "Response: ${BODY}"
echo ""

if echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('success') else 1)" 2>/dev/null; then
  echo "Webhook processed successfully!"
  echo "  Check Supabase 'calls' table for the new record"
  echo "  Check phone +16099771254 for SMS notification"
else
  echo "Webhook did not return success"
  echo "  Check the Next.js dev server console for error details"
fi

rm -f /tmp/webhook_response.json
