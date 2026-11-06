import Phaser from 'phaser'

export default class Enemy extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type = 'zombie') {
    super(scene, x, y, type)
    this.scene = scene
    this.type = type
    this.state = 'idle'
    this.patrolLeft = x - 100
    this.patrolRight = x + 100
    this.moveSpeed = 50
    this.health = this.getMaxHealth()
    this.maxHealth = this.health
    this.scoreValue = this.getScoreValue()
    this.attackCooldown = 0
    this.attackRange = 200
    this.detectionRange = 300
    this.facingRight = true

    this.setScale(1)
    this.setDepth(5)
    this.setupBehavior()
  }

  getMaxHealth() {
    switch (this.type) {
      case 'zombie': return 2
      case 'skeleton': return 1
      case 'demon': return 4
      case 'boss': return 15
      default: return 2
    }
  }

  getScoreValue() {
    switch (this.type) {
      case 'zombie': return 100
      case 'skeleton': return 150
      case 'demon': return 300
      case 'boss': return 2000
      default: return 100
    }
  }

  setupBehavior() {
    switch (this.type) {
      case 'zombie':
        this.moveSpeed = 40
        this.attackRange = 30
        this.attackDamage = 1
        break
      case 'skeleton':
        this.moveSpeed = 60
        this.attackRange = 30
        this.attackDamage = 1
        break
      case 'demon':
        this.moveSpeed = 80
        this.attackRange = 250
        this.attackDamage = 1
        this.canFly = true
        break
      case 'boss':
        this.moveSpeed = 30
        this.attackRange = 400
        this.attackDamage = 2
        this.phase = 1
        break
    }
  }

  update(player) {
    if (!this.active || this.state === 'dying') return

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const canSeePlayer = distToPlayer < this.detectionRange

    if (this.type === 'boss') {
      this.updateBoss(player, distToPlayer)
    } else if (this.type === 'demon') {
      this.updateDemon(player, distToPlayer, canSeePlayer)
    } else {
      this.updateGroundEnemy(player, distToPlayer, canSeePlayer)
    }

    // Face player
    this.facingRight = player.x > this.x
    this.setFlipX(!this.facingRight)
  }

  updateGroundEnemy(player, dist, canSee) {
    if (this.state === 'stunned') return

    if (canSee && dist < this.attackRange) {
      // Attack
      if (this.scene.time.now > this.attackCooldown) {
        this.attack()
        this.attackCooldown = this.scene.time.now + 1500
      }
    } else if (canSee) {
      // Chase
      this.state = 'chase'
      const dir = player.x > this.x ? 1 : -1
      this.setVelocityX(dir * this.moveSpeed)
    } else {
      // Patrol
      this.state = 'patrol'
      if (this.x <= this.patrolLeft) this.setVelocityX(this.moveSpeed)
      else if (this.x >= this.patrolRight) this.setVelocityX(-this.moveSpeed)
    }
  }

  updateDemon(player, dist, canSee) {
    if (this.state === 'stunned') return

    const dy = player.y - this.y
    const dx = player.x - this.x

    if (canSee) {
      this.state = 'chase'

      // Fly towards player
      const speed = this.moveSpeed
      this.setVelocityX(dx > 0 ? speed : -speed)
      this.setVelocityY(dy > 0 ? speed * 0.5 : -speed * 0.5)

      // Attack from distance
      if (dist < this.attackRange && this.scene.time.now > this.attackCooldown) {
        this.attack()
        this.attackCooldown = this.scene.time.now + 2000
      }
    } else {
      // Hover patrol
      this.state = 'patrol'
      this.setVelocityX(Phaser.Math.Between(-30, 30))
      this.setVelocityY(Phaser.Math.Between(-20, 20))
    }

    // Keep in bounds
    if (this.y < 100) this.setVelocityY(50)
    if (this.y > 600) this.setVelocityY(-50)
  }

  updateBoss(player, dist) {
    if (this.state === 'stunned') return

    // Phase transition
    if (this.phase === 1 && this.health < this.maxHealth * 0.5) {
      this.phase = 2
      this.moveSpeed = 50
      this.attackRange = 500
    }

    const dx = player.x - this.x

    if (dist < this.attackRange) {
      if (this.scene.time.now > this.attackCooldown) {
        this.bossAttack(player)
        this.attackCooldown = this.scene.time.now + (this.phase === 2 ? 1000 : 2000)
      }
    }

    // Slow approach
    if (Math.abs(dx) > 100) {
      this.setVelocityX(dx > 0 ? this.moveSpeed : -this.moveSpeed)
    } else {
      this.setVelocityX(0)
    }
  }

  bossAttack(player) {
    // Multi-projectile attack
    const angles = this.phase === 2 ? [-0.5, 0, 0.5] : [0]
    angles.forEach(angle => {
      const vx = Math.cos(angle) * (player.x > this.x ? 1 : -1) * 300
      const vy = Math.sin(angle) * 300
      this.scene.enemyFireProjectile(this.x, this.y - 40, vx > 0 ? 1 : -1, 'axe')
    })

    // Ground slam if close
    if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < 150) {
      this.scene.time.delayedCall(500, () => {
        if (this.active) {
          this.scene.cameras.main.shake(200, 0.01)
        }
      })
    }
  }

  attack() {
    if (this.type === 'demon') {
      // Fire projectile at player
      const dir = this.facingRight ? 1 : -1
      this.scene.enemyFireProjectile(this.x, this.y, dir, 'lance')
    }
    // Zombies and skeletons do contact damage only
  }

  takeDamage(amount) {
    if (this.state === 'dying') return

    this.health -= amount

    // Flash
    this.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => this.clearTint())

    // Knockback
    const player = this.scene.player
    if (player) {
      const dir = this.x < player.x ? -1 : 1
      this.setVelocityX(dir * 200)
      this.setVelocityY(-100)
    }

    if (this.health <= 0) {
      this.die()
    }
  }

  die() {
    this.state = 'dying'
    this.setVelocity(0, 0)
    this.body.enable = false

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: Phaser.Math.Between(-90, 90),
      duration: 500,
      onComplete: () => {
        this.destroy()
      }
    })

    // Score
    this.scene.events.emit('score-changed', this.scene.registry.get('score'))
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    // Ground enemies need gravity
    if (this.type !== 'demon' && this.type !== 'boss') {
      // Handled by physics
    }
  }
}