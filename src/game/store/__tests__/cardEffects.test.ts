import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../index';
import { CARD_CONFIGS, INITIAL_LIVES } from '../../config';
import type { Card, Enemy, CardType, CardRarity } from '../../types';

function makeCard(type: CardType, id?: string): Card {
  const config = CARD_CONFIGS[type];
  return {
    id: id ?? `card_${type}`,
    type,
    name: config.name,
    description: config.description,
    manaCost: config.manaCost,
    icon: config.icon,
    rarity: config.rarity as CardRarity,
  };
}

function makeEnemy(id: string, x: number, y: number, health: number): Enemy {
  return {
    id,
    type: 'normal',
    position: { x, y },
    health,
    maxHealth: health,
    speed: 50,
    pathIndex: 0,
    slowEffect: 0,
    slowDuration: 0,
    freezeDuration: 0,
    poisonDamage: 0,
    poisonDuration: 0,
    reward: 10,
  };
}

function setupStore(overrides: Record<string, unknown> = {}) {
  const card = overrides.card as Card | undefined;
  const defaultState: Record<string, unknown> = {
    status: 'playing',
    hand: card ? [card] : [],
    selectedCard: card ?? null,
    mana: 200,
    maxMana: 100,
    enemies: [],
    effects: [],
    discardPile: [],
    gold: 0,
    lives: 10,
    towerBoostMultiplier: 1,
    towerBoostDuration: 0,
    divineShield: 0,
    divineShieldDuration: 0,
    timeWarpScale: 1,
    timeWarpDuration: 0,
    currentLevelId: 'default',
    battleLogs: [],
    gameTime: 0,
  };
  const merged = { ...defaultState, ...overrides };
  delete merged.card;
  useGameStore.setState(merged as Partial<typeof useGameStore.getState>);
}

