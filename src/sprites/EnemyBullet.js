import BaseProjectile from './BaseProjectile';

/**
 * Enemy bullet class - plasma projectiles shot by enemies
 * Moves downward toward the player.
 * Config loaded from GameConfig.PROJECTILES.enemy_bullet
 */
export default class EnemyBullet extends BaseProjectile {
  constructor(scene, x, y) {
    const config = BaseProjectile.getTypeConfig('enemy_bullet');
    super(scene, x, y, config.texture, config.frame, config.speed, config.direction);
  }

  /**
   * Check if bullet is off-screen (below visible area)
   * @returns {boolean} True if bullet should be deactivated
   */
  isOffScreen() {
    return this.y > this.scene.cameras.main.height + 10;
  }
}
