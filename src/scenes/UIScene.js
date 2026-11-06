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
    this.gold = 0
    this.trophies = 0
    this.depth = 0
    this.weaponMode = 'melee'
    this.meleeWeapon = { name: 'LANCE', level: 1, type: 'lance' }
    this.rangedWeapon = { name: 'DAGGER', level: 1, type: 'dagger' }
    this.armorLevel = 0
    this.nearStation = false

    this.setupUI()
    this.setupEvents()
  }

  setupUI() {
    const cam = this.cameras.main
    const x = 20
    let y = 20

    // Health hearts (dynamic max health)
    this.hearts = []
    this.maxHearts = this.playerMaxHealth
    for (let i = 0; i < 10; i++) { // Max 10 hearts
      const heart = this.add.image(x + i * 28, y, 'heart')
        .setScrollFactor(0).setDepth(100).setScale(1.2).setVisible(false)
      this.hearts.push(heart)
    }

    // Gold
    y += 36
    this.goldIcon = this.add.image(x + 12, y, 'coin').setScale(1).setScrollFactor(0).setDepth(100)
    this.goldText = this.add.text(x + 28, y - 10, 'GOLD: 0', {
      fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#ffd700'
    }).setScrollFactor(0).setDepth(100)

    // Trophies
    y += 28
    this.trophyIcon = this.add.image(x + 12, y, 'heart').setTint(0xff6b6b).setScale(1).setScrollFactor(0).setDepth(100)
    this.trophyText = this.add.text(x + 28, y - 10, 'TROPHIES: 0', {
      fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#ff6b6b'
    }).setScrollFactor(0).setDepth(100)

    // Score
    y += 28
    this.scoreText = this.add.text(x, y, 'SCORE: 0', {
      fontSize: '16px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setScrollFactor(0).setDepth(100)

    // Depth/Progress
    y += 24
    this.depthText = this.add.text(x, y, 'DEPTH: 0m', {
      fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#88aaff'
    }).setScrollFactor(0).setDepth(100)

    // Weapon displays
    y += 32
    // Melee weapon
    this.meleeBox = this.add.image(x + 24, y + 24, 'weapon-box').setScrollFactor(0).setDepth(100).setScale(1)
    this.meleeIcon = this.add.image(x + 24, y + 24, this.meleeWeapon.type).setScrollFactor(0).setDepth(101).setScale(0.8)
    this.meleeName = this.add.text(x + 52, y + 4, this.formatWeaponName(this.meleeWeapon.name, this.meleeWeapon.level), {
      fontSize: '13px', fontFamily: 'Courier New, monospace', color: '#e0e0e0'
    }).setScrollFactor(0).setDepth(100)
    this.meleeModeIndicator = this.add.text(x + 52, y + 20, 'MELEE [J]', {
      fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setScrollFactor(0).setDepth(100)

    // Ranged weapon
    y += 56
    this.rangedBox = this.add.image(x + 24, y + 24, 'weapon-box').setScrollFactor(0).setDepth(100).setScale(1)
    this.rangedIcon = this.add.image(x + 24, y + 24, this.rangedWeapon.type).setScrollFactor(0).setDepth(101).setScale(0.8)
    this.rangedName = this.add.text(x + 52, y + 4, this.formatWeaponName(this.rangedWeapon.name, this.rangedWeapon.level), {
      fontSize: '13px', fontFamily: 'Courier New, monospace', color: '#e0e0e0'
    }).setScrollFactor(0).setDepth(100)
    this.rangedModeIndicator = this.add.text(x + 52, y + 20, 'RANGED [K]', {
      fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#88aaff'
    }).setScrollFactor(0).setDepth(100)

    // Armor
    y += 60
    this.armorIcon = this.add.image(x + 12, y, 'shield').setScrollFactor(0).setDepth(100).setScale(1).setVisible(false)
    this.armorText = this.add.text(x + 28, y - 8, 'ARMOR: 0', {
      fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#ffd700'
    }).setScrollFactor(0).setDepth(100).setVisible(false)

    // Current weapon mode indicator
    y += 24
    this.modeText = this.add.text(x, y, 'MODE: MELEE (E to switch)', {
      fontSize: '14px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setScrollFactor(0).setDepth(100)

    // Station proximity
    this.stationHint = this.add.text(cam.width / 2, cam.height - 100, '', {
      fontSize: '16px', fontFamily: 'Courier New, monospace', color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false)

    // Controls hint (mobile)
    if (this.sys.game.device.input.touch) {
      this.add.text(cam.width - 20, cam.height - 20, '← → JUMP [J]MELEE [K]RANGED [E]SWITCH', {
        fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#666'
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(100)
    }
  }

  setupEvents() {
    const mainScene = this.scene.get('MainScene')

    mainScene.events.on('health-changed', (health) => {
      this.playerHealth = health
      this.updateHearts()
    })

    mainScene.events.on('max-health-changed', (max) => {
      this.playerMaxHealth = max
      this.maxHearts = max
      this.updateHearts()
    })

    mainScene.events.on('score-changed', (score) => {
      this.score = score
      this.scoreText.setText('SCORE: ' + score)
    })

    mainScene.events.on('gold-changed', (gold) => {
      this.gold = gold
      this.goldText.setText('GOLD: ' + gold)
    })

    mainScene.events.on('trophy-changed', (trophies) => {
      this.trophies = trophies
      this.trophyText.setText('TROPHIES: ' + trophies)
    })

    mainScene.events.on('depth-changed', (depth) => {
      this.depth = Math.floor(depth / 32) // Convert to "meters" (tiles)
      this.depthText.setText('DEPTH: ' + this.depth + 'm')
    })

    mainScene.events.on('weapon-mode-changed', (mode) => {
      this.weaponMode = mode
      this.modeText.setText('MODE: ' + mode.toUpperCase() + ' (E to switch)')
      this.modeText.setColor(mode === 'melee' ? '#4ade80' : '#88aaff')
      this.updateWeaponHighlight()
    })

    mainScene.events.on('weapon-upgraded', (slot, weapon) => {
      if (slot === 'melee') {
        this.meleeWeapon = weapon
        this.meleeIcon.setTexture(weapon.type)
        this.meleeName.setText(this.formatWeaponName(weapon.name, weapon.level))
      } else {
        this.rangedWeapon = weapon
        this.rangedIcon.setTexture(weapon.type)
        this.rangedName.setText(this.formatWeaponName(weapon.name, weapon.level))
      }
    })

    mainScene.events.on('armor-upgraded', (level) => {
      this.armorLevel = level
      this.armorIcon.setVisible(level > 0)
      this.armorText.setVisible(level > 0)
      this.armorText.setText('ARMOR: ' + level)
    })

    mainScene.events.on('station-near', (near) => {
      this.nearStation = near
      this.stationHint.setVisible(near)
      if (near) {
        this.stationHint.setText('[E] UPGRADE STATION')
      }
    })

    // Initialize
    this.updateHearts()
    this.updateWeaponHighlight()
  }

  updateHearts() {
    this.hearts.forEach((heart, i) => {
      heart.setVisible(i < this.playerHealth)
      if (i < this.playerHealth) {
        heart.setTint(0xffffff)
      } else if (i < this.playerMaxHealth) {
        heart.setTint(0x333333)
      } else {
        heart.setVisible(false)
      }
    })
  }

  updateWeaponHighlight() {
    if (this.weaponMode === 'melee') {
      this.meleeBox.setTint(0x4ade80)
      this.rangedBox.clearTint()
      this.meleeModeIndicator.setColor('#4ade80')
      this.rangedModeIndicator.setColor('#888888')
    } else {
      this.rangedBox.setTint(0x88aaff)
      this.meleeBox.clearTint()
      this.rangedModeIndicator.setColor('#88aaff')
      this.meleeModeIndicator.setColor('#888888')
    }
  }

  formatWeaponName(name, level) {
    return `${name} (Lv.${level})`
  }
}