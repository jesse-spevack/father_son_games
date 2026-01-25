import Phaser from 'phaser';
import Player from '../sprites/Player.js';
import Bullet from '../sprites/Bullet.js';
import EnemyBullet from '../sprites/EnemyBullet.js';
import EnemySpawner from '../systems/EnemySpawner.js';
import Mine from '../sprites/Mine.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize score and lives
    this.score = 0;
    this.lives = 3;
    this.isInvincible = false;

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

    // Add exhaust flame behind player (lower depth)
    this.exhaust = this.add.sprite(
      this.player.x,
      this.player.y + 35,
      'sprites',
      'exhaust_01.png'
    );
    this.exhaust.play('exhaust');
    this.exhaust.setDepth(-1); // Behind player

    // Create enemy bullet group with object pooling
    this.enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      maxSize: 50,
      runChildUpdate: true, // Ensures preUpdate is called on enemy bullets
    });

    // Initialize enemy spawner with bullet group for shooting
    this.enemySpawner = new EnemySpawner(this, this.enemyBullets);

    // Initialize mine group and spawn timer
    this.mines = this.physics.add.group({
      classType: Mine,
      runChildUpdate: true
    });
    this.mineSpawnTimer = 0;
    this.mineSpawnInterval = 3000; // Spawn mine every 3 seconds

    // Difficulty progression tracking
    this.difficulty = 1;
    this.difficultyTimer = 0;
    this.difficultyInterval = 30000; // Increase difficulty every 30 seconds

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

    // Placeholder for game state
    this.gameStarted = false;

    // Input handling for game start
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Setup bullet pool for player weapons
    this.setupBullets();

    // Setup touch controls indicator (visual feedback for touch area)
    this.setupTouchIndicator();

    // Setup collision detection
    this.setupCollisions();

    // Create UI elements
    this.createHealthBar();
    this.createScoreText();
    this.createLivesDisplay();
    this.createWaveDisplay();
  }

  /**
   * Setup bullet object pool for efficient bullet management.
   */
  setupBullets() {
    // Create bullet group with object pooling
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 30,
      runChildUpdate: true, // Ensures preUpdate is called on bullets
    });

    // Track last fire time for rate limiting
    this.lastFired = 0;
    this.fireRate = 150; // Milliseconds between shots

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
      if (this.gameStarted) {
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
      if (pointer.isDown && this.gameStarted) {
        this.touchIndicator.setPosition(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointerup', () => {
      this.touchIndicator.setVisible(false);
      this.touchShooting = false;
    });
  }

  startGame() {
    this.gameStarted = true;
    this.titleText.setVisible(false);
    console.log('Game started! Player can now move freely.');
  }

  update() {
    // Scroll background
    this.background.tilePositionY -= 0.5;

    // Check for space to start
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.gameStarted) {
      this.startGame();
    }

    // Update player (handles movement, tilt, etc.)
    if (this.player) {
      this.player.update();

      // Keep exhaust positioned behind player
      this.exhaust.x = this.player.x;
      this.exhaust.y = this.player.y + 35;

      // Handle shooting (spacebar or right-side touch)
      if (this.gameStarted) {
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
    if (this.gameStarted && this.enemySpawner) {
      this.enemySpawner.update(this.time.now, this.game.loop.delta);
    }

    // Increase difficulty over time
    if (this.gameStarted) {
      this.difficultyTimer += this.game.loop.delta;
      if (this.difficultyTimer >= this.difficultyInterval) {
        this.difficultyTimer = 0;
        this.increaseDifficulty();
      }
    }

    // Spawn mines periodically
    if (this.gameStarted) {
      this.mineSpawnTimer += this.game.loop.delta;
      if (this.mineSpawnTimer >= this.mineSpawnInterval) {
        this.mineSpawnTimer = 0;
        this.spawnMine();
      }
    }

    // Update UI
    this.updateHealthBar();
    this.updateScore();
  }

  gameOver() {
    this.scene.start('GameOverScene', { score: this.score });
  }

  /**
   * Increase difficulty level - makes enemies spawn faster, move faster, and shoot more.
   */
  increaseDifficulty() {
    this.difficulty++;
    console.log('Difficulty increased to', this.difficulty);

    // Reduce spawn interval (more enemies)
    this.enemySpawner.minSpawnInterval = Math.max(500, 1000 - this.difficulty * 100);
    this.enemySpawner.maxSpawnInterval = Math.max(1000, 3000 - this.difficulty * 200);

    // Increase enemy speed and fire rate via spawner
    this.enemySpawner.difficultyMultiplier = 1 + (this.difficulty - 1) * 0.1;

    // Spawn mines faster with difficulty
    this.mineSpawnInterval = Math.max(2000, 5000 - this.difficulty * 300);

    // Update wave display if it exists
    if (this.waveText) {
      this.waveText.setText('Wave ' + this.difficulty);
    }
  }

  /**
   * Setup collision detection between game objects.
   */
  setupCollisions() {
    // Player bullets vs enemies
    this.physics.add.overlap(
      this.bullets,
      this.enemySpawner.getEnemyGroup(),
      this.bulletHitEnemy,
      null,
      this
    );

    // Enemy bullets vs player
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.enemyBulletHitPlayer,
      null,
      this
    );

    // Enemies vs player (collision damage)
    this.physics.add.overlap(
      this.enemySpawner.getEnemyGroup(),
      this.player,
      this.enemyHitPlayer,
      null,
      this
    );

    // Mines vs player (proximity explosion handled in Mine.preUpdate)
    // Keep this for direct collision
    this.physics.add.overlap(
      this.mines,
      this.player,
      this.mineHitPlayer,
      null,
      this
    );

    // Player bullets vs mines (mines can be destroyed)
    this.physics.add.overlap(
      this.bullets,
      this.mines,
      this.bulletHitMine,
      null,
      this
    );
  }

  /**
   * Handle player bullet hitting a mine.
   */
  bulletHitMine(bullet, mine) {
    bullet.setActive(false);
    bullet.setVisible(false);
    mine.takeDamage(1);
  }

  /**
   * Handle player bullet hitting an enemy.
   * @param {Bullet} bullet - The bullet that hit
   * @param {Enemy} enemy - The enemy that was hit
   */
  bulletHitEnemy(bullet, enemy) {
    bullet.setActive(false);
    bullet.setVisible(false);

    // Play explosion at enemy position
    this.playExplosion(enemy.x, enemy.y);

    // Damage enemy and add score if killed
    if (enemy.takeDamage(1)) {
      this.score += enemy.points;
    }
  }

  /**
   * Handle enemy bullet hitting the player.
   * @param {Player} player - The player
   * @param {EnemyBullet} bullet - The enemy bullet
   */
  enemyBulletHitPlayer(player, bullet) {
    if (this.isInvincible) return;

    bullet.setActive(false);
    bullet.setVisible(false);

    if (!this.player.takeDamage(10)) {
      this.loseLife();
    }
  }

  /**
   * Handle enemy colliding with player.
   * @param {Player} player - The player
   * @param {Enemy} enemy - The enemy that collided
   */
  enemyHitPlayer(player, enemy) {
    if (this.isInvincible) return;

    this.playExplosion(enemy.x, enemy.y);
    enemy.destroy();

    if (!this.player.takeDamage(25)) {
      this.loseLife();
    }
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
   * Handle mine colliding with player.
   * Mines damage player but are not destroyed.
   * @param {Player} player - The player
   * @param {Mine} mine - The mine that collided
   */
  mineHitPlayer(player, mine) {
    if (this.isInvincible) return;

    // Mine explodes on direct contact
    mine.explode();
  }

  /**
   * Lose a life and respawn or game over.
   */
  loseLife() {
    this.lives--;
    this.updateLivesDisplay();

    if (this.lives <= 0) {
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

    // Reset player position and health
    this.player.setPosition(this.cameras.main.centerX, this.cameras.main.height - 100);
    this.player.health = this.player.maxHealth;

    // Make invincible and flash
    this.isInvincible = true;
    this.player.setAlpha(0.5);

    // Flash effect
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 0.8 },
      duration: 100,
      repeat: 15,
      yoyo: true,
      onComplete: () => {
        this.isInvincible = false;
        this.player.setAlpha(1);
      }
    });
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

  /**
   * Create health bar UI element.
   */
  createHealthBar() {
    this.healthBarBg = this.add.rectangle(10, 10, 104, 14, 0x000000).setOrigin(0, 0);
    this.healthBar = this.add.rectangle(12, 12, 100, 10, 0x00ff00).setOrigin(0, 0);
    this.healthBarBg.setScrollFactor(0).setDepth(100);
    this.healthBar.setScrollFactor(0).setDepth(100);
  }

  /**
   * Update health bar based on player health.
   */
  updateHealthBar() {
    const percent = this.player.getHealthPercent();
    this.healthBar.width = 100 * percent;
    this.healthBar.fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
  }

  /**
   * Create score text UI element.
   */
  createScoreText() {
    this.scoreText = this.add.text(this.cameras.main.width - 10, 10, 'Score: 0', {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  /**
   * Update score text display.
   */
  updateScore() {
    this.scoreText.setText('Score: ' + this.score);
  }

  /**
   * Create lives display using ship icons.
   */
  createLivesDisplay() {
    this.livesIcons = [];
    for (let i = 0; i < this.lives; i++) {
      const icon = this.add.sprite(130 + i * 25, 17, 'sprites', 'player_r_m.png');
      icon.setScale(0.3);
      icon.setScrollFactor(0);
      icon.setDepth(100);
      this.livesIcons.push(icon);
    }
  }

  /**
   * Update lives display.
   */
  updateLivesDisplay() {
    this.livesIcons.forEach((icon, index) => {
      icon.setVisible(index < this.lives);
    });
  }

  /**
   * Create wave/difficulty display.
   */
  createWaveDisplay() {
    this.waveText = this.add.text(this.cameras.main.centerX, 10, 'Wave 1', {
      font: '16px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
  }
}
