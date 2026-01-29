import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Base class for all projectiles (player bullets, enemy bullets, etc.)
 * Uses object pooling - projectiles are reused when off-screen.
 * Subclasses must implement isOffScreen() to define when to deactivate.
 */
export default class BaseProjectile extends Phaser.Physics.Arcade.Sprite {
  /**
   * Get projectile config by type key
   * @param {string} type - Projectile type key from GameConfig.PROJECTILES
   * @returns {Object|null} Projectile config or null
   */
  static getTypeConfig(type) {
    return GameConfig.PROJECTILES[type] || null;
  }

  /**
   * Get all projectile type keys
   * @returns {string[]}
   */
  static getTypeKeys() {
    return Object.keys(GameConfig.PROJECTILES);
  }

  /**
   * @param {Phaser.Scene} scene - The scene this projectile belongs to
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {string} texture - Texture atlas key
   * @param {string} frame - Frame name within the atlas
   * @param {number} speed - Movement speed (positive value)
   * @param {number} direction - 1 for downward, -1 for upward
   */
  constructor(scene, x, y, texture, frame, speed, direction) {
    super(scene, x, y, texture, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.speed = speed;
    this.direction = direction;
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * Fire the projectile from a position.
   * Called when getting projectile from pool.
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} [spreadX=0] - Horizontal spread factor (-1 to 1, multiplied by speed)
   */
  fire(x, y, spreadX = 0) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(this.speed * this.direction);
    this.setVelocityX(this.speed * spreadX);
  }

  /**
   * Pre-update hook - checks if projectile is off-screen.
   * Deactivates projectile when it leaves the play area for pooling.
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.isOffScreen()) {
      this.setActive(false);
      this.setVisible(false);
    }
  }

  /**
   * Check if the projectile is off-screen.
   * Subclasses must override this method.
   * @returns {boolean} True if the projectile should be deactivated
   */
  isOffScreen() {
    throw new Error('Subclasses must implement isOffScreen()');
  }
}
