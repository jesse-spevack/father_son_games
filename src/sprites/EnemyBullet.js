import Phaser from 'phaser';

/**
 * Enemy bullet class - plasma projectiles shot by enemies
 * Moves downward toward the player
 */
export default class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'plasma_1.png');
    this.speed = 300;
  }

  /**
   * Fire the bullet from a given position
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   */
  fire(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(this.speed); // Shoot downward (positive Y)
  }

  /**
   * Called every frame - check if bullet is off screen
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Deactivate if past bottom of screen
    if (this.y > this.scene.cameras.main.height + 10) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
