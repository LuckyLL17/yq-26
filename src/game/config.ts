import type { TowerConfig, CardConfig, EnemyConfig, WaveConfig, Position } from './types';

export const TILE_SIZE = 50;
export const MAP_WIDTH = 16;
export const MAP_HEIGHT = 10;

export const INITIAL_GOLD = 200;
export const INITIAL_MANA = 50;
export const MAX_MANA = 100;
export const INITIAL_LIVES = 20;
export const MAX_HAND_SIZE = 5;
export const MANA_REGEN_RATE = 2;
export const MAX_BATTLE_LOGS = 50;

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  arrow: {
    name: '箭塔',
    maxLevel: 3,
    color: '#8B4513',
    projectileColor: '#D2691E',
    projectileSpeed: 400,
    icon: '🏹',
    description: '攻速快，单体攻击',
    levels: [
      { damage: 15, attackSpeed: 0.8, range: 120, cost: 50 },
      { damage: 25, attackSpeed: 0.65, range: 140, cost: 75 },
      { damage: 40, attackSpeed: 0.5, range: 160, cost: 120 },
    ],
  },
  mage: {
    name: '法师塔',
    maxLevel: 3,
    color: '#7c3aed',
    projectileColor: '#a78bfa',
    projectileSpeed: 300,
    icon: '🔮',
    description: '高伤害，范围攻击',
    levels: [
      { damage: 35, attackSpeed: 1.5, range: 150, cost: 100, splashRadius: 40 },
      { damage: 55, attackSpeed: 1.2, range: 170, cost: 150, splashRadius: 55 },
      { damage: 85, attackSpeed: 1.0, range: 200, cost: 220, splashRadius: 70 },
    ],
  },
  ice: {
    name: '冰冻塔',
    maxLevel: 3,
    color: '#00d9ff',
    projectileColor: '#7dd3fc',
    projectileSpeed: 350,
    icon: '❄️',
    description: '减速敌人移动速度',
    levels: [
      { damage: 8, attackSpeed: 1.0, range: 100, cost: 75, slowEffect: 0.5, slowDuration: 2 },
      { damage: 14, attackSpeed: 0.85, range: 120, cost: 100, slowEffect: 0.6, slowDuration: 2.5 },
      { damage: 22, attackSpeed: 0.7, range: 140, cost: 160, slowEffect: 0.7, slowDuration: 3 },
    ],
  },
  lightning: {
    name: '闪电塔',
    maxLevel: 3,
    color: '#fbbf24',
    projectileColor: '#fef08a',
    projectileSpeed: 600,
    icon: '⚡',
    description: '闪电连锁，攻击多个敌人',
    levels: [
      { damage: 20, attackSpeed: 1.2, range: 130, cost: 120, chainCount: 2, chainDamageDecay: 0.7 },
      { damage: 32, attackSpeed: 1.0, range: 150, cost: 180, chainCount: 3, chainDamageDecay: 0.75 },
      { damage: 50, attackSpeed: 0.8, range: 180, cost: 260, chainCount: 4, chainDamageDecay: 0.8 },
    ],
  },
  poison: {
    name: '剧毒塔',
    maxLevel: 3,
    color: '#22c55e',
    projectileColor: '#86efac',
    projectileSpeed: 280,
    icon: '☠️',
    description: '造成持续毒素伤害',
    levels: [
      { damage: 10, attackSpeed: 1.3, range: 110, cost: 90, poisonDamage: 8, poisonDuration: 4 },
      { damage: 16, attackSpeed: 1.1, range: 130, cost: 140, poisonDamage: 15, poisonDuration: 5 },
      { damage: 25, attackSpeed: 0.9, range: 150, cost: 210, poisonDamage: 25, poisonDuration: 6 },
    ],
  },
  sniper: {
    name: '狙击塔',
    maxLevel: 3,
    color: '#dc2626',
    projectileColor: '#fca5a5',
    projectileSpeed: 800,
    icon: '🎯',
    description: '超远射程，高暴击',
    levels: [
      { damage: 60, attackSpeed: 2.0, range: 250, cost: 150, critChance: 0.2, critMultiplier: 2.0 },
      { damage: 95, attackSpeed: 1.7, range: 280, cost: 220, critChance: 0.3, critMultiplier: 2.5 },
      { damage: 150, attackSpeed: 1.4, range: 320, cost: 320, critChance: 0.4, critMultiplier: 3.0 },
    ],
  },
};

