const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const lerp = (start, end, amount) => start + (end - start) * amount
const random = (min, max) => min + Math.random() * (max - min)

const hexToRgb = (hex) => {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const mixColor = (a, b, amount) => {
  const first = hexToRgb(a)
  const second = hexToRgb(b)
  return `rgb(${first.map((value, index) => Math.round(lerp(value, second[index], amount))).join(',')})`
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.roundRect(x, y, width, height, r)
}

export class GameEngine {
  constructor(canvas, callbacks, settings) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.callbacks = callbacks
    this.settings = settings
    this.running = false
    this.paused = true
    this.lastTime = 0
    this.animationFrame = null
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
    this.reset()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(320, rect.width)
    this.height = Math.max(400, rect.height)
    this.canvas.width = Math.round(this.width * dpr)
    this.canvas.height = Math.round(this.height * dpr)
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.scale = clamp(this.height / 760, 0.72, 1.22)
    this.groundY = this.height * 0.79
    if (this.player) {
      this.player.x = this.width * 0.16
      if (this.player.onGround) this.player.y = this.groundY - this.player.height
    }
  }

  reset() {
    const playerHeight = 58 * (this.scale || 1)
    this.elapsed = 0
    this.distance = 0
    this.score = 0
    this.coinsCollected = 0
    this.speed = 340 * (this.scale || 1)
    this.nextSpawn = 560
    this.obstacles = []
    this.coins = []
    this.particles = []
    this.trails = []
    this.shake = 0
    this.gameOver = false
    this.player = {
      x: this.width * 0.16,
      y: this.groundY - playerHeight,
      width: 42 * (this.scale || 1),
      height: playerHeight,
      velocityY: 0,
      jumps: 0,
      onGround: true,
      squash: 0,
      rotation: 0,
    }
    this.callbacks.onScore?.(0, 0)
    this.draw()
  }

  setSettings(settings) {
    this.settings = settings
  }

  start() {
    this.paused = false
    if (!this.running) {
      this.running = true
      this.lastTime = performance.now()
      this.animationFrame = requestAnimationFrame((time) => this.loop(time))
    }
  }

  pause() {
    this.paused = true
    this.draw()
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
  }

  jump() {
    if (this.paused || this.gameOver || this.player.jumps >= 2) return
    const isSecondJump = this.player.jumps === 1
    this.player.velocityY = (isSecondJump ? -760 : -830) * this.scale
    this.player.jumps += 1
    this.player.onGround = false
    this.player.squash = -0.16
    this.player.rotation += isSecondJump ? Math.PI * 2 : 0
    this.addBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#7cf7ff', isSecondJump ? 12 : 8)
    this.callbacks.onJump?.(isSecondJump)
  }

  loop(time) {
    if (!this.running) return
    const dt = Math.min((time - this.lastTime) / 1000, 0.033)
    this.lastTime = time
    if (!this.paused) this.update(dt)
    this.draw()
    this.animationFrame = requestAnimationFrame((nextTime) => this.loop(nextTime))
  }

  update(dt) {
    if (this.gameOver) {
      this.updateParticles(dt)
      this.shake = Math.max(0, this.shake - dt * 22)
      return
    }

    this.elapsed += dt
    this.speed = Math.min(760 * this.scale, this.speed + 7.5 * this.scale * dt)
    const movement = this.speed * dt
    this.distance += movement
    this.score = Math.floor(this.distance / (11 * this.scale)) + this.coinsCollected * 25
    this.nextSpawn -= movement

    if (this.nextSpawn <= 0) this.spawnPattern()

    const player = this.player
    player.velocityY += 2250 * this.scale * dt
    player.y += player.velocityY * dt
    player.squash = lerp(player.squash, 0, dt * 10)
    if (!player.onGround && player.jumps > 1) player.rotation += dt * 7.5

    if (player.y + player.height >= this.groundY) {
      if (!player.onGround && player.velocityY > 260 * this.scale) {
        this.addBurst(player.x + player.width / 2, this.groundY, '#9ff3ff', 10)
        player.squash = 0.18
      }
      player.y = this.groundY - player.height
      player.velocityY = 0
      player.jumps = 0
      player.onGround = true
      player.rotation = 0
    }

    this.obstacles.forEach((obstacle) => {
      obstacle.x -= movement
    })
    this.coins.forEach((coin) => {
      coin.x -= movement
      coin.spin += dt * 8
    })
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -60)
    this.coins = this.coins.filter((coin) => !coin.collected && coin.x > -50)

    this.checkCollisions()
    this.updateParticles(dt)

    if (Math.floor(this.elapsed * 4) % 2 === 0) {
      this.trails.push({
        x: player.x + player.width * 0.3,
        y: player.y + player.height * 0.55,
        life: 0.22,
        size: random(3, 7) * this.scale,
      })
    }
    this.trails.forEach((trail) => {
      trail.x -= movement * 0.25
      trail.life -= dt
    })
    this.trails = this.trails.filter((trail) => trail.life > 0)
    this.callbacks.onScore?.(this.score, this.coinsCollected)
  }

  spawnPattern() {
    const baseX = this.width + 60
    const difficulty = clamp(this.elapsed / 80, 0, 1)
    const roll = Math.random()

    if (roll < 0.3) {
      this.addObstacle(baseX, 'crate')
      this.spawnCoinArc(baseX - 20, this.groundY - 105 * this.scale, 5)
      this.nextSpawn = random(450, 650) * this.scale
    } else if (roll < 0.55) {
      this.addObstacle(baseX, 'spikes')
      this.spawnCoinArc(baseX, this.groundY - 130 * this.scale, 4)
      this.nextSpawn = random(500, 700) * this.scale
    } else if (roll < 0.78 && difficulty > 0.2) {
      this.addObstacle(baseX, 'barrier')
      this.addObstacle(baseX + 260 * this.scale, Math.random() > 0.5 ? 'crate' : 'spikes')
      this.spawnCoinArc(baseX + 45 * this.scale, this.groundY - 175 * this.scale, 6)
      this.nextSpawn = random(690, 850) * this.scale
    } else {
      this.addObstacle(baseX, 'tower')
      this.spawnCoinArc(baseX - 60 * this.scale, this.groundY - 215 * this.scale, 7)
      this.nextSpawn = random(570, 760) * this.scale
    }
  }

  addObstacle(x, type) {
    const sizes = {
      crate: [56, 56],
      spikes: [78, 34],
      barrier: [54, 92],
      tower: [66, 126],
    }
    const [width, height] = sizes[type]
    this.obstacles.push({
      x,
      y: this.groundY - height * this.scale,
      width: width * this.scale,
      height: height * this.scale,
      type,
    })
  }

  spawnCoinArc(startX, topY, count) {
    const spacing = 48 * this.scale
    for (let index = 0; index < count; index += 1) {
      const curve = Math.sin((index / Math.max(1, count - 1)) * Math.PI)
      this.coins.push({
        x: startX + index * spacing,
        y: topY - curve * 38 * this.scale,
        radius: 12 * this.scale,
        spin: index * 0.7,
        collected: false,
      })
    }
  }

  checkCollisions() {
    const player = {
      x: this.player.x + this.player.width * 0.19,
      y: this.player.y + this.player.height * 0.1,
      width: this.player.width * 0.62,
      height: this.player.height * 0.84,
    }

    for (const obstacle of this.obstacles) {
      const padding = obstacle.type === 'spikes' ? 9 * this.scale : 4 * this.scale
      if (
        player.x < obstacle.x + obstacle.width - padding &&
        player.x + player.width > obstacle.x + padding &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y + padding
      ) {
        this.gameOver = true
        this.shake = this.settings.reducedMotion ? 3 : 14
        this.addBurst(player.x + player.width, player.y + player.height / 2, '#ff5f78', this.settings.reducedMotion ? 8 : 24)
        this.callbacks.onGameOver?.(this.score, this.coinsCollected)
        return
      }
    }

    for (const coin of this.coins) {
      const nearestX = clamp(coin.x, player.x, player.x + player.width)
      const nearestY = clamp(coin.y, player.y, player.y + player.height)
      const dx = coin.x - nearestX
      const dy = coin.y - nearestY
      if (dx * dx + dy * dy < coin.radius * coin.radius) {
        coin.collected = true
        this.coinsCollected += 1
        this.addBurst(coin.x, coin.y, '#ffd95e', this.settings.reducedMotion ? 5 : 12)
        this.callbacks.onCoin?.()
      }
    }
  }

  addBurst(x, y, color, amount) {
    for (let index = 0; index < amount; index += 1) {
      const angle = random(0, Math.PI * 2)
      const speed = random(55, 250) * this.scale
      this.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: random(0.28, 0.62),
        maxLife: 0.62,
        size: random(2, 6) * this.scale,
        color,
      })
    }
  }

  updateParticles(dt) {
    this.particles.forEach((particle) => {
      particle.x += particle.velocityX * dt
      particle.y += particle.velocityY * dt
      particle.velocityY += 320 * this.scale * dt
      particle.velocityX *= 0.985
      particle.life -= dt
    })
    this.particles = this.particles.filter((particle) => particle.life > 0)
  }

  drawBackground(context) {
    const cycle = (Math.sin((this.elapsed / 55) * Math.PI * 2 - Math.PI / 2) + 1) / 2
    const nightAmount = 1 - cycle
    const skyTop = mixColor('#07142e', '#56c6ef', cycle)
    const skyBottom = mixColor('#422b65', '#ffd09a', cycle)
    const gradient = context.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, skyTop)
    gradient.addColorStop(0.72, skyBottom)
    gradient.addColorStop(1, mixColor('#111b35', '#446778', cycle))
    context.fillStyle = gradient
    context.fillRect(0, 0, this.width, this.height)

    context.globalAlpha = nightAmount * 0.85
    context.fillStyle = '#dff6ff'
    for (let index = 0; index < 38; index += 1) {
      const x = (index * 137 + 41) % this.width
      const y = (index * 73 + 29) % (this.height * 0.55)
      const twinkle = 0.6 + Math.sin(this.elapsed * 2 + index) * 0.35
      context.globalAlpha = nightAmount * twinkle
      context.beginPath()
      context.arc(x, y, index % 4 === 0 ? 1.6 : 1, 0, Math.PI * 2)
      context.fill()
    }
    context.globalAlpha = 1

    const orbX = this.width * 0.78
    const orbY = this.height * 0.2
    context.shadowBlur = 32
    context.shadowColor = cycle > 0.5 ? '#fff1a8' : '#9be5ff'
    context.fillStyle = cycle > 0.5 ? '#fff3b4' : '#d5ecff'
    context.beginPath()
    context.arc(orbX, orbY, 29 * this.scale, 0, Math.PI * 2)
    context.fill()
    context.shadowBlur = 0

    this.drawHills(context, 0.12, this.height * 0.58, mixColor('#182948', '#7c89a4', cycle), 95)
    this.drawCity(context, 0.25, this.height * 0.67, mixColor('#101b35', '#526579', cycle), nightAmount)
    this.drawHills(context, 0.42, this.height * 0.73, mixColor('#0a142b', '#344a57', cycle), 55)

    // Speed lines become more visible as the run accelerates.
    context.strokeStyle = `rgba(185,246,255,${clamp((this.speed / this.scale - 360) / 900, 0, 0.17)})`
    context.lineWidth = 2
    for (let index = 0; index < 10; index += 1) {
      const x = (index * 193 - this.distance * 1.8) % (this.width + 220)
      const y = 80 + ((index * 91) % (this.height * 0.62))
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x + 100, y)
      context.stroke()
    }
  }

  drawHills(context, factor, baseline, color, amplitude) {
    const offset = (this.distance * factor) % 280
    context.fillStyle = color
    context.beginPath()
    context.moveTo(-300, this.height)
    context.lineTo(-300, baseline)
    for (let x = -300; x <= this.width + 300; x += 140) {
      context.quadraticCurveTo(x + 70 - offset, baseline - amplitude, x + 140 - offset, baseline)
    }
    context.lineTo(this.width + 300, this.height)
    context.closePath()
    context.fill()
  }

  drawCity(context, factor, baseline, color, nightAmount) {
    const offset = (this.distance * factor) % 420
    for (let repeat = -1; repeat < Math.ceil(this.width / 420) + 2; repeat += 1) {
      const origin = repeat * 420 - offset
      const buildings = [[0, 72, 66], [77, 118, 88], [176, 82, 52], [239, 142, 78], [330, 96, 68]]
      buildings.forEach(([x, height, width], buildingIndex) => {
        const bx = origin + x
        context.fillStyle = color
        context.fillRect(bx, baseline - height * this.scale, width, height * this.scale)
        context.fillStyle = `rgba(255,224,121,${nightAmount * 0.38})`
        for (let row = 0; row < 3; row += 1) {
          for (let column = 0; column < 2; column += 1) {
            if ((row + column + buildingIndex) % 3 !== 0) {
              context.fillRect(bx + 14 + column * 24, baseline - height * this.scale + 18 + row * 25, 7, 9)
            }
          }
        }
      })
    }
  }

  drawGround(context) {
    const gradient = context.createLinearGradient(0, this.groundY, 0, this.height)
    gradient.addColorStop(0, '#17213c')
    gradient.addColorStop(1, '#060b18')
    context.fillStyle = gradient
    context.fillRect(0, this.groundY, this.width, this.height - this.groundY)
    context.fillStyle = '#6ce7f4'
    context.fillRect(0, this.groundY, this.width, 3)

    const offset = (this.distance * 1.3) % 80
    context.strokeStyle = 'rgba(116, 227, 240, 0.11)'
    context.lineWidth = 1
    for (let x = -80 - offset; x < this.width + 80; x += 80) {
      context.beginPath()
      context.moveTo(x, this.groundY)
      context.lineTo(x + 70, this.height)
      context.stroke()
    }
  }

  drawPlayer(context) {
    const player = this.player
    this.trails.forEach((trail) => {
      context.globalAlpha = clamp(trail.life / 0.22, 0, 1) * 0.24
      context.fillStyle = '#73f0ff'
      context.beginPath()
      context.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2)
      context.fill()
    })
    context.globalAlpha = 1

    context.save()
    context.translate(player.x + player.width / 2, player.y + player.height / 2)
    context.rotate(player.rotation)
    context.scale(1 + player.squash, 1 - player.squash)
    context.translate(-player.width / 2, -player.height / 2)

    const run = player.onGround ? Math.sin(this.elapsed * 18) : 0.2
    context.strokeStyle = '#0b1737'
    context.lineWidth = 8 * this.scale
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(player.width * 0.45, player.height * 0.66)
    context.lineTo(player.width * (0.3 + run * 0.12), player.height * 0.96)
    context.moveTo(player.width * 0.58, player.height * 0.66)
    context.lineTo(player.width * (0.72 - run * 0.12), player.height * 0.96)
    context.stroke()

    const bodyGradient = context.createLinearGradient(0, 0, player.width, player.height)
    bodyGradient.addColorStop(0, '#71f1ff')
    bodyGradient.addColorStop(1, '#8172ff')
    context.fillStyle = bodyGradient
    context.shadowBlur = 18
    context.shadowColor = 'rgba(92,230,255,.55)'
    roundedRect(context, player.width * 0.17, player.height * 0.2, player.width * 0.66, player.height * 0.55, 12)
    context.fill()
    context.shadowBlur = 0

    context.fillStyle = '#d8fbff'
    context.beginPath()
    context.arc(player.width * 0.5, player.height * 0.17, player.width * 0.29, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#142149'
    context.fillRect(player.width * 0.29, player.height * 0.13, player.width * 0.42, 5 * this.scale)
    context.fillStyle = '#70f1ff'
    context.fillRect(player.width * 0.36, player.height * 0.12, 7 * this.scale, 7 * this.scale)
    context.fillRect(player.width * 0.55, player.height * 0.12, 7 * this.scale, 7 * this.scale)

    context.strokeStyle = '#baf9ff'
    context.lineWidth = 6 * this.scale
    context.beginPath()
    context.moveTo(player.width * 0.2, player.height * 0.34)
    context.lineTo(player.width * (0.02 - run * 0.1), player.height * 0.59)
    context.moveTo(player.width * 0.8, player.height * 0.34)
    context.lineTo(player.width * (0.98 + run * 0.1), player.height * 0.59)
    context.stroke()
    context.restore()
  }

  drawObstacles(context) {
    this.obstacles.forEach((obstacle) => {
      if (obstacle.type === 'spikes') {
        const spikes = 4
        const spikeWidth = obstacle.width / spikes
        const gradient = context.createLinearGradient(0, obstacle.y, 0, obstacle.y + obstacle.height)
        gradient.addColorStop(0, '#ff8b99')
        gradient.addColorStop(1, '#d53d69')
        context.fillStyle = gradient
        context.beginPath()
        context.moveTo(obstacle.x, obstacle.y + obstacle.height)
        for (let index = 0; index < spikes; index += 1) {
          context.lineTo(obstacle.x + spikeWidth * (index + 0.5), obstacle.y)
          context.lineTo(obstacle.x + spikeWidth * (index + 1), obstacle.y + obstacle.height)
        }
        context.closePath()
        context.fill()
      } else {
        const gradient = context.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y + obstacle.height)
        gradient.addColorStop(0, obstacle.type === 'crate' ? '#ffaf61' : '#ff607b')
        gradient.addColorStop(1, obstacle.type === 'crate' ? '#b7535d' : '#8d315f')
        context.fillStyle = gradient
        context.shadowBlur = 14
        context.shadowColor = 'rgba(255,73,113,.2)'
        roundedRect(context, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7 * this.scale)
        context.fill()
        context.shadowBlur = 0
        context.strokeStyle = 'rgba(255,255,255,.28)'
        context.lineWidth = 2
        roundedRect(context, obstacle.x + 6, obstacle.y + 6, obstacle.width - 12, obstacle.height - 12, 4)
        context.stroke()
        context.strokeStyle = 'rgba(47,22,58,.35)'
        context.beginPath()
        context.moveTo(obstacle.x + 8, obstacle.y + 8)
        context.lineTo(obstacle.x + obstacle.width - 8, obstacle.y + obstacle.height - 8)
        context.moveTo(obstacle.x + obstacle.width - 8, obstacle.y + 8)
        context.lineTo(obstacle.x + 8, obstacle.y + obstacle.height - 8)
        context.stroke()
      }
    })
  }

  drawCoins(context) {
    this.coins.forEach((coin) => {
      if (coin.collected) return
      const width = Math.max(3, Math.abs(Math.cos(coin.spin)) * coin.radius)
      context.save()
      context.translate(coin.x, coin.y)
      context.shadowBlur = 18
      context.shadowColor = '#ffd75b'
      const gradient = context.createLinearGradient(-width, 0, width, 0)
      gradient.addColorStop(0, '#ff9e35')
      gradient.addColorStop(0.5, '#fff2a7')
      gradient.addColorStop(1, '#ffbe3e')
      context.fillStyle = gradient
      context.beginPath()
      context.ellipse(0, 0, width, coin.radius, 0, 0, Math.PI * 2)
      context.fill()
      context.shadowBlur = 0
      context.fillStyle = 'rgba(138,72,19,.45)'
      context.font = `bold ${12 * this.scale}px sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      if (width > coin.radius * 0.45) context.fillText('◆', 0, 1)
      context.restore()
    })
  }

  drawParticles(context) {
    this.particles.forEach((particle) => {
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1)
      context.fillStyle = particle.color
      context.beginPath()
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      context.fill()
    })
    context.globalAlpha = 1
  }

  draw() {
    const context = this.context
    if (!context) return
    context.save()
    if (this.shake > 0) {
      context.translate(random(-this.shake, this.shake), random(-this.shake, this.shake))
    }
    this.drawBackground(context)
    this.drawGround(context)
    this.drawCoins(context)
    this.drawObstacles(context)
    this.drawPlayer(context)
    this.drawParticles(context)
    context.restore()
  }
}
