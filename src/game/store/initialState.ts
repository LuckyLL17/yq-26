import type { GameState, GameMode, Card, CardType, LevelData } from '../types';
import {
  CARD_CONFIGS,
  WAVE_COUNTDOWN,
  INITIAL_MANA,
  MAX_MANA,
  MAX_HAND_SIZE,
  WAVE_REWARD_CARD_COUNT,
  generateRandomDeck,
  shuffleDeck,
  getWaveConfig,
} from '../config';
import { getDefaultLevel } from '../levelEditor';
import { generateId, resetIdCounter } from './utils';

export function createInitialState(
  level?: LevelData,
  gameMode: GameMode = 'normal'
): GameState {
  resetIdCounter();
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
