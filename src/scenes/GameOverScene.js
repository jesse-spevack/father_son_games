import Phaser from 'phaser';
import { leaderboardService } from '../services/LeaderboardService.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.stats = {
      score: data.score || 0,
      wave: data.wave || 1,
      enemiesKilled: data.enemiesKilled || 0,
      timeSurvived: data.timeSurvived || 0,
    };
    this.initials = '';
    this.qualifiesForLeaderboard = false;
    this.submitting = false;
    this.submitted = false;
  }

  async create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Game Over text
    this.add.text(centerX, 60, 'GAME OVER', {
      font: '48px monospace',
      fill: '#ff0000',
    }).setOrigin(0.5);

    // Stats display
    this.add.text(centerX, 120, `Score: ${this.stats.score}`, {
      font: '32px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, 160, [
      `Wave: ${this.stats.wave}`,
      `Enemies: ${this.stats.enemiesKilled}`,
      `Time: ${this.formatTime(this.stats.timeSurvived)}`,
    ].join('  |  '), {
      font: '16px monospace',
      fill: '#888888',
    }).setOrigin(0.5);

    // Check if score qualifies for leaderboard
    this.qualifiesForLeaderboard = await leaderboardService.checkIfQualifies(this.stats.score);

    if (this.qualifiesForLeaderboard) {
      this.showInitialsInput(centerX);
    } else {
      this.showLeaderboard(centerX, 200);
      this.showRestartPrompt(centerX);
    }

    // Keyboard input for initials
    this.input.keyboard.on('keydown', this.handleKeyInput, this);
  }

  showInitialsInput(centerX) {
    this.add.text(centerX, 210, 'NEW HIGH SCORE!', {
      font: '24px monospace',
      fill: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(centerX, 250, 'Enter your initials:', {
      font: '20px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Initials display with boxes
    this.initialsText = this.add.text(centerX, 300, '_ _ _', {
      font: '48px monospace',
      fill: '#00ff00',
    }).setOrigin(0.5);

    this.add.text(centerX, 360, 'Press ENTER to submit', {
      font: '16px monospace',
      fill: '#888888',
    }).setOrigin(0.5);
  }

  handleKeyInput(event) {
    if (this.submitted || this.submitting) return;

    if (this.qualifiesForLeaderboard && !this.submitted) {
      // Handle letter input
      if (event.keyCode >= 65 && event.keyCode <= 90 && this.initials.length < 3) {
        this.initials += event.key.toUpperCase();
        this.updateInitialsDisplay();
      }

      // Handle backspace
      if (event.keyCode === 8 && this.initials.length > 0) {
        this.initials = this.initials.slice(0, -1);
        this.updateInitialsDisplay();
      }

      // Handle enter to submit
      if (event.keyCode === 13 && this.initials.length === 3) {
        this.submitScore();
      }
    } else if (this.submitted) {
      // Handle space to restart after submission
      if (event.keyCode === 32) {
        this.restartGame();
      }
    }
  }

  updateInitialsDisplay() {
    const display = this.initials.padEnd(3, '_').split('').join(' ');
    this.initialsText.setText(display);
  }

  async submitScore() {
    if (this.submitting) return;
    this.submitting = true;

    this.initialsText.setText('...');

    await leaderboardService.submitScore({
      initials: this.initials,
      ...this.stats,
    });

    this.submitted = true;
    this.submitting = false;

    // Clear the initials input area and show leaderboard
    this.children.removeAll();
    this.create_postSubmit();
  }

  create_postSubmit() {
    const centerX = this.cameras.main.centerX;

    this.add.text(centerX, 40, 'SCORE SUBMITTED!', {
      font: '32px monospace',
      fill: '#00ff00',
    }).setOrigin(0.5);

    this.showLeaderboard(centerX, 90);
    this.showRestartPrompt(centerX);
  }

  async showLeaderboard(centerX, startY) {
    this.add.text(centerX, startY, '[ TOP 10 ]', {
      font: '24px monospace',
      fill: '#ffff00',
    }).setOrigin(0.5);

    const scores = await leaderboardService.getTopScores();
    const lineHeight = 28;

    // Header
    this.add.text(centerX, startY + 35, 'RNK  NAME   SCORE    WAVE  KILLS', {
      font: '14px monospace',
      fill: '#666666',
    }).setOrigin(0.5);

    scores.forEach((entry, index) => {
      const rank = (index + 1).toString().padStart(2, ' ');
      const name = entry.initials.padEnd(3, ' ');
      const score = entry.score.toString().padStart(8, ' ');
      const wave = entry.wave.toString().padStart(4, ' ');
      const kills = entry.enemiesKilled.toString().padStart(6, ' ');

      const isCurrentScore = this.submitted && entry.initials === this.initials && entry.score === this.stats.score;
      const color = isCurrentScore ? '#00ff00' : '#ffffff';

      this.add.text(centerX, startY + 60 + (index * lineHeight),
        `${rank}.  ${name}  ${score}    ${wave}  ${kills}`, {
        font: '14px monospace',
        fill: color,
      }).setOrigin(0.5);
    });

    // Show player's score if not in top 10
    if (!this.qualifiesForLeaderboard) {
      const y = startY + 60 + (10 * lineHeight) + 20;
      this.add.text(centerX, y, `Your score: ${this.stats.score}`, {
        font: '16px monospace',
        fill: '#888888',
      }).setOrigin(0.5);
    }
  }

  showRestartPrompt(centerX) {
    const y = this.cameras.main.height - 40;
    this.add.text(centerX, y, 'Press SPACE or tap to play again', {
      font: '18px monospace',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Input handling
    this.input.on('pointerdown', () => this.restartGame());
  }

  update() {
    // Space to restart (only after submission or if didn't qualify)
    if ((this.submitted || !this.qualifiesForLeaderboard) &&
        Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
      this.restartGame();
    }
  }

  restartGame() {
    this.scene.start('GameScene');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
