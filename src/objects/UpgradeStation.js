import Phaser from 'phaser'

export default class UpgradeStation extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'shield')
    this.scene = scene
    this.used = false

    this.setScale(1.5)
    this.setDepth(8)
    this.setTint(0xffd700)

    // Pulsing glow
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.6, to: 1 },
      scale: { from: 1.3, to: 1.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Floating particles
    this.emitter = scene.add.particles(x, y, 'sparkle', {
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 800,
      quantity: 1,
      frequency: 300,
      blendMode: 'ADD',
      emitting: true
    })
    this.emitter.setDepth(7)
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)
    if (this.emitter) {
      this.emitter.setPosition(this.x, this.y)
    }
  }

  destroy() {
    if (this.emitter) this.emitter.destroy()
    super.destroy()
  }
}