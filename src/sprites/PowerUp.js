import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Power-up types - generated from config for backwards compatibility
 */
export const PowerUpType = Object.keys(GameConfig.POWER_UP.TYPES).reduce((acc, key) => {
  acc[key.toUpperCase()] = key;
  return acc;
}, {});

/**
 * PowerUp - Collectible items dropped by enemies.
 * Types are defined in GameConfig.POWER_UP.TYPES
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
   * Get config for a power-up type
   * @param {string} type - Power-up type key
   * @returns {Object} Type config
   */
  static getTypeConfig(type) {
    return GameConfig.POWER_UP.TYPES[type];
  }

  /**
   * Get all available power-up type keys
   * @returns {string[]} Array of type keys
   */
  static getTypeKeys() {
    return Object.keys(GameConfig.POWER_UP.TYPES);
  }

  /**
   * Activate the power-up with a specific type
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Power-up type key from config
   */
  spawn(x, y, type) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.type = type;
    this.spawnTime = this.scene.time.now;

    // Get type config and set color
    const typeConfig = PowerUp.getTypeConfig(type);
    if (typeConfig) {
      this.setTint(typeConfig.color);
    }

    // Set downward velocity
    this.setVelocityY(GameConfig.POWER_UP.SPEED);

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

    // Get type config
    const typeConfig = PowerUp.getTypeConfig(this.type);
    if (!typeConfig) return;

    // Apply effect based on type
    this.applyEffect(player, this.type, typeConfig);

    // Show floating combat text
    this.showFloatingText(typeConfig.text, typeConfig.textColor);

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
   * Apply the power-up effect to the player
   * @param {Player} player
   * @param {string} type - Power-up type
   * @param {Object} config - Type config
   */
  applyEffect(player, type, config) {
    // Check for weapon pickup (switches weapon type)
    if (config.weaponType) {
      player.switchWeapon(config.weaponType);
      return;
    }

    // Standard power-up effects
    switch (type) {
      case 'health':
        player.heal(config.healAmount);
        break;
      case 'weapon':
        player.upgradeWeapon();
        break;
      case 'speed':
        player.applySpeedBoost(config.speedMult, config.duration);
        break;
      case 'shield':
        player.applyShield(config.duration);
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
    }
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
