import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';

/**
 * Boss attack strategies - each attack is a self-contained module.
 * Attacks receive the boss instance and execute their pattern.
 */

/**
 * Spray attack - fan of bullets downward
 */
export const SprayAttack = {
  key: 'spray',
  cooldown: GameConfig.BOSS.SPRAY_COOLDOWN,

  execute(boss) {
    boss.isAttacking = true;
    boss.stopIdlePulse();

    boss.scene.tweens.add({
      targets: boss,
      scaleX: 0.22,
      scaleY: 0.22,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        if (!boss.active || boss.isDying) return;

        const bulletCount = GameConfig.BOSS.SPRAY_BULLET_COUNT;
        const angle = GameConfig.BOSS.SPRAY_ANGLE;
        const speed = GameConfig.BOSS.SPRAY_BULLET_SPEED;
        const angleStep = angle / (bulletCount - 1);
        const startAngle = 90 - angle / 2;

        if (boss.scene.vfx) {
          boss.scene.vfx.screenShake(0.008, 100);
        }

        for (let i = 0; i < bulletCount; i++) {
          const bulletAngle = startAngle + i * angleStep;
          const radians = Phaser.Math.DegToRad(bulletAngle);

          const bullet = boss.bulletGroup.get(boss.x, boss.y + 30);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setPosition(boss.x, boss.y + 30);
            bullet.setVelocity(
              Math.cos(radians) * speed,
              Math.sin(radians) * speed
            );
          }
        }
      },
      onComplete: () => {
        boss.isAttacking = false;
        if (!boss.isDying) boss.resumeIdlePulse();
      }
    });
  }
};

/**
 * Aimed attack - bullets aimed at player position
 */
export const AimedAttack = {
  key: 'aimed',
  cooldown: GameConfig.BOSS.AIMED_COOLDOWN,

  execute(boss) {
    const player = boss.scene.player;
    if (!player || !player.active) return;

    boss.isAttacking = true;
    boss.stopIdlePulse();

    boss.scene.tweens.add({
      targets: boss,
      scaleX: 0.22,
      scaleY: 0.15,
      duration: 100,
      yoyo: true,
      onYoyo: () => {
        if (!boss.active || boss.isDying) return;

        const currentPlayer = boss.scene?.player;
        if (!currentPlayer?.active) return;

        const bulletCount = GameConfig.BOSS.AIMED_BULLET_COUNT;
        const speed = GameConfig.BOSS.AIMED_BULLET_SPEED;

        for (let i = 0; i < bulletCount; i++) {
          const spread = (i - (bulletCount - 1) / 2) * 20;

          const bullet = boss.bulletGroup.get(boss.x + spread, boss.y + 30);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setPosition(boss.x + spread, boss.y + 30);

            const angle = Phaser.Math.Angle.Between(
              boss.x + spread, boss.y + 30,
              currentPlayer.x, currentPlayer.y
            );

            bullet.setVelocity(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed
            );
          }
        }
      },
      onComplete: () => {
        boss.isAttacking = false;
        if (!boss.isDying) boss.resumeIdlePulse();
      }
    });
  }
};

/**
 * Ring attack - 360 degree bullet pattern (phase 3)
 */
export const RingAttack = {
  key: 'ring',
  cooldown: GameConfig.BOSS.RING_COOLDOWN,

  execute(boss) {
    boss.isAttacking = true;
    boss.stopIdlePulse();
    boss.setTint(0xff00ff);

    boss.scene.tweens.add({
      targets: boss,
      scaleX: 0.24,
      scaleY: 0.24,
      duration: 300,
      yoyo: true,
      onYoyo: () => {
        if (!boss.active || boss.isDying) return;

        if (boss.scene.vfx) {
          boss.scene.vfx.screenShake(0.012, 150);
        }

        const bulletCount = GameConfig.BOSS.RING_BULLET_COUNT;
        const speed = GameConfig.BOSS.RING_BULLET_SPEED;
        const angleStep = 360 / bulletCount;

        for (let i = 0; i < bulletCount; i++) {
          const angle = i * angleStep;
          const radians = Phaser.Math.DegToRad(angle);

          const bullet = boss.bulletGroup.get(boss.x, boss.y);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setPosition(boss.x, boss.y);
            bullet.setVelocity(
              Math.cos(radians) * speed,
              Math.sin(radians) * speed
            );
          }
        }
      },
      onComplete: () => {
        boss.isAttacking = false;
        if (!boss.isDying) {
          boss.setTint(boss.phaseColors[boss.currentPhase]);
          boss.resumeIdlePulse();
        }
      }
    });
  }
};

/**
 * Summon attack - calls for enemy reinforcements
 */
export const SummonAttack = {
  key: 'summon',
  cooldown: GameConfig.BOSS.SUMMON_COOLDOWN,

  execute(boss) {
    const count = boss.currentPhase === 3
      ? GameConfig.BOSS.SUMMON_HEAVIES
      : GameConfig.BOSS.SUMMON_FIGHTERS;
    const type = boss.currentPhase === 3 ? 'heavy' : 'fighter';

    boss.scene.events.emit('bossSummon', { count, type });
  }
};

/**
 * Attack registry - maps keys to attack objects
 */
export const AttackRegistry = {
  spray: SprayAttack,
  aimed: AimedAttack,
  ring: RingAttack,
  summon: SummonAttack,
};

/**
 * Get an attack by key
 * @param {string} key - Attack key
 * @returns {Object|null} Attack object or null
 */
export function getAttack(key) {
  return AttackRegistry[key] || null;
}

/**
 * Get all attack keys
 * @returns {string[]}
 */
export function getAttackKeys() {
  return Object.keys(AttackRegistry);
}
