/**
 * UIManager - Handles all UI elements for the game scene.
 * Manages health bar, score text, lives display, and wave display.
 */
export default class UIManager {
  /**
   * Create a new UIManager.
   * @param {Phaser.Scene} scene - The scene this UI belongs to
   */
  constructor(scene) {
    this.scene = scene;

    // UI element references
    this.healthBarBg = null;
    this.healthBar = null;
    this.scoreText = null;
    this.livesIcons = [];
    this.waveText = null;
  }

  /**
   * Create all UI elements.
   * Should be called during scene create().
   * @param {number} initialLives - The starting number of lives to display
   */
  create(initialLives = 3) {
    this.createHealthBar();
    this.createScoreText();
    this.createLivesDisplay(initialLives);
    this.createWaveDisplay();
  }

  /**
   * Update UI elements that need per-frame updates.
   * @param {object} gameState - Object containing current game state
   * @param {number} gameState.healthPercent - Player health as a decimal (0-1)
   * @param {number} gameState.score - Current score
   */
  update(gameState) {
    this.updateHealthBar(gameState.healthPercent);
    this.updateScore(gameState.score);
  }

  /**
   * Create health bar UI element.
   */
  createHealthBar() {
    this.healthBarBg = this.scene.add.rectangle(10, 10, 104, 14, 0x000000).setOrigin(0, 0);
    this.healthBar = this.scene.add.rectangle(12, 12, 100, 10, 0x00ff00).setOrigin(0, 0);
    this.healthBarBg.setScrollFactor(0).setDepth(100);
    this.healthBar.setScrollFactor(0).setDepth(100);
  }

  /**
   * Update health bar based on player health.
   * @param {number} percent - Health as a decimal (0-1)
   */
  updateHealthBar(percent) {
    this.healthBar.width = 100 * percent;
    this.healthBar.fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
  }

  /**
   * Create score text UI element.
   */
  createScoreText() {
    this.scoreText = this.scene.add.text(this.scene.cameras.main.width - 10, 10, 'Score: 0', {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  /**
   * Update score text display.
   * @param {number} score - Current score
   */
  updateScore(score) {
    this.scoreText.setText('Score: ' + score);
  }

  /**
   * Create lives display using ship icons.
   * @param {number} lives - Number of lives to display
   */
  createLivesDisplay(lives) {
    this.livesIcons = [];
    for (let i = 0; i < lives; i++) {
      const icon = this.scene.add.sprite(130 + i * 25, 17, 'sprites', 'player_r_m.png');
      icon.setScale(0.3);
      icon.setScrollFactor(0);
      icon.setDepth(100);
      this.livesIcons.push(icon);
    }
  }

  /**
   * Update lives display.
   * @param {number} lives - Current number of lives
   */
  updateLives(lives) {
    this.livesIcons.forEach((icon, index) => {
      icon.setVisible(index < lives);
    });
  }

  /**
   * Create wave/difficulty display.
   */
  createWaveDisplay() {
    this.waveText = this.scene.add.text(this.scene.cameras.main.centerX, 10, 'Wave 1', {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
  }

  /**
   * Update wave display.
   * @param {number} wave - Current wave number
   */
  updateWave(wave) {
    this.waveText.setText('Wave ' + wave);
  }
}
