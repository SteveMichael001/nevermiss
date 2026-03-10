import type { SupabaseClient } from '@supabase/supabase-js'

function normalizeStoragePath(path: string): string {
  return path.startsWith('recordings/') ? path.slice('recordings/'.length) : path
}

export async function fetchAndStoreRecording(
  conversationId: string,
  callId: string,
  supabase: SupabaseClient
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()

  if (!apiKey) {
    console.warn('[recordings] ELEVENLABS_API_KEY not set; skipping recording fetch')
    return
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: {
        'xi-api-key': apiKey,
      },
    }
  )

  if (!response.ok) {
    console.warn(
      `[recordings] Failed to fetch recording for conversation=${conversationId}: ${response.status} ${response.statusText}`
    )
    return
  }

  const audioBuffer = await response.arrayBuffer()
  const bucketPath = `${callId}.mp3`
  const storagePath = `recordings/${bucketPath}`

  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(bucketPath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { error: updateError } = await supabase
    .from('calls')
    .update({ recording_url: storagePath })
    .eq('id', callId)

  if (updateError) {
    throw updateError
  }
}

export function getRecordingObjectPath(recordingUrl: string): string {
  return normalizeStoragePath(recordingUrl)
}
