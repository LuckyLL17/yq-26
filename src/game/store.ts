import { create } from 'zustand';
import type {
  GameState,
  GameStatus,
  Tower,
  Enemy,
  Projectile,
  Effect,
  Card,
  Position,
  TowerType,
  CardType,
  EnemyType,
} from './types';
import {
  TOWER_CONFIGS,
  CARD_CONFIGS,
  ENEMY_CONFIGS,
  WAVE_CONFIGS,
  PATH,
  BUILDABLE_POSITIONS,
  INITIAL_GOLD,
  INITIAL_MANA,
  MAX_MANA,
  INITIAL_LIVES,
  MAX_HAND_SIZE,
  MANA_REGEN_RATE,
  TILE_SIZE,
  generateRandomDeck,
  shuffleDeck,
} from './config';

let idCounter = 0;
const generateId = () => `id_${++idCounter}`;

function createInitialState(): GameState {
  idCounter = 0;
  const deckCardTypes = generateRandomDeck();
  const deck: Card[] = shuffleDeck(
    deckCardTypes.map((type) => ({
      id: generateId(),
      type: type as CardType,
      name: CARD_CONFIGS[type].name,
      description: CARD_CONFIGS[type].description,
      manaCost: CARD_CONFIGS[type].manaCost,
      icon: CARD_CONFIGS[type].icon,
    }))
  );

  const hand: Card[] = [];
  for (let i = 0; i < MAX_HAND_SIZE && deck.length > 0; i++) {
    hand.push(deck.pop()!);
  }

  return {
    status: 'idle',
    gold: INITIAL_GOLD,
    mana: INITIAL_MANA,
    maxMana: MAX_MANA,
    lives: INITIAL_LIVES,
    wave: 0,
    maxWaves: WAVE_CONFIGS.length,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    deck,
    hand,
    discardPile: [],
    selectedTowerType: null,
    selectedCard: null,
    score: 0,
    waveInProgress: false,
    enemiesSpawned: 0,
    totalEnemiesInWave: 0,
    lastSpawnTime: 0,
    spawnQueue: [],
    towerBoostMultiplier: 1,
    towerBoostDuration: 0,
  };
}

function isBuildable(position: Position, towers: Tower[]): boolean {
  const isOnBuildSpot = BUILDABLE_POSITIONS.some(
    (p) => p.x === position.x && p.y === position.y
  );
  if (!isOnBuildSpot) return false;
  const hasTower = towers.some(
    (t) => t.position.x === position.x && t.position.y === position.y
  );
  return !hasTower;
}

function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getEnemyWorldPosition(enemy: Enemy): Position {
  return {
    x: enemy.position.x,
    y: enemy.position.y,
  };
}

