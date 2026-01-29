import BaseProjectile from './BaseProjectile';

/**
 * Player bullet class for the weapons system.
 * Uses object pooling - bullets are reused when off-screen.
 * Config loaded from GameConfig.PROJECTILES.player_bullet
 */
export default class Bullet extends BaseProjectile {
  constructor(scene, x, y) {
    const config = BaseProjectile.getTypeConfig('player_bullet');
    super(scene, x, y, config.texture, config.frame, config.speed, config.direction);
  }

  /**
   * Check if bullet is off-screen (above or outside visible area)
   * @returns {boolean} True if bullet should be deactivated
   */
  isOffScreen() {
    return this.y < -10 || this.x < -10 || this.x > this.scene.cameras.main.width + 10;
  }
}
