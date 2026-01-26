import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Boss enemy class - the Doomstar
 * Multi-phase boss with different attack patterns per phase.
 * Phase 1 (100-66%): Spray + aimed attacks
 * Phase 2 (66-33%): + summons fighters
 * Phase 3 (33-0%): + summons heavies, faster attacks
 */
export default class Boss extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss_idle_01');

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

    // Scale up the boss (it should be imposing)
    this.setScale(1.5);

    // Start idle animation
    this.play('boss_idle');
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

    // Flash to indicate phase change
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3
    });

    // Could add screen shake, sound effects, etc.
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(200, 0.01);
    }
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

    // Play damage animation
    this.play('boss_damaged', true);
    this.once('animationcomplete-boss_damaged', () => {
      if (!this.isDying) {
        this.play('boss_idle');
      }
    });

    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Check for death
    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  /**
   * Boss death sequence
   */
  die() {
    this.isDying = true;
    this.body.enable = false;

    // Play death animation
    this.play('boss_death');

    this.once('animationcomplete-boss_death', () => {
      // Emit event for rewards
      this.scene.events.emit('bossDefeated', this);
      this.destroy();
    });
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
    this.play('boss_attack', true);

    // Fire bullets at animation midpoint
    this.scene.time.delayedCall(200, () => {
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
    });

    this.once('animationcomplete-boss_attack', () => {
      this.isAttacking = false;
      if (!this.isDying) this.play('boss_idle');
    });
  }

  /**
   * Fire bullets aimed at player position
   */
  aimedAttack() {
    const player = this.scene.player;
    if (!player || !player.active) return;

    this.isAttacking = true;
    this.play('boss_attack', true);

    this.scene.time.delayedCall(200, () => {
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
    });

    this.once('animationcomplete-boss_attack', () => {
      this.isAttacking = false;
      if (!this.isDying) this.play('boss_idle');
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
