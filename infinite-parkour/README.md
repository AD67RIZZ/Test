# Infinite Parkour

A complete, responsive endless-runner game made with React and Vite. The entire game is a static website: there is no backend, server rendering, database, or platform-specific runtime.

## Features

- Automatic running with responsive keyboard and touch controls
- Double jump, random obstacle patterns, coins, and increasing speed
- Distance score and high score saved in `localStorage`
- Pause, restart, first-launch tutorial, sound and music settings
- Particle effects, collision shake, parallax scenery, and a day/night cycle
- Procedurally generated sound effects and background music using the Web Audio API

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`, including `dist/index.html`.

## Controls

- **Jump / double jump:** Space, Up Arrow, W, or tap/click the game
- **Pause / resume:** Escape
- **Restart after game over:** R or the Restart button
- **Mute everything:** M or the speaker button

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Select the **Vite** framework preset if it is not detected automatically.
4. Deploy.

Vercel will use:

- Build command: `npm run build`
- Output directory: `dist`

No extra configuration or code changes are required.
