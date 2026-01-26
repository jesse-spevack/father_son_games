import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Boss enemy class - Megaship Boss 1
 * Multi-phase boss with different attack patterns per phase.
 * Uses single sprite frame with code-based visual effects.
 * Phase 1 (100-66%): Spray + aimed attacks
 * Phase 2 (66-33%): + summons fighters
 * Phase 3 (33-0%): + summons heavies, faster attacks
 */
export default class Boss extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    // Use the space boss sprite
    super(scene, x, y, 'space_boss');

    // Add to scene
    scene.add.existing(this);

    // Store scene reference
    this.scene = scene;

    // Boss stats from config
    const cfg = GameConfig.BOSS;
    this.maxHealth = cfg.MAX_HEALTH;
    this.health = this.maxHealth;
    this.points = cfg.POINTS;
    this.collisionDamage = cfg.COLLISION_DAMAGE;

    // Movement properties
    this.speed = cfg.SPEED;
    this.enterSpeed = cfg.ENTER_SPEED;
    this.targetY = cfg.Y_POSITION;
    this.movementRange = cfg.MOVEMENT_RANGE;
    this.movementDirection = 1; // 1 = right, -1 = left
    this.isEntering = true;

    // Phase thresholds
    this.phase2Threshold = cfg.PHASE_2_THRESHOLD;
    this.phase3Threshold = cfg.PHASE_3_THRESHOLD;
    this.currentPhase = 1;

    // Attack timing
    this.sprayCooldown = cfg.SPRAY_COOLDOWN;
    this.aimedCooldown = cfg.AIMED_COOLDOWN;
    this.summonCooldown = cfg.SUMMON_COOLDOWN;
    this.phase3SpeedMult = cfg.PHASE_3_SPEED_MULT;

    this.lastSprayTime = 0;
    this.lastAimedTime = 0;
    this.lastSummonTime = 0;

    // Attack parameters
    this.sprayBulletCount = cfg.SPRAY_BULLET_COUNT;
    this.sprayAngle = cfg.SPRAY_ANGLE;
    this.sprayBulletSpeed = cfg.SPRAY_BULLET_SPEED;
    this.aimedBulletCount = cfg.AIMED_BULLET_COUNT;
    this.aimedBulletSpeed = cfg.AIMED_BULLET_SPEED;
    this.summonFighters = cfg.SUMMON_FIGHTERS;
    this.summonHeavies = cfg.SUMMON_HEAVIES;

    // Bullet group reference (set by BossManager)
    this.bulletGroup = null;

    // State flags
    this.isAttacking = false;
    this.isDying = false;

    // Set up physics body manually (not using physics group)
    scene.physics.add.existing(this);
    this.body.setSize(this.width * 0.8, this.height * 0.6);
    this.body.setOffset(this.width * 0.1, this.height * 0.2);

    // Scale the boss (image is 1024x1024, scale to ~180px)
    this.setScale(0.18);

    // Phase colors for visual feedback
    this.phaseColors = {
      1: 0xffffff, // Normal
      2: 0xffaa00, // Orange - phase 2
      3: 0xff4444  // Red - phase 3
    };

    // Start idle pulsing effect
    this.startIdlePulse();
  }

  /**
   * Create a gentle pulsing effect for idle state
   */
  startIdlePulse() {
    this.idleTween = this.scene.tweens.add({
      targets: this,
      scaleX: 0.19,
      scaleY: 0.17,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Stop idle pulse (during attacks)
   */
  stopIdlePulse() {
    if (this.idleTween) {
      this.idleTween.stop();
      this.setScale(0.18);
    }
  }

  /**
   * Resume idle pulse after attacks
   */
  resumeIdlePulse() {
    if (this.idleTween) {
      this.idleTween.stop();
    }
    this.startIdlePulse();
  }

  /**
   * Set the bullet group for boss attacks
   * @param {Phaser.Physics.Arcade.Group} bulletGroup
   */
  setBulletGroup(bulletGroup) {
    this.bulletGroup = bulletGroup;
  }

  /**
   * Get the current phase based on health
   * @returns {number} 1, 2, or 3
   */
  getCurrentPhase() {
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent <= this.phase3Threshold) return 3;
    if (healthPercent <= this.phase2Threshold) return 2;
    return 1;
  }

  /**
   * Called when phase changes
   * @param {number} newPhase
   */
  onPhaseChange(newPhase) {
    this.currentPhase = newPhase;
    console.log(`Boss entered phase ${newPhase}!`);

    // Dramatic phase change effect
    this.stopIdlePulse();

    // Flash and color change
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.22,
      scaleY: 0.22,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.setTint(this.phaseColors[newPhase]);
        this.resumeIdlePulse();
      }
    });

    // Alpha flash
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 4
    });

    // Big screen shake for phase transition
    this.scene.cameras.main.shake(400, 0.02);
  }

  /**
   * Take damage from player bullets
   * @param {number} amount - Damage amount
   * @returns {boolean} True if boss died
   */
  takeDamage(amount = 1) {
    if (this.isDying) return false;

    this.health -= amount;

    // Check for phase change
    const newPhase = this.getCurrentPhase();
    if (newPhase !== this.currentPhase) {
      this.onPhaseChange(newPhase);
    }

    // Damage flash effect - white flash then back to phase color
    this.setTint(0xffffff);
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.21,
      scaleY: 0.21,
      duration: 50,
      yoyo: true,
      onComplete: () => {
        if (this.active && !this.isDying) {
          this.setTint(this.phaseColors[this.currentPhase]);
        }
      }
    });

    // Small screen shake on hit
    this.scene.cameras.main.shake(50, 0.005);

    // Check for death
    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Boss death sequence with dramatic code effects
   */
  die() {
    this.isDying = true;
    this.body.enable = false;
    this.stopIdlePulse();

    // Big screen shake
    this.scene.cameras.main.shake(500, 0.03);

    // Flash rapidly between colors
    let flashCount = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: 80,
      callback: () => {
        flashCount++;
        this.setTint(flashCount % 2 === 0 ? 0xffffff : 0xff0000);
      },
      repeat: 10
    });

    // Spin and shrink
    this.scene.tweens.add({
      targets: this,
      angle: 720,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        // Create explosion particles at death location
        this.createDeathExplosion();
        // Emit event for rewards
        this.scene.events.emit('bossDefeated', this);
        this.destroy();
      }
    });
  }

  /**
   * Create sprite explosion effects on death
   */
  createDeathExplosion() {
    // Capture references before boss is destroyed
    const scene = this.scene;
    const bossX = this.x;
    const bossY = this.y;

    // Create multiple sprite explosions at different positions
    const explosionTypes = ['explosion1', 'explosion2', 'explosion3'];
    const offsets = [
      { x: 0, y: 0, delay: 0, scale: 2 },
      { x: -40, y: -30, delay: 100, scale: 1.5 },
      { x: 40, y: -30, delay: 150, scale: 1.5 },
      { x: -30, y: 30, delay: 200, scale: 1.2 },
      { x: 30, y: 30, delay: 250, scale: 1.2 },
      { x: 0, y: -50, delay: 300, scale: 1.8 },
    ];

    offsets.forEach((offset, i) => {
      scene.time.delayedCall(offset.delay, () => {
        const explosionType = explosionTypes[i % explosionTypes.length];
        const explosion = scene.add.sprite(
          bossX + offset.x,
          bossY + offset.y,
          'sprites',
          'explosion_1_01.png'
        );
        explosion.setScale(offset.scale);
        explosion.play(explosionType);
        explosion.once('animationcomplete', () => {
          explosion.destroy();
        });
      });
    });

    // Flash the screen
    scene.cameras.main.flash(300, 255, 200, 100);
  }

  /**
   * Get current health percentage (0-1)
   * @returns {number}
   */
  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  /**
   * Update boss each frame
   * @param {number} time - Current game time
   * @param {number} delta - Time since last frame
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.isDying) return;

    // Handle entrance
    if (this.isEntering) {
      this.y += this.enterSpeed * (delta / 1000);
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.isEntering = false;
      }
      return;
    }

    // Side-to-side movement
    this.updateMovement(delta);

    // Attack logic
    this.updateAttacks(time);
  }

  /**
   * Handle side-to-side patrol movement
   * @param {number} delta
   */
  updateMovement(delta) {
    const centerX = this.scene.cameras.main.centerX;
    const moveAmount = this.speed * (delta / 1000) * this.movementDirection;

    this.x += moveAmount;

    // Reverse at boundaries
    if (this.x > centerX + this.movementRange) {
      this.x = centerX + this.movementRange;
      this.movementDirection = -1;
    } else if (this.x < centerX - this.movementRange) {
      this.x = centerX - this.movementRange;
      this.movementDirection = 1;
    }

    // Update tilt based on movement direction
    // (boss_move frames are for tilt, but we use idle as base)
  }

  /**
   * Handle attack patterns based on phase and cooldowns
   * @param {number} time
   */
  updateAttacks(time) {
    if (!this.bulletGroup || this.isAttacking) return;

    const cooldownMult = this.currentPhase === 3 ? this.phase3SpeedMult : 1;

    // Spray attack (all phases)
    if (time - this.lastSprayTime >= this.sprayCooldown * cooldownMult) {
      this.sprayAttack();
      this.lastSprayTime = time;
      return;
    }

    // Aimed attack (all phases)
    if (time - this.lastAimedTime >= this.aimedCooldown * cooldownMult) {
      this.aimedAttack();
      this.lastAimedTime = time;
      return;
    }

    // Summon attack (phase 2+)
    if (this.currentPhase >= 2 && time - this.lastSummonTime >= this.summonCooldown * cooldownMult) {
      this.summonAttack();
      this.lastSummonTime = time;
    }
  }

  /**
   * Fire a spread of bullets in a fan pattern
   */
  sprayAttack() {
    this.isAttacking = true;
    this.stopIdlePulse();

    // Attack windup - quick scale up
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.22,
      scaleY: 0.22,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        // Fire bullets at peak of windup
        if (!this.active || this.isDying) return;

        const angleStep = this.sprayAngle / (this.sprayBulletCount - 1);
        const startAngle = 90 - this.sprayAngle / 2; // 90 = straight down

        for (let i = 0; i < this.sprayBulletCount; i++) {
          const angle = startAngle + i * angleStep;
          const radians = Phaser.Math.DegToRad(angle);

          const bullet = this.bulletGroup.get(this.x, this.y + 30);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setPosition(this.x, this.y + 30);
            bullet.setVelocity(
              Math.cos(radians) * this.sprayBulletSpeed,
              Math.sin(radians) * this.sprayBulletSpeed
            );
          }
        }
      },
      onComplete: () => {
        this.isAttacking = false;
        if (!this.isDying) this.resumeIdlePulse();
      }
    });
  }

  /**
   * Fire bullets aimed at player position
   */
  aimedAttack() {
    const player = this.scene.player;
    if (!player || !player.active) return;

    this.isAttacking = true;
    this.stopIdlePulse();

    // Quick horizontal stretch for aimed attack
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.22,
      scaleY: 0.15,
      duration: 100,
      yoyo: true,
      onYoyo: () => {
        if (!this.active || this.isDying) return;

        for (let i = 0; i < this.aimedBulletCount; i++) {
          // Add slight spread for multiple bullets
          const spread = (i - (this.aimedBulletCount - 1) / 2) * 20;

          const bullet = this.bulletGroup.get(this.x + spread, this.y + 30);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setPosition(this.x + spread, this.y + 30);

            // Calculate angle to player
            const angle = Phaser.Math.Angle.Between(
              this.x + spread, this.y + 30,
              player.x, player.y
            );

            bullet.setVelocity(
              Math.cos(angle) * this.aimedBulletSpeed,
              Math.sin(angle) * this.aimedBulletSpeed
            );
          }
        }
      },
      onComplete: () => {
        this.isAttacking = false;
        if (!this.isDying) this.resumeIdlePulse();
      }
    });
  }

  /**
   * Summon enemy reinforcements
   */
  summonAttack() {
    // Emit event for BossManager to handle spawning
    const count = this.currentPhase === 3 ? this.summonHeavies : this.summonFighters;
    const type = this.currentPhase === 3 ? 'heavy' : 'fighter';

    this.scene.events.emit('bossSummon', { count, type });
  }
}
