import Phaser from 'phaser'

export default class Loot extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type = 'gold', value = 10) {
    const texture = type === 'chest' ? 'weapon-box' : type === 'trophy' ? 'heart' : 'heart'
    super(scene, x, y, texture)
    this.scene = scene
    this.type = type
    this.value = value
    this.collected = false

    this.setScale(type === 'chest' ? 1.2 : 0.8)
    this.setDepth(8)

    if (type === 'gold') {
      this.setTint(0xffd700)
    } else if (type === 'trophy') {
      this.setTint(0xff6b6b)
    } else if (type === 'health') {
      this.setTint(0x4ade80)
    } else if (type === 'chest') {
      this.setTint(0x8b4513)
    }

    // Bobbing animation
    this.scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Spin for chests
    if (type === 'chest') {
      this.scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: 'Linear'
      })
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    // Attract to player when nearby
    if (this.scene.player && this.active && !this.collected) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y)
      if (dist < 100 && this.type !== 'chest') {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y)
        this.body.setVelocityX(Math.cos(angle) * 200)
        this.body.setVelocityY(Math.sin(angle) * 200)
      }
    }
  }
}