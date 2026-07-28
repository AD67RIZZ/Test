export default function GameIcon({ name, size = 20 }) {
  const paths = {
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h4v14H7zm6 0h4v14h-4z',
    restart: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3z',
    settings:
      'M19.4 13a7.7 7.7 0 0 0 .1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 2.6h4l.3-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4zm-6.4 2.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
    sound:
      'M4 9v6h4l5 4V5L8 9zm12.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zm0-8.2v2.1a7 7 0 0 1 0 12.2v2.1a9 9 0 0 0 0-16.4z',
    mute: 'M4 9v6h4l5 4V5L8 9zm11.5.5L17 11l1.5-1.5L20 11l-1.5 1.5L20 14l-1.5 1.5L17 14l-1.5 1.5-1.5-1.5 1.5-1.5L14 11z',
    home: 'M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z',
    close: 'm6 6 12 12M18 6 6 18',
    arrow: 'm12 4-7 8h5v8h4v-8h5z',
  }

  return (
    <svg
      aria-hidden="true"
      className="game-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'close' ? 'none' : 'currentColor'}
      stroke={name === 'close' ? 'currentColor' : 'none'}
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
