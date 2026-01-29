import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';
import { SprayAttack, AimedAttack, RingAttack, SummonAttack } from './BossAttacks.js';

/**
 * Boss enemy class - supports multiple boss types from config.
 * Multi-phase boss with different attack patterns per phase.
 * Uses single sprite frame with code-based visual effects.
 * Phase 1 (100-66%): Basic attacks
 * Phase 2 (66-33%): + more attacks
 * Phase 3 (33-0%): + all attacks, faster cooldowns
 */
export default class Boss extends Phaser.GameObjects.Sprite {
  /**
   * Get boss type config from registry
   * @param {string} type - Boss type key
   * @returns {Object} Type config
   */
  static getTypeConfig(type) {
    return GameConfig.BOSS.TYPES[type];
  }

  /**
   * Get all boss type keys
   * @returns {string[]}
   */
  static getTypeKeys() {
    return Object.keys(GameConfig.BOSS.TYPES);
  }

  /**
   * Create a boss of the specified type
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [type='megaship'] - Boss type from BOSS.TYPES
   */
  constructor(scene, x, y, type = 'megaship') {
    // Get type config
    const typeConfig = Boss.getTypeConfig(type);
    if (!typeConfig) {
      console.warn(`Unknown boss type: ${type}, defaulting to megaship`);
      type = 'megaship';
    }
    const tc = typeConfig || GameConfig.BOSS.TYPES.megaship;

    // Use the boss sprite for this type
    super(scene, x, y, tc.texture);

    // Add to scene
    scene.add.existing(this);

    // Store scene and type reference
    this.scene = scene;
    this.bossType = type;
    this.typeConfig = tc;

    // Boss stats from type config (with defaults from BOSS)
    const cfg = GameConfig.BOSS;
    this.maxHealth = tc.health || cfg.MAX_HEALTH;
    this.health = this.maxHealth;
    this.points = tc.points || cfg.POINTS;
    this.collisionDamage = cfg.COLLISION_DAMAGE;
    this.bossName = tc.name || 'Unknown Boss';

    // Movement properties (type can override speed)
    this.speed = tc.speed || cfg.SPEED;
    this.enterSpeed = cfg.ENTER_SPEED;
    this.targetY = cfg.Y_POSITION;
    this.movementRange = cfg.MOVEMENT_RANGE;
    this.movementDirection = 1; // 1 = right, -1 = left
    this.isEntering = true;

    // Phase thresholds
    this.phase2Threshold = cfg.PHASE_2_THRESHOLD;
    this.phase3Threshold = cfg.PHASE_3_THRESHOLD;
    this.currentPhase = 1;

    // Attack timing (type can have cooldown multipliers)
    this.sprayCooldown = cfg.SPRAY_COOLDOWN * (tc.sprayCooldownMult || 1);
    this.aimedCooldown = cfg.AIMED_COOLDOWN * (tc.aimedCooldownMult || 1);
    this.summonCooldown = cfg.SUMMON_COOLDOWN * (tc.summonCooldownMult || 1);
    this.ringCooldown = cfg.RING_COOLDOWN * (tc.ringCooldownMult || 1);
    this.phase3SpeedMult = cfg.PHASE_3_SPEED_MULT;

    this.lastSprayTime = 0;
    this.lastAimedTime = 0;
    this.lastSummonTime = 0;
    this.lastRingTime = 0;

    // Attack parameters (type can override)
    this.sprayBulletCount = cfg.SPRAY_BULLET_COUNT;
    this.sprayAngle = cfg.SPRAY_ANGLE;
    this.sprayBulletSpeed = cfg.SPRAY_BULLET_SPEED;
    this.aimedBulletCount = cfg.AIMED_BULLET_COUNT;
    this.aimedBulletSpeed = cfg.AIMED_BULLET_SPEED;
    this.ringBulletCount = tc.ringBulletCount || cfg.RING_BULLET_COUNT;
    this.ringBulletSpeed = cfg.RING_BULLET_SPEED;
    this.summonFighters = tc.summonCount || cfg.SUMMON_FIGHTERS;
    this.summonHeavies = tc.summonCount || cfg.SUMMON_HEAVIES;

    // Type-specific attack lists
    this.attacks = tc.attacks || ['spray', 'aimed'];
    this.phase3Attacks = tc.phase3Attacks || ['spray', 'aimed', 'ring'];
    this.summonTypes = tc.summonTypes || ['fighter', 'heavy'];

    // Bullet group reference (set by BossManager)
    this.bulletGroup = null;

    // State flags
    this.isAttacking = false;
    this.isDying = false;

    // Set up physics body manually (not using physics group)
    scene.physics.add.existing(this);
    this.body.setSize(this.width * 0.8, this.height * 0.6);
    this.body.setOffset(this.width * 0.1, this.height * 0.2);

    // Scale the boss (type can override)
    this.bossScale = tc.scale || cfg.SCALE;
    this.setScale(this.bossScale);

    // Apply type tint if specified
    if (tc.tint) {
      this.setTint(tc.tint);
      this.baseTint = tc.tint;
    } else {
      this.baseTint = 0xffffff;
    }

    // Phase colors for visual feedback
    this.phaseColors = {
      1: this.baseTint,
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
    const baseScale = this.bossScale;
    this.idleTween = this.scene.tweens.add({
      targets: this,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 0.95,
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
      this.setScale(this.bossScale);
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
    // Use VFX manager if available, otherwise fallback
    if (this.scene.vfx) {
      const offsets = [
        { x: 0, y: 0, delay: 0, scale: 2 },
        { x: -40, y: -30, delay: 100, scale: 1.5 },
        { x: 40, y: -30, delay: 150, scale: 1.5 },
        { x: -30, y: 30, delay: 200, scale: 1.2 },
        { x: 30, y: 30, delay: 250, scale: 1.2 },
        { x: 0, y: -50, delay: 300, scale: 1.8 },
      ];

      this.scene.vfx.multiExplosion(this.x, this.y, offsets);
      this.scene.vfx.screenFlash(300, 255, 200, 100);
    }
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
   * Check if this boss type has a specific attack
   * @param {string} attackName
   * @returns {boolean}
   */
  hasAttack(attackName) {
    const attackList = this.currentPhase === 3 ? this.phase3Attacks : this.attacks;
    return attackList.includes(attackName);
  }

  /**
   * Handle attack patterns based on phase and cooldowns.
   * Uses attack strategies from BossAttacks.js
   * @param {number} time
   */
  updateAttacks(time) {
    if (!this.bulletGroup || this.isAttacking) return;

    const cooldownMult = this.currentPhase === 3 ? this.phase3SpeedMult : 1;

    // Spray attack
    if (this.hasAttack('spray') && time - this.lastSprayTime >= this.sprayCooldown * cooldownMult) {
      SprayAttack.execute(this);
      this.lastSprayTime = time;
      return;
    }

    // Aimed attack
    if (this.hasAttack('aimed') && time - this.lastAimedTime >= this.aimedCooldown * cooldownMult) {
      AimedAttack.execute(this);
      this.lastAimedTime = time;
      return;
    }

    // Summon attack (phase 2+)
    if (this.currentPhase >= 2 && this.hasAttack('summon') && time - this.lastSummonTime >= this.summonCooldown * cooldownMult) {
      SummonAttack.execute(this);
      this.lastSummonTime = time;
      return;
    }

    // Ring attack
    if (this.hasAttack('ring') && time - this.lastRingTime >= this.ringCooldown * cooldownMult) {
      RingAttack.execute(this);
      this.lastRingTime = time;
    }
  }
}
