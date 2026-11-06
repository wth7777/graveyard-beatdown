import Phaser from 'phaser'
import Player from '../objects/Player.js'
import Enemy from '../objects/Enemy.js'
import Projectile from '../objects/Projectile.js'
import Loot from '../objects/Loot.js'
import UpgradeStation from '../objects/UpgradeStation.js'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
    this.player = null
    this.enemies = null
    this.projectiles = null
    this.enemyProjectiles = null
    this.meleeHitboxes = null
    this.platforms = null
    this.background = null
    this.loot = null
    this.upgradeStations = null
    this.cursors = null
    this.wasd = null
    this.touchControls = {
      left: false, right: false, up: false, down: false,
      jump: false, melee: false, ranged: false, switch: false
    }
    this.levelWidth = 5000
    this.levelHeight = 720
    this.levelData = null
    this.meleeAttackZone = null
  }

  create() {
    window.__diag?.setStage('diag-stage-main', 'ok', 'MAIN: Running')

    // Fallback background color
    this.cameras.main.setBackgroundColor('#1a0a1a')

    this.setupBackground()
    this.setupPlatforms()
    this.setupPlayer()
    this.setupEnemies()
    this.setupProjectiles()
    this.setupMeleeSystem()
    this.setupLoot()
    this.setupUpgradeStations()
    this.setupCollisions()
    this.setupInput()
    this.setupCamera()
    this.setupLevel()
    this.setupEvents()

    window.__hideLoading?.()
  }

  setupBackground() {
    this.background = this.add.group()

    const bg1 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg1')
    bg1.setOrigin(0, 0).setScrollFactor(0.1).setDepth(-10)
    this.background.add(bg1)

    const bg2 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg2')
    bg2.setOrigin(0, 0).setScrollFactor(0.3).setDepth(-8)
    this.background.add(bg2)

    const bg3 = this.add.tileSprite(0, 0, this.levelWidth, 720, 'bg3')
    bg3.setOrigin(0, 0).setScrollFactor(0.5).setDepth(-6)
    this.background.add(bg3)
  }

  setupPlatforms() {
    this.platforms = this.physics.add.staticGroup()

    // Ground
    for (let x = 0; x < this.levelWidth; x += 64) {
      const ground = this.platforms.create(x + 32, 720 - 32, 'ground')
      ground.setScale(1).refreshBody()
    }

    // Procedural platform generation with increasing difficulty
    const sections = 8
    const sectionWidth = this.levelWidth / sections

    for (let s = 0; s < sections; s++) {
      const baseX = s * sectionWidth
      const difficulty = s / sections // 0 to 1

      // Main path platforms
      const platformCount = Phaser.Math.Between(3, 6 - Math.floor(difficulty * 3))
      for (let i = 0; i < platformCount; i++) {
        const x = baseX + Phaser.Math.Between(100, sectionWidth - 100)
        const y = Phaser.Math.Between(200 + difficulty * 200, 580)
        const plat = this.platforms.create(x, y, 'platform')
        plat.setScale(1).refreshBody()
      }

      // Floating platforms (more in later sections)
      const floatingCount = Phaser.Math.Between(0, 2 + Math.floor(difficulty * 3))
      for (let i = 0; i < floatingCount; i++) {
        const x = baseX + Phaser.Math.Between(50, sectionWidth - 50)
        const y = Phaser.Math.Between(150, 400)
        const plat = this.platforms.create(x, y, 'platform')
        plat.setScale(1).refreshBody()
      }
    }

    // Boss arena at the end
    for (let i = 0; i < 5; i++) {
      const plat = this.platforms.create(this.levelWidth - 300 + i * 64, 400, 'platform')
      plat.setScale(1).refreshBody()
    }
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

    // Procedural enemy spawning based on depth
    const sections = 8
    const sectionWidth = this.levelWidth / sections

    for (let s = 0; s < sections; s++) {
      const baseX = s * sectionWidth
      const difficulty = s / sections

      // Enemy count increases with depth
      const enemyCount = Phaser.Math.Between(2, 4 + Math.floor(difficulty * 4))

      for (let i = 0; i < enemyCount; i++) {
        const x = baseX + Phaser.Math.Between(150, sectionWidth - 150)
        let y = 600

        // Find a platform near this x
        const nearbyPlatforms = this.platforms.getChildren().filter(p =>
          Math.abs(p.x - x) < 100 && p.y < 650
        )
        if (nearbyPlatforms.length > 0) {
          y = nearbyPlatforms[0].y - 64
        }

        // Enemy type based on depth
        let type = 'zombie'
        const roll = Math.random()
        if (difficulty > 0.7) {
          type = roll < 0.4 ? 'boss' : roll < 0.6 ? 'demon' : roll < 0.8 ? 'skeleton' : 'zombie'
        } else if (difficulty > 0.4) {
          type = roll < 0.3 ? 'demon' : roll < 0.6 ? 'skeleton' : 'zombie'
        } else if (difficulty > 0.2) {
          type = roll < 0.4 ? 'skeleton' : 'zombie'
        }

        const enemy = new Enemy(this, x, y, type)
        enemy.difficulty = difficulty
        this.enemies.add(enemy)
        this.add.existing(enemy)
        this.physics.add.existing(enemy)
        enemy.body.setCollideWorldBounds(true)
        enemy.body.setAllowGravity(type !== 'demon' && type !== 'boss')
      }
    }
  }

  setupProjectiles() {
    this.projectiles = this.physics.add.group()
  }

  setupMeleeSystem() {
    this.meleeHitboxes = this.physics.add.group()
  }

  setupLoot() {
    this.loot = this.physics.add.group()

    // Spawn loot chests
    const chestCount = 8
    for (let i = 0; i < chestCount; i++) {
      const x = Phaser.Math.Between(300, this.levelWidth - 300)
      let y = 600

      const nearbyPlatforms = this.platforms.getChildren().filter(p =>
        Math.abs(p.x - x) < 150 && p.y < 650
      )
      if (nearbyPlatforms.length > 0) {
        y = nearbyPlatforms[0].y - 64
      }

      const chest = new Loot(this, x, y, 'chest')
      this.loot.add(chest)
      this.add.existing(chest)
      this.physics.add.existing(chest)
      chest.body.setCollideWorldBounds(true)
      chest.body.setAllowGravity(true)
      chest.body.setImmovable(true)
    }
  }

  setupUpgradeStations() {
    this.upgradeStations = this.physics.add.group()

    // Stations at checkpoints
    const stationXs = [100, 800, 1600, 2400, 3200, 4000, 4700]
    stationXs.forEach(x => {
      let y = 600
      const nearbyPlatforms = this.platforms.getChildren().filter(p =>
        Math.abs(p.x - x) < 100 && p.y < 650
      )
      if (nearbyPlatforms.length > 0) {
        y = nearbyPlatforms[0].y - 64
      }

      const station = new UpgradeStation(this, x, y)
      this.upgradeStations.add(station)
      this.add.existing(station)
      this.physics.add.existing(station)
      station.body.setCollideWorldBounds(true)
      station.body.setAllowGravity(true)
      station.body.setImmovable(true)
    })
  }

  setupCollisions() {
    // Player vs platforms
    this.physics.add.collider(this.player, this.platforms)

    // Enemies vs platforms
    this.physics.add.collider(this.enemies, this.platforms)

    // Loot vs platforms
    this.physics.add.collider(this.loot, this.platforms)

    // Upgrade stations vs platforms
    this.physics.add.collider(this.upgradeStations, this.platforms)

    // Player projectiles vs enemies
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this)

    // Enemy projectiles vs player
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.hitPlayer, null, this)

    // Player vs enemies (contact damage)
    this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this)

    // Melee hitboxes vs enemies
    this.physics.add.overlap(this.meleeHitboxes, this.enemies, this.meleeHitEnemy, null, this)

    // Player vs loot
    this.physics.add.overlap(this.player, this.loot, this.collectLoot, null, this)

    // Player vs upgrade stations
    this.physics.add.overlap(this.player, this.upgradeStations, this.interactStation, null, this)

    // Projectiles vs projectiles
    this.physics.add.overlap(this.projectiles, this.enemyProjectiles, (p1, p2) => {
      p1.destroy()
      p2.destroy()
    })
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      left: 'A', right: 'D', up: 'W', down: 'S',
      jump: 'SPACE', melee: 'J', ranged: 'K', switch: 'E'
    })

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
    addTouch(btnAttack, 'melee')

    // Add ranged attack button for touch (repurpose special button if exists)
    const btnSpecial = document.getElementById('btn-special')
    if (btnSpecial) {
      addTouch(btnSpecial, 'ranged')
    }
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(100, 50)
    this.cameras.main.setZoom(1.8)
    this.cameras.main.centerOn(this.player.x, this.player.y)
  }

  setupLevel() {
    this.levelData = {
      startX: 100,
      endX: this.levelWidth - 100,
      checkpoints: [100, 800, 1600, 2400, 3200, 4000, 4700]
    }
  }

  setupEvents() {
    // Player events
    this.events.on('gold-changed', (gold) => this.registry.set('gold', gold))
    this.events.on('health-changed', (health) => this.registry.set('health', health))
    this.events.on('score-changed', (score) => this.registry.set('score', score))
    this.events.on('trophy-changed', (trophies) => this.registry.set('trophies', trophies))
    this.events.on('depth-changed', (depth) => this.registry.set('depth', depth))
    this.events.on('weapon-mode-changed', (mode) => this.registry.set('weaponMode', mode))
    this.events.on('weapon-upgraded', (slot, weapon) => this.registry.set(`${slot}Weapon`, weapon))
    this.events.on('armor-upgraded', (level) => this.registry.set('armorLevel', level))

    // Initialize registry
    this.registry.set('gold', 0)
    this.registry.set('health', this.player.health)
    this.registry.set('maxHealth', this.player.maxHealth)
    this.registry.set('score', 0)
    this.registry.set('trophies', 0)
    this.registry.set('depth', 0)
    this.registry.set('weaponMode', 'melee')
    this.registry.set('meleeWeapon', this.player.meleeWeapon)
    this.registry.set('rangedWeapon', this.player.rangedWeapon)
    this.registry.set('armorLevel', 0)
  }

  update() {
    if (!this.player || !this.player.active) return

    this.handleInput()
    this.updateEnemies()
    this.cleanupProjectiles()
    this.checkWinCondition()
    this.updateMeleeHitboxes()
    this.checkStationProximity()
  }

  handleInput() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchControls.left
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchControls.right
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                       Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                       Phaser.Input.Keyboard.JustDown(this.wasd.jump) ||
                       (this.touchControls.jump && !this._jumpHeld)
    const meleePressed = Phaser.Input.Keyboard.JustDown(this.wasd.melee) ||
                        (this.touchControls.melee && !this._meleeHeld)
    const rangedPressed = Phaser.Input.Keyboard.JustDown(this.wasd.ranged) ||
                         (this.touchControls.ranged && !this._rangedHeld)
    const switchPressed = Phaser.Input.Keyboard.JustDown(this.wasd.switch)

    this._jumpHeld = this.touchControls.jump
    this._meleeHeld = this.touchControls.melee
    this._rangedHeld = this.touchControls.ranged

    this.player.handleInput(left, right, jumpPressed, meleePressed, rangedPressed, switchPressed)
  }

  updateEnemies() {
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(this.player)
    })
  }

  cleanupProjectiles() {
    const camX = this.cameras.main.scrollX
    this.projectiles.getChildren().forEach(p => {
      if (p.x < camX - 100 || p.x > camX + 1400) p.destroy()
    })
    this.enemyProjectiles.getChildren().forEach(p => {
      if (p.x < camX - 100 || p.x > camX + 1400) p.destroy()
    })
  }

  updateMeleeHitboxes() {
    this.meleeHitboxes.getChildren().forEach(hb => {
      if (hb.lifetime && this.time.now > hb.lifetime) hb.destroy()
    })
  }

  checkWinCondition() {
    if (this.player.x >= this.levelData.endX) {
      this.levelComplete()
    }
  }

  levelComplete() {
    this.scene.pause()
    const bonusGold = Math.floor(this.player.depth / 10)
    this.player.addGold(bonusGold)

    this.add.text(this.cameras.main.scrollX + 640, 300, 'DUNGEON CLEARED!', {
      fontSize: '48px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0)

    this.add.text(this.cameras.main.scrollX + 640, 380, `Depth Bonus: +${bonusGold} Gold`, {
      fontSize: '24px', fontFamily: 'Courier New, monospace', color: '#ffd700'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0)

    this.time.delayedCall(4000, () => this.scene.restart())
  }

  hitEnemy(projectile, enemy) {
    if (!enemy.active || !projectile.active) return

    projectile.destroy()
    const killed = enemy.takeDamage(projectile.damage || 1)

    if (killed) {
      // Drop gold
      const goldDrop = Phaser.Math.Between(5, 15) * (enemy.type === 'boss' ? 10 : enemy.type === 'demon' ? 3 : 1)
      this.spawnGold(enemy.x, enemy.y, goldDrop)

      // Chance for trophy
      if (Math.random() < 0.15) {
        this.spawnTrophy(enemy.x, enemy.y)
      }

      this.player.addScore(enemy.scoreValue || 100)
    }
  }

  meleeHitEnemy(hitbox, enemy) {
    if (!enemy.active || !hitbox.active) return

    const killed = enemy.takeDamage(hitbox.damage || 1)

    if (killed) {
      const goldDrop = Phaser.Math.Between(5, 15) * (enemy.type === 'boss' ? 10 : enemy.type === 'demon' ? 3 : 1)
      this.spawnGold(enemy.x, enemy.y, goldDrop)

      if (Math.random() < 0.15) {
        this.spawnTrophy(enemy.x, enemy.y)
      }

      this.player.addScore(enemy.scoreValue || 100)
    }

    // Knockback
    const dir = hitbox.direction || 1
    enemy.setVelocityX(dir * 200)
    enemy.setVelocityY(-100)
  }

  hitPlayer(projectile, player) {
    if (!player.active || !projectile.active || player.invulnerable) return

    projectile.destroy()
    player.takeDamage(1)
  }

  playerTouchEnemy(player, enemy) {
    if (!player.active || !enemy.active || player.invulnerable) return
    if (enemy.type === 'boss' && enemy.state === 'dying') return

    const dir = player.x < enemy.x ? -1 : 1
    player.takeDamage(enemy.attackDamage || 1)
    player.setVelocityX(dir * -300)
    player.setVelocityY(-200)
  }

  collectLoot(player, loot) {
    if (!loot.active || !loot.collected) return

    loot.collected = true

    if (loot.type === 'chest') {
      // Chest gives gold + maybe trophy/weapon
      const gold = Phaser.Math.Between(50, 200)
      player.addGold(gold)

      this.showFloatingText(loot.x, loot.y - 30, `+${gold} Gold`, '#ffd700')

      if (Math.random() < 0.3) {
        player.addTrophy()
        this.showFloatingText(loot.x, loot.y - 50, 'TROPHY!', '#ff6b6b')
      }
    } else if (loot.type === 'gold') {
      player.addGold(loot.value)
      this.showFloatingText(loot.x, loot.y - 20, `+${loot.value}`, '#ffd700')
    } else if (loot.type === 'trophy') {
      player.addTrophy()
      this.showFloatingText(loot.x, loot.y - 20, 'TROPHY!', '#ff6b6b')
    } else if (loot.type === 'health') {
      player.heal(1)
      this.showFloatingText(loot.x, loot.y - 20, '+1 HP', '#4ade80')
    }

    this.tweens.add({
      targets: loot,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => loot.destroy()
    })
  }

  interactStation(player, station) {
    if (!station.active || station.used) return

    station.used = true
    station.setTint(0x4ade80)

    // Show upgrade menu (for now, auto-upgrade cheapest available)
    this.showUpgradeMenu(station)

    this.tweens.add({
      targets: station,
      tint: 0xffffff,
      duration: 500,
      yoyo: true,
      repeat: 3
    })
  }

  showUpgradeMenu(station) {
    const cam = this.cameras.main
    const x = cam.scrollX + 640
    const y = cam.scrollY + 360

    const menu = this.add.container(x, y).setDepth(200).setScrollFactor(0)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.fillRoundedRect(-200, -150, 400, 300, 16)
    bg.lineStyle(2, 0x4ade80)
    bg.strokeRoundedRect(-200, -150, 400, 300, 16)
    menu.add(bg)

    const title = this.add.text(0, -120, 'UPGRADE STATION', {
      fontSize: '24px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setOrigin(0.5)
    menu.add(title)

    const goldText = this.add.text(0, -90, `Gold: ${this.player.gold}`, {
      fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#ffd700'
    }).setOrigin(0.5)
    menu.add(goldText)

    const upgrades = [
      { key: 'melee', label: `Melee: ${this.player.meleeWeapon.name} (Lv.${this.player.meleeWeapon.level})`, cost: this.getUpgradeCost('melee'), action: () => this.player.upgradeMeleeWeapon() },
      { key: 'ranged', label: `Ranged: ${this.player.rangedWeapon.name} (Lv.${this.player.rangedWeapon.level})`, cost: this.getUpgradeCost('ranged'), action: () => this.player.upgradeRangedWeapon() },
      { key: 'armor', label: `Armor (Lv.${this.player.armorLevel}/4)`, cost: this.getUpgradeCost('armor'), action: () => this.player.upgradeArmor() },
      { key: 'speed', label: `Speed (Lv.${this.player.speedLevel || 0}/3)`, cost: this.getUpgradeCost('speed'), action: () => this.player.upgradeSpeed() }
    ]

    upgrades.forEach((upg, i) => {
      const canAfford = this.player.gold >= upg.cost
      const btn = this.add.text(0, -40 + i * 40,
        `${upg.label} - ${upg.cost > 0 ? upg.cost : 'MAX'} Gold`,
        { fontSize: '16px', fontFamily: 'Courier New, monospace', color: canAfford ? '#4ade80' : '#666666' }
      ).setOrigin(0.5).setInteractive()
      menu.add(btn)

      if (canAfford && upg.cost > 0) {
        btn.on('pointerdown', () => {
          if (upg.action()) {
            goldText.setText(`Gold: ${this.player.gold}`)
            btn.setText(`${upg.label} - ${this.getUpgradeCost(upg.key) > 0 ? this.getUpgradeCost(upg.key) : 'MAX'} Gold`)
            btn.setColor(this.player.gold >= this.getUpgradeCost(upg.key) ? '#4ade80' : '#666666')
          }
        })
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#4ade80', color: '#000000' }))
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: 'transparent', color: '#4ade80' }))
      }
    })

    const closeBtn = this.add.text(0, 130, 'CLOSE (ESC)', {
      fontSize: '16px', fontFamily: 'Courier New, monospace', color: '#888888'
    }).setOrigin(0.5).setInteractive()
    menu.add(closeBtn)

    closeBtn.on('pointerdown', () => menu.destroy())
    this.input.keyboard.once('keydown-ESC', () => menu.destroy())

    // Auto-destroy after 30s
    this.time.delayedCall(30000, () => menu.destroy())
  }

  getUpgradeCost(type) {
    const costs = {
      melee: [0, 50, 150, 400, 1000, 2500],
      ranged: [0, 50, 150, 400, 1000, 2500],
      armor: [0, 100, 300, 800, 2000],
      speed: [0, 75, 200, 500]
    }
    const level = type === 'melee' ? this.player.meleeWeapon.level :
                  type === 'ranged' ? this.player.rangedWeapon.level :
                  type === 'armor' ? this.player.armorLevel :
                  this.player.speedLevel || 0
    return costs[type][level] || 0
  }

  spawnGold(x, y, value) {
    const gold = new Loot(this, x + Phaser.Math.Between(-20, 20), y - 20, 'gold', value)
    this.loot.add(gold)
    this.add.existing(gold)
    this.physics.add.existing(gold)
    gold.body.setAllowGravity(true)
    gold.body.setVelocityY(-100)
    gold.body.setVelocityX(Phaser.Math.Between(-50, 50))
    gold.body.setCollideWorldBounds(true)
  }

  spawnTrophy(x, y) {
    const trophy = new Loot(this, x, y - 30, 'trophy')
    this.loot.add(trophy)
    this.add.existing(trophy)
    this.physics.add.existing(trophy)
    trophy.body.setAllowGravity(true)
    trophy.body.setVelocityY(-150)
    trophy.body.setCollideWorldBounds(true)
  }

  showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, {
      fontSize: '18px', fontFamily: 'Courier New, monospace', color: color, stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(50)

    this.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => txt.destroy()
    })
  }

  meleeAttack(x, y, range, damage, direction) {
    const hitbox = this.add.zone(x, y, range, 60)
    this.physics.world.enable(hitbox)
    hitbox.body.setAllowGravity(false)
    hitbox.body.setImmovable(true)
    hitbox.damage = damage
    hitbox.direction = direction
    hitbox.lifetime = this.time.now + 150
    this.meleeHitboxes.add(hitbox)

    // Visual effect
    const slash = this.add.graphics()
    slash.lineStyle(4, direction > 0 ? 0x4ade80 : 0xffd700, 1)
    slash.beginPath()
    slash.moveTo(x - direction * range/2, y)
    slash.lineTo(x + direction * range/2, y - 20)
    slash.lineTo(x + direction * range/2, y + 20)
    slash.closePath()
    slash.fillPath()
    slash.setDepth(15)

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.5,
      duration: 100,
      onComplete: () => slash.destroy()
    })
  }

  fireProjectile(x, y, direction, weaponType, damage) {
    const projectile = new Projectile(this, x, y, direction, weaponType, false, damage)
    this.projectiles.add(projectile)
    this.add.existing(projectile)
    this.physics.add.existing(projectile)
    return projectile
  }

  enemyFireProjectile(x, y, direction, type, damage) {
    const projectile = new Projectile(this, x, y, direction, type, true, damage || 1)
    this.enemyProjectiles.add(projectile)
    this.add.existing(projectile)
    this.physics.add.existing(projectile)
    return projectile
  }

  checkStationProximity() {
    if (!this.upgradeStations) return

    let near = false
    this.upgradeStations.getChildren().forEach(station => {
      if (station.active && !station.used) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y)
        if (dist < 80) near = true
      }
    })
    this.events.emit('station-near', near)
  }
}