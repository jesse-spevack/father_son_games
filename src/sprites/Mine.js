import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

export default class Mine extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'mine_1_01.png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Mine properties from config
    const cfg = GameConfig.MINE;
    this.speed = cfg.SPEED;
    this.damage = cfg.DAMAGE;
    this.health = cfg.HEALTH;
    this.proximityRadius = cfg.PROXIMITY_RADIUS;
    this.points = cfg.POINTS;
    this.explosionRadiusMultiplier = cfg.EXPLOSION_RADIUS_MULTIPLIER;

    // Movement pattern with randomized wave parameters from config
    this.startX = x;
    this.waveAmplitude = Phaser.Math.Between(cfg.WAVE_AMPLITUDE_MIN, cfg.WAVE_AMPLITUDE_MAX);
    this.waveFrequency = Phaser.Math.Between(cfg.WAVE_FREQUENCY_MIN, cfg.WAVE_FREQUENCY_MAX);
    this.timeOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // Play spin animation
    this.play('mine1_spin');
    this.setActive(true);
    this.setVisible(true);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Move downward manually (velocity doesn't work well with direct x manipulation)
    this.y += this.speed * (delta / 1000);

    // Sine wave horizontal movement
    const elapsed = time / 1000;
    this.x = this.startX + Math.sin(elapsed * this.waveFrequency + this.timeOffset) * this.waveAmplitude;

    // Check proximity to player
    const player = this.scene.player;
    if (player && player.active) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.proximityRadius) {
        this.explode();
        return;
      }
    }

    // Destroy if past bottom of screen
    if (this.y > this.scene.cameras.main.height + 50) {
      this.destroy();
    }
  }

  takeDamage(amount = 1) {
    this.health -= amount;

    // Flash red when hit
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.health <= 0) {
      this.explode();
      return true;
    }
    return false;
  }

  explode() {
    // Capture scene reference before destroy
    const scene = this.scene;

    // Play explosion
    scene.playExplosion(this.x, this.y);

    // Add score
    scene.gameState.addScore(this.points);

    // Damage player if close enough and not invincible
    const player = scene.player;
    if (player && player.active && !player.isInvincible) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.proximityRadius * this.explosionRadiusMultiplier) {
        if (!player.takeDamage(this.damage)) {
          scene.loseLife();
        } else {
          // Brief invincibility after mine damage (500ms)
          player.makeInvincible(500);
        }
      }
    }

    this.destroy();
  }
}
