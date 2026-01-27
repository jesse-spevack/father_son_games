import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Power-up types
 */
export const PowerUpType = {
  HEALTH: 'health',
  WEAPON: 'weapon',
  SPEED: 'speed',
};

/**
 * PowerUp - Collectible items dropped by enemies.
 * Types: health (green), weapon upgrade (red), speed boost (blue)
 */
export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Use proton sprite as base (will be tinted)
    super(scene, x, y, 'sprites', 'proton_01.png');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.type = null;
    this.spawnTime = 0;

    // Set up physics body
    this.body.setCircle(12);
    this.setScale(1.2);
  }

  /**
   * Activate the power-up with a specific type
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - PowerUpType value
   */
  spawn(x, y, type) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.type = type;
    this.spawnTime = this.scene.time.now;

    // Set color based on type
    const cfg = GameConfig.POWER_UP;
    switch (type) {
      case PowerUpType.HEALTH:
        this.setTint(cfg.HEALTH.COLOR);
        break;
      case PowerUpType.WEAPON:
        this.setTint(cfg.WEAPON.COLOR);
        break;
      case PowerUpType.SPEED:
        this.setTint(cfg.SPEED_BOOST.COLOR);
        break;
    }

    // Set downward velocity
    this.setVelocityY(cfg.SPEED);

    // Pulsing effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Deactivate and return to pool
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(this);
  }

  /**
   * Check if power-up should despawn
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) return;

    const cfg = GameConfig.POWER_UP;

    // Check lifetime
    if (time - this.spawnTime > cfg.LIFETIME) {
      // Fade out before despawning
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.alpha = 1;
          this.deactivate();
        }
      });
      return;
    }

    // Flash warning when about to expire (last 2 seconds)
    if (time - this.spawnTime > cfg.LIFETIME - 2000) {
      this.alpha = Math.sin(time * 0.02) * 0.3 + 0.7;
    }

    // Check if off screen
    if (this.y > this.scene.cameras.main.height + 50) {
      this.deactivate();
    }
  }

  /**
   * Apply power-up effect to player
   * @param {Player} player
   */
  collect(player) {
    // Prevent multiple collections from repeated collision triggers
    if (!this.active) return;
    this.setActive(false);

    const cfg = GameConfig.POWER_UP;

    // Determine text and color based on type
    let text, color;
    switch (this.type) {
      case PowerUpType.HEALTH:
        player.heal(cfg.HEALTH.RESTORE_AMOUNT);
        text = `+${cfg.HEALTH.RESTORE_AMOUNT} HP`;
        color = '#00ff00';
        break;
      case PowerUpType.WEAPON:
        player.upgradeWeapon();
        text = 'WEAPON UP!';
        color = '#ff6600';
        break;
      case PowerUpType.SPEED:
        player.applySpeedBoost(cfg.SPEED_BOOST.SPEED_MULT, cfg.SPEED_BOOST.DURATION);
        text = 'SPEED BOOST!';
        color = '#00aaff';
        break;
    }

    // Show floating combat text
    this.showFloatingText(text, color);

    // Visual feedback
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.alpha = 1;
        this.deactivate();
      }
    });
  }

  /**
   * Show WoW-style floating combat text that rises and fades
   * @param {string} text - Text to display
   * @param {string} color - Hex color string
   */
  showFloatingText(text, color) {
    // Random x offset for variety
    const xOffset = Phaser.Math.Between(-20, 20);

    const floatingText = this.scene.add.text(
      this.x + xOffset,
      this.y,
      text,
      {
        fontFamily: 'Arial Black, Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: color,
        stroke: '#000000',
        strokeThickness: 4,
      }
    );

    floatingText.setOrigin(0.5);
    floatingText.setDepth(1000);

    // Float upward and fade out
    this.scene.tweens.add({
      targets: floatingText,
      y: this.y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
}
