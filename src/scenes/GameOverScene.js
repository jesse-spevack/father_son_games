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
      credits: data.credits || 0,
    };
    this.initials = '';
    this.qualifiesForLeaderboard = false;
    this.submitting = false;
    this.submitted = false;

    // Save progress to localStorage
    this.saveProgress();
  }

  /**
   * Save game progress to localStorage via ProgressManager.
   */
  saveProgress() {
    const progress = this.game.registry.get('progress');
    if (progress) {
      progress.recordGameEnd(this.stats);
      this.totalCredits = progress.getCredits();
    } else {
      this.totalCredits = this.stats.credits;
    }
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

    // Credits display
    this.add.text(centerX, 190, `Space Credits: +${this.stats.credits}  (Total: ${this.totalCredits})`, {
      font: '16px monospace',
      fill: '#ffdd00',
    }).setOrigin(0.5);

    // Check if score qualifies for leaderboard
    this.qualifiesForLeaderboard = await leaderboardService.checkIfQualifies(this.stats.score);

    if (this.qualifiesForLeaderboard) {
      this.showInitialsInput(centerX);
    } else {
      this.showLeaderboard(centerX, 225);
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

    // Initials display - tappable to open keyboard on mobile
    this.initialsText = this.add.text(centerX, 300, '_ _ _', {
      font: '48px monospace',
      fill: '#00ff00',
    }).setOrigin(0.5);

    // Create hidden HTML input for native keyboard
    this.createNativeInput();

    // Make initials text tappable to focus input
    const hitArea = this.add.rectangle(centerX, 300, 200, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.focusInput());

    this.add.text(centerX, 350, 'Tap above to enter initials', {
      font: '16px monospace',
      fill: '#888888',
    }).setOrigin(0.5);

    // Submit button
    this.submitButton = this.add.rectangle(centerX, 410, 160, 44, 0x222222)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.trySubmit());
    this.submitText = this.add.text(centerX, 410, 'SUBMIT', {
      font: '20px monospace',
      fill: '#888888',
    }).setOrigin(0.5);
  }

  createNativeInput() {
    // Create hidden input element for native keyboard
    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'text';
    this.hiddenInput.maxLength = 3;
    this.hiddenInput.autocomplete = 'off';
    this.hiddenInput.autocapitalize = 'characters';
    this.hiddenInput.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 50%;
      opacity: 0;
    `;

    // Update display on input
    this.hiddenInput.addEventListener('input', () => {
      this.initials = this.hiddenInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
      this.hiddenInput.value = this.initials;
      this.updateInitialsDisplay();
      this.updateSubmitButton();

      // Auto-submit when 3 letters entered
      if (this.initials.length === 3) {
        this.hiddenInput.blur();
      }
    });

    document.body.appendChild(this.hiddenInput);
  }

  focusInput() {
    if (this.hiddenInput && !this.submitted && !this.submitting) {
      this.hiddenInput.focus();
    }
  }

  updateSubmitButton() {
    if (this.submitText) {
      const ready = this.initials.length === 3;
      this.submitText.setFill(ready ? '#ffffff' : '#888888');
      this.submitButton.setFillStyle(ready ? 0x336633 : 0x222222);
    }
  }

  trySubmit() {
    if (this.initials.length === 3 && !this.submitting) {
      this.submitScore();
    }
  }

  destroyNativeInput() {
    if (this.hiddenInput && this.hiddenInput.parentNode) {
      this.hiddenInput.parentNode.removeChild(this.hiddenInput);
      this.hiddenInput = null;
    }
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

    this.destroyNativeInput();
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

    this.add.text(centerX, 40, 'SCORE RECORDED!', {
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
    this.destroyNativeInput();
    this.scene.start('GameScene');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
