import type { SetState, GetState, GameStore } from './types';
import type { LevelData, GameMode } from '../types';
import { getDefaultLevel } from '../levelEditor';
import { loadLevelFromStorage } from './levelStorage';
import { createInitialState } from './initialState';

export function createGameSlice(
  set: SetState,
  get: GetState
): Pick<
  GameStore,
  | 'startGame'
  | 'pauseGame'
  | 'resumeGame'
  | 'restartGame'
  | 'setGameMode'
  | 'toggleAutoStart'
  | 'setLevel'
> {
  return {
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

    setGameMode: (mode: GameMode) => {
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

    setLevel: (level: LevelData) => {
      const gameMode = get().gameMode;
      set(createInitialState(level, gameMode));
    },
  };
}