export const CARD_CONFIGS: Record<string, CardConfig> = {
  fireball: {
    name: '火球术',
    description: '对目标区域造成大量伤害',
    manaCost: 30,
    icon: '🔥',
    rarity: 'common',
    damage: 80,
    radius: 60,
  },
  freeze: {
    name: '冰冻术',
    description: '冻结范围内敌人3秒',
    manaCost: 25,
    icon: '🧊',
    rarity: 'common',
    radius: 80,
    duration: 3,
  },
  lightning: {
    name: '闪电链',
    description: '连锁攻击3个敌人',
    manaCost: 35,
    icon: '⚡',
    rarity: 'common',
    damage: 50,
  },
  heal: {
    name: '治疗术',
    description: '恢复5点生命值',
    manaCost: 20,
    icon: '💚',
    rarity: 'common',
    healAmount: 5,
  },
  gold_rain: {
    name: '金币雨',
    description: '获得100金币',
    manaCost: 15,
    icon: '💰',
    rarity: 'common',
    goldAmount: 100,
  },
  tower_boost: {
    name: '强化塔',
    description: '所有塔攻击力提升50%，持续10秒',
    manaCost: 40,
    icon: '💪',
    rarity: 'rare',
    boostMultiplier: 1.5,
    duration: 10,
  },
  meteor: {
    name: '陨石术',
    description: '召唤陨石造成毁灭性范围伤害',
    manaCost: 60,
    icon: '☄️',
    rarity: 'epic',
    damage: 200,
    radius: 100,
  },
  summon: {
    name: '召唤石像鬼',
    description: '召唤3个石像鬼攻击敌人',
    manaCost: 45,
    icon: '👹',
    rarity: 'rare',
    summonCount: 3,
    summonDamage: 30,
    duration: 15,
  },
  mana_surge: {
    name: '法力涌动',
    description: '立即恢复50点法力值',
    manaCost: 0,
    icon: '💠',
    rarity: 'rare',
    manaAmount: 50,
  },
  time_warp: {
    name: '时间扭曲',
    description: '所有塔攻速提升100%，持续8秒',
    manaCost: 55,
    icon: '⏳',
    rarity: 'epic',
    timeScale: 0.5,
    duration: 8,
  },
  divine_shield: {
    name: '神圣护盾',
    description: '获得10点护盾，抵挡敌人伤害',
    manaCost: 50,
    icon: '🛡️',
    rarity: 'legendary',
    shieldAmount: 10,
    duration: 30,
  },
};

export const RARITY_WEIGHTS: Record<string, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  normal: {
    name: '哥布林',
    health: 60,
    speed: 50,
    reward: 10,
    color: '#22c55e',
    size: 14,
  },
  fast: {
    name: '飞贼',
    health: 35,
    speed: 90,
    reward: 15,
    color: '#f59e0b',
    size: 10,
  },
  tank: {
    name: '巨魔',
    health: 200,
    speed: 25,
    reward: 30,
    color: '#ef4444',
    size: 20,
  },
  boss: {
    name: '恶魔领主',
    health: 800,
    speed: 20,
    reward: 150,
    color: '#7c2d12',
    size: 28,
  },
};

export const WAVE_CONFIGS: WaveConfig[] = [
  { enemies: [{ type: 'normal', count: 5, interval: 1.5 }] },
  { enemies: [{ type: 'normal', count: 8, interval: 1.2 }] },
  { enemies: [{ type: 'normal', count: 5, interval: 1.0 }, { type: 'fast', count: 3, interval: 0.8 }] },
  { enemies: [{ type: 'fast', count: 8, interval: 0.7 }] },
  { enemies: [{ type: 'normal', count: 6, interval: 1.0 }, { type: 'tank', count: 2, interval: 2.5 }] },
  { enemies: [{ type: 'fast', count: 6, interval: 0.6 }, { type: 'tank', count: 3, interval: 2.0 }] },
  { enemies: [{ type: 'normal', count: 10, interval: 0.8 }, { type: 'fast', count: 5, interval: 0.6 }] },
  { enemies: [{ type: 'tank', count: 5, interval: 1.8 }] },
  { enemies: [{ type: 'fast', count: 10, interval: 0.5 }, { type: 'tank', count: 3, interval: 2.0 }] },
  { enemies: [{ type: 'normal', count: 8, interval: 0.8 }, { type: 'tank', count: 4, interval: 1.5 }, { type: 'boss', count: 1, interval: 5 }] },
];

export const PATH: Position[] = [
  { x: -1, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 1 },
  { x: 6, y: 1 },
  { x: 6, y: 7 },
  { x: 10, y: 7 },
  { x: 10, y: 3 },
  { x: 14, y: 3 },
  { x: 14, y: 6 },
  { x: 17, y: 6 },
];

export const BUILDABLE_POSITIONS: Position[] = [
  { x: 1, y: 3 }, { x: 1, y: 5 },
  { x: 3, y: 0 }, { x: 3, y: 2 },
  { x: 4, y: 2 }, { x: 5, y: 2 },
  { x: 5, y: 0 }, { x: 4, y: 0 },
  { x: 4, y: 6 }, { x: 5, y: 6 },
  { x: 7, y: 6 }, { x: 7, y: 8 },
  { x: 8, y: 8 }, { x: 9, y: 8 },
  { x: 8, y: 5 }, { x: 9, y: 5 },
  { x: 9, y: 2 }, { x: 11, y: 2 },
  { x: 11, y: 4 }, { x: 12, y: 4 },
  { x: 12, y: 6 }, { x: 13, y: 6 },
  { x: 13, y: 2 }, { x: 11, y: 8 },
  { x: 3, y: 7 }, { x: 4, y: 8 },
];

export function generateRandomDeck(): string[] {
  const deck: string[] = [];
  const deckSize = 20;

  const rarityCards: Record<string, string[]> = {};
  Object.entries(CARD_CONFIGS).forEach(([type, config]) => {
    if (!rarityCards[config.rarity]) {
      rarityCards[config.rarity] = [];
    }
    rarityCards[config.rarity].push(type);
  });

  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);

  for (let i = 0; i < deckSize; i++) {
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    let selectedRarity = 'common';

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      cumulative += weight;
      if (roll <= cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    const cardsOfRarity = rarityCards[selectedRarity] || rarityCards['common'];
    const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
    deck.push(cardsOfRarity[randomIndex]);
  }

  return deck;
}

export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getTowerLevelConfig(towerType: string, level: number) {
  const config = TOWER_CONFIGS[towerType];
  const levelIndex = Math.min(level - 1, config.levels.length - 1);
  return config.levels[levelIndex];
}
