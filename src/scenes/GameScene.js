import Phaser from 'phaser';
import Player from '../sprites/Player.js';
import Bullet from '../sprites/Bullet.js';
import EnemyBullet from '../sprites/EnemyBullet.js';
import EnemySpawner from '../systems/EnemySpawner.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import CollisionManager from '../systems/CollisionManager.js';
import BossManager from '../systems/BossManager.js';
import Mine from '../sprites/Mine.js';
import PowerUp, { PowerUpType } from '../sprites/PowerUp.js';
import GameState from '../systems/GameState.js';
import UIManager from '../systems/UIManager.js';
import VisualEffectsManager from '../systems/VisualEffectsManager.js';
import PoolManager from '../systems/PoolManager.js';
import GameConfig from '../config/GameConfig.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize centralized game state
    this.gameState = new GameState();

    // Initialize pool manager for centralized object pool management
    this.pools = new PoolManager(this);

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

    // Create enemy bullet pool
    this.enemyBullets = this.pools.register('enemyBullets', EnemyBullet, {
      maxSize: GameConfig.ENEMY_BULLET.POOL_SIZE,
    });

    // Initialize enemy spawner with bullet group for shooting
    this.enemySpawner = new EnemySpawner(this, this.enemyBullets);

    // Create mine pool
    this.mines = this.pools.register('mines', Mine);

    // Create power-up pool
    this.powerUps = this.pools.register('powerUps', PowerUp, {
      maxSize: GameConfig.POWER_UP.POOL_SIZE,
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
      this.player,
      this.powerUps
    );

    // Create UI manager and initialize UI elements
    this.uiManager = new UIManager(this);
    this.uiManager.create(this.gameState.lives);

    // Create visual effects manager
    this.vfx = new VisualEffectsManager(this);

    // Initialize boss manager
    this.bossManager = new BossManager(this, this.enemySpawner, this.enemyBullets);
    this.collisionManager.setBossManager(this.bossManager);

    // Setup boss event listeners
    this.setupBossEvents();

    // Setup game event listeners for decoupled communication
    this.setupGameEvents();
  }

  /**
   * Setup event listeners for game state changes.
   * Decouples managers from direct gameState access.
   */
  setupGameEvents() {
    // Handle score changes from any source
    this.events.on('addScore', (points) => {
      this.gameState.addScore(points);
    });

    // Handle extra life awards
    this.events.on('awardLife', () => {
      this.gameState.lives++;
      this.uiManager.updateLives(this.gameState.lives);
    });

    // Handle enemy kills for leaderboard stats
    this.events.on('enemyKilled', () => {
      this.gameState.recordKill();
    });

    // Handle explosion effects (decoupled from CollisionManager)
    this.events.on('playExplosion', (data) => {
      this.playExplosion(data.x, data.y, data.scale);
    });

    // Handle life loss (decoupled from CollisionManager)
    this.events.on('loseLife', () => {
      this.loseLife();
    });
  }

  /**
   * Setup event listeners for boss fights.
   */
  setupBossEvents() {
    // When boss spawns, show health bar and setup collisions
    this.events.on('bossSpawned', (boss) => {
      this.uiManager.showBossHealth('MEGASHIP BOSS 1', boss.maxHealth);
      this.collisionManager.setupBossCollisions(boss);
    });

    // When boss is defeated, hide health bar
    this.events.on('bossDefeatedUI', () => {
      this.uiManager.hideBossHealth();
    });
  }

  /**
   * Setup bullet object pool for efficient bullet management.
   */
  setupBullets() {
    // Create bullet pool via PoolManager
    this.bullets = this.pools.register('bullets', Bullet, {
      maxSize: GameConfig.BULLET.POOL_SIZE,
    });

    // Track last fire time for rate limiting
    this.lastFired = 0;

    // Dedicated fire key (spacebar is also used for start, so we use a separate tracking)
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /**
   * Fire bullets from the player position.
   * Uses player's weapon level for fire rate and bullet count.
   * @param {number} time - Current game time in milliseconds
   */
  shoot(time) {
    // Check fire rate (use player's upgraded fire rate)
    const fireRate = this.player.getFireRate();
    if (time < this.lastFired + fireRate) {
      return;
    }

    const bulletCount = this.player.getBulletCount();
    const playerX = this.player.x;
    const playerY = this.player.y - 20;

    // Fire based on bullet count (1, 2, or 3 bullets)
    if (bulletCount === 1) {
      // Single bullet - straight ahead
      const bullet = this.bullets.get(playerX, playerY);
      if (bullet) {
        bullet.fire(playerX, playerY);
      }
    } else if (bulletCount === 2) {
      // Double spread - two bullets at slight angles
      const spread = 15; // pixels offset
      const bullet1 = this.bullets.get(playerX - spread, playerY);
      const bullet2 = this.bullets.get(playerX + spread, playerY);
      if (bullet1) bullet1.fire(playerX - spread, playerY, -0.1);
      if (bullet2) bullet2.fire(playerX + spread, playerY, 0.1);
    } else if (bulletCount >= 3) {
      // Triple spread - center + two angled
      const spread = 20;
      const bullet1 = this.bullets.get(playerX, playerY);
      const bullet2 = this.bullets.get(playerX - spread, playerY);
      const bullet3 = this.bullets.get(playerX + spread, playerY);
      if (bullet1) bullet1.fire(playerX, playerY, 0);
      if (bullet2) bullet2.fire(playerX - spread, playerY, -0.15);
      if (bullet3) bullet3.fire(playerX + spread, playerY, 0.15);
    }

    this.lastFired = time;
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
    this.gameState.startTimer(this.time.now);
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

    // Update player movement
    if (this.player) {
      this.player.update();
    }

    // Handle shooting (spacebar or right-side touch)
    if (this.player && this.gameState.gameStarted) {
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

    // Update enemy spawner (spawns formations at intervals)
    if (this.gameState.gameStarted && this.enemySpawner) {
      this.enemySpawner.update(this.time.now, this.game.loop.delta);
    }

    // Update boss manager
    if (this.gameState.gameStarted && this.bossManager) {
      this.bossManager.update(this.game.loop.delta);

      // Update boss health bar if boss is active
      if (this.bossManager.isBossActive()) {
        const boss = this.bossManager.getBoss();
        this.uiManager.updateBossHealth(boss.getHealthPercent());
      }
    }

    // Update difficulty progression (only when no boss fight)
    if (this.gameState.gameStarted && !this.bossManager.isBossActive()) {
      const difficultyIncreased = this.difficultyManager.update(this.game.loop.delta, this.enemySpawner);
      if (difficultyIncreased) {
        this.uiManager.updateWave(this.difficultyManager.getDifficulty());
      }
    }

    // Spawn mines periodically (only when no boss fight)
    if (this.gameState.gameStarted && !this.bossManager.isBossActive()) {
      this.gameState.mineSpawnTimer += this.game.loop.delta;
      if (this.gameState.mineSpawnTimer >= this.difficultyManager.getMineSpawnInterval()) {
        this.gameState.mineSpawnTimer = 0;
        this.spawnMine();
      }
    }

    // Update game time for leaderboard
    if (this.gameState.gameStarted) {
      this.gameState.updateTime(this.time.now);
    }

    // Update UI
    this.uiManager.update({
      healthPercent: this.player.getHealthPercent(),
      score: this.gameState.score
    });
  }

  gameOver() {
    this.scene.start('GameOverScene', this.gameState.getStats());
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
   * @param {number} [scale=1] - Explosion scale
   */
  playExplosion(x, y, scale = 1) {
    this.vfx.explosion(x, y, scale);
  }

  /**
   * Clean up scene resources.
   * Called automatically by Phaser when scene shuts down.
   */
  shutdown() {
    // Clean up all managers to prevent memory leaks
    if (this.bossManager) {
      this.bossManager.destroy();
    }
    if (this.collisionManager) {
      this.collisionManager.destroy();
    }
    if (this.uiManager) {
      this.uiManager.destroy();
    }
    if (this.vfx) {
      this.vfx.destroy();
    }
    if (this.pools) {
      this.pools.destroy();
    }

    // Remove event listeners set up in setupBossEvents
    this.events.off('bossSpawned');
    this.events.off('bossDefeatedUI');

    // Remove event listeners set up in setupGameEvents
    this.events.off('addScore');
    this.events.off('awardLife');
    this.events.off('enemyKilled');
    this.events.off('playExplosion');
    this.events.off('loseLife');
  }
}
