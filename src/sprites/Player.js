import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Player ship class with movement controls (keyboard + touch).
 * Extends Phaser.Physics.Arcade.Sprite for physics-based movement.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'player_r_m.png');

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Store scene reference
    this.scene = scene;

    // Add exhaust flame behind player
    this.exhaust = scene.add.sprite(x, y + 35, 'sprites', 'exhaust_01.png');
    this.exhaust.play('exhaust');
    this.exhaust.setDepth(-1); // Behind player

    // Player properties from config
    this.baseSpeed = GameConfig.PLAYER.SPEED;
    this.speed = this.baseSpeed;
    this.health = GameConfig.PLAYER.MAX_HEALTH;
    this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
    this.isInvincible = false;

    // Power-up state
    this.weaponLevel = 0; // 0 = base, 1-2 = upgraded
    this.speedBoostActive = false;
    this.speedBoostTimer = null;
    this.shieldActive = false;
    this.shieldTimer = null;
    this.shieldGraphic = null;

    // Configure physics body
    this.setCollideWorldBounds(true);
    this.body.setSize(this.width * 0.8, this.height * 0.8); // Slightly smaller hitbox

    // Tilt frame names for visual feedback
    this.tiltFrames = {
      left2: 'player_r_l2.png',
      left1: 'player_r_l1.png',
      center: 'player_r_m.png',
      right1: 'player_r_r1.png',
      right2: 'player_r_r2.png',
    };

    // Touch control state
    this.touchTarget = null;
    this.touchDeadzone = GameConfig.PLAYER.TOUCH_DEADZONE;

    // Setup keyboard controls
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  /**
   * Update player movement and visuals.
   * Called from scene's update loop.
   */
  update() {
    // Handle keyboard input
    const keyboardVelocity = this.handleKeyboardInput();

    // Handle touch input (touch takes priority if active)
    const touchVelocity = this.handleTouchInput();

    // Apply velocity (touch overrides keyboard if active)
    if (touchVelocity) {
      this.setVelocity(touchVelocity.x, touchVelocity.y);
    } else {
      this.setVelocity(keyboardVelocity.x, keyboardVelocity.y);
    }

    // Update tilt based on horizontal velocity
    this.updateTilt();

    // Keep exhaust positioned behind player
    this.exhaust.x = this.x;
    this.exhaust.y = this.y + 35;

    // Keep shield positioned on player
    if (this.shieldGraphic) {
      this.shieldGraphic.x = this.x;
      this.shieldGraphic.y = this.y;
    }
  }

  /**
   * Handle keyboard arrow keys and WASD input.
   * @returns {{ x: number, y: number }} Velocity vector
   */
  handleKeyboardInput() {
    let vx = 0;
    let vy = 0;

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx = -this.speed;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx = this.speed;
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vy = -this.speed;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vy = this.speed;
    }

    // Normalize diagonal movement to prevent faster diagonal speed
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2; // 1 / sqrt(2)
      vx *= factor;
      vy *= factor;
    }

    return { x: vx, y: vy };
  }

  /**
   * Handle touch/pointer input - player moves toward touch point.
   * @returns {{ x: number, y: number } | null} Velocity vector or null if no touch
   */
  handleTouchInput() {
    const pointer = this.scene.input.activePointer;

    // Only handle touch if pointer is down
    if (!pointer.isDown) {
      this.touchTarget = null;
      return null;
    }

    // Get pointer position in world coordinates
    const targetX = pointer.worldX;
    const targetY = pointer.worldY;

    // Calculate distance to target
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If within deadzone, stop moving
    if (distance < this.touchDeadzone) {
      return { x: 0, y: 0 };
    }

    // Calculate velocity toward target
    // Use distance-based speed for smoother stop near target
    const speedMultiplier = Math.min(1, distance / 50);
    const adjustedSpeed = this.speed * speedMultiplier;

    const vx = (dx / distance) * adjustedSpeed;
    const vy = (dy / distance) * adjustedSpeed;

    return { x: vx, y: vy };
  }

  /**
   * Update the player sprite tilt based on horizontal velocity.
   */
  updateTilt() {
    const vx = this.body.velocity.x;
    const threshold = this.speed * 0.3; // 30% of max speed for initial tilt
    const maxThreshold = this.speed * 0.7; // 70% for max tilt

    if (vx < -maxThreshold) {
      this.setFrame(this.tiltFrames.left2);
    } else if (vx < -threshold) {
      this.setFrame(this.tiltFrames.left1);
    } else if (vx > maxThreshold) {
      this.setFrame(this.tiltFrames.right2);
    } else if (vx > threshold) {
      this.setFrame(this.tiltFrames.right1);
    } else {
      this.setFrame(this.tiltFrames.center);
    }
  }

  /**
   * Apply damage to the player.
   * @param {number} amount - Amount of damage to apply
   * @returns {boolean} True if player is still alive
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Flash effect for damage feedback
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    return this.health > 0;
  }

  /**
   * Heal the player.
   * @param {number} amount - Amount to heal
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Check if player is alive.
   * @returns {boolean} True if health > 0
   */
  isAlive() {
    return this.health > 0;
  }

  /**
   * Get current health percentage (0-1).
   * @returns {number} Health percentage
   */
  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  /**
   * Make the player temporarily invincible with a flashing effect.
   * @param {number} [duration] - Duration in ms (default from config)
   */
  makeInvincible(duration = GameConfig.PLAYER.INVINCIBILITY_DURATION) {
    this.isInvincible = true;
    this.setAlpha(0.5);

    // Flash effect: alpha 0.3 to 0.8, duration 100ms, repeat 15, yoyo
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 0.8 },
      duration: 100,
      repeat: 15,
      yoyo: true,
      onComplete: () => {
        this.isInvincible = false;
        this.setAlpha(1);
      }
    });
  }

  /**
   * Respawn the player at a given position with full health and invincibility.
   * @param {number} x - X position to respawn at
   * @param {number} y - Y position to respawn at
   */
  respawn(x, y) {
    this.setPosition(x, y);
    this.health = this.maxHealth;
    this.weaponLevel = 0; // Reset weapon on death
    this.makeInvincible();
  }

  /**
   * Upgrade weapon to next level (max 2)
   */
  upgradeWeapon() {
    const maxLevel = GameConfig.POWER_UP.WEAPON.MAX_LEVEL - 1;
    if (this.weaponLevel < maxLevel) {
      this.weaponLevel++;
      console.log(`Weapon upgraded to level ${this.weaponLevel + 1}!`);

      // Visual feedback
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true
      });
    }
  }

  /**
   * Get current fire rate based on weapon level
   * @returns {number} Fire rate in ms
   */
  getFireRate() {
    const baserate = GameConfig.PLAYER.FIRE_RATE;
    const mult = GameConfig.POWER_UP.WEAPON.FIRE_RATE_MULT[this.weaponLevel];
    return baserate * mult;
  }

  /**
   * Get number of bullets to fire based on weapon level
   * @returns {number} Bullet count
   */
  getBulletCount() {
    return GameConfig.POWER_UP.WEAPON.BULLET_COUNT[this.weaponLevel];
  }

  /**
   * Apply temporary speed boost
   * @param {number} multiplier - Speed multiplier
   * @param {number} duration - Duration in ms
   */
  applySpeedBoost(multiplier, duration) {
    // Clear existing boost if any
    if (this.speedBoostTimer) {
      this.speedBoostTimer.remove();
    }

    this.speedBoostActive = true;
    this.speed = this.baseSpeed * multiplier;
    console.log(`Speed boost active! Speed: ${this.speed}`);

    // Visual feedback - blue tint
    this.setTint(0x88ccff);

    // End boost after duration
    this.speedBoostTimer = this.scene.time.delayedCall(duration, () => {
      this.speedBoostActive = false;
      this.speed = this.baseSpeed;
      this.clearTint();
      console.log('Speed boost ended');
    });
  }

  /**
   * Apply temporary shield (invincibility with visual bubble)
   * @param {number} duration - Duration in ms
   */
  applyShield(duration) {
    // Clear existing shield if any
    if (this.shieldTimer) {
      this.shieldTimer.remove();
    }
    if (this.shieldGraphic) {
      this.shieldGraphic.destroy();
    }

    this.shieldActive = true;
    this.isInvincible = true;
    console.log('Shield activated!');

    // Create shield bubble graphic
    this.shieldGraphic = this.scene.add.circle(this.x, this.y, 40, 0xaa44ff, 0.3);
    this.shieldGraphic.setStrokeStyle(3, 0xaa44ff, 0.8);
    this.shieldGraphic.setDepth(this.depth - 1);

    // Pulsing effect on shield
    this.scene.tweens.add({
      targets: this.shieldGraphic,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.5,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // End shield after duration
    this.shieldTimer = this.scene.time.delayedCall(duration, () => {
      this.deactivateShield();
    });
  }

  /**
   * Remove shield effect
   */
  deactivateShield() {
    this.shieldActive = false;
    this.isInvincible = false;

    if (this.shieldGraphic) {
      // Fade out shield
      this.scene.tweens.add({
        targets: this.shieldGraphic,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        onComplete: () => {
          if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
            this.shieldGraphic = null;
          }
        }
      });
    }

    console.log('Shield deactivated');
  }
}
