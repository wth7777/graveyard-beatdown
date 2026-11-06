import Phaser from 'phaser'

export default class Projectile extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, direction, weaponType = 'lance', fromEnemy = false, damage = null) {
    super(scene, x, y, weaponType)
    this.scene = scene
    this.direction = direction
    this.weaponType = weaponType
    this.fromEnemy = fromEnemy
    this.damage = damage !== null ? damage : this.getDamage()
    this.lifetime = 3000
    this.spawnTime = scene.time.now

    this.setScale(1)
    this.setDepth(8)
    this.setFlipX(direction < 0)

    this.setupPhysics()
  }

  getDamage() {
    switch (this.weaponType) {
      case 'lance': return 1
      case 'dagger': return 1
      case 'axe': return 2
      case 'sickle': return 1
      case 'holyfire': return 3
      case 'bolas': return 2
      default: return 1
    }
  }

  setupPhysics() {
    const config = this.getWeaponConfig()
    this.scene.physics.world.enable(this)
    this.body.setAllowGravity(config.gravity)
    this.body.setVelocity(config.speed * this.direction, config.verticalSpeed || 0)
    this.body.setSize(this.width * 0.8, this.height * 0.8)

    // Boomerang effect for sickle
    if (this.weaponType === 'sickle' && !this.fromEnemy) {
      this.boomerangTime = this.scene.time.now + 800
      this.returning = false
    }

    // Arc for axe and holyfire
    if (['axe', 'holyfire'].includes(this.weaponType)) {
      this.body.setVelocityY(-200)
    }
  }

  getWeaponConfig() {
    switch (this.weaponType) {
      case 'lance':
        return { speed: 500, gravity: false }
      case 'dagger':
        return { speed: 700, gravity: false }
      case 'axe':
        return { speed: 300, gravity: true, verticalSpeed: -200 }
      case 'sickle':
        return { speed: 400, gravity: false }
      case 'holyfire':
        return { speed: 250, gravity: true, verticalSpeed: -150 }
      case 'bolas':
        return { speed: 350, gravity: false }
      default:
        return { speed: 500, gravity: false }
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    // Lifetime
    if (time - this.spawnTime > this.lifetime) {
      this.destroy()
      return
    }

    // Sickle boomerang
    if (this.weaponType === 'sickle' && !this.fromEnemy && !this.returning && time > this.boomerangTime) {
      this.returning = true
      this.direction *= -1
      this.setFlipX(this.direction < 0)
      this.body.setVelocityX(this.getWeaponConfig().speed * this.direction)
    }

    // Return to player (sickle)
    if (this.weaponType === 'sickle' && this.returning && this.scene.player) {
      const dx = this.scene.player.x - this.x
      const dy = this.scene.player.y - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 50) {
        this.destroy()
      } else {
        const speed = this.getWeaponConfig().speed
        this.body.setVelocityX((dx / dist) * speed)
        this.body.setVelocityY((dy / dist) * speed)
      }
    }

    // Axe and holyfire arc
    if (['axe', 'holyfire'].includes(this.weaponType) && this.body) {
      this.body.velocityY += 50 // gravity
    }

    // Rotation for spinning weapons
    if (['axe', 'sickle', 'bolas'].includes(this.weaponType)) {
      this.angle += this.direction * 15
    }

    // Cleanup if off screen
    const cam = this.scene.cameras.main
    if (this.x < cam.scrollX - 100 || this.x > cam.scrollX + cam.width + 100 ||
        this.y < -100 || this.y > cam.height + 100) {
      this.destroy()
    }
  }
}