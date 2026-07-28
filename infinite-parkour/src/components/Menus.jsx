import GameIcon from './GameIcon'

export function StartScreen({ highScore, onStart, onSettings }) {
  return (
    <section className="screen start-screen" aria-labelledby="game-title">
      <div className="brand-mark" aria-hidden="true">
        <span />
        <i />
      </div>
      <p className="eyebrow">RUN • LEAP • REPEAT</p>
      <h1 id="game-title">
        INFINITE <span>PARKOUR</span>
      </h1>
      <p className="tagline">The city never stops. Neither do you.</p>

      <div className="best-card">
        <span>Personal best</span>
        <strong>{highScore.toLocaleString()}</strong>
        <small>metres</small>
      </div>

      <button className="primary-button" onClick={onStart}>
        <GameIcon name="play" size={22} /> Start run
      </button>
      <button className="text-button" onClick={onSettings}>
        <GameIcon name="settings" size={18} /> Settings
      </button>

      <div className="quick-controls" aria-label="Controls">
        <span><kbd>SPACE</kbd> Jump</span>
        <span><kbd>×2</kbd> Double jump</span>
        <span><kbd>ESC</kbd> Pause</span>
      </div>
    </section>
  )
}

export function Tutorial({ onClose }) {
  return (
    <section className="modal-card tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <p className="eyebrow">QUICK START</p>
      <h2 id="tutorial-title">Ready to run?</h2>
      <div className="tutorial-step">
        <div className="tutorial-icon"><GameIcon name="arrow" size={28} /></div>
        <div><strong>Jump</strong><span>Press Space, W, ↑, or tap anywhere.</span></div>
      </div>
      <div className="tutorial-step">
        <div className="tutorial-icon double">2×</div>
        <div><strong>Double jump</strong><span>Jump again in the air to go higher.</span></div>
      </div>
      <div className="tutorial-step">
        <div className="tutorial-coin">◆</div>
        <div><strong>Grab coins</strong><span>Collect them for bonus points. Avoid every obstacle!</span></div>
      </div>
      <button className="primary-button" onClick={onClose}>Got it — let’s go!</button>
    </section>
  )
}

export function PauseMenu({ score, onResume, onRestart, onSettings, onHome }) {
  return (
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <p className="eyebrow">RUN PAUSED</p>
      <h2 id="pause-title">Catch your breath</h2>
      <p className="modal-score">{score.toLocaleString()} m</p>
      <button className="primary-button" onClick={onResume}><GameIcon name="play" /> Resume</button>
      <div className="button-row">
        <button className="secondary-button" onClick={onRestart}><GameIcon name="restart" /> Restart</button>
        <button className="secondary-button" onClick={onSettings}><GameIcon name="settings" /> Settings</button>
      </div>
      <button className="text-button" onClick={onHome}><GameIcon name="home" /> Main menu</button>
    </section>
  )
}

export function GameOver({ score, coins, highScore, isNewBest, onRestart, onHome }) {
  return (
    <section className="modal-card game-over-card" role="dialog" aria-modal="true" aria-labelledby="over-title">
      <div className="crash-badge">!</div>
      <p className="eyebrow">{isNewBest ? 'NEW PERSONAL BEST!' : 'RUN ENDED'}</p>
      <h2 id="over-title">{isNewBest ? 'You crushed it!' : 'One more run?'}</h2>
      <div className="results-grid">
        <div><strong>{score.toLocaleString()}</strong><span>metres</span></div>
        <div><strong>{coins}</strong><span>coins</span></div>
        <div><strong>{highScore.toLocaleString()}</strong><span>best</span></div>
      </div>
      <button className="primary-button" onClick={onRestart}><GameIcon name="restart" /> Run again</button>
      <button className="text-button" onClick={onHome}><GameIcon name="home" /> Main menu</button>
      <small className="restart-hint">Press R to restart</small>
    </section>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

export function SettingsMenu({ settings, onChange, onClose }) {
  return (
    <section className="modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button className="icon-button close-button" onClick={onClose} aria-label="Close settings">
        <GameIcon name="close" />
      </button>
      <p className="eyebrow">MAKE IT YOURS</p>
      <h2 id="settings-title">Settings</h2>
      <Toggle
        label="Sound effects"
        description="Jumps, coins, and collisions"
        checked={settings.soundOn}
        onChange={(soundOn) => onChange({ ...settings, soundOn })}
      />
      <Toggle
        label="Background music"
        description="Procedural synth soundtrack"
        checked={settings.musicOn}
        onChange={(musicOn) => onChange({ ...settings, musicOn })}
      />
      <Toggle
        label="Reduced motion"
        description="Softer shake and particle effects"
        checked={settings.reducedMotion}
        onChange={(reducedMotion) => onChange({ ...settings, reducedMotion })}
      />
      <button className="primary-button" onClick={onClose}>Save & close</button>
    </section>
  )
}
