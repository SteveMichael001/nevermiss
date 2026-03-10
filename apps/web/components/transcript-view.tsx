interface TranscriptViewProps {
  transcript: string | null
}

interface TranscriptTurn {
  speaker: string
  message: string
}

function parseTranscript(transcript: string): TranscriptTurn[] {
  return transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/)
      if (!match) {
        return {
          speaker: 'Transcript',
          message: line,
        }
      }

      const rawSpeaker = match[1].trim()
      const normalized = rawSpeaker.toLowerCase()
      const speaker =
        normalized === 'agent'
          ? 'AI Agent'
          : normalized === 'user'
            ? 'Caller'
            : rawSpeaker

      return {
        speaker,
        message: match[2].trim(),
      }
    })
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  if (!transcript) {
    return <p className="text-sm text-zinc-400 italic">No transcript available</p>
  }

  const turns = parseTranscript(transcript)

  return (
    <div className="space-y-3">
      {turns.map((turn, index) => {
        const isAgent = turn.speaker === 'AI Agent'

        return (
          <div
            key={`${turn.speaker}-${index}`}
            className={isAgent ? 'ml-0 sm:mr-10' : 'ml-0 sm:ml-10'}
          >
            <div className="border border-zinc-200 bg-white p-4">
              <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400">
                {turn.speaker}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                {turn.message}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
