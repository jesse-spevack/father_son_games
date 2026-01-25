import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Game Over text
    this.add.text(centerX, centerY - 100, 'GAME OVER', {
      font: '48px monospace',
      fill: '#ff0000',
    }).setOrigin(0.5);

    // Score
    this.add.text(centerX, centerY, `Score: ${this.finalScore}`, {
      font: '32px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // High score
    const highScore = this.getHighScore();
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      this.add.text(centerX, centerY + 50, 'NEW HIGH SCORE!', {
        font: '24px monospace',
        fill: '#ffff00',
      }).setOrigin(0.5);
    } else {
      this.add.text(centerX, centerY + 50, `High Score: ${highScore}`, {
        font: '24px monospace',
        fill: '#888888',
      }).setOrigin(0.5);
    }

    // Restart prompt
    this.add.text(centerX, centerY + 120, 'Press SPACE or tap to play again', {
      font: '20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Input handling
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', () => this.restartGame());
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.restartGame();
    }
  }

  restartGame() {
    this.scene.start('GameScene');
  }

  getHighScore() {
    return parseInt(localStorage.getItem('spacebear_highscore') || '0', 10);
  }

  setHighScore(score) {
    localStorage.setItem('spacebear_highscore', score.toString());
  }
}
