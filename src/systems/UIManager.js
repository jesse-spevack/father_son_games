import GameConfig from '../config/GameConfig.js';

/**
 * UIManager - Handles all UI elements for the game scene.
 * Manages health bar, score text, lives display, wave display, and credits.
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

    // Credits display
    this.coinIcon = null;
    this.creditsText = null;

    // Boss UI elements
    this.bossHealthBarBg = null;
    this.bossHealthBar = null;
    this.bossNameText = null;
    this.bossHealthVisible = false;
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
    this.createCreditsDisplay();
  }

  /**
   * Update UI elements that need per-frame updates.
   * @param {object} gameState - Object containing current game state
   * @param {number} gameState.healthPercent - Player health as a decimal (0-1)
   * @param {number} gameState.score - Current score
   * @param {number} [gameState.credits] - Current credits (optional)
   */
  update(gameState) {
    this.updateHealthBar(gameState.healthPercent);
    this.updateScore(gameState.score);
    if (gameState.credits !== undefined) {
      this.updateCredits(gameState.credits);
    }
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
   * Create credits display with coin icon.
   * Positioned below the score, right-aligned.
   */
  createCreditsDisplay() {
    const width = this.scene.cameras.main.width;
    const y = 30; // Below score (which is at y=10)

    // Coin icon (small, right side)
    this.coinIcon = this.scene.add.image(width - 45, y, 'coin');
    this.coinIcon.setDisplaySize(16, 16);
    this.coinIcon.setScrollFactor(0);
    this.coinIcon.setDepth(100);

    // Credits text (right of icon)
    this.creditsText = this.scene.add.text(
      width - 10,
      y,
      '0',
      {
        font: '14px monospace',
        fill: '#ffdd00'
      }
    ).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
  }

  /**
   * Update credits display.
   * @param {number} credits - Current credits
   */
  updateCredits(credits) {
    if (this.creditsText) {
      this.creditsText.setText(credits.toString());
    }
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

  /**
   * Show boss health bar when boss spawns.
   * @param {string} bossName - Name to display
   * @param {number} maxHealth - Boss max health for scaling
   */
  showBossHealth(bossName = 'MEGASHIP BOSS 1', maxHealth = 100) {
    const width = this.scene.cameras.main.width;
    const barWidth = width * 0.6;
    const barX = (width - barWidth) / 2;
    const barY = 35;

    // Create boss name text
    this.bossNameText = this.scene.add.text(width / 2, barY - 5, bossName, {
      font: 'bold 14px monospace',
      fill: '#ff4444'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);
    this.bossNameText.setAlpha(0);

    // Create boss health bar background
    this.bossHealthBarBg = this.scene.add.rectangle(
      barX, barY, barWidth + 4, 16, 0x000000
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.bossHealthBarBg.setAlpha(0);

    // Create boss health bar fill
    this.bossHealthBar = this.scene.add.rectangle(
      barX + 2, barY + 2, barWidth, 12, 0xff4444
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.bossHealthBar.setData('maxWidth', barWidth);
    this.bossHealthBar.setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: [this.bossNameText, this.bossHealthBarBg, this.bossHealthBar],
      alpha: 1,
      duration: 500
    });

    this.bossHealthVisible = true;
  }

  /**
   * Update boss health bar.
   * @param {number} healthPercent - Current health as decimal (0-1)
   */
  updateBossHealth(healthPercent) {
    if (!this.bossHealthBar || !this.bossHealthVisible) return;

    const maxWidth = this.bossHealthBar.getData('maxWidth');
    const targetWidth = maxWidth * healthPercent;

    // Smooth width transition
    this.scene.tweens.add({
      targets: this.bossHealthBar,
      width: targetWidth,
      duration: 100
    });

    // Color changes at phase thresholds
    if (healthPercent <= 0.33) {
      this.bossHealthBar.fillColor = 0xff0000; // Red - phase 3
    } else if (healthPercent <= 0.66) {
      this.bossHealthBar.fillColor = 0xff8800; // Orange - phase 2
    } else {
      this.bossHealthBar.fillColor = 0xff4444; // Light red - phase 1
    }
  }

  /**
   * Hide boss health bar when boss is defeated.
   */
  hideBossHealth() {
    if (!this.bossHealthVisible) return;

    this.bossHealthVisible = false;

    // Fade out and destroy
    this.scene.tweens.add({
      targets: [this.bossNameText, this.bossHealthBarBg, this.bossHealthBar],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        if (this.bossNameText) this.bossNameText.destroy();
        if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
        if (this.bossHealthBar) this.bossHealthBar.destroy();
        this.bossNameText = null;
        this.bossHealthBarBg = null;
        this.bossHealthBar = null;
      }
    });
  }

  /**
   * Clean up all UI elements.
   * Should be called during scene shutdown.
   */
  destroy() {
    // Destroy main UI elements
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
    if (this.scoreText) this.scoreText.destroy();
    if (this.waveText) this.waveText.destroy();

    // Destroy credits display
    if (this.coinIcon) this.coinIcon.destroy();
    if (this.creditsText) this.creditsText.destroy();

    // Destroy lives icons
    this.livesIcons.forEach(icon => icon.destroy());
    this.livesIcons = [];

    // Destroy boss UI elements
    if (this.bossNameText) this.bossNameText.destroy();
    if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
    if (this.bossHealthBar) this.bossHealthBar.destroy();

    // Clear references
    this.healthBarBg = null;
    this.healthBar = null;
    this.scoreText = null;
    this.waveText = null;
    this.coinIcon = null;
    this.creditsText = null;
    this.bossNameText = null;
    this.bossHealthBarBg = null;
    this.bossHealthBar = null;
  }
}
