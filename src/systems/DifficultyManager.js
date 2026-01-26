import GameConfig from '../config/GameConfig.js';

/**
 * DifficultyManager - Handles difficulty progression over time.
 * Manages difficulty levels, timers, and adjustments to spawning rates.
 */
export default class DifficultyManager {
  /**
   * Create a new DifficultyManager.
   * @param {number} initialDifficulty - Starting difficulty level (default 1)
   * @param {number} difficultyInterval - Time in ms between difficulty increases
   * @param {number} mineSpawnInterval - Initial mine spawn interval in ms
   */
  constructor(
    initialDifficulty = 1,
    difficultyInterval = GameConfig.DIFFICULTY.INTERVAL,
    mineSpawnInterval = GameConfig.DIFFICULTY.INITIAL_MINE_SPAWN_INTERVAL
  ) {
    this.difficulty = initialDifficulty;
    this.difficultyInterval = difficultyInterval;
    this.mineSpawnInterval = mineSpawnInterval;
    this.difficultyTimer = 0;
  }

  /**
   * Get the current difficulty level.
   * @returns {number} Current difficulty level
   */
  getDifficulty() {
    return this.difficulty;
  }

  /**
   * Get the current mine spawn interval.
   * @returns {number} Mine spawn interval in milliseconds
   */
  getMineSpawnInterval() {
    return this.mineSpawnInterval;
  }

  /**
   * Update the difficulty manager. Call this each frame.
   * @param {number} delta - Time elapsed since last frame in ms
   * @param {EnemySpawner} enemySpawner - The enemy spawner to adjust on difficulty increase
   * @returns {boolean} True if difficulty was increased this frame
   */
  update(delta, enemySpawner) {
    this.difficultyTimer += delta;

    if (this.difficultyTimer >= this.difficultyInterval) {
      this.difficultyTimer = 0;
      this.increaseDifficulty(enemySpawner);
      return true;
    }

    return false;
  }

  /**
   * Increase difficulty level and adjust spawner/mine settings.
   * @param {EnemySpawner} enemySpawner - The enemy spawner to adjust
   */
  increaseDifficulty(enemySpawner) {
    this.difficulty++;
    console.log('Difficulty increased to', this.difficulty);

    // Reduce spawn interval (more enemies)
    const minSpawnBase = GameConfig.SPAWNER.MIN_SPAWN_INTERVAL;
    const maxSpawnBase = GameConfig.SPAWNER.MAX_SPAWN_INTERVAL;
    enemySpawner.minSpawnInterval = Math.max(500, minSpawnBase - this.difficulty * 100);
    enemySpawner.maxSpawnInterval = Math.max(1000, maxSpawnBase - this.difficulty * 200);

    // Increase enemy speed and fire rate via spawner
    enemySpawner.difficultyMultiplier = 1 + (this.difficulty - 1) * 0.1;

    // Spawn mines faster with difficulty
    const minMineInterval = GameConfig.DIFFICULTY.MIN_MINE_SPAWN_INTERVAL;
    this.mineSpawnInterval = Math.max(minMineInterval, 5000 - this.difficulty * 300);
  }
}
