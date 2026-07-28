import { useCallback, useEffect, useRef } from 'react'

const NOTES = [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 369.99]

export function useGameAudio({ soundOn, musicOn, muted, isPlaying }) {
  const contextRef = useRef(null)
  const musicTimerRef = useRef(null)
  const stepRef = useRef(0)

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      contextRef.current = new AudioContext()
    }
    if (contextRef.current.state === 'suspended') contextRef.current.resume()
    return contextRef.current
  }, [])

  const tone = useCallback(
    (frequency, duration, type = 'sine', volume = 0.08, slide = 0) => {
      if (!soundOn || muted) return
      const context = getContext()
      if (!context) return

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, now)
      if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + duration + 0.02)
    },
    [getContext, muted, soundOn],
  )

  const playJump = useCallback(
    (secondJump = false) => {
      tone(secondJump ? 520 : 410, 0.13, 'triangle', 0.09, 210)
    },
    [tone],
  )

  const playCoin = useCallback(() => {
    tone(880, 0.08, 'sine', 0.08, 350)
    window.setTimeout(() => tone(1318, 0.1, 'sine', 0.055), 55)
  }, [tone])

  const playGameOver = useCallback(() => {
    tone(220, 0.24, 'sawtooth', 0.08, -90)
    window.setTimeout(() => tone(130, 0.35, 'triangle', 0.07, -55), 130)
  }, [tone])

  // A tiny procedural music loop keeps the project asset-free and fully static.
  useEffect(() => {
    window.clearInterval(musicTimerRef.current)
    if (!musicOn || muted || !isPlaying) return undefined

    const playMusicStep = () => {
      const context = getContext()
      if (!context) return
      const now = context.currentTime
      const frequency = NOTES[stepRef.current % NOTES.length]
      stepRef.current += 1

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.32)
    }

    playMusicStep()
    musicTimerRef.current = window.setInterval(playMusicStep, 360)
    return () => window.clearInterval(musicTimerRef.current)
  }, [getContext, isPlaying, musicOn, muted])

  useEffect(
    () => () => {
      window.clearInterval(musicTimerRef.current)
      contextRef.current?.close()
    },
    [],
  )

  return { getContext, playJump, playCoin, playGameOver }
}
