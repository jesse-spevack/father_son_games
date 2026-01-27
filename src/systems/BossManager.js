import Boss from '../sprites/Boss.js';
import GameConfig from '../config/GameConfig.js';

/**
 * BossManager - Handles boss spawning, fight state, and rewards.
 * Coordinates between boss, spawner, and UI systems.
 */
export default class BossManager {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {EnemySpawner} enemySpawner - Reference to pause/resume spawning
   * @param {Phaser.Physics.Arcade.Group} enemyBullets - Bullet pool for boss attacks
   */
  constructor(scene, enemySpawner, enemyBullets) {
    this.scene = scene;
    this.enemySpawner = enemySpawner;
    this.enemyBullets = enemyBullets;

    // Current boss instance (null when no boss fight)
    this.currentBoss = null;

    // Spawn timing
    this.spawnTimer = 0;
    this.firstSpawnDelay = GameConfig.BOSS.FIRST_SPAWN_DELAY;
    this.spawnInterval = GameConfig.BOSS.SPAWN_INTERVAL;
    this.isFirstBoss = true;

    // Fight state
    this.isBossFight = false;

    // Listen for boss events
    this.scene.events.on('bossDefeated', this.onBossDefeated, this);
    this.scene.events.on('bossSummon', this.onBossSummon, this);
  }

  /**
   * Check if a boss fight is currently active
   * @returns {boolean}
   */
  isBossActive() {
    return this.isBossFight && this.currentBoss && this.currentBoss.active;
  }

  /**
   * Get the current boss instance
   * @returns {Boss|null}
   */
  getBoss() {
    return this.currentBoss;
  }

  /**
   * Update boss manager each frame
   * @param {number} delta - Time since last frame in ms
   */
  update(delta) {
    // Don't spawn during active boss fight
    if (this.isBossFight) return;

    // Accumulate spawn timer
    this.spawnTimer += delta;

    // Check if it's time to spawn a boss
    const threshold = this.isFirstBoss ? this.firstSpawnDelay : this.spawnInterval;

    if (this.spawnTimer >= threshold) {
      this.spawnBoss();
    }
  }

  /**
   * Spawn the boss
   */
  spawnBoss() {
    console.log('Boss spawning!');

    // Reset timer
    this.spawnTimer = 0;
    this.isFirstBoss = false;

    // Create boss at top center of screen
    const x = this.scene.cameras.main.centerX;
    const y = -100; // Start above screen

    this.currentBoss = new Boss(this.scene, x, y);
    this.currentBoss.setBulletGroup(this.enemyBullets);

    // Enter boss fight state
    this.isBossFight = true;

    // Pause regular enemy spawning
    if (this.enemySpawner) {
      this.enemySpawner.pause();
    }

    // Clear existing enemies (optional - gives player breathing room)
    // this.clearEnemies();

    // Notify UI
    this.scene.events.emit('bossSpawned', this.currentBoss);

    // Camera shake for dramatic entrance
    this.scene.cameras.main.shake(300, 0.01);
  }

  /**
   * Handle boss summon event - spawn reinforcements
   * @param {Object} data - { count, type }
   */
  onBossSummon(data) {
    const { count, type } = data;
    console.log(`Boss summoning ${count} ${type}s!`);

    if (!this.enemySpawner) return;

    // Spawn enemies from sides
    for (let i = 0; i < count; i++) {
      // Alternate left/right side spawns
      const fromLeft = i % 2 === 0;
      const x = fromLeft ? -30 : this.scene.cameras.main.width + 30;
      const y = 100 + i * 50;

      // Delay each spawn slightly
      this.scene.time.delayedCall(i * 200, () => {
        const enemyType = type === 'heavy' ? 2 : 1;
        const color = Phaser.Math.RND.pick(['r', 'g', 'b']);
        const enemy = this.enemySpawner.spawnSingleEnemy(x, y, enemyType, color);

        if (enemy) {
          // Make them fly inward
          const targetX = fromLeft ? 100 + Math.random() * 200 : this.scene.cameras.main.width - 100 - Math.random() * 200;
          enemy.setVelocityX(fromLeft ? 100 : -100);

          // Curve down after entering
          this.scene.time.delayedCall(500, () => {
            if (enemy.active) {
              enemy.setVelocityX(0);
              enemy.setVelocityY(enemy.speed);
            }
          });
        }
      });
    }
  }

  /**
   * Handle boss defeated event
   * @param {Boss} boss
   */
  onBossDefeated(boss) {
    console.log('Boss defeated!');

    // Guard against null boss (edge case if destroyed unexpectedly)
    if (!boss) return;

    // Award points via event
    this.scene.events.emit('addScore', boss.points);

    // Award extra life via event
    if (GameConfig.BOSS.REWARD_EXTRA_LIFE) {
      this.scene.events.emit('awardLife');
      console.log('Extra life awarded!');
    }

    // Spawn power-up (if power-up system exists)
    if (GameConfig.BOSS.REWARD_POWER_UP) {
      this.scene.events.emit('spawnPowerUp', { x: boss.x, y: boss.y });
    }

    // End boss fight state
    this.isBossFight = false;
    this.currentBoss = null;

    // Resume regular spawning after a short delay
    this.scene.time.delayedCall(2000, () => {
      if (this.enemySpawner) {
        this.enemySpawner.resume();
      }
    });

    // Notify UI
    this.scene.events.emit('bossDefeatedUI');
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.scene.events.off('bossDefeated', this.onBossDefeated, this);
    this.scene.events.off('bossSummon', this.onBossSummon, this);
  }
}
