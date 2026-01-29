import GameConfig from '../config/GameConfig.js';

/**
 * VisualEffectsManager - Centralized visual effects for consistent game feel.
 * Handles explosions, flashes, screen shakes, and floating text.
 */
export default class VisualEffectsManager {
  /**
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Play a damage flash effect on a target sprite.
   * @param {Phaser.GameObjects.Sprite} target - Sprite to flash
   * @param {number} [color=0xff0000] - Flash color
   * @param {number} [duration=100] - Flash duration in ms
   */
  damageFlash(target, color = GameConfig.DISPLAY.DAMAGE_FLASH_TINT, duration = GameConfig.DISPLAY.DAMAGE_FLASH_DURATION) {
    if (!target || !target.active) return;

    target.setTint(color);
    this.scene.time.delayedCall(duration, () => {
      if (target.active) {
        target.clearTint();
      }
    });
  }

  /**
   * Play a damage flash with alpha pulse.
   * @param {Phaser.GameObjects.Sprite} target - Sprite to flash
   * @param {number} [repeats=2] - Number of flash repeats
   */
  damageFlashWithAlpha(target, repeats = 2) {
    if (!target || !target.active) return;

    this.scene.tweens.add({
      targets: target,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: repeats,
    });
  }

  /**
   * Shake the camera for impact feedback.
   * @param {number} [intensity=0.01] - Shake intensity (0-1)
   * @param {number} [duration=100] - Shake duration in ms
   */
  screenShake(intensity = 0.01, duration = 100) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Flash the screen (for big impacts like boss death).
   * @param {number} [duration=300] - Flash duration in ms
   * @param {number} [r=255] - Red component
   * @param {number} [g=255] - Green component
   * @param {number} [b=255] - Blue component
   */
  screenFlash(duration = 300, r = 255, g = 255, b = 255) {
    this.scene.cameras.main.flash(duration, r, g, b);
  }

  /**
   * Play an explosion animation at a position.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} [scale=1] - Explosion scale
   * @returns {Phaser.GameObjects.Sprite} The explosion sprite
   */
  explosion(x, y, scale = 1) {
    const explosions = ['explosion1', 'explosion2', 'explosion3'];
    const key = Phaser.Math.RND.pick(explosions);
    const explosion = this.scene.add.sprite(x, y, 'sprites');
    explosion.setScale(scale);
    explosion.play(key);
    explosion.once('animationcomplete', () => explosion.destroy());
    return explosion;
  }

  /**
   * Play multiple explosions in a pattern (for boss death, etc).
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {Object[]} offsets - Array of {x, y, delay, scale} offsets
   */
  multiExplosion(centerX, centerY, offsets) {
    offsets.forEach((offset) => {
      this.scene.time.delayedCall(offset.delay || 0, () => {
        this.explosion(
          centerX + (offset.x || 0),
          centerY + (offset.y || 0),
          offset.scale || 1
        );
      });
    });
  }

  /**
   * Show floating text that rises and fades.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} text - Text to display
   * @param {string} [color='#ffffff'] - Text color
   * @param {number} [fontSize=20] - Font size
   */
  floatingText(x, y, text, color = '#ffffff', fontSize = 20) {
    const textObj = this.scene.add.text(x, y, text, {
      font: `bold ${fontSize}px monospace`,
      fill: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: textObj,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => textObj.destroy(),
    });

    return textObj;
  }

  /**
   * Scale pulse effect (for power-ups, phase changes, etc).
   * @param {Phaser.GameObjects.Sprite} target - Sprite to pulse
   * @param {number} [scale=1.2] - Max scale
   * @param {number} [duration=100] - Pulse duration
   */
  scalePulse(target, scale = 1.2, duration = 100) {
    if (!target || !target.active) return;

    const originalScaleX = target.scaleX;
    const originalScaleY = target.scaleY;

    this.scene.tweens.add({
      targets: target,
      scaleX: originalScaleX * scale,
      scaleY: originalScaleY * scale,
      duration: duration,
      yoyo: true,
    });
  }

  /**
   * Tint pulse effect (flash a color then return).
   * @param {Phaser.GameObjects.Sprite} target - Sprite to tint
   * @param {number} tint - Tint color
   * @param {number} [duration=100] - Tint duration
   * @param {number} [returnTint=null] - Tint to return to (null = clear)
   */
  tintPulse(target, tint, duration = 100, returnTint = null) {
    if (!target || !target.active) return;

    target.setTint(tint);
    this.scene.time.delayedCall(duration, () => {
      if (target.active) {
        if (returnTint !== null) {
          target.setTint(returnTint);
        } else {
          target.clearTint();
        }
      }
    });
  }

  /**
   * Clean up (nothing to clean currently, but good practice).
   */
  destroy() {
    this.scene = null;
  }
}
