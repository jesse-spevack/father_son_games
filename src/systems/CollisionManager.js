import GameConfig from '../config/GameConfig.js';
import Bullet from '../sprites/Bullet.js';
import Boss from '../sprites/Boss.js';

/**
 * CollisionManager - Handles all collision detection and response in the game.
 * Centralizes collision setup and handler methods for cleaner scene organization.
 */
export default class CollisionManager {
  /**
   * Create a CollisionManager.
   * @param {Phaser.Scene} scene - The game scene reference
   */
  constructor(scene) {
    this.scene = scene;
    this.bossManager = null;
  }

  /**
   * Set the boss manager reference for boss collisions
   * @param {BossManager} bossManager
   */
  setBossManager(bossManager) {
    this.bossManager = bossManager;
  }

  /**
   * Setup all collision detection between game objects.
   * @param {Phaser.Physics.Arcade.Group} bullets - Player bullet group
   * @param {Phaser.Physics.Arcade.Group} enemyBullets - Enemy bullet group
   * @param {Phaser.Physics.Arcade.Group} enemies - Enemy group
   * @param {Phaser.Physics.Arcade.Group} mines - Mine group
   * @param {Player} player - The player sprite
   * @param {Phaser.Physics.Arcade.Group} powerUps - Power-up group
   * @param {Phaser.Physics.Arcade.Group} coins - Coin group
   */
  setup(bullets, enemyBullets, enemies, mines, player, powerUps, coins) {
    // Store references for boss collision setup
    this.bullets = bullets;
    this.player = player;
    this.powerUps = powerUps;
    this.coins = coins;
    this.enemies = enemies;
    // Player bullets vs enemies
    this.scene.physics.add.overlap(
      bullets,
      enemies,
      this.bulletHitEnemy,
      null,
      this
    );

    // Enemy bullets vs player
    this.scene.physics.add.overlap(
      enemyBullets,
      player,
      this.enemyBulletHitPlayer,
      null,
      this
    );

    // Enemies vs player (collision damage)
    this.scene.physics.add.overlap(
      enemies,
      player,
      this.enemyHitPlayer,
      null,
      this
    );

    // Mines vs player (proximity explosion handled in Mine.preUpdate)
    // Keep this for direct collision
    this.scene.physics.add.overlap(
      mines,
      player,
      this.mineHitPlayer,
      null,
      this
    );

    // Player bullets vs mines (mines can be destroyed)
    this.scene.physics.add.overlap(
      bullets,
      mines,
      this.bulletHitMine,
      null,
      this
    );

    // Power-ups vs player (collection)
    this.scene.physics.add.overlap(
      powerUps,
      player,
      this.powerUpHitPlayer,
      null,
      this
    );

    // Coins vs player (collection)
    this.scene.physics.add.overlap(
      coins,
      player,
      this.coinHitPlayer,
      null,
      this
    );
  }

  /**
   * Handle player bullet hitting an enemy.
   * @param {Bullet} bullet - The bullet that hit
   * @param {Enemy} enemy - The enemy that was hit
   */
  bulletHitEnemy(bullet, enemy) {
    bullet.setActive(false);
    bullet.setVisible(false);

    // Emit explosion event (scene handles VFX)
    this.scene.events.emit('playExplosion', { x: enemy.x, y: enemy.y });

    // Damage enemy and add score if killed
    if (enemy.takeDamage(1)) {
      this.scene.events.emit('addScore', enemy.points);
      this.scene.events.emit('enemyKilled');

      // Drop coins from loot table
      const loot = enemy.getLoot();
      if (loot && loot.credits) {
        this.spawnCoins(enemy.x, enemy.y, loot.credits);
      }

      this.trySpawnPowerUp(enemy.x, enemy.y, loot);
    }
  }

  /**
   * Spawn collectible coins at position.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} credits - { min, max } credit range
   */
  spawnCoins(x, y, credits) {
    const value = Phaser.Math.Between(credits.min, credits.max);
    const coin = this.coins.get(x, y);
    if (coin) {
      coin.spawn(x, y, value);
    }
  }

  /**
   * Handle player collecting a coin.
   */
  coinHitPlayer(obj1, obj2) {
    // Determine which is the coin (has collect method and value property)
    const coin = obj1.value !== undefined ? obj1 : obj2;
    const player = obj1.value !== undefined ? obj2 : obj1;
    coin.collect(player);
  }

