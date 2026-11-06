import Phaser from 'phaser'

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'knight', 'frame_0')
    scene.physics.world.enable(this)

    this.scene = scene
    this.health = 3
    this.maxHealth = 3
    this.invulnerable = false
    this.invulnTime = 0
    this.facingRight = true
    this.onGround = false
    this.jumpsUsed = 0
    this.maxJumps = 2 // Double jump!

    // Lost Dungeon mechanics
    this.gold = 0
    this.trophies = 0
    this.depth = 0 // How far into the dungeon

    // Weapon system - melee + ranged
    this.weapons = {
      melee: {
        type: 'lance', // lance, heavy, dual, magic
        level: 1,
        damage: 1,
        range: 60,
        attackRate: 300,
        name: 'Lance'
      },
      ranged: {
        type: 'dagger', // dagger, axe, sickle, holyfire, bolas
        level: 1,
        damage: 1,
        range: 400,
        attackRate: 400,
        name: 'Dagger'
      }
    }
    this.currentWeaponMode = 'melee' // 'melee' or 'ranged'
    this.lastMeleeTime = 0
    this.lastRangedTime = 0

    // Armor/defense
    this.armorLevel = 0
    this.damageReduction = 0

    // Stats
    this.moveSpeed = 200
    this.jumpPower = 450
    this.score = 0

    this.setupAnimations()
    this.setScale(0.5)
    this.setDepth(10)
    this.play('knight-idle-right')
  }

  get currentWeapon() {
    return this.weapons[this.currentWeaponMode]
  }

  get meleeWeapon() {
    return this.weapons.melee
  }

  get rangedWeapon() {
    return this.weapons.ranged
  }

  setupAnimations() {
    this.scene.anims.create({
      key: 'knight-idle-right', frames: [{ key: 'knight', frame: 'frame_0' }], frameRate: 1, repeat: -1
    })
    this.scene.anims.create({
      key: 'knight-idle-left', frames: [{ key: 'knight', frame: 'frame_1' }], frameRate: 1, repeat: -1
    })
    this.scene.anims.create({
      key: 'knight-walk-right', frames: [
        { key: 'knight', frame: 'frame_2' }, { key: 'knight', frame: 'frame_3' },
        { key: 'knight', frame: 'frame_4' }, { key: 'knight', frame: 'frame_5' }
      ], frameRate: 10, repeat: -1
    })
    this.scene.anims.create({
      key: 'knight-walk-left', frames: [
        { key: 'knight', frame: 'frame_6' }, { key: 'knight', frame: 'frame_7' },
        { key: 'knight', frame: 'frame_8' }, { key: 'knight', frame: 'frame_9' }
      ], frameRate: 10, repeat: -1
    })
    this.scene.anims.create({
      key: 'knight-jump-right', frames: [{ key: 'knight', frame: 'frame_10' }], frameRate: 1, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-jump-left', frames: [{ key: 'knight', frame: 'frame_11' }], frameRate: 1, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-melee-right', frames: [
        { key: 'knight', frame: 'frame_12' }, { key: 'knight', frame: 'frame_13' }
      ], frameRate: 20, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-melee-left', frames: [
        { key: 'knight', frame: 'frame_14' }, { key: 'knight', frame: 'frame_15' }
      ], frameRate: 20, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-ranged-right', frames: [
        { key: 'knight', frame: 'frame_12' }, { key: 'knight', frame: 'frame_13' }
      ], frameRate: 15, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-ranged-left', frames: [
        { key: 'knight', frame: 'frame_14' }, { key: 'knight', frame: 'frame_15' }
      ], frameRate: 15, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-hurt-right', frames: [{ key: 'knight', frame: 'frame_1' }], frameRate: 1, repeat: 0
    })
    this.scene.anims.create({
      key: 'knight-hurt-left', frames: [{ key: 'knight', frame: 'frame_0' }], frameRate: 1, repeat: 0
    })
  }

  handleInput(left, right, jumpPressed, meleePressed, rangedPressed, switchPressed) {
    const now = this.scene.time.now

    // Horizontal movement
    if (left && !right) {
      this.setVelocityX(-this.moveSpeed)
      this.facingRight = false
      if (this.onGround && !this.isPlayingAnim('melee') && !this.isPlayingAnim('ranged')) {
        this.play('knight-walk-left', true)
      }
    } else if (right && !left) {
      this.setVelocityX(this.moveSpeed)
      this.facingRight = true
      if (this.onGround && !this.isPlayingAnim('melee') && !this.isPlayingAnim('ranged')) {
        this.play('knight-walk-right', true)
      }
    } else {
      this.setVelocityX(0)
      if (this.onGround && !this.isPlayingAnim('melee') && !this.isPlayingAnim('ranged')) {
        this.play(this.facingRight ? 'knight-idle-right' : 'knight-idle-left', true)
      }
    }

    // Jump (double jump!)
    if (jumpPressed && this.jumpsUsed < this.maxJumps) {
      this.setVelocityY(-this.jumpPower)
      this.jumpsUsed++
      this.onGround = false
      this.play(this.facingRight ? 'knight-jump-right' : 'knight-jump-left', true)
      if (this.jumpsUsed === 2) this.canAirControl = true
    }

    // Air control on second jump
    if (this.canAirControl && !this.onGround && this.jumpsUsed === 2) {
      if (left) this.setVelocityX(-150)
      else if (right) this.setVelocityX(150)
    }

    // Switch weapon mode (E key)
    if (switchPressed) {
      this.currentWeaponMode = this.currentWeaponMode === 'melee' ? 'ranged' : 'melee'
      this.scene.events.emit('weapon-mode-changed', this.currentWeaponMode)
      // Visual feedback
      this.setTint(this.currentWeaponMode === 'melee' ? 0xffffff : 0x88aaff)
      this.scene.time.delayedCall(200, () => this.clearTint())
    }

    // Melee attack (J key)
    if (meleePressed && now - this.lastMeleeTime > this.meleeWeapon.attackRate) {
      this.meleeAttack()
      this.lastMeleeTime = now
    }

    // Ranged attack (K key)
    if (rangedPressed && now - this.lastRangedTime > this.rangedWeapon.attackRate) {
      this.rangedAttack()
      this.lastRangedTime = now
    }

    // Update invulnerability
    if (this.invulnerable && now > this.invulnTime) {
      this.invulnerable = false
      this.setAlpha(1)
    }
  }

  isPlayingAnim(key) {
    return this.anims.currentAnim && this.anims.currentAnim.key.includes(key)
  }

  meleeAttack() {
    if (this.isPlayingAnim('melee')) return

    const animKey = this.facingRight ? 'knight-melee-right' : 'knight-melee-left'
    this.play(animKey, true)

    // Melee hitbox - instant damage in front of player
    this.scene.time.delayedCall(80, () => {
      if (!this.active) return
      const range = this.meleeWeapon.range
      const x = this.facingRight ? this.x + range/2 : this.x - range/2
      const y = this.y - 10
      this.scene.meleeAttack(x, y, range, this.meleeWeapon.damage, this.facingRight ? 1 : -1)
    })

    this.once('animationcomplete', () => this.returnToIdle())
  }

  rangedAttack() {
    if (this.isPlayingAnim('ranged')) return

    const animKey = this.facingRight ? 'knight-ranged-right' : 'knight-ranged-left'
    this.play(animKey, true)

    // Fire projectile
    this.scene.time.delayedCall(100, () => {
      if (!this.active) return
      const x = this.facingRight ? this.x + 40 : this.x - 40
      const y = this.y - 10
      this.scene.fireProjectile(x, y, this.facingRight ? 1 : -1, this.rangedWeapon.type, this.rangedWeapon.damage)
    })

    this.once('animationcomplete', () => this.returnToIdle())
  }

  returnToIdle() {
    if (!this.active) return
    if (this.body.velocity.x !== 0 && this.onGround) {
      this.play(this.facingRight ? 'knight-walk-right' : 'knight-walk-left', true)
    } else if (this.onGround) {
      this.play(this.facingRight ? 'knight-idle-right' : 'knight-idle-left', true)
    }
  }

  takeDamage(amount) {
    if (this.invulnerable || !this.active) return

    // Apply damage reduction from armor
    const actualDamage = Math.max(1, amount - this.damageReduction)
    this.health -= actualDamage
    this.invulnerable = true
    this.invulnTime = this.scene.time.now + 1500
    this.setAlpha(0.5)

    this.scene.tweens.add({
      targets: this, alpha: { from: 0.5, to: 1 }, duration: 100, repeat: 14, yoyo: true
    })

    this.play(this.facingRight ? 'knight-hurt-right' : 'knight-hurt-left', true)
    this.scene.events.emit('health-changed', this.health)

    if (this.health <= 0) this.die()
  }

  die() {
    this.setActive(false)
    this.setVisible(false)
    this.body.enable = false

    this.scene.add.text(this.x, this.y - 50, 'YOU DIED', {
      fontSize: '32px', fontFamily: 'Courier New, monospace', color: '#ff0000'
    }).setOrigin(0.5).setDepth(100)

    // Lose half gold on death (Lost Dungeon style)
    const lostGold = Math.floor(this.gold * 0.5)
    this.gold -= lostGold
    this.scene.events.emit('gold-changed', this.gold)

    this.scene.time.delayedCall(2000, () => this.scene.scene.restart())
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
    this.scene.events.emit('health-changed', this.health)
  }

  addGold(amount) {
    this.gold += amount
    this.scene.events.emit('gold-changed', this.gold)
  }

  addTrophy() {
    this.trophies++
    this.scene.events.emit('trophy-changed', this.trophies)
  }

  addScore(amount) {
    this.score += amount
    this.scene.events.emit('score-changed', this.score)
  }

  // Upgrade system
  upgradeMeleeWeapon() {
    const w = this.meleeWeapon
    const costs = [0, 50, 150, 400, 1000, 2500]
    if (w.level >= 5) return false
    if (this.gold < costs[w.level]) return false

    this.gold -= costs[w.level]
    w.level++
    w.damage = Math.floor(w.damage * 1.5) + 1
    w.range = Math.min(120, w.range + 10)
    w.attackRate = Math.max(150, w.attackRate - 30)

    const names = ['Lance', 'Heavy Sword', 'Dual Blades', 'Magic Staff', 'Legendary', 'Mythic']
    w.name = names[w.level - 1] || 'Mythic'
    w.type = ['lance', 'heavy', 'dual', 'magic', 'legendary', 'mythic'][w.level - 1] || 'mythic'

    this.scene.events.emit('gold-changed', this.gold)
    this.scene.events.emit('weapon-upgraded', 'melee', w)
    return true
  }

  upgradeRangedWeapon() {
    const w = this.rangedWeapon
    const costs = [0, 50, 150, 400, 1000, 2500]
    if (w.level >= 5) return false
    if (this.gold < costs[w.level]) return false

    this.gold -= costs[w.level]
    w.level++
    w.damage = Math.floor(w.damage * 1.5) + 1
    w.attackRate = Math.max(200, w.attackRate - 40)

    const names = ['Dagger', 'Axe', 'Sickle', 'Holy Fire', 'Bolas', 'Mythic']
    w.name = names[w.level - 1] || 'Mythic'
    w.type = ['dagger', 'axe', 'sickle', 'holyfire', 'bolas', 'mythic'][w.level - 1] || 'mythic'

    this.scene.events.emit('gold-changed', this.gold)
    this.scene.events.emit('weapon-upgraded', 'ranged', w)
    return true
  }

  upgradeArmor() {
    const costs = [0, 100, 300, 800, 2000]
    if (this.armorLevel >= 4) return false
    if (this.gold < costs[this.armorLevel]) return false

    this.gold -= costs[this.armorLevel]
    this.armorLevel++
    this.maxHealth += 1
    this.health = this.maxHealth
    this.damageReduction = this.armorLevel

    this.scene.events.emit('gold-changed', this.gold)
    this.scene.events.emit('health-changed', this.health)
    this.scene.events.emit('max-health-changed', this.maxHealth)
    this.scene.events.emit('armor-upgraded', this.armorLevel)
    return true
  }

  upgradeSpeed() {
    const costs = [0, 75, 200, 500]
    const maxLevel = 3
    if (!this.speedLevel) this.speedLevel = 0
    if (this.speedLevel >= maxLevel) return false
    if (this.gold < costs[this.speedLevel]) return false

    this.gold -= costs[this.speedLevel]
    this.speedLevel++
    this.moveSpeed += 30
    this.jumpPower += 30

    this.scene.events.emit('gold-changed', this.gold)
    return true
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    this.onGround = this.body.blocked.down || this.body.touching.down
    if (this.onGround) {
      this.jumpsUsed = 0
      this.canAirControl = false
    }

    // Track depth (furthest right reached)
    if (this.x > this.depth) {
      this.depth = this.x
      this.scene.events.emit('depth-changed', this.depth)
    }

    if (Math.abs(this.body.velocity.x) < 10) this.body.velocity.x = 0
  }
}