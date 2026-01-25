import Phaser from 'phaser';

export default class Mine extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'mine_1_01.png');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 60; // Drift downward
    this.damage = 30;
    this.health = 2; // Takes 2 hits to destroy
    this.proximityRadius = 80; // Explode if player gets this close
    this.points = 50;

    // Movement pattern
    this.startX = x;
    this.waveAmplitude = Phaser.Math.Between(30, 60); // Side-to-side movement
    this.waveFrequency = Phaser.Math.Between(2, 4); // Speed of oscillation
    this.timeOffset = Phaser.Math.FloatBetween(0, Math.PI * 2); // Random phase

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
    // Play explosion
    this.scene.playExplosion(this.x, this.y);

    // Add score
    this.scene.score += this.points;

    // Damage player if close enough and not invincible
    const player = this.scene.player;
    if (player && player.active && !this.scene.isInvincible) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.proximityRadius * 1.5) { // Explosion radius is larger
        if (!player.takeDamage(this.damage)) {
          this.scene.loseLife();
        } else {
          // Brief invincibility after mine damage
          this.scene.isInvincible = true;
          player.setAlpha(0.5);
          this.scene.time.delayedCall(500, () => {
            this.scene.isInvincible = false;
            player.setAlpha(1);
          });
        }
      }
    }

    this.destroy();
  }
}
