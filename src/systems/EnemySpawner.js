import Enemy from '../sprites/Enemy.js';
import GameConfig from '../config/GameConfig.js';

/**
 * Manages enemy spawning and formations
 * Spawns waves of enemies in various formation patterns
 */
export default class EnemySpawner {
  /**
   * @param {Phaser.Scene} scene - The game scene
   * @param {Phaser.Physics.Arcade.Group} bulletGroup - The enemy bullet group for shooting
   */
  constructor(scene, bulletGroup = null) {
    this.scene = scene;
    this.bulletGroup = bulletGroup;

    // Create physics group for all enemies
    this.enemyGroup = scene.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });

    // Spawn timing
    this.spawnTimer = 0;
    this.spawnInterval = 2000; // ms between formations
    this.minSpawnInterval = 1000;
    this.maxSpawnInterval = 3000;

    // Available colors and types (types from config registry)
    this.colors = ['r', 'g', 'b'];
    this.types = Enemy.getTypeKeys();

    // Formation spacing
    this.shipSpacing = 50;

    // Difficulty multiplier (set by GameScene)
    this.difficultyMultiplier = 1;

    // Pause state (for boss fights)
    this.isPaused = false;

    // Screen dimensions
    this.screenWidth = scene.cameras.main.width;
    this.screenHeight = scene.cameras.main.height;
    this.spawnMargin = 60; // Keep formations away from edges
  }

  /**
   * Get a random color for enemies
   * @returns {string} Random color code ('r', 'g', or 'b')
   */
  getRandomColor() {
    return Phaser.Math.RND.pick(this.colors);
  }

  /**
   * Get a random enemy type (weighted towards fighter)
   * @returns {string} Enemy type key from config
   */
  getRandomType() {
    // Use spawn weight from config (70% fighter, 30% heavy)
    const weight = GameConfig.SPAWNER.FIGHTER_SPAWN_WEIGHT;
    return Math.random() < weight ? 'fighter' : 'heavy';
  }

  /**
   * Get a random enemy type from allowed types for a formation
   * @param {string[]} allowedTypes - Array of allowed type keys
   * @returns {string} Enemy type key
   */
  getRandomTypeFrom(allowedTypes) {
    if (!allowedTypes || allowedTypes.length === 0) {
      return this.getRandomType();
    }
    return Phaser.Math.RND.pick(allowedTypes);
  }

  /**
   * Get all available formation keys
   * @returns {string[]} Array of formation keys
   */
  static getFormationKeys() {
    return Object.keys(GameConfig.FORMATIONS);
  }

  /**
   * Get random X position within safe spawn area
   * @returns {number} X coordinate for spawning
   */
  getRandomSpawnX() {
    return Phaser.Math.Between(this.spawnMargin, this.screenWidth - this.spawnMargin);
  }

  /**
   * Set the bullet group for enemies to use
   * @param {Phaser.Physics.Arcade.Group} bulletGroup - The enemy bullet group
   */
  setBulletGroup(bulletGroup) {
    this.bulletGroup = bulletGroup;
  }

  /**
   * Create a single enemy and add to the group
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} type - Enemy type
   * @param {string} color - Enemy color
   * @param {number} velocityX - Optional horizontal velocity for formations
   * @returns {Enemy} The created enemy
   */
  createEnemy(x, y, type, color, velocityX = 0) {
    const enemy = new Enemy(this.scene, x, y, type, color);
    this.enemyGroup.add(enemy);

    // Give enemy access to the bullet group for shooting
    if (this.bulletGroup) {
      enemy.setBulletGroup(this.bulletGroup);
    }

    // Set horizontal velocity if specified (for formation movement)
    if (velocityX !== 0) {
      enemy.setVelocityX(velocityX);
    }

    // Apply difficulty multiplier
    enemy.speed *= this.difficultyMultiplier;
    enemy.setVelocityY(enemy.speed);
    enemy.fireRate = Math.max(500, enemy.fireRate / this.difficultyMultiplier);

    return enemy;
  }

  /**
   * Spawn a formation from config
   * @param {string} formationKey - Key from GameConfig.FORMATIONS
   * @param {number} centerX - Center X position of formation
   * @param {number} startY - Starting Y position (top of screen)
   */
  spawnFormation(formationKey, centerX, startY = -50) {
    const config = GameConfig.FORMATIONS[formationKey];
    if (!config) {
      console.warn(`Unknown formation: ${formationKey}`);
      return;
    }

    const color = this.getRandomColor();
    const type = this.getRandomTypeFrom(config.types);
    const spacing = this.shipSpacing;

    // Get positions, handling variable-length formations
    let positions = [...config.positions];
    if (config.minShips && config.maxShips) {
      const shipCount = Phaser.Math.Between(config.minShips, config.maxShips);
      // Center the subset of positions
      const startIndex = Math.floor((positions.length - shipCount) / 2);
      positions = positions.slice(startIndex, startIndex + shipCount);
    }

    positions.forEach((pos) => {
      const x = centerX + pos.x * spacing;
      const y = startY + pos.y * spacing;

      // Only spawn if within screen bounds
      if (x > this.spawnMargin && x < this.screenWidth - this.spawnMargin) {
        this.createEnemy(x, y, type, color);
      }
    });
  }

  /**
   * Spawn a random formation type from config
   */
  spawnRandomFormation() {
    const formationKeys = Object.keys(GameConfig.FORMATIONS);
    const formationKey = Phaser.Math.RND.pick(formationKeys);
    const x = this.getRandomSpawnX();
    this.spawnFormation(formationKey, x);
  }

  /**
   * Update spawner - call this from scene's update method
   * @param {number} time - Current game time
   * @param {number} delta - Time since last frame in ms
   */
  update(time, delta) {
    // Don't spawn if paused (during boss fights)
    if (this.isPaused) return;

    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      // Spawn a random formation
      this.spawnRandomFormation();

      // Randomize next spawn interval for variety
      this.spawnInterval = Phaser.Math.Between(
        this.minSpawnInterval,
        this.maxSpawnInterval
      );
    }
  }

  /**
   * Pause spawning (used during boss fights)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume spawning (after boss fights)
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Spawn a single enemy at a specific position.
   * Used by BossManager for boss summons.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} type - Enemy type (1 or 2)
   * @param {string} color - Enemy color
   * @returns {Enemy} The created enemy
   */
  spawnSingleEnemy(x, y, type, color) {
    return this.createEnemy(x, y, type, color);
  }

  /**
   * Get the enemy physics group for collision detection
   * @returns {Phaser.Physics.Arcade.Group} The enemy group
   */
  getEnemyGroup() {
    return this.enemyGroup;
  }

  /**
   * Get count of active enemies
   * @returns {number} Number of active enemies
   */
  getActiveCount() {
    return this.enemyGroup.getChildren().length;
  }

  /**
   * Destroy all enemies (for game reset)
   */
  destroyAll() {
    this.enemyGroup.clear(true, true);
  }
}
