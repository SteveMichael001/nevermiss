// NOTE: The ElevenLabs native Twilio endpoint (api.us.elevenlabs.io/twilio/inbound_call)
// is used for call routing. The twimlElevenLabs WebSocket stream function below is kept
// for reference but is not used in production.
export function twimlElevenLabs(
  agentId: string,
  callerPhone: string,
  callSid: string,
  businessId: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.us.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}">
      <Parameter name="caller_phone" value="${callerPhone}"/>
      <Parameter name="twilio_call_sid" value="${callSid}"/>
      <Parameter name="business_id" value="${businessId}"/>
    </Stream>
  </Connect>
</Response>`
}

export function twimlEmptyResponse(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response/>'
}
