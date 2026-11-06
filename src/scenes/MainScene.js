import Phaser from 'phaser'
import Player from '../objects/Player.js'
import Enemy from '../objects/Enemy.js'
import Projectile from '../objects/Projectile.js'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
    this.player = null
    this.enemies = null
    this.projectiles = null
    this.enemyProjectiles = null
    this.platforms = null
    this.background = null
    this.cursors = null
    this.wasd = null
    this.touchControls = { left: false, right: false, up: false, down: false, jump: false, attack: false }
    this.levelWidth = 3840
    this.levelHeight = 720
    this.spawnPoints = []
    this.levelData = null
  }

  create() {
    window.__diag?.setStage('diag-stage-main', 'ok', 'MAIN: Running')

    this.setupBackground()
    this.setupPlatforms()
    this.setupPlayer()
    this.setupEnemies()
    this.setupProjectiles()
    this.setupCollisions()
    this.setupInput()
    this.setupCamera()
    this.setupLevel()

    // Hide loading overlay
    window.__hideLoading?.()
  }

  setupBackground() {
    // Create parallax background layers
    this.background = this.add.group()

    const bg1 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg1')
    bg1.setOrigin(0, 0)
    bg1.setScrollFactor(0.1)
    bg1.setDepth(-10)
    this.background.add(bg1)

    const bg2 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg2')
    bg2.setOrigin(0, 0)
    bg2.setScrollFactor(0.3)
    bg2.setDepth(-8)
    this.background.add(bg2)

    const bg3 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg3')
    bg3.setOrigin(0, 0)
    bg3.setScrollFactor(0.5)
    bg3.setDepth(-6)
    this.background.add(bg3)
  }

  setupPlatforms() {
    this.platforms = this.physics.add.staticGroup()

    // Ground
    for (let x = 0; x < this.levelWidth; x += 64) {
      const ground = this.platforms.create(x + 32, 720 - 32, 'ground')
      ground.setScale(1).refreshBody()
    }

    // Platforms - create a challenging level layout
    const platformData = [
      // Section 1: Tutorial area
      { x: 400, y: 580, count: 3 },
      { x: 600, y: 500, count: 2 },
      { x: 800, y: 420, count: 2 },
      { x: 1000, y: 340, count: 3 },

      // Section 2: Rising platforms
      { x: 1300, y: 580, count: 2 },
      { x: 1500, y: 500, count: 3 },
      { x: 1700, y: 420, count: 2 },
      { x: 1900, y: 340, count: 2 },
      { x: 2100, y: 260, count: 3 },

      // Section 3: Gaps and enemies
      { x: 2400, y: 580, count: 2 },
      { x: 2600, y: 500, count: 1 },
      { x: 2800, y: 580, count: 2 },
      { x: 3000, y: 500, count: 1 },
      { x: 3200, y: 420, count: 3 },

      // Section 4: Final approach
      { x: 3400, y: 340, count: 2 },
      { x: 3600, y: 260, count: 3 },
    ]

    platformData.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        const plat = this.platforms.create(p.x + i * 64, p.y, 'platform')
        plat.setScale(1).refreshBody()
      }
    })

    // Add some floating platforms
    const floating = [
      { x: 500, y: 400 }, { x: 1200, y: 350 }, { x: 1800, y: 300 },
      { x: 2500, y: 350 }, { x: 3100, y: 300 }, { x: 3700, y: 200 }
    ]
    floating.forEach(f => {
      const plat = this.platforms.create(f.x, f.y, 'platform')
      plat.setScale(1).refreshBody()
    })
  }

  setupPlayer() {
    this.player = new Player(this, 100, 600)
    this.add.existing(this.player)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setSize(40, 80)
    this.player.body.setOffset(12, 16)
  }

  setupEnemies() {
    this.enemies = this.physics.add.group()
    this.enemyProjectiles = this.physics.add.group()

    // Spawn enemies at predefined positions
    const enemySpawns = [
      // Section 1
      { x: 500, y: 520, type: 'zombie' },
      { x: 700, y: 440, type: 'zombie' },
      { x: 900, y: 360, type: 'skeleton' },

      // Section 2
      { x: 1400, y: 520, type: 'zombie' },
      { x: 1600, y: 440, type: 'skeleton' },
      { x: 1800, y: 360, type: 'zombie' },
      { x: 2000, y: 280, type: 'demon' },

      // Section 3
      { x: 2500, y: 520, type: 'skeleton' },
      { x: 2700, y: 440, type: 'zombie' },
      { x: 2900, y: 520, type: 'demon' },
      { x: 3100, y: 360, type: 'skeleton' },

      // Section 4
      { x: 3300, y: 360, type: 'zombie' },
      { x: 3500, y: 280, type: 'demon' },
      { x: 3700, y: 200, type: 'boss' },
    ]

    enemySpawns.forEach(spawn => {
      const enemy = new Enemy(this, spawn.x, spawn.y, spawn.type)
      this.enemies.add(enemy)
      this.add.existing(enemy)
      this.physics.add.existing(enemy)
      enemy.body.setCollideWorldBounds(true)
      enemy.body.setAllowGravity(spawn.type !== 'demon' && spawn.type !== 'boss')
    })
  }

  setupProjectiles() {
    this.projectiles = this.physics.add.group()
  }

  setupCollisions() {
    // Player vs platforms
    this.physics.add.collider(this.player, this.platforms)

    // Enemies vs platforms
    this.physics.add.collider(this.enemies, this.platforms)

    // Player projectiles vs enemies
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this)

    // Enemy projectiles vs player
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.hitPlayer, null, this)

    // Player vs enemies (contact damage)
    this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this)

    // Player projectiles vs enemy projectiles
    this.physics.add.overlap(this.projectiles, this.enemyProjectiles, (p1, p2) => {
      p1.destroy()
      p2.destroy()
    })
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ left: 'A', right: 'D', up: 'W', down: 'S', jump: 'SPACE', attack: 'J' })

    // Touch controls
    const btnLeft = document.getElementById('btn-left')
    const btnRight = document.getElementById('btn-right')
    const btnUp = document.getElementById('btn-up')
    const btnDown = document.getElementById('btn-down')
    const btnJump = document.getElementById('btn-jump')
    const btnAttack = document.getElementById('btn-attack')

    const addTouch = (btn, key) => {
      if (!btn) return
      btn.addEventListener('touchstart', e => { e.preventDefault(); this.touchControls[key] = true }, { passive: false })
      btn.addEventListener('touchend', e => { e.preventDefault(); this.touchControls[key] = false }, { passive: false })
      btn.addEventListener('mousedown', e => { e.preventDefault(); this.touchControls[key] = true })
      btn.addEventListener('mouseup', e => { e.preventDefault(); this.touchControls[key] = false })
      btn.addEventListener('mouseleave', e => { this.touchControls[key] = false })
    }

    addTouch(btnLeft, 'left')
    addTouch(btnRight, 'right')
    addTouch(btnUp, 'up')
    addTouch(btnDown, 'down')
    addTouch(btnJump, 'jump')
    addTouch(btnAttack, 'attack')
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(100, 50)
    this.cameras.main.setZoom(2.5)
  }

  setupLevel() {
    this.levelData = {
      startX: 100,
      endX: this.levelWidth - 100,
      checkpoints: [100, 1200, 2400, 3600]
    }
  }

  update() {
    if (!this.player || !this.player.active) return

    this.handleInput()
    this.updateEnemies()
    this.cleanupProjectiles()
    this.checkWinCondition()
  }

  handleInput() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchControls.left
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchControls.right
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                       Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                       Phaser.Input.Keyboard.JustDown(this.wasd.jump) ||
                       (this.touchControls.jump && !this._jumpHeld)
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.wasd.attack) ||
                         (this.touchControls.attack && !this._attackHeld)

    this._jumpHeld = this.touchControls.jump
    this._attackHeld = this.touchControls.attack

    this.player.handleInput(left, right, jumpPressed, attackPressed)
  }

  updateEnemies() {
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(this.player)
    })
  }

  cleanupProjectiles() {
    this.projectiles.getChildren().forEach(p => {
      if (p.x < this.cameras.main.scrollX - 100 || p.x > this.cameras.main.scrollX + 1400) p.destroy()
    })
    this.enemyProjectiles.getChildren().forEach(p => {
      if (p.x < this.cameras.main.scrollX - 100 || p.x > this.cameras.main.scrollX + 1400) p.destroy()
    })
  }

  checkWinCondition() {
    if (this.player.x >= this.levelData.endX) {
      this.levelComplete()
    }
  }

  levelComplete() {
    this.scene.pause()
    this.add.text(this.cameras.main.scrollX + 640, 360, 'LEVEL COMPLETE!', {
      fontSize: '48px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0)

    this.time.delayedCall(3000, () => {
      this.scene.restart()
    })
  }

  hitEnemy(projectile, enemy) {
    if (!enemy.active || !projectile.active) return

    projectile.destroy()
    enemy.takeDamage(projectile.damage || 1)

    // Score
    this.registry.inc('score', enemy.scoreValue || 100)
    this.events.emit('score-changed', this.registry.get('score'))
  }

  hitPlayer(projectile, player) {
    if (!player.active || !projectile.active || player.invulnerable) return

    projectile.destroy()
    player.takeDamage(1)
  }

  playerTouchEnemy(player, enemy) {
    if (!player.active || !enemy.active || player.invulnerable) return
    if (enemy.type === 'boss' && enemy.state === 'dying') return

    // Knockback
    const dir = player.x < enemy.x ? -1 : 1
    player.takeDamage(1)
    player.setVelocityX(dir * -300)
    player.setVelocityY(-200)
  }

  fireProjectile(x, y, direction, weaponType = 'lance') {
    const projectile = new Projectile(this, x, y, direction, weaponType)
    this.projectiles.add(projectile)
    this.add.existing(projectile)
    this.physics.add.existing(projectile)
    return projectile
  }

  enemyFireProjectile(x, y, direction, type = 'lance') {
    const projectile = new Projectile(this, x, y, direction, type, true)
    this.enemyProjectiles.add(projectile)
    this.add.existing(projectile)
    this.physics.add.existing(projectile)
    return projectile
  }
}