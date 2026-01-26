import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percent text
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      font: '18px monospace',
      fill: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // Clean up on complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load assets
    this.loadAssets();
  }

  loadAssets() {
    // Load the spritesheet with JSON atlas
    this.load.atlas(
      'sprites',
      'assets/spritesheet.png',
      'assets/spritesheet.json'
    );

    // Load background
    this.load.image('background', 'assets/BG.png');

    // Load boss sprites
    this.loadBossSprites();
  }

  loadBossSprites() {
    const bossFrames = [
      'boss_idle_01', 'boss_idle_02', 'boss_idle_03',
      'boss_move_01', 'boss_move_02', 'boss_move_03',
      'boss_attack_01', 'boss_attack_02', 'boss_attack_03', 'boss_attack_04',
      'boss_damaged_01', 'boss_damaged_02', 'boss_damaged_03',
      'boss_death_01', 'boss_death_02', 'boss_death_03', 'boss_death_04'
    ];

    bossFrames.forEach(frame => {
      this.load.image(frame, `assets/Boss/${frame}.png`);
    });
  }

  create() {
    // Create all animations
    this.createAnimations();

    // Transition to game scene
    this.scene.start('GameScene');
  }

  createAnimations() {
    // Player tilt animations (red variant - main player)
    // These are not animated sequences, but individual frames for tilt states
    // We'll create a pseudo-animation for reference, but typically you'd just set the frame

    // Helper to generate frame array for atlas
    const makeFrames = (prefix, start, end) => {
      const frames = [];
      for (let i = start; i <= end; i++) {
        const num = i.toString().padStart(2, '0');
        frames.push({ key: 'sprites', frame: `${prefix}${num}.png` });
      }
      return frames;
    };

    // Exhaust flame animation (looping)
    this.anims.create({
      key: 'exhaust',
      frames: makeFrames('exhaust_', 1, 5),
      frameRate: 15,
      repeat: -1
    });

    // Mine 1 spin animation (looping)
    this.anims.create({
      key: 'mine1_spin',
      frames: makeFrames('mine_1_', 1, 9),
      frameRate: 10,
      repeat: -1
    });

    // Mine 2 spin animation (looping)
    this.anims.create({
      key: 'mine2_spin',
      frames: makeFrames('mine_2_', 1, 4),
      frameRate: 10,
      repeat: -1
    });

    // Explosion 1 animation (single play)
    this.anims.create({
      key: 'explosion1',
      frames: makeFrames('explosion_1_', 1, 11),
      frameRate: 15,
      repeat: 0
    });

    // Explosion 2 animation (single play)
    this.anims.create({
      key: 'explosion2',
      frames: makeFrames('explosion_2_', 1, 9),
      frameRate: 15,
      repeat: 0
    });

    // Explosion 3 animation (single play)
    this.anims.create({
      key: 'explosion3',
      frames: makeFrames('explosion_3_', 1, 9),
      frameRate: 15,
      repeat: 0
    });

    // Player tilt frames are static, but we can store frame references
    // The tilt sequence is: l2 (left max) -> l1 -> m (center) -> r1 -> r2 (right max)
    // These will be set directly on sprites based on movement, not as animations

    // Enemy tilt frames follow the same pattern as player
    // Colors: r (red), g (green), b (blue)
    // Directions: l2, l1, m, r1, r2

    // Boss animations
    this.createBossAnimations();
  }

  createBossAnimations() {
    // Helper to generate frame array for individual images
    const makeBossFrames = (prefix, count) => {
      const frames = [];
      for (let i = 1; i <= count; i++) {
        const num = i.toString().padStart(2, '0');
        frames.push({ key: `${prefix}_${num}` });
      }
      return frames;
    };

    // Boss idle animation (looping)
    this.anims.create({
      key: 'boss_idle',
      frames: makeBossFrames('boss_idle', 3),
      frameRate: 6,
      repeat: -1
    });

    // Boss move animations (for tilt feedback)
    this.anims.create({
      key: 'boss_move_left',
      frames: [{ key: 'boss_move_01' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'boss_move_right',
      frames: [{ key: 'boss_move_03' }],
      frameRate: 1
    });

    // Boss attack animation (single play)
    this.anims.create({
      key: 'boss_attack',
      frames: makeBossFrames('boss_attack', 4),
      frameRate: 10,
      repeat: 0
    });

    // Boss damaged animation (single play)
    this.anims.create({
      key: 'boss_damaged',
      frames: makeBossFrames('boss_damaged', 3),
      frameRate: 12,
      repeat: 0
    });

    // Boss death animation (single play)
    this.anims.create({
      key: 'boss_death',
      frames: makeBossFrames('boss_death', 4),
      frameRate: 8,
      repeat: 0
    });
  }
}
