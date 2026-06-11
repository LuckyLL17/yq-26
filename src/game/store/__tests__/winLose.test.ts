import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../index';
import type { Enemy } from '../../types';
import { TILE_SIZE } from '../../config';
import { PATH } from '../../config';

const LAST_PATH_INDEX = PATH.length - 1;

function makeEnemyAtEnd(overrides: Partial<Enemy> = {}): Enemy {
  const lastPoint = PATH[LAST_PATH_INDEX];
  return {
    id: 'enemy-end-1',
    type: 'normal',
    position: {
      x: lastPoint.x * TILE_SIZE + TILE_SIZE / 2,
      y: lastPoint.y * TILE_SIZE + TILE_SIZE / 2,
    },
    health: 100,
    maxHealth: 100,
    speed: 100,
    pathIndex: LAST_PATH_INDEX,
    slowEffect: 0,
    slowDuration: 0,
    freezeDuration: 0,
    poisonDamage: 0,
    poisonDuration: 0,
    reward: 10,
    ...overrides,
  };
}

function makeEnemyNearEnd(overrides: Partial<Enemy> = {}): Enemy {
  const secondLast = PATH[LAST_PATH_INDEX - 1];
  const last = PATH[LAST_PATH_INDEX];
  return {
    id: 'enemy-near-end-1',
    type: 'fast',
    position: {
      x: last.x * TILE_SIZE + TILE_SIZE / 2 - 1,
      y: last.y * TILE_SIZE + TILE_SIZE / 2,
    },
    health: 100,
    maxHealth: 100,
    speed: 99999,
    pathIndex: LAST_PATH_INDEX - 1,
    slowEffect: 0,
    slowDuration: 0,
    freezeDuration: 0,
    poisonDamage: 0,
    poisonDuration: 0,
    reward: 10,
    ...overrides,
  };
}

function setupStore(overrides: Record<string, unknown> = {}) {
  useGameStore.setState({
    status: 'playing',
    waveInProgress: true,
    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],
    spawnQueue: [],
    lives: 20,
    wave: 1,
    maxWaves: 10,
    gameMode: 'normal',
    gold: 500,
    mana: 50,
    maxMana: 100,
    score: 0,
    waveTime: 0,
    enemiesSpawned: 0,
    gameTime: 100,
    currentLevelId: 'default',
    divineShield: 0,
    divineShieldDuration: 0,
    towerBoostDuration: 0,
    towerBoostMultiplier: 1,
    timeWarpDuration: 0,
    timeWarpScale: 1,
    isCountdownActive: false,
    waveCountdown: 0,
    autoStartWave: false,
    battleLogs: [],
    selectedTowerType: null,
    selectedTowerId: null,
    selectedCard: null,
    waveRewardCards: [],
    nextWaveConfig: null,
    ...overrides,
  });
}

