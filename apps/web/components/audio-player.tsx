'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'

interface AudioPlayerProps {
  callId: string
  duration?: number
  className?: string
}

export function AudioPlayer({ callId, duration, className }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration ?? 0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  async function loadAudio() {
    if (audioUrl) return
    setLoading(true)
    try {
      const res = await fetch(`/api/calls/${callId}/audio`)
      const data = await res.json()
      setAudioUrl(data.url)
    } catch (err) {
      console.error('Failed to load audio', err)
    } finally {
      setLoading(false)
    }
  }

  async function togglePlay() {
    if (!audioUrl) {
      await loadAudio()
    }
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    audio.src = audioUrl

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onDurationChange = () => {
      setTotalDuration(audio.duration)
    }
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)

    if (playing) {
      audio.play().catch(() => setPlaying(false))
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl, playing])

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !totalDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * totalDuration
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <audio ref={audioRef} preload="none" />

      <button
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
        disabled={loading}
        className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors flex-shrink-0 disabled:opacity-60"
      >
        {loading ? (
          <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
        ) : playing ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="h-1.5 bg-gray-200 rounded-full cursor-pointer relative"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(totalDuration))}</span>
        </div>
      </div>

      <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  )
}