describe('playCard', () => {
  beforeEach(() => {
    useGameStore.setState({
      status: 'idle',
      gameMode: 'normal',
      gold: 0,
      mana: 0,
      maxMana: 100,
      lives: 10,
      wave: 0,
      maxWaves: 10,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      deck: [],
      hand: [],
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
      currentLevelId: 'default',
      waveCountdown: 15,
      isCountdownActive: false,
      nextWaveConfig: null,
      waveRewardCards: [],
      autoStartWave: false,
    });
  });

  it('does nothing when no card is selected', () => {
    setupStore({ card: null, mana: 200, gold: 50 });
    useGameStore.getState().playCard({ x: 100, y: 100 });
    const state = useGameStore.getState();
    expect(state.gold).toBe(50);
    expect(state.mana).toBe(200);
  });

  it('does nothing when mana is insufficient', () => {
    const card = makeCard('fireball');
    setupStore({ card, mana: 10 });
    useGameStore.getState().playCard({ x: 100, y: 100 });
    const state = useGameStore.getState();
    expect(state.hand).toHaveLength(1);
    expect(state.mana).toBe(10);
  });

  it('removes card from hand and adds to discardPile', () => {
    const card = makeCard('heal');
    setupStore({ card, mana: 200 });
    useGameStore.getState().playCard();
    const state = useGameStore.getState();
    expect(state.hand).toHaveLength(0);
    expect(state.discardPile).toHaveLength(1);
    expect(state.discardPile[0].id).toBe(card.id);
  });

  it('deducts mana by card manaCost', () => {
    const card = makeCard('fireball');
    setupStore({ card, mana: 100 });
    useGameStore.getState().playCard({ x: 100, y: 100 });
    const state = useGameStore.getState();
    expect(state.mana).toBe(100 - card.manaCost);
  });

  it('sets selectedCard to null after playing', () => {
    const card = makeCard('heal');
    setupStore({ card, mana: 200 });
    useGameStore.getState().playCard();
    expect(useGameStore.getState().selectedCard).toBeNull();
  });

  describe('fireball', () => {
    it('deals 80 damage to enemies within radius of target position', () => {
      const card = makeCard('fireball');
      const enemy1 = makeEnemy('e1', 100, 100, 200);
      const enemy2 = makeEnemy('e2', 130, 100, 200);
      setupStore({ card, mana: 200, enemies: [enemy1, enemy2] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      const state = useGameStore.getState();
      const e1 = state.enemies.find((e) => e.id === 'e1')!;
      const e2 = state.enemies.find((e) => e.id === 'e2')!;
      expect(e1.health).toBe(200 - 80);
      expect(e2.health).toBe(200 - 80);
    });

    it('does not damage enemies outside radius', () => {
      const card = makeCard('fireball');
      const enemy = makeEnemy('e1', 200, 200, 200);
      setupStore({ card, mana: 200, enemies: [enemy] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      const state = useGameStore.getState();
      expect(state.enemies[0].health).toBe(200);
    });

    it('does nothing without targetPosition', () => {
      const card = makeCard('fireball');
      const enemy = makeEnemy('e1', 100, 100, 200);
      setupStore({ card, mana: 200, enemies: [enemy] });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.enemies[0].health).toBe(200);
    });
  });

  describe('freeze', () => {
    it('sets freezeDuration to 3 for enemies within radius', () => {
      const card = makeCard('freeze');
      const enemy1 = makeEnemy('e1', 100, 100, 200);
      const enemy2 = makeEnemy('e2', 170, 100, 200);
      setupStore({ card, mana: 200, enemies: [enemy1, enemy2] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      const state = useGameStore.getState();
      const e1 = state.enemies.find((e) => e.id === 'e1')!;
      const e2 = state.enemies.find((e) => e.id === 'e2')!;
      expect(e1.freezeDuration).toBe(3);
      expect(e2.freezeDuration).toBe(3);
    });

    it('does not freeze enemies outside radius', () => {
      const card = makeCard('freeze');
      const enemy = makeEnemy('e1', 300, 300, 200);
      setupStore({ card, mana: 200, enemies: [enemy] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      const state = useGameStore.getState();
      expect(state.enemies[0].freezeDuration).toBe(0);
    });
  });

  describe('lightning', () => {
    it('deals 50 damage to top 3 enemies by health', () => {
      const card = makeCard('lightning');
      const enemy1 = makeEnemy('e1', 100, 100, 300);
      const enemy2 = makeEnemy('e2', 200, 200, 250);
      const enemy3 = makeEnemy('e3', 300, 300, 200);
      const enemy4 = makeEnemy('e4', 400, 400, 150);
      setupStore({ card, mana: 200, enemies: [enemy1, enemy2, enemy3, enemy4] });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      const e1 = state.enemies.find((e) => e.id === 'e1')!;
      const e2 = state.enemies.find((e) => e.id === 'e2')!;
      const e3 = state.enemies.find((e) => e.id === 'e3')!;
      const e4 = state.enemies.find((e) => e.id === 'e4')!;
      expect(e1.health).toBe(300 - 50);
      expect(e2.health).toBe(250 - 50);
      expect(e3.health).toBe(200 - 50);
      expect(e4.health).toBe(150);
    });

    it('targets fewer than 3 when fewer enemies exist', () => {
      const card = makeCard('lightning');
      const enemy1 = makeEnemy('e1', 100, 100, 200);
      setupStore({ card, mana: 200, enemies: [enemy1] });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.enemies[0].health).toBe(200 - 50);
    });
  });

  describe('heal', () => {
    it('increases lives by healAmount', () => {
      const card = makeCard('heal');
      setupStore({ card, mana: 200, lives: 10 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().lives).toBe(10 + 5);
    });

    it('caps lives at initialLives', () => {
      const card = makeCard('heal');
      setupStore({ card, mana: 200, lives: 18 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().lives).toBe(INITIAL_LIVES);
    });
  });

  describe('gold_rain', () => {
    it('adds 100 gold', () => {
      const card = makeCard('gold_rain');
      setupStore({ card, mana: 200, gold: 50 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().gold).toBe(50 + 100);
    });
  });

  describe('tower_boost', () => {
    it('sets towerBoostMultiplier to 1.5 and towerBoostDuration to 10', () => {
      const card = makeCard('tower_boost');
      setupStore({ card, mana: 200 });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.towerBoostMultiplier).toBe(1.5);
      expect(state.towerBoostDuration).toBe(10);
    });
  });

  describe('meteor', () => {
    it('deals 200 damage to enemies within radius of target position', () => {
      const card = makeCard('meteor');
      const enemy1 = makeEnemy('e1', 100, 100, 500);
      const enemy2 = makeEnemy('e2', 150, 100, 500);
      setupStore({ card, mana: 200, enemies: [enemy1, enemy2] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      const state = useGameStore.getState();
      const e1 = state.enemies.find((e) => e.id === 'e1')!;
      const e2 = state.enemies.find((e) => e.id === 'e2')!;
      expect(e1.health).toBe(500 - 200);
      expect(e2.health).toBe(500 - 200);
    });

    it('does not damage enemies outside radius', () => {
      const card = makeCard('meteor');
      const enemy = makeEnemy('e1', 300, 300, 500);
      setupStore({ card, mana: 200, enemies: [enemy] });
      useGameStore.getState().playCard({ x: 100, y: 100 });
      expect(useGameStore.getState().enemies[0].health).toBe(500);
    });

    it('does nothing without targetPosition', () => {
      const card = makeCard('meteor');
      const enemy = makeEnemy('e1', 100, 100, 500);
      setupStore({ card, mana: 200, enemies: [enemy] });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().enemies[0].health).toBe(500);
    });
  });

  describe('summon', () => {
    it('deals 90 damage to all enemies', () => {
      const card = makeCard('summon');
      const enemy1 = makeEnemy('e1', 100, 100, 300);
      const enemy2 = makeEnemy('e2', 500, 500, 300);
      setupStore({ card, mana: 200, enemies: [enemy1, enemy2] });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.enemies[0].health).toBe(300 - 90);
      expect(state.enemies[1].health).toBe(300 - 90);
    });
  });

  describe('mana_surge', () => {
    it('adds 50 mana capped at maxMana', () => {
      const card = makeCard('mana_surge');
      setupStore({ card, mana: 30, maxMana: 100 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().mana).toBe(80);
    });

    it('caps mana at maxMana', () => {
      const card = makeCard('mana_surge');
      setupStore({ card, mana: 80, maxMana: 100 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().mana).toBe(100);
    });

    it('does not deduct mana cost since manaCost is 0', () => {
      const card = makeCard('mana_surge');
      setupStore({ card, mana: 50, maxMana: 100 });
      useGameStore.getState().playCard();
      expect(useGameStore.getState().mana).toBe(100);
    });
  });

  describe('time_warp', () => {
    it('sets timeWarpScale to 0.5 and timeWarpDuration to 8', () => {
      const card = makeCard('time_warp');
      setupStore({ card, mana: 200 });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.timeWarpScale).toBe(0.5);
      expect(state.timeWarpDuration).toBe(8);
    });
  });

  describe('divine_shield', () => {
    it('adds shieldAmount to divineShield and sets divineShieldDuration', () => {
      const card = makeCard('divine_shield');
      setupStore({ card, mana: 200 });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.divineShield).toBe(10);
      expect(state.divineShieldDuration).toBe(30);
    });

    it('stacks shieldAmount on existing divineShield', () => {
      const card = makeCard('divine_shield');
      setupStore({ card, mana: 200, divineShield: 5, divineShieldDuration: 10 });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.divineShield).toBe(15);
      expect(state.divineShieldDuration).toBe(30);
    });

    it('keeps current divineShieldDuration if greater than config duration', () => {
      const card = makeCard('divine_shield');
      setupStore({ card, mana: 200, divineShield: 0, divineShieldDuration: 50 });
      useGameStore.getState().playCard();
      const state = useGameStore.getState();
      expect(state.divineShield).toBe(10);
      expect(state.divineShieldDuration).toBe(50);
    });
  });
});
