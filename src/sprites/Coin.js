import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Coin - Collectible currency dropped by enemies.
 * Falls downward, attracted to player when close.
 */
export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'coin');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.value = 0;
    this.spawnTime = 0;

    // Set up physics body
    this.body.setCircle(15);
    this.setDisplaySize(32, 32);
  }

  /**
   * Spawn a coin at position with a value.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} value - Credit value of this coin
   */
  spawn(x, y, value) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.alpha = 1;

    this.value = value;
    this.spawnTime = this.scene.time.now;

    // Random initial velocity (slight spread)
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5);
    const speed = GameConfig.CURRENCY.DROP_SPEED;
    this.setVelocity(
      Math.sin(angle) * speed * 0.5,
      speed
    );

    // Spinning/pulsing effect
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });

    // Subtle scale pulse
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Deactivate and return to pool.
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(this);
    this.angle = 0;
    this.setDisplaySize(32, 32);
  }

  /**
   * Update - handle magnet effect and lifetime.
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) return;

    const cfg = GameConfig.CURRENCY;
    const player = this.scene.player;

    // Check lifetime
    const age = time - this.spawnTime;
    if (age > cfg.LIFETIME) {
      this.fadeOut();
      return;
    }

    // Flash warning when about to expire (last 2 seconds)
    if (age > cfg.LIFETIME - 2000) {
      this.alpha = Math.sin(time * 0.02) * 0.3 + 0.7;
    }

    // Magnet effect - drift toward player when close
    if (player && player.active) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (dist < cfg.MAGNET_RANGE) {
        // Accelerate toward player (stronger when closer)
        const magnetStrength = 1 - (dist / cfg.MAGNET_RANGE);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const pullSpeed = 200 * magnetStrength;

        this.setVelocity(
          Math.cos(angle) * pullSpeed,
          Math.sin(angle) * pullSpeed
        );
      }
    }

    // Check if off screen
    if (this.y > this.scene.cameras.main.height + 50) {
      this.deactivate();
    }
  }

  /**
   * Fade out before despawning.
   */
  fadeOut() {
    // Prevent multiple fade calls
    if (this.fading) return;
    this.fading = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        this.fading = false;
        this.deactivate();
      }
    });
  }

  /**
   * Collect the coin - called on player collision.
   * @param {Player} player - The player collecting the coin
   */
  collect(player) {
    if (!this.active) return;
    this.setActive(false);

    // Emit event to add credits
    this.scene.events.emit('addCredits', this.value);

    // Show floating text with value
    this.showFloatingText(`+${this.value}`);

    // Collection effect - zoom toward UI and fade
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      y: this.y - 30,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.deactivate();
      }
    });
  }

  /**
   * Show floating text when collected.
   * @param {string} text - Text to display
   */
  showFloatingText(text) {
    const floatingText = this.scene.add.text(
      this.x,
      this.y,
      text,
      {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffdd00',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );

    floatingText.setOrigin(0.5);
    floatingText.setDepth(1000);

    // Float upward and fade out
    this.scene.tweens.add({
      targets: floatingText,
      y: this.y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
}
