import Phaser from 'phaser';
import Player from '../sprites/Player.js';
import Bullet from '../sprites/Bullet.js';
import EnemyBullet from '../sprites/EnemyBullet.js';
import EnemySpawner from '../systems/EnemySpawner.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import CollisionManager from '../systems/CollisionManager.js';
import Mine from '../sprites/Mine.js';
import GameState from '../systems/GameState.js';
import UIManager from '../systems/UIManager.js';
import GameConfig from '../config/GameConfig.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize centralized game state
    this.gameState = new GameState();

    // Add scrolling background
    this.background = this.add.tileSprite(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      'background'
    );

    // Create player using Player class - positioned near bottom center
    this.player = new Player(
      this,
      this.cameras.main.centerX,
      this.cameras.main.height - 100
    );

    // Create enemy bullet group with object pooling
    this.enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      maxSize: GameConfig.ENEMY_BULLET.POOL_SIZE,
      runChildUpdate: true, // Ensures preUpdate is called on enemy bullets
    });

    // Initialize enemy spawner with bullet group for shooting
    this.enemySpawner = new EnemySpawner(this, this.enemyBullets);

    // Initialize mine group and spawn timer
    this.mines = this.physics.add.group({
      classType: Mine,
      runChildUpdate: true
    });

    // Initialize difficulty manager
    this.difficultyManager = new DifficultyManager();

    // Placeholder text
    this.titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'SpaceBear\n\nPress SPACE to start\n\nArrows/WASD or Touch to move',
      {
        font: '24px monospace',
        fill: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5);

    // gameStarted is now tracked in this.gameState.gameStarted

    // Input handling for game start
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Setup bullet pool for player weapons
    this.setupBullets();

    // Setup touch controls indicator (visual feedback for touch area)
    this.setupTouchIndicator();

    // Setup collision detection via CollisionManager
    this.collisionManager = new CollisionManager(this);
    this.collisionManager.setup(
      this.bullets,
      this.enemyBullets,
      this.enemySpawner.getEnemyGroup(),
      this.mines,
      this.player
    );

    // Create UI manager and initialize UI elements
    this.uiManager = new UIManager(this);
    this.uiManager.create(this.gameState.lives);
  }

  /**
   * Setup bullet object pool for efficient bullet management.
   */
  setupBullets() {
    // Create bullet group with object pooling
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: GameConfig.BULLET.POOL_SIZE,
      runChildUpdate: true, // Ensures preUpdate is called on bullets
    });

    // Track last fire time for rate limiting
    this.lastFired = 0;
    this.fireRate = GameConfig.PLAYER.FIRE_RATE;

    // Dedicated fire key (spacebar is also used for start, so we use a separate tracking)
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /**
   * Fire a bullet from the player position.
   * @param {number} time - Current game time in milliseconds
   */
  shoot(time) {
    // Check fire rate
    if (time < this.lastFired + this.fireRate) {
      return;
    }

    // Get bullet from pool
    const bullet = this.bullets.get(this.player.x, this.player.y - 20);

    if (bullet) {
      bullet.fire(this.player.x, this.player.y - 20);
      this.lastFired = time;
    }
  }

  /**
   * Setup visual indicator for touch controls.
   * Shows where the player is touching.
   */
  setupTouchIndicator() {
    // Create touch indicator (small circle that appears at touch point)
    this.touchIndicator = this.add.circle(0, 0, 20, 0xffffff, 0.3);
    this.touchIndicator.setVisible(false);
    this.touchIndicator.setDepth(100);

    // Track if touch is for shooting (right side) or movement (left side)
    this.touchShooting = false;

    // Show/hide indicator based on pointer state
    this.input.on('pointerdown', (pointer) => {
      if (this.gameState.gameStarted) {
        // Right side of screen = shooting, left side = movement
        const screenMidpoint = this.cameras.main.width / 2;

        if (pointer.worldX > screenMidpoint) {
          // Right side - shooting mode
          this.touchShooting = true;
        } else {
          // Left side - movement mode (show indicator)
          this.touchIndicator.setPosition(pointer.worldX, pointer.worldY);
          this.touchIndicator.setVisible(true);
        }
      } else {
        // Start game on touch if not started
        this.startGame();
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && this.gameState.gameStarted) {
        this.touchIndicator.setPosition(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointerup', () => {
      this.touchIndicator.setVisible(false);
      this.touchShooting = false;
    });
  }

  startGame() {
    this.gameState.gameStarted = true;
    this.titleText.setVisible(false);
    console.log('Game started! Player can now move freely.');
  }

  update() {
    // Scroll background
    this.background.tilePositionY -= 0.5;

    // Check for space to start
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.gameState.gameStarted) {
      this.startGame();
    }

    // Update player (handles movement, tilt, etc.)
    if (this.player) {
      this.player.update();

      // Handle shooting (spacebar or right-side touch)
      if (this.gameState.gameStarted) {
        const time = this.time.now;

        // Keyboard shooting (spacebar)
        if (this.fireKey.isDown) {
          this.shoot(time);
        }

        // Touch shooting (right side of screen)
        if (this.touchShooting && this.input.activePointer.isDown) {
          this.shoot(time);
        }
      }
    }

    // Update enemy spawner (spawns formations at intervals)
    if (this.gameState.gameStarted && this.enemySpawner) {
      this.enemySpawner.update(this.time.now, this.game.loop.delta);
    }

    // Update difficulty progression
    if (this.gameState.gameStarted) {
      const difficultyIncreased = this.difficultyManager.update(this.game.loop.delta, this.enemySpawner);
      if (difficultyIncreased) {
        this.uiManager.updateWave(this.difficultyManager.getDifficulty());
      }
    }

    // Spawn mines periodically
    if (this.gameState.gameStarted) {
      this.gameState.mineSpawnTimer += this.game.loop.delta;
      if (this.gameState.mineSpawnTimer >= this.difficultyManager.getMineSpawnInterval()) {
        this.gameState.mineSpawnTimer = 0;
        this.spawnMine();
      }
    }

    // Update UI
    this.uiManager.update({
      healthPercent: this.player.getHealthPercent(),
      score: this.gameState.score
    });
  }

  gameOver() {
    this.scene.start('GameOverScene', { score: this.gameState.score });
  }

  /**
   * Spawn a mine at a random x position above the screen.
   */
  spawnMine() {
    const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
    const mine = new Mine(this, x, -30);
    this.mines.add(mine);
  }

  /**
   * Lose a life and respawn or game over.
   */
  loseLife() {
    const remainingLives = this.gameState.loseLife();
    this.uiManager.updateLives(remainingLives);

    if (remainingLives <= 0) {
      this.playExplosion(this.player.x, this.player.y);
      this.gameOver();
    } else {
      // Respawn with invincibility
      this.respawnPlayer();
    }
  }

  /**
   * Respawn player with temporary invincibility.
   */
  respawnPlayer() {
    // Play explosion at current position
    this.playExplosion(this.player.x, this.player.y);

    // Respawn player at center bottom with invincibility
    this.player.respawn(this.cameras.main.centerX, this.cameras.main.height - 100);
  }

  /**
   * Play a random explosion animation at the given position.
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  playExplosion(x, y) {
    const explosions = ['explosion1', 'explosion2', 'explosion3'];
    const key = Phaser.Math.RND.pick(explosions);
    const explosion = this.add.sprite(x, y, 'sprites');
    explosion.play(key);
    explosion.once('animationcomplete', () => explosion.destroy());
  }
}
