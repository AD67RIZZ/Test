import { useCallback, useEffect, useRef, useState } from 'react'
import GameCanvas from './game/GameCanvas'
import GameIcon from './components/GameIcon'
import { GameOver, PauseMenu, SettingsMenu, StartScreen, Tutorial } from './components/Menus'
import { useGameAudio } from './hooks/useGameAudio'

const readNumber = (key) => {
  const value = Number.parseInt(localStorage.getItem(key) || '0', 10)
  return Number.isFinite(value) ? value : 0
}

const readSettings = () => {
  try {
    return {
      soundOn: true,
      musicOn: true,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ...JSON.parse(localStorage.getItem('infinite-parkour-settings') || '{}'),
    }
  } catch {
    return { soundOn: true, musicOn: true, reducedMotion: false }
  }
}

export default function App() {
  const gameRef = useRef(null)
  const [screen, setScreen] = useState('menu')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(readSettings)
  const [muted, setMuted] = useState(false)
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [highScore, setHighScore] = useState(() => readNumber('infinite-parkour-high-score'))
  const [newBest, setNewBest] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(
    () => localStorage.getItem('infinite-parkour-tutorial-seen') !== 'true',
  )

  const isPlaying = screen === 'playing'
  const { getContext, playJump, playCoin, playGameOver } = useGameAudio({
    ...settings,
    muted,
    isPlaying,
  })

  const saveSettings = useCallback((nextSettings) => {
    setSettings(nextSettings)
    localStorage.setItem('infinite-parkour-settings', JSON.stringify(nextSettings))
  }, [])

  const startRun = useCallback(() => {
    getContext()
    setScore(0)
    setCoins(0)
    setNewBest(false)
    gameRef.current?.reset()
    setScreen('playing')
  }, [getContext])

  const handleJump = useCallback(() => {
    if (screen === 'playing' && !settingsOpen) gameRef.current?.jump()
  }, [screen, settingsOpen])

  const handleGameOver = useCallback(
    (finalScore, finalCoins) => {
      setScore(finalScore)
      setCoins(finalCoins)
      const beatBest = finalScore > highScore
      setNewBest(beatBest)
      if (beatBest) {
        setHighScore(finalScore)
        localStorage.setItem('infinite-parkour-high-score', String(finalScore))
      }
      playGameOver()
      window.setTimeout(() => setScreen('gameover'), settings.reducedMotion ? 120 : 430)
    },
    [highScore, playGameOver, settings.reducedMotion],
  )

  const togglePause = useCallback(() => {
    if (settingsOpen || screen === 'gameover' || screen === 'menu') return
    setScreen((current) => (current === 'playing' ? 'paused' : 'playing'))
  }, [screen, settingsOpen])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
        event.preventDefault()
        handleJump()
      } else if (event.code === 'Escape') {
        event.preventDefault()
        if (settingsOpen) setSettingsOpen(false)
        else togglePause()
      } else if (event.code === 'KeyR' && screen === 'gameover') {
        startRun()
      } else if (event.code === 'KeyM') {
        setMuted((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleJump, screen, settingsOpen, startRun, togglePause])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && screen === 'playing') setScreen('paused')
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [screen])

  return (
    <main className={`app-shell ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <GameCanvas
        ref={gameRef}
        active={screen !== 'menu'}
        paused={screen !== 'playing'}
        settings={settings}
        onScore={(nextScore, nextCoins) => {
          setScore(nextScore)
          setCoins(nextCoins)
        }}
        onCoin={playCoin}
        onJump={playJump}
        onGameOver={handleGameOver}
        onTap={handleJump}
      />

      <header className={`game-hud ${screen === 'menu' ? 'hud-hidden' : ''}`}>
        <div className="score-block">
          <span>Distance</span>
          <strong>{score.toLocaleString()} <small>m</small></strong>
        </div>
        <div className="coin-counter" aria-label={`${coins} coins`}>
          <i>◆</i> {coins}
        </div>
        <div className="hud-actions">
          <button
            className="icon-button"
            onClick={(event) => {
              event.stopPropagation()
              setMuted((value) => !value)
            }}
            aria-label={muted ? 'Unmute all audio' : 'Mute all audio'}
          >
            <GameIcon name={muted ? 'mute' : 'sound'} />
          </button>
          {screen === 'playing' && (
            <button className="icon-button" onClick={togglePause} aria-label="Pause game">
              <GameIcon name="pause" />
            </button>
          )}
        </div>
      </header>

      {screen === 'menu' && (
        <div className="screen-layer">
          <StartScreen highScore={highScore} onStart={startRun} onSettings={() => setSettingsOpen(true)} />
        </div>
      )}

      {screen === 'paused' && !settingsOpen && (
        <div className="screen-layer backdrop">
          <PauseMenu
            score={score}
            onResume={() => setScreen('playing')}
            onRestart={startRun}
            onSettings={() => setSettingsOpen(true)}
            onHome={() => setScreen('menu')}
          />
        </div>
      )}

      {screen === 'gameover' && (
        <div className="screen-layer backdrop">
          <GameOver
            score={score}
            coins={coins}
            highScore={highScore}
            isNewBest={newBest}
            onRestart={startRun}
            onHome={() => setScreen('menu')}
          />
        </div>
      )}

      {tutorialOpen && (
        <div className="screen-layer backdrop tutorial-layer">
          <Tutorial
            onClose={() => {
              localStorage.setItem('infinite-parkour-tutorial-seen', 'true')
              setTutorialOpen(false)
            }}
          />
        </div>
      )}

      {settingsOpen && (
        <div className="screen-layer backdrop settings-layer">
          <SettingsMenu settings={settings} onChange={saveSettings} onClose={() => setSettingsOpen(false)} />
        </div>
      )}

      {screen === 'playing' && <div className="tap-hint">Tap or press Space to jump • Tap twice to double jump</div>}
    </main>
  )
}
