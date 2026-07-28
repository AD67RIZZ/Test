import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { GameEngine } from './gameEngine'

const GameCanvas = forwardRef(function GameCanvas(
  { active, paused, settings, onScore, onCoin, onJump, onGameOver, onTap },
  ref,
) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const callbacksRef = useRef({ onScore, onCoin, onJump, onGameOver })

  callbacksRef.current = { onScore, onCoin, onJump, onGameOver }

  useEffect(() => {
    const engine = new GameEngine(
      canvasRef.current,
      {
        onScore: (...args) => callbacksRef.current.onScore?.(...args),
        onCoin: (...args) => callbacksRef.current.onCoin?.(...args),
        onJump: (...args) => callbacksRef.current.onJump?.(...args),
        onGameOver: (...args) => callbacksRef.current.onGameOver?.(...args),
      },
      settings,
    )
    engineRef.current = engine
    return () => engine.destroy()
  }, [])

  useEffect(() => {
    engineRef.current?.setSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!engineRef.current) return
    if (active && !paused) engineRef.current.start()
    else engineRef.current.pause()
  }, [active, paused])

  useImperativeHandle(ref, () => ({
    jump: () => engineRef.current?.jump(),
    reset: () => engineRef.current?.reset(),
  }))

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onPointerDown={(event) => {
        event.preventDefault()
        onTap()
      }}
      aria-label="Infinite Parkour game area. Tap to jump."
    />
  )
})

export default GameCanvas
