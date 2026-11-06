import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene')
  }

  create(data) {
    window.__diag?.setStage('diag-stage-ui', 'ok', 'UI: Ready')

    this.playerHealth = data?.playerHealth || 3
    this.playerMaxHealth = data?.playerMaxHealth || 3
    this.score = data?.score || 0
    this.weaponType = 'lance'

    this.setupUI()
    this.setupEvents()
  }

  setupUI() {
    const cam = this.cameras.main
    const x = 20
    let y = 20

    // Health hearts
    this.hearts = []
    for (let i = 0; i < this.playerMaxHealth; i++) {
      const heart = this.add.image(x + i * 28, y, 'heart')
        .setScrollFactor(0).setDepth(100).setScale(1.2)
      this.hearts.push(heart)
    }

    // Score
    y += 36
    this.scoreText = this.add.text(x, y, 'SCORE: 0', {
      fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setScrollFactor(0).setDepth(100)

    // Weapon display
    y += 28
    this.weaponBox = this.add.image(x + 24, y + 24, 'weapon-box')
      .setScrollFactor(0).setDepth(100).setScale(1)
    this.weaponIcon = this.add.image(x + 24, y + 24, this.weaponType)
      .setScrollFactor(0).setDepth(101).setScale(0.8)
    this.weaponName = this.add.text(x + 52, y + 12, this.formatWeaponName(this.weaponType), {
      fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#e0e0e0'
    }).setScrollFactor(0).setDepth(100)

    // Armor/Shield indicator (if any)
    y += 52
    this.shieldIcon = this.add.image(x + 12, y, 'shield')
      .setScrollFactor(0).setDepth(100).setScale(1).setVisible(false)
    this.shieldText = this.add.text(x + 28, y - 8, 'SHIELD', {
      fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#ffd700'
    }).setScrollFactor(0).setDepth(100).setVisible(false)

    // Controls hint (mobile)
    if (this.sys.game.device.input.touch) {
      this.add.text(cam.width - 20, cam.height - 20, '← → JUMP ATK', {
        fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#666'
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(100)
    }
  }

  setupEvents() {
    // Listen for health changes from MainScene
    this.scene.get('MainScene').events.on('health-changed', (health) => {
      this.playerHealth = health
      this.updateHearts()
    })

    this.scene.get('MainScene').events.on('score-changed', (score) => {
      this.score = score
      this.scoreText.setText('SCORE: ' + score)
    })

    this.scene.get('MainScene').events.on('weapon-changed', (weapon) => {
      this.weaponType = weapon
      this.weaponIcon.setTexture(weapon)
      this.weaponName.setText(this.formatWeaponName(weapon))
    })

    // Initialize
    this.updateHearts()
  }

  updateHearts() {
    this.hearts.forEach((heart, i) => {
      heart.setVisible(i < this.playerHealth)
      if (i < this.playerHealth) {
        heart.setTint(0xffffff)
      } else {
        heart.setTint(0x333333)
      }
    })
  }

  formatWeaponName(type) {
    const names = {
      'lance': 'LANCE',
      'dagger': 'DAGGER',
      'axe': 'AXE',
      'sickle': 'SICKLE',
      'holyfire': 'HOLY FIRE',
      'bolas': 'BOLAS'
    }
    return names[type] || type.toUpperCase()
  }
}