import { create } from 'zustand';
import type { GameStore } from './types';
import { createInitialState } from './initialState';
import { createGameSlice } from './gameSlice';
import { createTowerSlice } from './towerSlice';
import { createCardSlice } from './cardSlice';
import { createWaveSlice } from './waveSlice';
import { createBattleLogSlice } from './battleLogSlice';
import { createTickSlice } from './tickSlice';
import { createSelectorsSlice } from './selectors';

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  ...createGameSlice(set, get),
  ...createTowerSlice(set, get),
  ...createCardSlice(set, get),
  ...createWaveSlice(set, get),
  ...createBattleLogSlice(set, get),
  ...createTickSlice(set, get),
  ...createSelectorsSlice(set, get),
}));

export { loadLevelFromStorage } from './levelStorage';
export type { GameStore } from './types';