describe('win/lose conditions in tick', () => {
  beforeEach(() => {
    setupStore();
  });

  describe('lose when lives <= 0', () => {
    it('sets status to lost when an enemy reaches end and lives drop to 0', () => {
      setupStore({
        lives: 1,
        enemies: [makeEnemyAtEnd()],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
      expect(state.lives).toBe(0);
    });

    it('sets status to lost when lives drop below 0', () => {
      setupStore({
        lives: 1,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
      expect(state.lives).toBeLessThan(0);
    });

    it('removes enemies that reached the end from the enemies array', () => {
      setupStore({
        lives: 5,
        enemies: [makeEnemyAtEnd()],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.enemies).toHaveLength(0);
    });

    it('does not set status to lost when lives remain above 0', () => {
      const midPath = PATH[Math.floor(PATH.length / 2)];
      setupStore({
        lives: 5,
        enemies: [
          makeEnemyAtEnd(),
          {
            id: 'still-alive',
            type: 'normal' as const,
            position: {
              x: midPath.x * TILE_SIZE + TILE_SIZE / 2,
              y: midPath.y * TILE_SIZE + TILE_SIZE / 2,
            },
            health: 100,
            maxHealth: 100,
            speed: 50,
            pathIndex: Math.floor(PATH.length / 2),
            slowEffect: 0,
            slowDuration: 0,
            freezeDuration: 0,
            poisonDamage: 0,
            poisonDuration: 0,
            reward: 10,
          },
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('playing');
      expect(state.lives).toBe(4);
    });
  });

  describe('win when all waves complete in normal mode', () => {
    it('sets status to won when waveComplete and wave >= maxWaves in normal mode', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 10,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('won');
    });

    it('does not set won when wave < maxWaves', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 5,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).not.toBe('won');
    });

    it('does not set won when spawnQueue is not empty', () => {
      setupStore({
        enemies: [],
        spawnQueue: [{ type: 'normal', spawnTime: 0 }],
        wave: 10,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).not.toBe('won');
    });

    it('does not set won when enemies still alive', () => {
      setupStore({
        enemies: [makeEnemyNearEnd({ id: 'still-alive' })],
        spawnQueue: [],
        wave: 10,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).not.toBe('won');
    });

    it('sets waveInProgress to false on win', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 10,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.waveInProgress).toBe(false);
    });
  });

  describe('wave reward when wave complete but not final', () => {
    it('sets status to wave_reward when waveComplete but wave < maxWaves', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 5,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('wave_reward');
    });

    it('generates waveRewardCards on wave_reward', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 5,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.waveRewardCards.length).toBeGreaterThan(0);
    });

    it('sets waveInProgress to false on wave_reward', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 5,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.waveInProgress).toBe(false);
    });

    it('does not trigger wave_reward when enemies remain', () => {
      setupStore({
        enemies: [makeEnemyNearEnd({ id: 'still-alive' })],
        spawnQueue: [],
        wave: 5,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).not.toBe('wave_reward');
    });
  });

  describe('divine shield absorbs damage', () => {
    it('divineShield absorbs enemy reaching end instead of lives', () => {
      setupStore({
        lives: 5,
        divineShield: 3,
        divineShieldDuration: 10,
        enemies: [makeEnemyAtEnd()],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(5);
      expect(state.divineShield).toBe(2);
    });

    it('depletes divineShield then reduces lives when multiple enemies reach end', () => {
      setupStore({
        lives: 5,
        divineShield: 1,
        divineShieldDuration: 10,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
          makeEnemyAtEnd({ id: 'e3' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.divineShield).toBe(0);
      expect(state.lives).toBe(3);
    });

    it('divineShield fully absorbs all enemies reaching end', () => {
      setupStore({
        lives: 5,
        divineShield: 3,
        divineShieldDuration: 10,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
          makeEnemyAtEnd({ id: 'e3' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.divineShield).toBe(0);
      expect(state.lives).toBe(5);
    });

    it('loses game when divineShield depleted and lives drop to 0', () => {
      setupStore({
        lives: 1,
        divineShield: 1,
        divineShieldDuration: 10,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
      expect(state.divineShield).toBe(0);
      expect(state.lives).toBe(0);
    });
  });

  describe('multiple enemies reaching end in same tick', () => {
    it('each enemy reduces lives by 1', () => {
      setupStore({
        lives: 10,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
          makeEnemyAtEnd({ id: 'e3' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(7);
      expect(state.enemies).toHaveLength(0);
    });

    it('enemies reaching end via high speed movement also reduce lives', () => {
      setupStore({
        lives: 10,
        enemies: [
          makeEnemyNearEnd({ id: 'fast1' }),
          makeEnemyNearEnd({ id: 'fast2' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(8);
    });

    it('causes game loss when multiple enemies deplete all lives', () => {
      setupStore({
        lives: 2,
        enemies: [
          makeEnemyAtEnd({ id: 'e1' }),
          makeEnemyAtEnd({ id: 'e2' }),
          makeEnemyAtEnd({ id: 'e3' }),
        ],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
    });
  });

  describe('endless mode never triggers won', () => {
    it('does not set won when gameMode is endless even with wave >= maxWaves', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 999,
        maxWaves: 999,
        gameMode: 'endless',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('wave_reward');
      expect(state.status).not.toBe('won');
    });

    it('sets wave_reward in endless mode when wave completes', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 5,
        maxWaves: 999,
        gameMode: 'endless',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('wave_reward');
    });

    it('can still lose in endless mode', () => {
      setupStore({
        lives: 1,
        enemies: [makeEnemyAtEnd()],
        spawnQueue: [],
        wave: 5,
        maxWaves: 999,
        gameMode: 'endless',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
    });
  });

  describe('tick does not process when status is not playing or wave_reward', () => {
    it('does nothing when status is idle', () => {
      setupStore({ status: 'idle', lives: 5 });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(5);
      expect(state.status).toBe('idle');
    });

    it('does nothing when status is paused', () => {
      setupStore({ status: 'paused', lives: 5 });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(5);
      expect(state.status).toBe('paused');
    });

    it('does nothing when status is already won', () => {
      setupStore({ status: 'won', lives: 5 });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(5);
      expect(state.status).toBe('won');
    });

    it('does nothing when status is already lost', () => {
      setupStore({ status: 'lost', lives: 0 });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.lives).toBe(0);
      expect(state.status).toBe('lost');
    });
  });

  describe('lose takes priority over win', () => {
    it('sets lost instead of won when last enemy reaches end and lives drop to 0 on final wave', () => {
      setupStore({
        lives: 1,
        enemies: [makeEnemyAtEnd()],
        spawnQueue: [],
        wave: 10,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('lost');
      expect(state.status).not.toBe('won');
    });
  });

  describe('divineShield duration expiry', () => {
    it('clears divineShield when duration expires during tick', () => {
      setupStore({
        divineShield: 5,
        divineShieldDuration: 0.01,
        enemies: [],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.divineShield).toBe(0);
      expect(state.divineShieldDuration).toBe(0);
    });

    it('keeps divineShield when duration has not expired', () => {
      setupStore({
        divineShield: 5,
        divineShieldDuration: 10,
        enemies: [],
        spawnQueue: [],
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.divineShield).toBe(5);
      expect(state.divineShieldDuration).toBeGreaterThan(0);
    });
  });

  describe('wave_complete condition', () => {
    it('waveComplete is true when spawnQueue is empty and no enemies remain', () => {
      setupStore({
        enemies: [],
        spawnQueue: [],
        wave: 3,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('wave_reward');
    });

    it('waveComplete is false when spawnQueue has items', () => {
      setupStore({
        enemies: [],
        spawnQueue: [{ type: 'normal' as const, spawnTime: 0 }],
        wave: 3,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('playing');
    });

    it('waveComplete is false when enemies are still alive', () => {
      const farFromEnd = PATH[0];
      setupStore({
        enemies: [
          {
            id: 'alive1',
            type: 'normal' as const,
            position: {
              x: farFromEnd.x * TILE_SIZE + TILE_SIZE / 2,
              y: farFromEnd.y * TILE_SIZE + TILE_SIZE / 2,
            },
            health: 100,
            maxHealth: 100,
            speed: 50,
            pathIndex: 0,
            slowEffect: 0,
            slowDuration: 0,
            freezeDuration: 0,
            poisonDamage: 0,
            poisonDuration: 0,
            reward: 10,
          },
        ],
        spawnQueue: [],
        wave: 3,
        maxWaves: 10,
        gameMode: 'normal',
      });

      useGameStore.getState().tick(0.016);
      const state = useGameStore.getState();

      expect(state.status).toBe('playing');
    });
  });
});
