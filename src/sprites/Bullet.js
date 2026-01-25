import Phaser from 'phaser';

/**
 * Player bullet class for the weapons system.
 * Uses object pooling - bullets are reused when off-screen.
 */
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'vulcan_1.png');
    this.speed = 500;
  }

  /**
   * Fire the bullet from a position.
   * Called when getting bullet from pool.
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   */
  fire(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(-this.speed); // Shoot upward (negative Y)
  }

  /**
   * Pre-update hook - checks if bullet is off-screen.
   * Deactivates bullet when it leaves the play area for pooling.
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Deactivate if off screen (above visible area)
    if (this.y < -10) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
