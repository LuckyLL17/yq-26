import type { SetState, GetState, GameStore } from './types';
import type { Position, WaveConfig } from '../types';
import {
  PATH,
  BUILDABLE_POSITIONS,
  WAVE_CONFIGS,
  INITIAL_LIVES,
} from '../config';
import { loadLevelFromStorage } from './levelStorage';

export function createSelectorsSlice(
  set: SetState,
  get: GetState
): Pick<
  GameStore,
  'getPath' | 'getBuildablePositions' | 'getWaves' | 'getInitialLives'
> {
  return {
    getPath: (): Position[] => {
      const state = get();
      if (state.currentLevelId === 'default') {
        return PATH;
      }
      const level = loadLevelFromStorage(state.currentLevelId);
      return level?.path || PATH;
    },

    getBuildablePositions: (): Position[] => {
      const state = get();
      if (state.currentLevelId === 'default') {
        return BUILDABLE_POSITIONS;
      }
      const level = loadLevelFromStorage(state.currentLevelId);
      return level?.buildablePositions || BUILDABLE_POSITIONS;
    },

    getWaves: (): WaveConfig[] => {
      const state = get();
      if (state.currentLevelId === 'default') {
        return WAVE_CONFIGS;
      }
      const level = loadLevelFromStorage(state.currentLevelId);
      return level?.waves || WAVE_CONFIGS;
    },

    getInitialLives: (): number => {
      const state = get();
      if (state.currentLevelId === 'default') {
        return INITIAL_LIVES;
      }
      const level = loadLevelFromStorage(state.currentLevelId);
      return level?.initialLives || INITIAL_LIVES;
    },
  };
}
