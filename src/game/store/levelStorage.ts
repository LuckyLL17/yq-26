import type { LevelData } from '../types';

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
