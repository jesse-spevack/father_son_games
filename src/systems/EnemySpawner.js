import Enemy from '../sprites/Enemy.js';

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

    // Available colors and types
    this.colors = ['r', 'g', 'b'];
    this.types = [1, 2];

    // Formation spacing
    this.shipSpacing = 50;

    // Difficulty multiplier (set by GameScene)
    this.difficultyMultiplier = 1;

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
   * Get a random enemy type (weighted towards type 1)
   * @returns {number} Enemy type (1 or 2)
   */
  getRandomType() {
    // 70% chance of type 1 (fighter), 30% chance of type 2 (heavy)
    return Math.random() < 0.7 ? 1 : 2;
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
   * Spawn V-formation (5 ships in V shape)
   * @param {number} centerX - Center X position of formation
   * @param {number} startY - Starting Y position (top of screen)
   */
  spawnVFormation(centerX, startY = -50) {
    const color = this.getRandomColor();
    const type = this.getRandomType();
    const spacing = this.shipSpacing;

    // V-formation positions (relative to center)
    // Front ship at center, then pairs spreading back
    const positions = [
      { x: 0, y: 0 },                    // Lead ship
      { x: -spacing, y: spacing },       // Left wing
      { x: spacing, y: spacing },        // Right wing
      { x: -spacing * 2, y: spacing * 2 }, // Far left
      { x: spacing * 2, y: spacing * 2 },  // Far right
    ];

    positions.forEach((pos) => {
      const x = centerX + pos.x;
      const y = startY + pos.y;

      // Only spawn if within screen bounds
      if (x > this.spawnMargin && x < this.screenWidth - this.spawnMargin) {
        this.createEnemy(x, y, type, color);
      }
    });
  }

  /**
   * Spawn line formation (horizontal row of 3-5 ships)
   * @param {number} centerX - Center X position of formation
   * @param {number} startY - Starting Y position
   */
  spawnLineFormation(centerX, startY = -30) {
    const color = this.getRandomColor();
    const type = this.getRandomType();
    const spacing = this.shipSpacing;

    // Random number of ships (3-5)
    const shipCount = Phaser.Math.Between(3, 5);

    // Calculate starting X to center the formation
    const totalWidth = (shipCount - 1) * spacing;
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < shipCount; i++) {
      const x = startX + i * spacing;

      // Only spawn if within screen bounds
      if (x > this.spawnMargin && x < this.screenWidth - this.spawnMargin) {
        this.createEnemy(x, startY, type, color);
      }
    }
  }

  /**
   * Spawn diamond formation (4 ships in diamond shape)
   * @param {number} centerX - Center X position of formation
   * @param {number} startY - Starting Y position
   */
  spawnDiamondFormation(centerX, startY = -50) {
    const color = this.getRandomColor();
    const type = this.getRandomType();
    const spacing = this.shipSpacing;

    // Diamond positions (relative to center)
    const positions = [
      { x: 0, y: 0 },              // Top
      { x: -spacing, y: spacing }, // Left
      { x: spacing, y: spacing },  // Right
      { x: 0, y: spacing * 2 },    // Bottom
    ];

    positions.forEach((pos) => {
      const x = centerX + pos.x;
      const y = startY + pos.y;

      // Only spawn if within screen bounds
      if (x > this.spawnMargin && x < this.screenWidth - this.spawnMargin) {
        this.createEnemy(x, y, type, color);
      }
    });
  }

  /**
   * Spawn a random formation type
   */
  spawnRandomFormation() {
    const formations = ['v', 'line', 'diamond'];
    const formation = Phaser.Math.RND.pick(formations);
    const x = this.getRandomSpawnX();

    switch (formation) {
      case 'v':
        this.spawnVFormation(x);
        break;
      case 'line':
        this.spawnLineFormation(x);
        break;
      case 'diamond':
        this.spawnDiamondFormation(x);
        break;
    }
  }

  /**
   * Update spawner - call this from scene's update method
   * @param {number} time - Current game time
   * @param {number} delta - Time since last frame in ms
   */
  update(time, delta) {
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
