'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { motion } from 'framer-motion'

interface CounterStatProps {
  end: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function CounterStat({
  end,
  prefix = '',
  suffix = '',
  duration = 2000,
  className,
}: CounterStatProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [count, setCount] = useState(0)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    let raf: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))

      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        setCount(end)
        // Tiny settle pulse after count completes
        setTimeout(() => setSettled(true), 50)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end, duration])

  const formatted = count.toLocaleString('en-US')

  return (
    <motion.span
      ref={ref}
      className={className}
      animate={settled ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  )
}
