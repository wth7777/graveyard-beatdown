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
    this.weaponType = 'lance'
    this.weaponLevel = 0 // 0=lance, 1=dagger, 2=axe, 3=sickle, 4=holyfire, 5=bolas
    this.attackCooldown = 0
    this.attackRate = 300
    this.lastAttackTime = 0
    this.score = 0

    this.setupAnimations()
    this.setScale(0.5) // Spritesheet frames are 384x256, scale down
    this.setDepth(10)
    this.play('knight-idle-right')
  }

  setupAnimations() {
    // The spritesheet has 16 frames (2x8 grid). We'll use them for different animations.
    // For now, create simple animations using the atlas frames
    const frames = this.texture.frames
    const frameNames = Object.keys(frames).filter(k => k.startsWith('frame_'))

    // Since we don't know exact frame layout, create procedural animations
    // We'll use the first few frames for idle/walk/jump/attack

    this.scene.anims.create({
      key: 'knight-idle-right',
      frames: [{ key: 'knight', frame: 'frame_0' }],
      frameRate: 1,
      repeat: -1
    })

    this.scene.anims.create({
      key: 'knight-idle-left',
      frames: [{ key: 'knight', frame: 'frame_1' }],
      frameRate: 1,
      repeat: -1
    })

    this.scene.anims.create({
      key: 'knight-walk-right',
      frames: [
        { key: 'knight', frame: 'frame_2' },
        { key: 'knight', frame: 'frame_3' },
        { key: 'knight', frame: 'frame_4' },
        { key: 'knight', frame: 'frame_5' }
      ],
      frameRate: 10,
      repeat: -1
    })

    this.scene.anims.create({
      key: 'knight-walk-left',
      frames: [
        { key: 'knight', frame: 'frame_6' },
        { key: 'knight', frame: 'frame_7' },
        { key: 'knight', frame: 'frame_8' },
        { key: 'knight', frame: 'frame_9' }
      ],
      frameRate: 10,
      repeat: -1
    })

    this.scene.anims.create({
      key: 'knight-jump-right',
      frames: [{ key: 'knight', frame: 'frame_10' }],
      frameRate: 1,
      repeat: 0
    })

    this.scene.anims.create({
      key: 'knight-jump-left',
      frames: [{ key: 'knight', frame: 'frame_11' }],
      frameRate: 1,
      repeat: 0
    })

    this.scene.anims.create({
      key: 'knight-attack-right',
      frames: [
        { key: 'knight', frame: 'frame_12' },
        { key: 'knight', frame: 'frame_13' }
      ],
      frameRate: 15,
      repeat: 0
    })

    this.scene.anims.create({
      key: 'knight-attack-left',
      frames: [
        { key: 'knight', frame: 'frame_14' },
        { key: 'knight', frame: 'frame_15' }
      ],
      frameRate: 15,
      repeat: 0
    })

    this.scene.anims.create({
      key: 'knight-hurt-right',
      frames: [{ key: 'knight', frame: 'frame_1' }],
      frameRate: 1,
      repeat: 0
    })

    this.scene.anims.create({
      key: 'knight-hurt-left',
      frames: [{ key: 'knight', frame: 'frame_0' }],
      frameRate: 1,
      repeat: 0
    })
  }

  handleInput(left, right, jumpPressed, attackPressed) {
    const now = this.scene.time.now

    // Horizontal movement
    if (left && !right) {
      this.setVelocityX(-200)
      this.facingRight = false
      if (this.onGround && !this.isPlayingAnim('attack')) this.play('knight-walk-left', true)
    } else if (right && !left) {
      this.setVelocityX(200)
      this.facingRight = true
      if (this.onGround && !this.isPlayingAnim('attack')) this.play('knight-walk-right', true)
    } else {
      this.setVelocityX(0)
      if (this.onGround && !this.isPlayingAnim('attack')) {
        this.play(this.facingRight ? 'knight-idle-right' : 'knight-idle-left', true)
      }
    }

    // Jump (double jump!)
    if (jumpPressed && this.jumpsUsed < this.maxJumps) {
      this.setVelocityY(-450)
      this.jumpsUsed++
      this.onGround = false
      this.play(this.facingRight ? 'knight-jump-right' : 'knight-jump-left', true)

      // Allow direction change on second jump (like Super Ghouls 'n Ghosts)
      if (this.jumpsUsed === 2) {
        this.canAirControl = true
      }
    }

    // Air control on second jump
    if (this.canAirControl && !this.onGround && this.jumpsUsed === 2) {
      if (left) this.setVelocityX(-150)
      else if (right) this.setVelocityX(150)
    }

    // Attack
    if (attackPressed && now - this.lastAttackTime > this.attackRate) {
      this.attack()
      this.lastAttackTime = now
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

  attack() {
    if (this.isPlayingAnim('attack')) return

    const animKey = this.facingRight ? 'knight-attack-right' : 'knight-attack-left'
    this.play(animKey, true)

    // Fire projectile after short delay
    this.scene.time.delayedCall(100, () => {
      if (!this.active) return
      const x = this.facingRight ? this.x + 40 : this.x - 40
      const y = this.y - 10
      this.scene.fireProjectile(x, y, this.facingRight ? 1 : -1, this.weaponType)
    })

    // Return to idle/walk after attack
    this.once('animationcomplete', () => {
      if (!this.active) return
      if (this.body.velocity.x !== 0 && this.onGround) {
        this.play(this.facingRight ? 'knight-walk-right' : 'knight-walk-left', true)
      } else if (this.onGround) {
        this.play(this.facingRight ? 'knight-idle-right' : 'knight-idle-left', true)
      }
    })
  }

  takeDamage(amount) {
    if (this.invulnerable || !this.active) return

    this.health -= amount
    this.invulnerable = true
    this.invulnTime = this.scene.time.now + 1500
    this.setAlpha(0.5)

    // Flash effect
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.5, to: 1 },
      duration: 100,
      repeat: 14,
      yoyo: true
    })

    // Play hurt animation
    this.play(this.facingRight ? 'knight-hurt-right' : 'knight-hurt-left', true)

    // Update UI
    this.scene.events.emit('health-changed', this.health)

    if (this.health <= 0) {
      this.die()
    }
  }

  die() {
    this.setActive(false)
    this.setVisible(false)
    this.body.enable = false

    this.scene.add.text(this.x, this.y - 50, 'YOU DIED', {
      fontSize: '32px', fontFamily: 'Courier New, monospace', color: '#ff0000'
    }).setOrigin(0.5).setDepth(100)

    this.scene.time.delayedCall(2000, () => {
      this.scene.scene.restart()
    })
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
    this.scene.events.emit('health-changed', this.health)
  }

  setWeapon(type) {
    this.weaponType = type
    this.scene.events.emit('weapon-changed', type)
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    // Check if on ground
    this.onGround = this.body.blocked.down || this.body.touching.down
    if (this.onGround) {
      this.jumpsUsed = 0
      this.canAirControl = false
    }

    // Clamp velocity
    if (Math.abs(this.body.velocity.x) < 10) this.body.velocity.x = 0
  }
}