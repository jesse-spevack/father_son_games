import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Enemy ship class - extends Phaser physics sprite
 * Types are defined in GameConfig.ENEMY.TYPES
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * Get config for an enemy type
   * @param {string} type - Enemy type key
   * @returns {Object} Type config
   */
  static getTypeConfig(type) {
    return GameConfig.ENEMY.TYPES[type];
  }

  /**
   * Get all available enemy type keys
   * @returns {string[]} Array of type keys
   */
  static getTypeKeys() {
    return Object.keys(GameConfig.ENEMY.TYPES);
  }

  /**
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} type - Enemy type key from config (e.g., 'fighter', 'heavy')
   * @param {string} color - Color variant: 'r' (red), 'g' (green), or 'b' (blue)
   */
  constructor(scene, x, y, type = 'fighter', color = 'r') {
    // Get type config
    const typeConfig = Enemy.getTypeConfig(type);
    if (!typeConfig) {
      console.warn(`Unknown enemy type: ${type}, defaulting to fighter`);
      type = 'fighter';
    }
    const config = typeConfig || GameConfig.ENEMY.TYPES.fighter;

    const frame = `enemy_${config.frameId}_${color}_m.png`;
    super(scene, x, y, 'sprites', frame);

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Store enemy properties
    this.enemyType = type;
    this.frameId = config.frameId;
    this.color = color;

    // Type-specific stats from config
    this.health = config.health;
    this.speed = config.speed;
    this.points = config.points;
    this.fireRate = config.fireRate;
    this.damage = config.damage || 10;

    // Movement pattern
    this.movementPattern = config.movement || 'straight';
    this.movementAmplitude = config.movementAmplitude || 60;
    this.movementFrequency = config.movementFrequency || 3;
    this.diveSpeed = config.diveSpeed || 300;
    this.diveDistance = config.diveDistance || 200;
    this.isDiving = false;
    this.spawnX = x; // remember starting X for sine wave
    this.elapsedTime = 0;

    // Attack pattern
    this.attackPattern = config.attack || 'basic';
    this.burstCount = 0;
    this.burstMax = 3;
    this.burstDelay = 150; // ms between burst shots

    // Loot table (RPG-ready)
    this.loot = config.loot || null;

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
      this.setFrame(`enemy_${this.frameId}_${this.color}_${newTilt}.png`);
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
   * Update movement based on pattern type
   * @param {number} delta - Time since last frame in ms
   */
  updateMovement(delta) {
    this.elapsedTime += delta;

    switch (this.movementPattern) {
      case 'sine':
        // Weave side to side while descending
        const waveOffset = Math.sin(this.elapsedTime * 0.001 * this.movementFrequency * Math.PI * 2) * this.movementAmplitude;
        this.x = this.spawnX + waveOffset;
        this.setVelocityY(this.speed);
        break;

      case 'zigzag':
        // Sharp direction changes at intervals
        const zigInterval = 500; // ms between direction changes
        const zigSpeed = this.speed * 0.8;
        const direction = Math.floor(this.elapsedTime / zigInterval) % 2 === 0 ? 1 : -1;
        this.setVelocityX(zigSpeed * direction);
        this.setVelocityY(this.speed);
        // Bounce off screen edges
        if (this.x < 50 || this.x > this.scene.cameras.main.width - 50) {
          this.spawnX = this.x; // reset reference
        }
        break;

      case 'dive':
        // Accelerate toward player when close
        if (!this.isDiving && this.scene.player) {
          const distToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.scene.player.x, this.scene.player.y
          );
          if (distToPlayer < this.diveDistance) {
            this.isDiving = true;
          }
        }
        if (this.isDiving && this.scene.player) {
          // Dive toward player position
          const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.scene.player.x, this.scene.player.y
          );
          this.setVelocity(
            Math.cos(angle) * this.diveSpeed,
            Math.sin(angle) * this.diveSpeed
          );
        } else {
          this.setVelocityY(this.speed);
        }
        break;

      case 'straight':
      default:
        // Standard downward movement
        this.setVelocityY(this.speed);
        break;
    }
  }

  /**
   * Execute attack based on pattern type
   * @param {number} time - Current game time
   */
  executeAttack(time) {
    if (!this.bulletGroup) return;

    switch (this.attackPattern) {
      case 'aimed':
        // Fire toward player position
        if (this.scene.player) {
          const bullet = this.bulletGroup.get(this.x, this.y + 20);
          if (bullet) {
            const angle = Phaser.Math.Angle.Between(
              this.x, this.y,
              this.scene.player.x, this.scene.player.y
            );
            bullet.fire(this.x, this.y + 20);
            bullet.setVelocity(
              Math.cos(angle) * 300,
              Math.sin(angle) * 300
            );
            this.lastFired = time;
          }
        }
        break;

      case 'burst':
        // Fire 3 quick shots then pause
        if (this.burstCount < this.burstMax) {
          const bullet = this.bulletGroup.get(this.x, this.y + 20);
          if (bullet) {
            bullet.fire(this.x, this.y + 20);
            this.burstCount++;
            this.lastFired = time - this.fireRate + this.burstDelay; // short delay for next burst shot
          }
        } else {
          this.burstCount = 0;
          this.lastFired = time; // full cooldown after burst
        }
        break;

      case 'none':
        // Don't shoot
        break;

      case 'basic':
      default:
        // Standard straight-down shot
        this.shoot(time);
        break;
    }
  }

  /**
   * Called every frame - update tilt, shooting, and check bounds
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Update movement pattern
    this.updateMovement(delta);

    // Update tilt based on movement
    this.updateTilt();

    // Check if should shoot (only when on screen)
    if (this.y > 0 && this.y < this.scene.cameras.main.height && this.canShoot(time)) {
      this.executeAttack(time);
    }

    // Destroy if past bottom of screen (with buffer)
    if (this.y > this.scene.cameras.main.height + 50) {
      this.destroy();
    }
  }

  /**
   * Get this enemy's loot table for drops
   * @returns {Object|null} Loot configuration or null
   */
  getLoot() {
    return this.loot;
  }

  /**
   * Get collision damage this enemy deals
   * @returns {number} Damage amount
   */
  getCollisionDamage() {
    return this.damage;
  }
}
