import Phaser from 'phaser';
import Player from '../sprites/Player.js';
import Bullet from '../sprites/Bullet.js';
import EnemyBullet from '../sprites/EnemyBullet.js';
import EnemySpawner from '../systems/EnemySpawner.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
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

    // Test mine sprite with spin animation
    this.testMine = this.add.sprite(
      this.cameras.main.centerX - 100,
      150,
      'sprites',
      'mine_1_01.png'
    );
    this.testMine.play('mine1_spin');

    // Create enemy bullet group with object pooling
    this.enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      maxSize: 50,
      runChildUpdate: true, // Ensures preUpdate is called on enemy bullets
    });

    // Initialize enemy spawner with bullet group for shooting
    this.enemySpawner = new EnemySpawner(this, this.enemyBullets);

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
  }

  gameOver() {
    this.scene.start('GameOverScene', { score: this.score || 0 });
  }
}