  /**
   * Attempt to spawn a power-up at the given position based on drop chance.
   * Uses enemy loot table if provided, otherwise falls back to global config.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} [loot] - Enemy's loot table (optional)
   */
  trySpawnPowerUp(x, y, loot = null) {
    // First check global drop chance
    if (Math.random() > GameConfig.POWER_UP.DROP_CHANCE) {
      return;
    }

    // Get power-up from pool
    const powerUp = this.scene.powerUps.get(x, y);
    if (!powerUp) return;

    // Determine power-up type
    let type;

    if (loot && loot.dropTable && loot.dropTable.length > 0) {
      // Use enemy's loot table with weighted chances
      const roll = Math.random();
      let cumulative = 0;

      for (const drop of loot.dropTable) {
        cumulative += drop.chance;
        if (roll <= cumulative) {
          type = drop.item;
          break;
        }
      }

      // Fallback if no type selected (shouldn't happen if chances sum to 1)
      if (!type) {
        type = loot.dropTable[0].item;
      }
    } else {
      // Fallback: randomly select from all power-up types
      const types = Object.keys(GameConfig.POWER_UP.TYPES);
      type = Phaser.Math.RND.pick(types);
    }

    powerUp.spawn(x, y, type);
  }

  /**
   * Handle player bullet hitting a mine.
   * @param {Bullet} bullet - The bullet that hit
   * @param {Mine} mine - The mine that was hit
   */
  bulletHitMine(bullet, mine) {
    bullet.setActive(false);
    bullet.setVisible(false);
    mine.takeDamage(1);
  }

  /**
   * Handle player collecting a power-up.
   * Note: Phaser passes params as (sprite, groupMember) for overlap(group, sprite)
   */
  powerUpHitPlayer(obj1, obj2) {
    // Determine which is the powerUp (has collect method)
    const powerUp = obj1.collect ? obj1 : obj2;
    const player = obj1.collect ? obj2 : obj1;
    powerUp.collect(player);
  }

  /**
   * Handle enemy bullet hitting the player.
   * @param {Player} player - The player
   * @param {EnemyBullet} bullet - The enemy bullet
   */
  enemyBulletHitPlayer(player, bullet) {
    if (this.scene.player?.isInvincible) return;

    bullet.setActive(false);
    bullet.setVisible(false);

    if (!this.scene.player?.takeDamage(10)) {
      this.scene.events.emit('loseLife');
    }
  }

  /**
   * Handle enemy colliding with player.
   * @param {Player} player - The player
   * @param {Enemy} enemy - The enemy that collided
   */
  enemyHitPlayer(player, enemy) {
    if (this.scene.player?.isInvincible) return;

    this.scene.events.emit('playExplosion', { x: enemy.x, y: enemy.y });

    // Use enemy's configured damage value
    const damage = enemy.getCollisionDamage ? enemy.getCollisionDamage() : 25;
    enemy.destroy();

    if (!this.scene.player?.takeDamage(damage)) {
      this.scene.events.emit('loseLife');
    }
  }

  /**
   * Handle mine colliding with player.
   * Mines damage player but are not destroyed.
   * @param {Player} player - The player
   * @param {Mine} mine - The mine that collided
   */
  mineHitPlayer(player, mine) {
    if (this.scene.player?.isInvincible) return;

    // Mine explodes on direct contact
    mine.explode();
  }

  /**
   * Setup collision detection for boss.
   * Called when boss spawns.
   * @param {Boss} boss - The boss sprite
   */
  setupBossCollisions(boss) {
    // Player bullets vs boss
    this.scene.physics.add.overlap(
      this.bullets,
      boss,
      this.bulletHitBoss,
      null,
      this
    );

    // Boss vs player (body collision)
    this.scene.physics.add.overlap(
      boss,
      this.player,
      this.bossHitPlayer,
      null,
      this
    );
  }

  /**
   * Handle player bullet hitting the boss.
   * @param {Bullet} bullet - The bullet that hit
   * @param {Boss} boss - The boss that was hit
   */
  bulletHitBoss(obj1, obj2) {
    // Use instanceof for reliable type detection (survives minification)
    const bullet = obj1 instanceof Bullet ? obj1 : obj2;
    const boss = obj1 instanceof Boss ? obj1 : obj2;

    bullet.setActive(false);
    bullet.setVisible(false);

    // Damage boss (no explosion on each hit - boss is tough)
    if (boss.takeDamage) {
      boss.takeDamage(1);
    }
  }

  /**
   * Handle boss body collision with player.
   * @param {Object} obj1 - First collision object
   * @param {Object} obj2 - Second collision object
   */
  bossHitPlayer(obj1, obj2) {
    // Use instanceof for reliable type detection (survives minification)
    const boss = obj1 instanceof Boss ? obj1 : obj2;

    if (this.scene.player?.isInvincible) return;
    if (boss?.isDying) return;

    // Heavy collision damage
    const damage = GameConfig.BOSS.COLLISION_DAMAGE;

    if (!this.scene.player?.takeDamage(damage)) {
      this.scene.events.emit('loseLife');
    } else {
      // Brief invincibility after boss collision
      this.scene.player?.makeInvincible(1000);
    }
  }

  /**
   * Clean up collision manager.
   * Should be called during scene shutdown.
   */
  destroy() {
    // Clear stored references
    this.bullets = null;
    this.player = null;
    this.bossManager = null;
  }
}
