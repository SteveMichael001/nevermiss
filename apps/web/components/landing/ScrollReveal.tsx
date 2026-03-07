'use client'

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

const easeOutExpo = [0.16, 1, 0.3, 1] as const

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}

export function ScrollReveal({ children, delay = 0, className, y = 24 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        ease: easeOutExpo,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  staggerDelay?: number
  delayChildren?: number
}

export function StaggerContainer({ children, className, style, staggerDelay = 0.1, delayChildren = 0 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
