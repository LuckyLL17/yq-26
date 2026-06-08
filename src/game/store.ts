import { create } from 'zustand';
import type {
  GameState,
  GameStatus,
  GameMode,
  Tower,
  Enemy,
  Projectile,
  Effect,
  Card,
  Position,
  TowerType,
  CardType,
  EnemyType,
  BattleLogType,
  BattleLogEntry,
  LevelData,
  WaveConfig,
} from './types';
import {
  TOWER_CONFIGS,
  CARD_CONFIGS,
  ENEMY_CONFIGS,
  WAVE_CONFIGS,
  RARITY_WEIGHTS,
  PATH,
  BUILDABLE_POSITIONS,
  INITIAL_GOLD,
  INITIAL_MANA,
  MAX_MANA,
  INITIAL_LIVES,
  MAX_HAND_SIZE,
  MANA_REGEN_RATE,
  TILE_SIZE,
  MAX_BATTLE_LOGS,
  WAVE_COUNTDOWN,
  WAVE_REWARD_CARD_COUNT,
  generateRandomDeck,
  shuffleDeck,
  getTowerLevelConfig,
  getWaveConfig,
} from './config';
import { getDefaultLevel } from './levelEditor';

let idCounter = 0;
const generateId = () => `id_${++idCounter}`;

function createInitialState(level?: LevelData, gameMode: GameMode = 'normal'): GameState {
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
      rarity: CARD_CONFIGS[type].rarity,
    }))
  );

  const hand: Card[] = [];
  for (let i = 0; i < MAX_HAND_SIZE && deck.length > 0; i++) {
    hand.push(deck.pop()!);
  }

  const currentLevel = level || getDefaultLevel();
  const maxWaves = gameMode === 'endless' ? 999 : currentLevel.waves.length;
  const nextWaveConfig = getWaveConfig(1, gameMode, currentLevel.waves);

  return {
    status: 'idle',
    gameMode,
    gold: currentLevel.initialGold,
    mana: INITIAL_MANA,
    maxMana: MAX_MANA,
    lives: currentLevel.initialLives,
    wave: 0,
    maxWaves,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    deck,
    hand,
    discardPile: [],
    selectedTowerType: null,
    selectedTowerId: null,
    selectedCard: null,
    score: 0,
    waveInProgress: false,
    enemiesSpawned: 0,
    totalEnemiesInWave: 0,
    waveTime: 0,
    spawnQueue: [],
    towerBoostMultiplier: 1,
    towerBoostDuration: 0,
    divineShield: 0,
    divineShieldDuration: 0,
    timeWarpDuration: 0,
    timeWarpScale: 1,
    gameTime: 0,
    battleLogs: [],
    currentLevelId: currentLevel.id,
    waveCountdown: WAVE_COUNTDOWN,
    isCountdownActive: false,
    nextWaveConfig,
    waveRewardCards: [],
    autoStartWave: false,
  };
}

