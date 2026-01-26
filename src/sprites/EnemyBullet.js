import BaseProjectile from './BaseProjectile';

/**
 * Enemy bullet class - plasma projectiles shot by enemies
 * Moves downward toward the player
 */
export default class EnemyBullet extends BaseProjectile {
  constructor(scene, x, y) {
    // Enemy bullets move downward (direction = 1) at speed 300
    super(scene, x, y, 'sprites', 'plasma_1.png', 300, 1);
  }

  /**
   * Check if bullet is off-screen (below visible area)
   * @returns {boolean} True if bullet should be deactivated
   */
  isOffScreen() {
    return this.y > this.scene.cameras.main.height + 10;
  }
}
