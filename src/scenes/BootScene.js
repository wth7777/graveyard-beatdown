import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    this.add.text(width / 2, height / 2 - 50, 'GRAVEYARD BEATDOWN', {
      fontSize: '32px', fontFamily: 'Courier New, monospace', color: '#4ade80'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 20, 'Loading assets...', {
      fontSize: '16px', fontFamily: 'Courier New, monospace', color: '#e0e0e0'
    }).setOrigin(0.5)

    const progressBar = this.add.graphics()
    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x4ade80, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 + 40, 300 * value, 20)
    })
    this.load.on('complete', () => { progressBar.destroy() })

    this.load.baseURL = '/graveyard-beatdown/'

    // Character spritesheet (16 frames, 384x256 each, 768x2048 total)
    this.load.atlas('knight', 'assets/images/character/spritesheet-1793923405413.png', 'assets/images/character/spritesheet-1793923405413.json')

    // Backgrounds
    this.load.image('bg1', 'assets/images/tiles/background1.jpg')
    this.load.image('bg2', 'assets/images/tiles/background2.jpg')
    this.load.image('bg3', 'assets/images/tiles/background3.jpg')

    // Procedural fallback graphics for enemies, projectiles, UI
    this.createEnemyTextures()
    this.createProjectileTextures()
    this.createUITextures()
    this.createTileTextures()
  }

  create() {
    window.__diag?.setStage('diag-stage-boot', 'ok', 'BOOT: Textures ready')
    this.scene.start('MainScene')
    this.scene.launch('UIScene')
  }

  createEnemyTextures() {
    // Zombie/Ghoul
    const zombie = this.make.graphics({ x: 0, y: 0, add: false })
    zombie.fillStyle(0x5a8a4a, 1)
    zombie.fillEllipse(32, 48, 40, 56) // body
    zombie.fillStyle(0x3a5a2a, 1)
    zombie.fillEllipse(32, 30, 28, 28) // head
    zombie.fillStyle(0xff0000, 1)
    zombie.fillCircle(24, 28, 3); zombie.fillCircle(40, 28, 3) // eyes
    zombie.fillStyle(0x8b0000, 1)
    zombie.fillRect(20, 70, 8, 20); zombie.fillRect(44, 70, 8, 20) // legs
    zombie.generateTexture('zombie', 64, 96)

    // Skeleton
    const skeleton = this.make.graphics({ x: 0, y: 0, add: false })
    skeleton.fillStyle(0xe0e0e0, 1)
    skeleton.fillRect(28, 20, 24, 16) // skull
    skeleton.fillRect(30, 36, 20, 4) // neck
    skeleton.fillRect(24, 40, 32, 40) // ribcage
    skeleton.fillRect(16, 44, 8, 32); skeleton.fillRect(56, 44, 8, 32) // arms
    skeleton.fillRect(28, 80, 10, 32); skeleton.fillRect(42, 80, 10, 32) // legs
    skeleton.generateTexture('skeleton', 64, 112)

    // Flying demon/harpy
    const demon = this.make.graphics({ x: 0, y: 0, add: false })
    demon.fillStyle(0x8b0040, 1)
    demon.fillEllipse(32, 32, 48, 40) // body
    demon.fillStyle(0x660030, 1)
    demon.fillTriangle(8, 32, 32, 16, 32, 48) // left wing
    demon.fillTriangle(56, 32, 32, 16, 32, 48) // right wing
    demon.fillStyle(0xffcc00, 1)
    demon.fillCircle(22, 28, 4); demon.fillCircle(42, 28, 4) // eyes
    demon.generateTexture('demon', 64, 64)

    // Boss - Big Demon
    const boss = this.make.graphics({ x: 0, y: 0, add: false })
    boss.fillStyle(0x4a0020, 1)
    boss.fillEllipse(64, 96, 80, 100) // body
    boss.fillStyle(0x8b0040, 1)
    boss.fillTriangle(24, 80, 64, 40, 64, 120) // left wing
    boss.fillTriangle(104, 80, 64, 40, 64, 120) // right wing
    boss.fillStyle(0xff0000, 1)
    boss.fillCircle(48, 80, 8); boss.fillCircle(80, 80, 8) // eyes
    boss.fillStyle(0xffffff, 1)
    boss.fillRect(40, 110, 48, 12) // mouth
    boss.generateTexture('boss', 128, 192)
  }

  createProjectileTextures() {
    // Lance/Sword (default)
    const lance = this.make.graphics({ x: 0, y: 0, add: false })
    lance.fillStyle(0xc0c0c0, 1)
    lance.fillRect(0, 10, 48, 4)
    lance.fillStyle(0xffffff, 1)
    lance.fillTriangle(48, 8, 64, 12, 48, 16)
    lance.generateTexture('lance', 64, 24)

    // Dagger (fast, shorter)
    const dagger = this.make.graphics({ x: 0, y: 0, add: false })
    dagger.fillStyle(0xc0c0c0, 1)
    dagger.fillRect(0, 8, 32, 4)
    dagger.fillStyle(0xffffff, 1)
    dagger.fillTriangle(32, 6, 40, 10, 32, 14)
    dagger.generateTexture('dagger', 40, 20)

    // Axe (arc)
    const axe = this.make.graphics({ x: 0, y: 0, add: false })
    axe.fillStyle(0x8b4513, 1)
    axe.fillTriangle(0, 0, 24, 24, 0, 24)
    axe.fillStyle(0x654321, 1)
    axe.fillRect(0, 20, 8, 16)
    axe.generateTexture('axe', 24, 40)

    // Sickle (boomerang)
    const sickle = this.make.graphics({ x: 0, y: 0, add: false })
    sickle.fillStyle(0xc0c0c0, 1)
    sickle.fillArc(16, 16, 16, Math.PI * 1.5, Math.PI * 0.5, false, 4)
    sickle.fillRect(0, 12, 12, 4)
    sickle.generateTexture('sickle', 32, 32)

    // Holy Fire (arc, high damage)
    const holyFire = this.make.graphics({ x: 0, y: 0, add: false })
    holyFire.fillStyle(0xffd700, 1)
    holyFire.fillCircle(12, 12, 12)
    holyFire.fillStyle(0xff8800, 1)
    holyFire.fillCircle(12, 12, 8)
    holyFire.fillStyle(0xffcc00, 1)
    holyFire.fillCircle(12, 12, 4)
    holyFire.generateTexture('holyfire', 24, 24)

    // Bolas (wide)
    const bolas = this.make.graphics({ x: 0, y: 0, add: false })
    bolas.fillStyle(0x333333, 1)
    bolas.fillCircle(8, 8, 8)
    bolas.fillCircle(24, 8, 8)
    bolas.fillStyle(0x666666, 1)
    bolas.fillRect(8, 6, 16, 4)
    bolas.generateTexture('bolas', 32, 16)
  }

  createUITextures() {
    // Health heart
    const heart = this.make.graphics({ x: 0, y: 0, add: false })
    heart.fillStyle(0xff0000, 1)
    heart.fillCircle(8, 6, 6)
    heart.fillCircle(16, 6, 6)
    heart.fillRect(4, 6, 14, 10)
    heart.generateTexture('heart', 24, 24)

    // Gold coin
    const coin = this.make.graphics({ x: 0, y: 0, add: false })
    coin.fillStyle(0xffd700, 1)
    coin.fillCircle(12, 12, 12)
    coin.fillStyle(0xffaa00, 1)
    coin.fillCircle(12, 12, 8)
    coin.fillStyle(0xffcc00, 1)
    coin.fillCircle(12, 12, 4)
    coin.lineStyle(2, 0xff8800, 1)
    coin.strokeCircle(12, 12, 10)
    coin.generateTexture('coin', 24, 24)

    // Armor shield
    const shield = this.make.graphics({ x: 0, y: 0, add: false })
    shield.fillStyle(0xffd700, 1)
    shield.fillRect(4, 2, 16, 4)
    shield.fillRect(2, 6, 20, 16)
    shield.fillStyle(0xffaa00, 1)
    shield.fillRect(6, 8, 12, 12)
    shield.generateTexture('shield', 24, 24)

    // Weapon icon box
    const wbox = this.make.graphics({ x: 0, y: 0, add: false })
    wbox.lineStyle(2, 0x4ade80, 1)
    wbox.strokeRect(2, 2, 44, 44)
    wbox.generateTexture('weapon-box', 48, 48)
  }

  createTileTextures() {
    // Ground tile
    const ground = this.make.graphics({ x: 0, y: 0, add: false })
    ground.fillStyle(0x3d2b1f, 1)
    ground.fillRect(0, 0, 64, 64)
    ground.fillStyle(0x4a3728, 1)
    for (let i = 0; i < 64; i += 16) {
      for (let j = 0; j < 64; j += 16) {
        if ((i + j) % 32 === 0) ground.fillRect(i, j, 8, 8)
      }
    }
    ground.generateTexture('ground', 64, 64)

    // Platform tile
    const platform = this.make.graphics({ x: 0, y: 0, add: false })
    platform.fillStyle(0x2a2a2a, 1)
    platform.fillRect(0, 0, 64, 32)
    platform.fillStyle(0x3a3a3a, 1)
    platform.fillRect(0, 0, 64, 4)
    platform.generateTexture('platform', 64, 32)
  }
}