function isBuildable(position: Position, towers: Tower[], buildablePositions: Position[]): boolean {
  const isOnBuildSpot = buildablePositions.some(
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

function moveEnemyAlongPath(enemy: Enemy, deltaTime: number, path: Position[]): boolean {
  if (enemy.freezeDuration > 0) {
    enemy.freezeDuration -= deltaTime;
    return false;
  }

  let currentSpeed = enemy.speed;
  if (enemy.slowDuration > 0) {
    currentSpeed *= 1 - enemy.slowEffect;
    enemy.slowDuration -= deltaTime;
  }

  const targetPathPoint = path[enemy.pathIndex + 1];
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
    if (enemy.pathIndex >= path.length - 1) {
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
  currentLevelId: string;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  selectTowerType: (type: TowerType | null) => void;
  selectTower: (towerId: string | null) => void;
  buildTower: (gridPosition: Position) => void;
  upgradeTower: (towerId: string) => void;
  sellTower: (towerId: string) => void;
  selectCard: (card: Card | null) => void;
  playCard: (targetPosition?: Position) => void;
  drawCards: (count: number) => void;
  startWave: () => void;
  tick: (deltaTime: number) => void;
  addBattleLog: (type: BattleLogType, message: string) => void;
  setLevel: (level: LevelData) => void;
  setGameMode: (mode: GameMode) => void;
  toggleAutoStart: () => void;
  skipCountdown: () => void;
  collectWaveReward: (cardId: string) => void;
  skipWaveReward: () => void;
  getPath: () => Position[];
  getBuildablePositions: () => Position[];
  getWaves: () => { enemies: { type: EnemyType; count: number; interval: number }[] }[];
  getInitialLives: () => number;
  generateWaveRewardCards: () => Card[];
}

const CUSTOM_LEVELS_KEY = 'td_custom_levels';

export function loadLevelFromStorage(levelId: string): LevelData | null {
  try {
    const stored = localStorage.getItem(CUSTOM_LEVELS_KEY);
    if (stored) {
      const levels: LevelData[] = JSON.parse(stored);
      return levels.find((l) => l.id === levelId) || null;
    }
  } catch (e) {
    console.error('Failed to load level from storage:', e);
  }
  return null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  currentLevelId: 'default',

  startGame: () => {
    const { autoStartWave } = get();
    set({ 
      status: 'playing',
      isCountdownActive: autoStartWave,
    });
    if (autoStartWave) {
      get().addBattleLog('info', '自动开始倒计时...');
    }
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
    const levelId = get().currentLevelId;
    const gameMode = get().gameMode;
    let level: LevelData | undefined;
    
    if (levelId === 'default') {
      level = getDefaultLevel();
    } else {
      const storedLevel = loadLevelFromStorage(levelId);
      if (storedLevel) {
        level = storedLevel;
      } else {
        level = getDefaultLevel();
      }
    }
    
    set(createInitialState(level, gameMode));
  },

  setGameMode: (mode) => {
    const state = get();
    if (state.status !== 'idle') return;
    
    const levelId = state.currentLevelId;
    let level: LevelData | undefined;
    
    if (levelId === 'default') {
      level = getDefaultLevel();
    } else {
      const storedLevel = loadLevelFromStorage(levelId);
      if (storedLevel) {
        level = storedLevel;
      } else {
        level = getDefaultLevel();
      }
    }
    
    set(createInitialState(level, mode));
  },

  toggleAutoStart: () => {
    set({ autoStartWave: !get().autoStartWave });
  },

  selectTowerType: (type) => {
    set({ selectedTowerType: type, selectedCard: null, selectedTowerId: null });
  },

  selectTower: (towerId) => {
    set({ selectedTowerId: towerId, selectedTowerType: null, selectedCard: null });
  },

  buildTower: (gridPosition) => {
    const state = get();
    const { selectedTowerType, gold, towers, effects } = state;
    const buildablePositions = get().getBuildablePositions();

    if (!selectedTowerType) return;
    if (!isBuildable(gridPosition, towers, buildablePositions)) return;

    const config = TOWER_CONFIGS[selectedTowerType];
    const levelConfig = config.levels[0];
    if (gold < levelConfig.cost) return;

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
      gold: gold - levelConfig.cost,
      selectedTowerType: null,
      effects: [...effects, newEffect],
    });

    get().addBattleLog('build', `建造了 ${config.name}（花费 ${levelConfig.cost} 金币）`);
  },

  upgradeTower: (towerId) => {
    const state = get();
    const { towers, gold, effects } = state;

    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;

    const config = TOWER_CONFIGS[tower.type];
    if (tower.level >= config.maxLevel) return;

    const nextLevelConfig = config.levels[tower.level];
    if (gold < nextLevelConfig.cost) return;

    const upgradedTowers = towers.map((t) =>
      t.id === towerId ? { ...t, level: t.level + 1 } : t
    );

    const towerPos = {
      x: tower.position.x * TILE_SIZE + TILE_SIZE / 2,
      y: tower.position.y * TILE_SIZE + TILE_SIZE / 2,
    };

    const newEffects: Effect[] = [
      ...effects,
      {
        id: generateId(),
        type: 'upgrade',
        position: towerPos,
        duration: 0.8,
        maxDuration: 0.8,
        radius: TILE_SIZE * 1.5,
        towerId,
      },
      {
        id: generateId(),
        type: 'level_up',
        position: towerPos,
        duration: 1.2,
        maxDuration: 1.2,
        towerId,
      },
    ];

    set({
      towers: upgradedTowers,
      gold: gold - nextLevelConfig.cost,
      effects: newEffects,
    });

    get().addBattleLog('upgrade', `${config.name} 升级到 ${tower.level + 1} 级（花费 ${nextLevelConfig.cost} 金币）`);
  },

  sellTower: (towerId) => {
    const state = get();
    const { towers, gold } = state;

    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;

    const config = TOWER_CONFIGS[tower.type];
    let totalCost = 0;
    for (let i = 0; i < tower.level; i++) {
      totalCost += config.levels[i].cost;
    }
    const sellValue = Math.floor(totalCost * 0.7);

    const remainingTowers = towers.filter((t) => t.id !== towerId);

    set({
      towers: remainingTowers,
      gold: gold + sellValue,
      selectedTowerId: null,
    });

    get().addBattleLog('sell', `出售了 ${config.name}（获得 ${sellValue} 金币）`);
  },

  selectCard: (card) => {
    const { selectedCard, mana } = get();
    if (card && card.manaCost > mana) return;
    set({ selectedCard: selectedCard?.id === card?.id ? null : card, selectedTowerType: null, selectedTowerId: null });
  },

  playCard: (targetPosition) => {
    const state = get();
    const { selectedCard, hand, discardPile, mana, effects, enemies, gold, lives, towerBoostMultiplier, towerBoostDuration, divineShield, divineShieldDuration, timeWarpDuration, timeWarpScale, maxMana } = state;

    if (!selectedCard) return;
    if (mana < selectedCard.manaCost) return;

    const config = CARD_CONFIGS[selectedCard.type];
    const newEffects = [...effects];
    let newEnemies = [...enemies];
    let newGold = gold;
    let newLives = lives;
    let newMana = mana;
    let newTowerBoostMultiplier = towerBoostMultiplier;
    let newTowerBoostDuration = towerBoostDuration;
    let newDivineShield = divineShield;
    let newDivineShieldDuration = divineShieldDuration;
    let newTimeWarpDuration = timeWarpDuration;
    let newTimeWarpScale = timeWarpScale;
    const initialLives = get().getInitialLives();

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
        newLives = Math.min(initialLives, lives + (config.healAmount || 5));
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

      case 'meteor':
        if (targetPosition) {
          newEffects.push({
            id: generateId(),
            type: 'meteor',
            position: targetPosition,
            duration: 1.2,
            maxDuration: 1.2,
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

      case 'summon':
        newEnemies = newEnemies.map((enemy) => {
          return { ...enemy, health: enemy.health - (config.summonDamage || 30) * (config.summonCount || 3) };
        });
        newEffects.push({
          id: generateId(),
          type: 'summon',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 150,
        });
        break;

      case 'mana_surge':
        newMana = Math.min(maxMana, mana + (config.manaAmount || 50));
        newEffects.push({
          id: generateId(),
          type: 'mana_surge',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 100,
        });
        break;

      case 'time_warp':
        newTimeWarpScale = config.timeScale || 0.5;
        newTimeWarpDuration = config.duration || 8;
        newEffects.push({
          id: generateId(),
          type: 'time_warp',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1,
          maxDuration: 1,
          radius: 200,
        });
        break;

      case 'divine_shield':
        newDivineShield = (newDivineShield || 0) + (config.shieldAmount || 10);
        newDivineShieldDuration = Math.max(newDivineShieldDuration, config.duration || 30);
        newEffects.push({
          id: generateId(),
          type: 'divine_shield',
          position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
          duration: 1.5,
          maxDuration: 1.5,
          radius: 120,
        });
        break;
    }

    const newHand = hand.filter((c) => c.id !== selectedCard.id);
    const newDiscardPile = [...discardPile, selectedCard];

    set({
      hand: newHand,
      discardPile: newDiscardPile,
      mana: newMana - selectedCard.manaCost,
      selectedCard: null,
      effects: newEffects,
      enemies: newEnemies,
      gold: newGold,
      lives: newLives,
      towerBoostMultiplier: newTowerBoostMultiplier,
      towerBoostDuration: newTowerBoostDuration,
      divineShield: newDivineShield,
      divineShieldDuration: newDivineShieldDuration,
      timeWarpDuration: newTimeWarpDuration,
      timeWarpScale: newTimeWarpScale,
    });

    get().addBattleLog('card', `使用了 ${selectedCard.name}`);
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

  generateWaveRewardCards: () => {
    const state = get();
    const wave = state.wave;
    
    const rewardCards: Card[] = [];
    const cardCount = WAVE_REWARD_CARD_COUNT;
    
    const rarityBonus = Math.floor(wave / 5) * 0.05;
    const adjustedWeights = {
      common: Math.max(20, RARITY_WEIGHTS.common - rarityBonus * 50),
      rare: RARITY_WEIGHTS.rare + rarityBonus * 20,
      epic: RARITY_WEIGHTS.epic + rarityBonus * 20,
      legendary: RARITY_WEIGHTS.legendary + rarityBonus * 10,
    };
    
    const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
    
    const rarityCards: Record<string, string[]> = {};
    Object.entries(CARD_CONFIGS).forEach(([type, config]) => {
      if (!rarityCards[config.rarity]) {
        rarityCards[config.rarity] = [];
      }
      rarityCards[config.rarity].push(type);
    });
    
    for (let i = 0; i < cardCount; i++) {
      const roll = Math.random() * totalWeight;
      let cumulative = 0;
      let selectedRarity = 'common';
      
      for (const [rarity, weight] of Object.entries(adjustedWeights)) {
        cumulative += weight;
        if (roll <= cumulative) {
          selectedRarity = rarity;
          break;
        }
      }
      
      const cardsOfRarity = rarityCards[selectedRarity] || rarityCards['common'];
      const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
      const cardType = cardsOfRarity[randomIndex];
      const config = CARD_CONFIGS[cardType];
      
      rewardCards.push({
        id: generateId(),
        type: cardType as CardType,
        name: config.name,
        description: config.description,
        manaCost: config.manaCost,
        icon: config.icon,
        rarity: config.rarity,
      });
    }
    
    return rewardCards;
  },

  startWave: () => {
    const state = get();
    const { wave, waveInProgress, maxWaves, status, gameMode, isCountdownActive } = state;

    if (waveInProgress || status !== 'playing') return;
    if (wave >= maxWaves) return;

    const waves = get().getWaves();
    const waveConfig = getWaveConfig(wave + 1, gameMode, waves);
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
    const nextWave = wave + 2;
    let nextWaveConfig: WaveConfig | null = null;
    if (nextWave <= maxWaves || gameMode === 'endless') {
      nextWaveConfig = getWaveConfig(nextWave, gameMode, waves);
    }

    set({
      wave: wave + 1,
      waveInProgress: true,
      spawnQueue,
      enemiesSpawned: 0,
      totalEnemiesInWave: totalEnemies,
      waveTime: 0,
      isCountdownActive: false,
      waveCountdown: WAVE_COUNTDOWN,
      nextWaveConfig,
    });

    get().drawCards(2);
    get().addBattleLog('wave', `第 ${wave + 1} 波敌人来袭！`);
  },

  skipCountdown: () => {
    const state = get();
    if (!state.isCountdownActive || state.status !== 'playing') return;
    get().startWave();
  },

  collectWaveReward: (cardId) => {
    const state = get();
    if (state.status !== 'wave_reward') return;
    
    const card = state.waveRewardCards.find(c => c.id === cardId);
    if (!card) return;
    
    let newDeck = [...state.deck, card];
    newDeck = shuffleDeck(newDeck);
    
    const remainingCards = state.waveRewardCards.filter(c => c.id !== cardId);
    const newDiscardPile = [...state.discardPile, ...remainingCards];
    
    const nextWaveNum = state.wave + 1;
    const waves = get().getWaves();
    let nextWaveConfig: WaveConfig | null = null;
    if (nextWaveNum <= state.maxWaves || state.gameMode === 'endless') {
      nextWaveConfig = getWaveConfig(nextWaveNum, state.gameMode, waves);
    }
    
    set({
      status: 'playing',
      waveRewardCards: [],
      deck: newDeck,
      discardPile: newDiscardPile,
      isCountdownActive: state.autoStartWave,
      waveCountdown: WAVE_COUNTDOWN,
      nextWaveConfig,
    });
    
    get().addBattleLog('card', `获得了 ${card.name}！`);
    
    if (state.autoStartWave) {
      get().addBattleLog('info', '自动开始下一波倒计时...');
    }
  },

  skipWaveReward: () => {
    const state = get();
    if (state.status !== 'wave_reward') return;
    
    const newDiscardPile = [...state.discardPile, ...state.waveRewardCards];
    
    const nextWaveNum = state.wave + 1;
    const waves = get().getWaves();
    let nextWaveConfig: WaveConfig | null = null;
    if (nextWaveNum <= state.maxWaves || state.gameMode === 'endless') {
      nextWaveConfig = getWaveConfig(nextWaveNum, state.gameMode, waves);
    }
    
    set({
      status: 'playing',
      waveRewardCards: [],
      discardPile: newDiscardPile,
      isCountdownActive: state.autoStartWave,
      waveCountdown: WAVE_COUNTDOWN,
      nextWaveConfig,
    });
    
    if (state.autoStartWave) {
      get().addBattleLog('info', '自动开始下一波倒计时...');
    }
  },

  tick: (deltaTime) => {
    const state = get();
    const { status, waveInProgress, enemies, towers, projectiles, effects, mana, maxMana, lives, score, wave, maxWaves, spawnQueue, waveTime, enemiesSpawned, towerBoostDuration, towerBoostMultiplier, divineShield, divineShieldDuration, timeWarpDuration, timeWarpScale, gameTime, isCountdownActive, waveCountdown, gameMode, autoStartWave } = state;
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
          get().addBattleLog('warning', `${reachedEnd.length - shieldDamage} 个敌人突破了防线！`);
        }
      }

      newEnemies = newEnemies.filter((e) => !reachedEnd.includes(e.id));

      const deadEnemies = newEnemies.filter((e) => e.health <= 0);
      deadEnemies.forEach((e) => {
        newGold += e.reward;
        newScore += e.reward * 10;
      });

      if (deadEnemies.length > 0) {
        const totalReward = deadEnemies.reduce((sum, e) => sum + e.reward, 0);
        get().addBattleLog('kill', `消灭了 ${deadEnemies.length} 个敌人（获得 ${totalReward} 金币）`);
      }

      newEnemies = newEnemies.filter((e) => e.health > 0);

      newTowers.forEach((tower) => {
        const towerConfig = TOWER_CONFIGS[tower.type];
        const levelConfig = getTowerLevelConfig(tower.type, tower.level);
        const towerPos = getTowerWorldPosition(tower);

        const attackCooldown = levelConfig.attackSpeed * (newTimeWarpScale || 1);
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
          const angle = Math.atan2(enemyPos.y - towerPos.y, enemyPos.x - towerPos.x);
          tower.angle = angle;
          tower.lastAttackTime = newGameTime;

          let damage = levelConfig.damage * newTowerBoostMultiplier;
          let isCrit = false;

          if (tower.type === 'sniper' && levelConfig.critChance && levelConfig.critMultiplier) {
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
            hitTargets: tower.type === 'lightning' ? [nearestEnemy.id] : undefined,
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

          if (proj.poisonDamage && proj.poisonDuration) {
            target.poisonDamage = Math.max(target.poisonDamage, proj.poisonDamage);
            target.poisonDuration = Math.max(target.poisonDuration, proj.poisonDuration);
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
              const chainDamage = proj.damage * (proj.chainDamageDecay || 0.7);
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

      newProjectiles = newProjectiles.filter((p) => !projectilesToRemove.includes(p.id));
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
      } else if (waveComplete && wave >= maxWaves && gameMode === 'normal') {
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

  addBattleLog: (type, message) => {
    const { battleLogs, gameTime } = get();
    const newLog: BattleLogEntry = {
      id: generateId(),
      type,
      message,
      timestamp: gameTime,
    };
    const newLogs = [newLog, ...battleLogs].slice(0, MAX_BATTLE_LOGS);
    set({ battleLogs: newLogs });
  },

  setLevel: (level) => {
    const gameMode = get().gameMode;
    set(createInitialState(level, gameMode));
  },

  getPath: () => {
    const state = get();
    if (state.currentLevelId === 'default') {
      return PATH;
    }
    const level = loadLevelFromStorage(state.currentLevelId);
    return level?.path || PATH;
  },

  getBuildablePositions: () => {
    const state = get();
    if (state.currentLevelId === 'default') {
      return BUILDABLE_POSITIONS;
    }
    const level = loadLevelFromStorage(state.currentLevelId);
    return level?.buildablePositions || BUILDABLE_POSITIONS;
  },

  getWaves: () => {
    const state = get();
    if (state.currentLevelId === 'default') {
      return WAVE_CONFIGS;
    }
    const level = loadLevelFromStorage(state.currentLevelId);
    return level?.waves || WAVE_CONFIGS;
  },

  getInitialLives: () => {
    const state = get();
    if (state.currentLevelId === 'default') {
      return INITIAL_LIVES;
    }
    const level = loadLevelFromStorage(state.currentLevelId);
    return level?.initialLives || INITIAL_LIVES;
  },
}));
