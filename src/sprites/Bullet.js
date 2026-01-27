import BaseProjectile from './BaseProjectile';

/**
 * Player bullet class for the weapons system.
 * Uses object pooling - bullets are reused when off-screen.
 */
export default class Bullet extends BaseProjectile {
  constructor(scene, x, y) {
    // Player bullets move upward (direction = -1) at speed 500
    super(scene, x, y, 'sprites', 'vulcan_1.png', 500, -1);
  }

  /**
   * Check if bullet is off-screen (above or outside visible area)
   * @returns {boolean} True if bullet should be deactivated
   */
  isOffScreen() {
    return this.y < -10 || this.x < -10 || this.x > this.scene.cameras.main.width + 10;
  }
}
