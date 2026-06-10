import type { SetState, GetState, GameStore } from './types';
import type { EnemyType, WaveConfig } from '../types';
import { WAVE_COUNTDOWN, getWaveConfig, shuffleDeck } from '../config';

export function createWaveSlice(
  set: SetState,
  get: GetState
): Pick<
  GameStore,
  | 'startWave'
  | 'skipCountdown'
  | 'collectWaveReward'
  | 'skipWaveReward'
> {
  return {
    startWave: () => {
      const state = get();
      const { wave, waveInProgress, maxWaves, status, gameMode } = state;

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

    collectWaveReward: (cardId: string) => {
      const state = get();
      if (state.status !== 'wave_reward') return;

      const card = state.waveRewardCards.find((c) => c.id === cardId);
      if (!card) return;

      let newDeck = [...state.deck, card];
      newDeck = shuffleDeck(newDeck);

      const remainingCards = state.waveRewardCards.filter((c) => c.id !== cardId);
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
  };
}
