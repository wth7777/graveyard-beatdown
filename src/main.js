import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import MainScene from './scenes/MainScene.js'
import UIScene from './scenes/UIScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, MainScene, UIScene],
  pixelArt: true,
  roundPixels: true,
  antialias: false
}

const game = new Phaser.Game(config)

window.__diag = {
  setStage: (id, status, text) => {
    const el = document.getElementById(id)
    if (el) { el.className = 'stage ' + status; el.textContent = id.replace('diag-stage-', '').toUpperCase() + ': ' + text }
  }
}

export default game