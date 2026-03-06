/**
 * POST /api/webhook/twilio/status
 *
 * Twilio call status callback — fires when a call's status changes
 * (completed, failed, busy, no-answer, canceled).
 *
 * For calls routed to the owner's cell (in-hours), we log the outcome here.
 * For calls routed to ElevenLabs (out-of-hours), ElevenLabs handles its own
 * post-call webhook — this just handles the Twilio-level status event.
 *
 * Always returns 200 — Twilio retries on non-200.
 */

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid')?.toString() ?? ''
    const callStatus = formData.get('CallStatus')?.toString() ?? ''
    const to = formData.get('To')?.toString() ?? ''
    const from = formData.get('From')?.toString() ?? ''
    const duration = formData.get('CallDuration')?.toString() ?? '0'

    console.log(
      `[twilio/status] CallSid=${callSid} Status=${callStatus} To=${to} From=${from} Duration=${duration}s`
    )

    // No-op for now — ElevenLabs post-call webhook handles out-of-hours leads.
    // In-hours calls (owner answered) are logged here for future call history tracking.
    // TODO: insert a minimal call record for in-hours answered calls (no lead capture needed,
    // but useful for usage stats and billing).

    return new Response('', { status: 200 })
  } catch (err) {
    console.error('[twilio/status] Unhandled error:', err)
    return new Response('', { status: 200 })
  }
}
