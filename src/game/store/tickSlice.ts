import type { SetState, GetState, GameStore } from './types';
import type { GameStatus, Enemy, Projectile, Effect } from '../types';
import {
  ENEMY_CONFIGS,
  TOWER_CONFIGS,
  MANA_REGEN_RATE,
  TILE_SIZE,
  getTowerLevelConfig,
} from '../config';
import {
  generateId,
  moveEnemyAlongPath,
  getDistance,
  getEnemyWorldPosition,
  getTowerWorldPosition,
} from './utils';

export function createTickSlice(
  set: SetState,
  get: GetState
): Pick<GameStore, 'tick'> {
  return {
    tick: (deltaTime: number) => {
      const state = get();
      const {
        status,
        waveInProgress,
        enemies,
        towers,
        projectiles,
        effects,
        mana,
        maxMana,
        lives,
        score,
        wave,
        maxWaves,
        spawnQueue,
        waveTime,
        enemiesSpawned,
        towerBoostDuration,
        towerBoostMultiplier,
        divineShield,
        divineShieldDuration,
        timeWarpDuration,
        timeWarpScale,
        gameTime,
        isCountdownActive,
        waveCountdown,
        gameMode,
        autoStartWave,
      } = state;
      const path = get().getPath();

      if (status !== 'playing' && status !== 'wave_reward') return;

      const newGameTime = gameTime + deltaTime;
      let newWaveTime = waveTime;

      let newMana = Math.min(maxMana, mana + MANA_REGEN_RATE * deltaTime);
      let newLives = lives;
      let newScore = score;
      let newGold = state.gold;

      let newEnemies = enemies.map((e) => ({ ...e }));
      let newProjectiles = projectiles.map((p) => ({ ...p }));
      let newEffects = effects.map((e) => ({ ...e }));
      const newTowers = towers.map((t) => ({ ...t }));

      let newTowerBoostDuration = towerBoostDuration;
      let newTowerBoostMultiplier = towerBoostMultiplier;
      let newDivineShield = divineShield;
      let newDivineShieldDuration = divineShieldDuration;
      let newTimeWarpDuration = timeWarpDuration;
      let newTimeWarpScale = timeWarpScale;

      let newIsCountdownActive = isCountdownActive;
      let newWaveCountdown = waveCountdown;
      let newStatus: GameStatus = status;

      if (towerBoostDuration > 0) {
        newTowerBoostDuration -= deltaTime;
        if (newTowerBoostDuration <= 0) {
          newTowerBoostMultiplier = 1;
          newTowerBoostDuration = 0;
        }
      }

      if (newDivineShieldDuration > 0) {
        newDivineShieldDuration -= deltaTime;
        if (newDivineShieldDuration <= 0) {
          newDivineShield = 0;
          newDivineShieldDuration = 0;
        }
      }

      if (newTimeWarpDuration > 0) {
        newTimeWarpDuration -= deltaTime;
        if (newTimeWarpDuration <= 0) {
          newTimeWarpScale = 1;
          newTimeWarpDuration = 0;
        }
      }

      let remainingQueue = [...spawnQueue];
      let spawnedCount = enemiesSpawned;
      let waveComplete = false;
      let waveInProgressFlag = waveInProgress;

      if (status === 'playing' && waveInProgress) {
        newWaveTime = waveTime + deltaTime;

        if (spawnQueue.length > 0) {
          const newQueue: typeof spawnQueue = [];
          spawnQueue.forEach((spawn) => {
            if (spawn.spawnTime <= newWaveTime) {
              const config = ENEMY_CONFIGS[spawn.type];
              const startPos = path[0];
              const newEnemy: Enemy = {
                id: generateId(),
                type: spawn.type,
                position: {
                  x: startPos.x * TILE_SIZE + TILE_SIZE / 2,
                  y: startPos.y * TILE_SIZE + TILE_SIZE / 2,
                },
                health: config.health,
                maxHealth: config.health,
                speed: config.speed,
                pathIndex: 0,
                slowEffect: 0,
                slowDuration: 0,
                freezeDuration: 0,
                poisonDamage: 0,
                poisonDuration: 0,
                reward: config.reward,
              };
              newEnemies.push(newEnemy);
              spawnedCount++;
            } else {
              newQueue.push(spawn);
            }
          });
          remainingQueue = newQueue;
        }

        const reachedEnd: string[] = [];
        let shieldDamage = 0;
        newEnemies.forEach((enemy) => {
          const reached = moveEnemyAlongPath(enemy, deltaTime, path);
          if (reached) {
            reachedEnd.push(enemy.id);
            if (newDivineShield > 0) {
              shieldDamage++;
              newDivineShield--;
            } else {
              newLives--;
            }
          }
        });

        if (reachedEnd.length > 0) {
          if (shieldDamage > 0) {
            get().addBattleLog('info', `护盾抵挡了 ${shieldDamage} 点伤害！`);
          }
          if (reachedEnd.length - shieldDamage > 0) {
            get().addBattleLog(
              'warning',
              `${reachedEnd.length - shieldDamage} 个敌人突破了防线！`
            );
          }
        }

        newEnemies = newEnemies.filter((e) => !reachedEnd.includes(e.id));

        const deadEnemies = newEnemies.filter((e) => e.health <= 0);
        deadEnemies.forEach((e) => {
          newGold += e.reward;
          newScore += e.reward * 10;

          const enemyConfig = ENEMY_CONFIGS[e.type];
          newEffects.push({
            id: generateId(),
            type: 'death_explosion',
            position: { ...e.position },
            duration: 0.01,
            maxDuration: 0.01,
            enemyColor: enemyConfig.color,
            enemySize: enemyConfig.size,
          });
        });

        if (deadEnemies.length > 0) {
          const totalReward = deadEnemies.reduce(
            (sum, e) => sum + e.reward,
            0
          );
          get().addBattleLog(
            'kill',
            `消灭了 ${deadEnemies.length} 个敌人（获得 ${totalReward} 金币）`
          );
        }

        newEnemies = newEnemies.filter((e) => e.health > 0);

        newTowers.forEach((tower) => {
          const towerConfig = TOWER_CONFIGS[tower.type];
          const levelConfig = getTowerLevelConfig(tower.type, tower.level);
          const towerPos = getTowerWorldPosition(tower);

          const attackCooldown =
            levelConfig.attackSpeed * (newTimeWarpScale || 1);
          if (newGameTime - tower.lastAttackTime < attackCooldown) return;

          let nearestEnemy: Enemy | null = null;
          let nearestDist = Infinity;

          newEnemies.forEach((enemy) => {
            const enemyPos = getEnemyWorldPosition(enemy);
            const dist = getDistance(towerPos, enemyPos);
            if (dist <= levelConfig.range && dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = enemy;
            }
          });

          if (nearestEnemy) {
            const enemyPos = getEnemyWorldPosition(nearestEnemy);
            const angle = Math.atan2(
              enemyPos.y - towerPos.y,
              enemyPos.x - towerPos.x
            );
            tower.angle = angle;
            tower.lastAttackTime = newGameTime;

            let damage = levelConfig.damage * newTowerBoostMultiplier;
            let isCrit = false;

            if (
              tower.type === 'sniper' &&
              levelConfig.critChance &&
              levelConfig.critMultiplier
            ) {
              if (Math.random() < levelConfig.critChance) {
                damage *= levelConfig.critMultiplier;
                isCrit = true;
              }
            }

            const projectile: Projectile = {
              id: generateId(),
              position: { ...towerPos },
              targetId: nearestEnemy.id,
              speed: towerConfig.projectileSpeed,
              damage,
              type: tower.type,
              splashRadius: levelConfig.splashRadius,
              slowEffect: levelConfig.slowEffect,
              slowDuration: levelConfig.slowDuration,
              chainCount: levelConfig.chainCount,
              chainDamageDecay: levelConfig.chainDamageDecay,
              hitTargets:
                tower.type === 'lightning'
                  ? [nearestEnemy.id]
                  : undefined,
              poisonDamage: levelConfig.poisonDamage,
              poisonDuration: levelConfig.poisonDuration,
              isSniper: isCrit,
            };
            newProjectiles.push(projectile);
          }
        });

        const projectilesToRemove: string[] = [];
        const newChainProjectiles: Projectile[] = [];

        newProjectiles.forEach((proj) => {
          const target = newEnemies.find((e) => e.id === proj.targetId);
          if (!target) {
            projectilesToRemove.push(proj.id);
            return;
          }

          const targetPos = getEnemyWorldPosition(target);
          const dx = targetPos.x - proj.position.x;
          const dy = targetPos.y - proj.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            projectilesToRemove.push(proj.id);

            if (proj.splashRadius) {
              newEnemies.forEach((enemy) => {
                const enemyPos = getEnemyWorldPosition(enemy);
                const splashDist = getDistance(targetPos, enemyPos);
                if (splashDist <= proj.splashRadius!) {
                  enemy.health -=
                    proj.damage *
                    (1 - splashDist / proj.splashRadius! * 0.5);
                }
              });
            } else {
              target.health -= proj.damage;
            }

            if (proj.slowEffect && proj.slowDuration) {
              target.slowEffect = proj.slowEffect;
              target.slowDuration = proj.slowDuration;
            }

            if (proj.poisonDamage && proj.poisonDuration) {
              target.poisonDamage = Math.max(
                target.poisonDamage,
                proj.poisonDamage
              );
              target.poisonDuration = Math.max(
                target.poisonDuration,
                proj.poisonDuration
              );
            }

            if (proj.chainCount && proj.chainCount > 0 && proj.hitTargets) {
              let nextTarget: Enemy | null = null;
              let nextDist = Infinity;
              const chainRange = 150;

              newEnemies.forEach((enemy) => {
                if (proj.hitTargets!.includes(enemy.id)) return;
                const enemyPos = getEnemyWorldPosition(enemy);
                const d = getDistance(targetPos, enemyPos);
                if (d <= chainRange && d < nextDist) {
                  nextDist = d;
                  nextTarget = enemy;
                }
              });

              if (nextTarget) {
                const chainDamage =
                  proj.damage * (proj.chainDamageDecay || 0.7);
                const chainProjectile: Projectile = {
                  id: generateId(),
                  position: { ...targetPos },
                  targetId: nextTarget.id,
                  speed: 800,
                  damage: chainDamage,
                  type: 'lightning',
                  chainCount: proj.chainCount - 1,
                  chainDamageDecay: proj.chainDamageDecay,
                  hitTargets: [...proj.hitTargets, nextTarget.id],
                };
                newChainProjectiles.push(chainProjectile);

                newEffects.push({
                  id: generateId(),
                  type: 'chain_lightning',
                  position: targetPos,
                  duration: 0.2,
                  maxDuration: 0.2,
                  chainTargets: [targetPos, getEnemyWorldPosition(nextTarget)],
                });
              }
            }

            if (proj.isSniper) {
              newEffects.push({
                id: generateId(),
                type: 'sniper',
                position: targetPos,
                duration: 0.4,
                maxDuration: 0.4,
              });
            }
          } else {
            const moveDist = proj.speed * deltaTime;
            const ratio = moveDist / dist;
            proj.position.x += dx * ratio;
            proj.position.y += dy * ratio;
          }
        });

        newProjectiles = newProjectiles.filter(
          (p) => !projectilesToRemove.includes(p.id)
        );
        newProjectiles = [...newProjectiles, ...newChainProjectiles];

        newEnemies.forEach((enemy) => {
          if (enemy.poisonDuration > 0 && enemy.poisonDamage > 0) {
            enemy.health -= enemy.poisonDamage * deltaTime;
            enemy.poisonDuration -= deltaTime;
          }
        });

        waveComplete = remainingQueue.length === 0 && newEnemies.length === 0;

        if (newLives <= 0) {
          newStatus = 'lost';
          get().addBattleLog('warning', '游戏失败！生命值耗尽...');
        } else if (
          waveComplete &&
          wave >= maxWaves &&
          gameMode === 'normal'
        ) {
          newStatus = 'won';
          get().addBattleLog('info', '🎉 恭喜通关！所有波次已清除！');
        } else if (waveComplete) {
          get().addBattleLog('info', `第 ${wave} 波完成！`);
          const rewardCards = get().generateWaveRewardCards();
          newStatus = 'wave_reward';
          set({
            waveRewardCards: rewardCards,
          });
          get().addBattleLog('info', '选择一张卡牌作为奖励！');
        }
      }

      const waveIsNotActive = !waveInProgress && !waveComplete;
      if (newStatus === 'playing' && waveIsNotActive && newIsCountdownActive) {
        newWaveCountdown -= deltaTime;
        if (newWaveCountdown <= 0) {
          get().startWave();
          return;
        }
      }

      newEffects = newEffects
        .map((e) => ({ ...e, duration: e.duration - deltaTime }))
        .filter((e) => e.duration > 0);

      set({
        enemies: newEnemies,
        projectiles: newProjectiles,
        effects: newEffects,
        towers: newTowers,
        mana: newMana,
        lives: newLives,
        gold: newGold,
        score: newScore,
        waveTime: newWaveTime,
        spawnQueue: remainingQueue,
        enemiesSpawned: spawnedCount,
        waveInProgress: waveInProgress && !waveComplete,
        status: newStatus,
        towerBoostDuration: newTowerBoostDuration,
        towerBoostMultiplier: newTowerBoostMultiplier,
        divineShield: newDivineShield,
        divineShieldDuration: newDivineShieldDuration,
        timeWarpDuration: newTimeWarpDuration,
        timeWarpScale: newTimeWarpScale,
        gameTime: newGameTime,
        waveCountdown: newWaveCountdown,
        isCountdownActive: newIsCountdownActive,
      });
    },
  };
}