function getTowerWorldPosition(tower: Tower): Position {
  return {
    x: tower.position.x * TILE_SIZE + TILE_SIZE / 2,
    y: tower.position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

function moveEnemyAlongPath(enemy: Enemy, deltaTime: number): boolean {
  if (enemy.freezeDuration > 0) {
    enemy.freezeDuration -= deltaTime;
    return false;
  }

  let currentSpeed = enemy.speed;
  if (enemy.slowDuration > 0) {
    currentSpeed *= 1 - enemy.slowEffect;
    enemy.slowDuration -= deltaTime;
  }

  const targetPathPoint = PATH[enemy.pathIndex + 1];
  if (!targetPathPoint) {
    return true;
  }

  const targetX = targetPathPoint.x * TILE_SIZE + TILE_SIZE / 2;
  const targetY = targetPathPoint.y * TILE_SIZE + TILE_SIZE / 2;
  const currentX = enemy.position.x;
  const currentY = enemy.position.y;

  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) {
    enemy.pathIndex++;
    if (enemy.pathIndex >= PATH.length - 1) {
      return true;
    }
    return false;
  }

  const moveDistance = currentSpeed * deltaTime;
  const ratio = Math.min(moveDistance / distance, 1);

  enemy.position.x += dx * ratio;
  enemy.position.y += dy * ratio;

  return false;
}

interface GameStore extends GameState {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  selectTowerType: (type: TowerType | null) => void;
  buildTower: (gridPosition: Position) => void;
  selectCard: (card: Card | null) => void;
  playCard: (targetPosition?: Position) => void;
  drawCards: (count: number) => void;
  startWave: () => void;
  tick: (deltaTime: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startGame: () => {
    set({ status: 'playing' });
  },

  pauseGame: () => {
    const { status } = get();
    if (status === 'playing') {
      set({ status: 'paused' });
    }
  },

  resumeGame: () => {
    const { status } = get();
    if (status === 'paused') {
      set({ status: 'playing' });
    }
  },

  restartGame: () => {
    set(createInitialState());
  },

  selectTowerType: (type) => {
    set({ selectedTowerType: type, selectedCard: null });
  },

  buildTower: (gridPosition) => {
    const state = get();
    const { selectedTowerType, gold, towers } = state;

    if (!selectedTowerType) return;
    if (!isBuildable(gridPosition, towers)) return;

    const config = TOWER_CONFIGS[selectedTowerType];
    if (gold < config.cost) return;

    const newTower: Tower = {
      id: generateId(),
      type: selectedTowerType,
      position: gridPosition,
      level: 1,
      lastAttackTime: 0,
      angle: 0,
    };

    const newEffect: Effect = {
      id: generateId(),
      type: 'build',
      position: {
        x: gridPosition.x * TILE_SIZE + TILE_SIZE / 2,
        y: gridPosition.y * TILE_SIZE + TILE_SIZE / 2,
      },
      duration: 0.5,
      maxDuration: 0.5,
      radius: TILE_SIZE,
    };

    set({
      towers: [...towers, newTower],
      gold: gold - config.cost,
      selectedTowerType: null,
      effects: [...state.effects, newEffect],
    });
  },

  selectCard: (card) => {
    const { selectedCard, mana } = get();
    if (card && card.manaCost > mana) return;
    set({ selectedCard: selectedCard?.id === card?.id ? null : card, selectedTowerType: null });
  },

  playCard: (targetPosition) => {
    const state = get();
    const { selectedCard, hand, discardPile, mana, effects, enemies, gold, lives, towerBoostMultiplier, towerBoostDuration } = state;

    if (!selectedCard) return;
    if (mana < selectedCard.manaCost) return;

    const config = CARD_CONFIGS[selectedCard.type];
    const newEffects = [...effects];
    let newEnemies = [...enemies];
    let newGold = gold;
    let newLives = lives;
    let newTowerBoostMultiplier = towerBoostMultiplier;
    let newTowerBoostDuration = towerBoostDuration;

    switch (selectedCard.type) {
      case 'fireball':
        if (targetPosition) {
          newEffects.push({
            id: generateId(),
            type: 'explosion',
            position: targetPosition,
            duration: 0.6,
            maxDuration: 0.6,
            radius: config.radius,
          });
          newEnemies = newEnemies.map((enemy) => {
            const enemyWorldPos = getEnemyWorldPosition(enemy);
            const dist = getDistance(enemyWorldPos, targetPosition);
            if (dist <= (config.radius || 0)) {
              return { ...enemy, health: enemy.health - (config.damage || 0) };
            }
            return enemy;
          });
        }
        break;

      case 'freeze':
        if (targetPosition) {
          newEffects.push({
            id: generateId(),
            type: 'freeze',
            position: targetPosition,
            duration: 1,
            maxDuration: 1,
            radius: config.radius,
          });
          newEnemies = newEnemies.map((enemy) => {
            const enemyWorldPos = getEnemyWorldPosition(enemy);
            const dist = getDistance(enemyWorldPos, targetPosition);
            if (dist <= (config.radius || 0)) {
              return { ...enemy, freezeDuration: config.duration || 3 };
            }
            return enemy;
          });
        }
        break;

      case 'lightning': {
        const damage = config.damage || 50;
        const targetCount = 3;
        const sortedEnemies = [...newEnemies].sort((a, b) => b.health - a.health);
        const targets = sortedEnemies.slice(0, targetCount);
        const targetIds = new Set(targets.map((t) => t.id));

        targets.forEach((target) => {
          newEffects.push({
            id: generateId(),
            type: 'lightning',
            position: getEnemyWorldPosition(target),
            duration: 0.3,
            maxDuration: 0.3,
          });
        });

        newEnemies = newEnemies.map((enemy) => {
          if (targetIds.has(enemy.id)) {
            return { ...enemy, health: enemy.health - damage };
          }
          return enemy;
        });
        break;
      }

      case 'heal':
        newLives = Math.min(INITIAL_LIVES, lives + (config.healAmount || 5));
        newEffects.push({
          id: generateId(),
          type: 'heal',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 100,
        });
        break;

      case 'gold_rain':
        newGold = gold + (config.goldAmount || 100);
        newEffects.push({
          id: generateId(),
          type: 'gold',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 80,
        });
        break;

      case 'tower_boost':
        newTowerBoostMultiplier = config.boostMultiplier || 1.5;
        newTowerBoostDuration = config.duration || 10;
        newEffects.push({
          id: generateId(),
          type: 'tower_boost',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 200,
        });
        break;
    }

    const newHand = hand.filter((c) => c.id !== selectedCard.id);
    const newDiscardPile = [...discardPile, selectedCard];

    set({
      hand: newHand,
      discardPile: newDiscardPile,
      mana: mana - selectedCard.manaCost,
      selectedCard: null,
      effects: newEffects,
      enemies: newEnemies,
      gold: newGold,
      lives: newLives,
      towerBoostMultiplier: newTowerBoostMultiplier,
      towerBoostDuration: newTowerBoostDuration,
    });
  },

  drawCards: (count) => {
    const state = get();
    let { deck, hand, discardPile } = state;

    for (let i = 0; i < count; i++) {
      if (hand.length >= MAX_HAND_SIZE) break;

      if (deck.length === 0) {
        if (discardPile.length === 0) break;
        deck = shuffleDeck([...discardPile]);
        discardPile = [];
      }

      const card = deck[deck.length - 1];
      deck = deck.slice(0, -1);
      hand = [...hand, card];
    }

    set({ deck, hand, discardPile });
  },

  startWave: () => {
    const state = get();
    const { wave, waveInProgress, maxWaves, status } = state;

    if (waveInProgress || status !== 'playing') return;
    if (wave >= maxWaves) return;

    const waveConfig = WAVE_CONFIGS[wave];
    const spawnQueue: { type: EnemyType; spawnTime: number }[] = [];
    let totalTime = 0;

    waveConfig.enemies.forEach((enemyGroup) => {
      for (let i = 0; i < enemyGroup.count; i++) {
        spawnQueue.push({
          type: enemyGroup.type,
          spawnTime: totalTime,
        });
        totalTime += enemyGroup.interval;
      }
    });

    const totalEnemies = spawnQueue.length;

    set({
      wave: wave + 1,
      waveInProgress: true,
      spawnQueue,
      enemiesSpawned: 0,
      totalEnemiesInWave: totalEnemies,
      lastSpawnTime: 0,
    });

    get().drawCards(2);
  },

  tick: (deltaTime) => {
    const state = get();
    const { status, waveInProgress, enemies, towers, projectiles, effects, mana, maxMana, lives, score, wave, maxWaves, spawnQueue, lastSpawnTime, enemiesSpawned, towerBoostDuration, towerBoostMultiplier } = state;

    if (status !== 'playing') return;

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

    if (towerBoostDuration > 0) {
      newTowerBoostDuration -= deltaTime;
      if (newTowerBoostDuration <= 0) {
        newTowerBoostMultiplier = 1;
        newTowerBoostDuration = 0;
      }
    }

    let remainingQueue = [...spawnQueue];
    let spawnedCount = enemiesSpawned;
    let newLastSpawnTime = lastSpawnTime;

    if (waveInProgress && spawnQueue.length > 0) {
      newLastSpawnTime = lastSpawnTime + deltaTime;

      const newQueue: typeof spawnQueue = [];
      spawnQueue.forEach((spawn) => {
        if (spawn.spawnTime <= newLastSpawnTime) {
          const config = ENEMY_CONFIGS[spawn.type];
          const startPos = PATH[0];
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
            reward: config.reward,
          };
          newEnemies.push(newEnemy);
          spawnedCount++;
        } else {
          newQueue.push({ ...spawn, spawnTime: spawn.spawnTime - newLastSpawnTime });
        }
      });
      remainingQueue = newQueue;
    }

    if (waveInProgress) {
      const reachedEnd: string[] = [];
      newEnemies.forEach((enemy) => {
        const reached = moveEnemyAlongPath(enemy, deltaTime);
        if (reached) {
          reachedEnd.push(enemy.id);
          newLives--;
        }
      });

      newEnemies = newEnemies.filter((e) => !reachedEnd.includes(e.id));

      const deadEnemies = newEnemies.filter((e) => e.health <= 0);
      deadEnemies.forEach((e) => {
        newGold += e.reward;
        newScore += e.reward * 10;
      });
      newEnemies = newEnemies.filter((e) => e.health > 0);

      const waveComplete = remainingQueue.length === 0 && newEnemies.length === 0;

      newTowers.forEach((tower) => {
        const towerConfig = TOWER_CONFIGS[tower.type];
        const towerPos = getTowerWorldPosition(tower);

        if (tower.lastAttackTime + towerConfig.attackSpeed > lastSpawnTime + deltaTime) return;

        let nearestEnemy: Enemy | null = null;
        let nearestDist = Infinity;

        newEnemies.forEach((enemy) => {
          const enemyPos = getEnemyWorldPosition(enemy);
          const dist = getDistance(towerPos, enemyPos);
          if (dist <= towerConfig.range && dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        });

        if (nearestEnemy) {
          const enemyPos = getEnemyWorldPosition(nearestEnemy);
          const angle = Math.atan2(enemyPos.y - towerPos.y, enemyPos.x - towerPos.x);
          tower.angle = angle;
          tower.lastAttackTime = lastSpawnTime + deltaTime;

          const projectile: Projectile = {
            id: generateId(),
            position: { ...towerPos },
            targetId: nearestEnemy.id,
            speed: towerConfig.projectileSpeed,
            damage: towerConfig.damage * newTowerBoostMultiplier,
            type: tower.type,
            splashRadius: towerConfig.splashRadius,
            slowEffect: towerConfig.slowEffect,
            slowDuration: towerConfig.slowDuration,
          };
          newProjectiles.push(projectile);
        }
      });

      const projectilesToRemove: string[] = [];
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
                enemy.health -= proj.damage * (1 - splashDist / proj.splashRadius! * 0.5);
              }
            });
          } else {
            target.health -= proj.damage;
          }

          if (proj.slowEffect && proj.slowDuration) {
            target.slowEffect = proj.slowEffect;
            target.slowDuration = proj.slowDuration;
          }
        } else {
          const moveDist = proj.speed * deltaTime;
          const ratio = moveDist / dist;
          proj.position.x += dx * ratio;
          proj.position.y += dy * ratio;
        }
      });

      newProjectiles = newProjectiles.filter((p) => !projectilesToRemove.includes(p.id));

      let newStatus: GameStatus = status;
      if (newLives <= 0) {
        newStatus = 'lost';
      } else if (waveComplete && wave >= maxWaves) {
        newStatus = 'won';
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
        lastSpawnTime: newLastSpawnTime,
        spawnQueue: remainingQueue,
        enemiesSpawned: spawnedCount,
        waveInProgress: !waveComplete,
        status: newStatus,
        towerBoostDuration: newTowerBoostDuration,
        towerBoostMultiplier: newTowerBoostMultiplier,
      });
    } else {
      newEffects = newEffects
        .map((e) => ({ ...e, duration: e.duration - deltaTime }))
        .filter((e) => e.duration > 0);

      set({
        effects: newEffects,
        mana: newMana,
        lives: newLives,
        gold: newGold,
        score: newScore,
        towerBoostDuration: newTowerBoostDuration,
        towerBoostMultiplier: newTowerBoostMultiplier,
      });
    }
  },
}));
