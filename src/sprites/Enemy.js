import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Enemy ship class - extends Phaser physics sprite
 * Supports two enemy types with color variants and tilt animation
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} type - Enemy type: 1 (fighter) or 2 (heavy)
   * @param {string} color - Color variant: 'r' (red), 'g' (green), or 'b' (blue)
   */
  constructor(scene, x, y, type = 1, color = 'r') {
    const frame = `enemy_${type}_${color}_m.png`;
    super(scene, x, y, 'sprites', frame);

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Store enemy properties
    this.enemyType = type;
    this.color = color;

    // Type-specific stats from config
    // Type 1 (fighter): fast, weak, low points, shoots less often
    // Type 2 (heavy): slow, tough, high points, shoots more often
    const stats = type === 1 ? GameConfig.ENEMY.FIGHTER : GameConfig.ENEMY.HEAVY;
    this.health = stats.HEALTH;
    this.speed = stats.SPEED;
    this.points = stats.POINTS;
    this.fireRate = stats.FIRE_RATE;

    // Shooting state - randomize initial delay so enemies don't all shoot at once
    this.lastFired = -Phaser.Math.Between(0, this.fireRate);
    this.bulletGroup = null;

    // Current tilt state for frame updates
    this.currentTilt = 'm';

    // Set initial downward velocity
    this.setVelocityY(this.speed);
  }

  /**
   * Update the sprite's tilt frame based on horizontal velocity
   * Tilt frames: l2 (far left), l1 (slight left), m (center), r1 (slight right), r2 (far right)
   */
  updateTilt() {
    const vx = this.body.velocity.x;
    let newTilt = 'm';
    const { TILT_THRESHOLD_LOW, TILT_THRESHOLD_HIGH } = GameConfig.ENEMY;

    if (vx < -TILT_THRESHOLD_HIGH) {
      newTilt = 'l2';
    } else if (vx < -TILT_THRESHOLD_LOW) {
      newTilt = 'l1';
    } else if (vx > TILT_THRESHOLD_HIGH) {
      newTilt = 'r2';
    } else if (vx > TILT_THRESHOLD_LOW) {
      newTilt = 'r1';
    }

    // Only update frame if tilt changed
    if (newTilt !== this.currentTilt) {
      this.currentTilt = newTilt;
      this.setFrame(`enemy_${this.enemyType}_${this.color}_${newTilt}.png`);
    }
  }

  /**
   * Set the bullet group for this enemy to use when shooting
   * @param {Phaser.Physics.Arcade.Group} bulletGroup - The enemy bullet group
   */
  setBulletGroup(bulletGroup) {
    this.bulletGroup = bulletGroup;
  }

  /**
   * Check if enemy can shoot based on fire rate
   * @param {number} time - Current game time
   * @returns {boolean} True if enemy can shoot
   */
  canShoot(time) {
    return this.bulletGroup && time - this.lastFired >= this.fireRate;
  }

  /**
   * Fire a bullet from this enemy's position
   * @param {number} time - Current game time
   */
  shoot(time) {
    if (!this.bulletGroup) return;

    // Get a bullet from the pool
    const bullet = this.bulletGroup.get(this.x, this.y + 20);
    if (bullet) {
      bullet.fire(this.x, this.y + 20);
      this.lastFired = time;
    }
  }

  /**
   * Take damage and check if destroyed
   * @param {number} damage - Amount of damage to take
   * @returns {boolean} True if enemy was destroyed
   */
  takeDamage(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  /**
   * Called every frame - update tilt, shooting, and check bounds
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Update tilt based on movement
    this.updateTilt();

    // Check if should shoot (only when on screen)
    if (this.y > 0 && this.y < this.scene.cameras.main.height && this.canShoot(time)) {
      this.shoot(time);
    }

    // Destroy if past bottom of screen (with buffer)
    if (this.y > this.scene.cameras.main.height + 50) {
      this.destroy();
    }
  }
}
