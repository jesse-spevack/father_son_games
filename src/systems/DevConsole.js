import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * DevConsole - In-game developer tools for rapid testing.
 * Toggle with backtick (`) or F1.
 * Only active in development mode.
 *
 * Keyboard shortcuts:
 *   ` or F1  - Toggle console overlay
 *   1-4      - Give power-up (health, weapon, speed, shield)
 *   5-8      - Switch weapon (vulcan, laser, spreader, plasma)
 *   B        - Spawn boss
 *   E        - Spawn enemy formation
 *   I        - Toggle invincibility
 *   K        - Kill all enemies
 *   L        - Add extra life
 *   N        - Skip to next wave
 *   P        - Pause/unpause spawning
 */
export default class DevConsole {
  /**
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
    this.enabled = this.isDevMode();
    this.visible = false;

    // Overlay elements
    this.overlay = null;
    this.statsText = null;
    this.helpText = null;

    // Cheat state
    this.godMode = false;

    if (this.enabled) {
      this.setupKeys();
      this.createOverlay();
      console.log('[DevConsole] Initialized. Press ` or F1 to toggle.');
    }
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevMode() {
    // Vite dev mode check
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV === true;
    }
    // Fallback: check for localhost
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeys() {
    const keyboard = this.scene.input.keyboard;

    // Toggle console
    keyboard.on('keydown-BACKTICK', () => this.toggle());
    keyboard.on('keydown-F1', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Power-ups (1-4)
    keyboard.on('keydown-ONE', () => this.givePowerUp('health'));
    keyboard.on('keydown-TWO', () => this.givePowerUp('weapon'));
    keyboard.on('keydown-THREE', () => this.givePowerUp('speed'));
    keyboard.on('keydown-FOUR', () => this.givePowerUp('shield'));

    // Weapon switches (5-8)
    keyboard.on('keydown-FIVE', () => this.switchWeapon('vulcan'));
    keyboard.on('keydown-SIX', () => this.switchWeapon('laser'));
    keyboard.on('keydown-SEVEN', () => this.switchWeapon('spreader'));
    keyboard.on('keydown-EIGHT', () => this.switchWeapon('plasma'));

    // Cheats
    keyboard.on('keydown-B', () => this.spawnBoss());
    keyboard.on('keydown-E', () => this.spawnEnemyFormation());
    keyboard.on('keydown-I', () => this.toggleGodMode());
    keyboard.on('keydown-K', () => this.killAllEnemies());
    keyboard.on('keydown-L', () => this.addLife());
    keyboard.on('keydown-N', () => this.nextWave());
    keyboard.on('keydown-P', () => this.toggleSpawning());
  }

  /**
   * Create the debug overlay UI
   */
  createOverlay() {
    const { width, height } = this.scene.cameras.main;

    // Semi-transparent background
    this.overlay = this.scene.add.rectangle(
      0, 0, width, 140, 0x000000, 0.7
    );
    this.overlay.setOrigin(0, 0);
    this.overlay.setDepth(9999);
    this.overlay.setScrollFactor(0);
    this.overlay.setVisible(false);

    // Stats text (left side)
    this.statsText = this.scene.add.text(10, 10, '', {
      font: '14px monospace',
      fill: '#00ff00',
      lineSpacing: 4,
    });
    this.statsText.setDepth(10000);
    this.statsText.setScrollFactor(0);
    this.statsText.setVisible(false);

    // Help text (right side)
    this.helpText = this.scene.add.text(width - 10, 10, this.getHelpText(), {
      font: '12px monospace',
      fill: '#ffff00',
      align: 'right',
      lineSpacing: 2,
    });
    this.helpText.setOrigin(1, 0);
    this.helpText.setDepth(10000);
    this.helpText.setScrollFactor(0);
    this.helpText.setVisible(false);

    // God mode indicator (always visible when active)
    this.godModeText = this.scene.add.text(width / 2, 10, '[ GOD MODE ]', {
      font: 'bold 16px monospace',
      fill: '#ff0000',
    });
    this.godModeText.setOrigin(0.5, 0);
    this.godModeText.setDepth(10000);
    this.godModeText.setScrollFactor(0);
    this.godModeText.setVisible(false);
  }

  /**
   * Get help text for overlay
   */
  getHelpText() {
    return [
      '1-4: Power-ups',
      '5-8: Weapons',
      'B: Boss  E: Enemies',
      'I: God  K: Kill all',
      'L: +Life  N: Wave',
      'P: Pause spawn',
    ].join('\n');
  }

  /**
   * Toggle overlay visibility
   */
  toggle() {
    if (!this.enabled) return;

    this.visible = !this.visible;
    this.overlay.setVisible(this.visible);
    this.statsText.setVisible(this.visible);
    this.helpText.setVisible(this.visible);

    if (this.visible) {
      this.log('Console opened');
    }
  }

  /**
   * Update stats display - call from scene update()
   */
  update() {
    if (!this.enabled || !this.visible) return;

    const scene = this.scene;
    const state = scene.gameState;
    const fps = Math.round(scene.game.loop.actualFps);

    // Gather stats
    const enemyCount = scene.enemySpawner?.getActiveCount() || 0;
    const bulletCount = scene.bullets?.getChildren().filter(b => b.active).length || 0;
    const enemyBulletCount = scene.enemyBullets?.getChildren().filter(b => b.active).length || 0;
    const mineCount = scene.mines?.getChildren().filter(m => m.active).length || 0;
    const wave = scene.difficultyManager?.getDifficulty() || 1;
    const bossActive = scene.bossManager?.isBossActive() || false;

    // Player stats
    const player = scene.player;
    const weapon = player?.getWeaponConfig();
    const weaponName = weapon?.name || 'Unknown';
    const weaponLevel = (player?.weaponLevel || 0) + 1;

    const stats = [
      `FPS: ${fps}`,
      `Score: ${state?.score || 0}  Lives: ${state?.lives || 0}`,
      `Wave: ${wave}  Boss: ${bossActive ? 'ACTIVE' : 'no'}`,
      `Enemies: ${enemyCount}  Mines: ${mineCount}`,
      `Bullets: ${bulletCount}  Enemy bullets: ${enemyBulletCount}`,
      `Weapon: ${weaponName} Lv${weaponLevel}`,
      `Health: ${player?.health || 0}/${player?.maxHealth || 100}`,
    ];

    this.statsText.setText(stats.join('\n'));

    // Update god mode indicator
    this.godModeText.setVisible(this.godMode);
  }

  /**
   * Log a message to console (and optionally show in-game)
   */
  log(message) {
    console.log(`[DevConsole] ${message}`);
  }

  // ==================== CHEAT COMMANDS ====================

  /**
   * Give a power-up to the player
   */
  givePowerUp(type) {
    if (!this.enabled) return;

    const player = this.scene.player;
    const config = GameConfig.POWER_UP.TYPES[type];

    if (!config) {
      this.log(`Unknown power-up: ${type}`);
      return;
    }

    // Apply effect directly
    switch (type) {
      case 'health':
        player.heal(config.healAmount);
        break;
      case 'weapon':
        player.upgradeWeapon();
        break;
      case 'speed':
        player.applySpeedBoost(config.speedMult, config.duration);
        break;
      case 'shield':
        player.applyShield(config.duration);
        break;
    }

    this.log(`Gave power-up: ${type}`);
  }

  /**
   * Switch player weapon
   */
  switchWeapon(weaponType) {
    if (!this.enabled) return;

    const player = this.scene.player;
    if (player.switchWeapon) {
      player.switchWeapon(weaponType, false); // Keep current level
      this.log(`Switched to weapon: ${weaponType}`);
    }
  }

  /**
   * Spawn the boss immediately
   */
  spawnBoss() {
    if (!this.enabled) return;

    const bossManager = this.scene.bossManager;
    if (bossManager && !bossManager.isBossActive()) {
      bossManager.spawnBoss();
      this.log('Spawned boss');
    } else {
      this.log('Boss already active');
    }
  }

  /**
   * Spawn a random enemy formation
   */
  spawnEnemyFormation() {
    if (!this.enabled) return;

    const spawner = this.scene.enemySpawner;
    if (spawner) {
      spawner.spawnRandomFormation();
      this.log('Spawned enemy formation');
    }
  }

  /**
   * Toggle god mode (invincibility)
   */
  toggleGodMode() {
    if (!this.enabled) return;

    this.godMode = !this.godMode;
    const player = this.scene.player;

    if (player) {
      player.isInvincible = this.godMode;
      if (this.godMode) {
        player.setTint(0xffff00); // Yellow tint for god mode
      } else {
        player.clearTint();
      }
    }

    this.log(`God mode: ${this.godMode ? 'ON' : 'OFF'}`);
  }

  /**
   * Kill all active enemies
   */
  killAllEnemies() {
    if (!this.enabled) return;

    const spawner = this.scene.enemySpawner;
    if (spawner) {
      const count = spawner.getActiveCount();
      spawner.destroyAll();
      this.log(`Killed ${count} enemies`);
    }

    // Also kill boss if active
    const boss = this.scene.bossManager?.getBoss();
    if (boss && boss.active) {
      boss.takeDamage(9999);
      this.log('Killed boss');
    }
  }

  /**
   * Add an extra life
   */
  addLife() {
    if (!this.enabled) return;

    this.scene.events.emit('awardLife');
    this.log('Added extra life');
  }

  /**
   * Skip to next difficulty wave
   */
  nextWave() {
    if (!this.enabled) return;

    const dm = this.scene.difficultyManager;
    if (dm) {
      dm.forceLevelUp();
      this.scene.uiManager?.updateWave(dm.getDifficulty());
      this.log(`Skipped to wave ${dm.getDifficulty()}`);
    }
  }

  /**
   * Toggle enemy spawning
   */
  toggleSpawning() {
    if (!this.enabled) return;

    const spawner = this.scene.enemySpawner;
    if (spawner) {
      if (spawner.isPaused) {
        spawner.resume();
        this.log('Spawning resumed');
      } else {
        spawner.pause();
        this.log('Spawning paused');
      }
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.overlay) this.overlay.destroy();
    if (this.statsText) this.statsText.destroy();
    if (this.helpText) this.helpText.destroy();
    if (this.godModeText) this.godModeText.destroy();
  }
}
