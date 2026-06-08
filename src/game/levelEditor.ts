import { create } from 'zustand';
import type { LevelData, Position, EditorTool, WaveConfig } from './types';
import { WAVE_CONFIGS, INITIAL_GOLD, INITIAL_LIVES, MAP_WIDTH, MAP_HEIGHT } from './config';

const LEVELS_STORAGE_KEY = 'td_custom_levels';

let levelIdCounter = 0;
const generateLevelId = () => `level_${Date.now()}_${++levelIdCounter}`;

function createEmptyLevel(): LevelData {
  return {
    id: generateLevelId(),
    name: '新建关卡',
    description: '',
    path: [
      { x: -1, y: Math.floor(MAP_HEIGHT / 2) },
      { x: MAP_WIDTH, y: Math.floor(MAP_HEIGHT / 2) },
    ],
    buildablePositions: [],
    waves: [...WAVE_CONFIGS],
    initialGold: INITIAL_GOLD,
    initialLives: INITIAL_LIVES,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadLevelsFromStorage(): LevelData[] {
  try {
    const stored = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load levels from storage:', e);
  }
  return [];
}

function saveLevelsToStorage(levels: LevelData[]) {
  try {
    localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(levels));
  } catch (e) {
    console.error('Failed to save levels to storage:', e);
  }
}

function isPositionOnPath(pos: Position, path: Position[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    
    if (start.x === end.x) {
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      if (pos.x === start.x && pos.y >= minY && pos.y <= maxY) {
        return true;
      }
    } else if (start.y === end.y) {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      if (pos.y === start.y && pos.x >= minX && pos.x <= maxX) {
        return true;
      }
    }
  }
  return false;
}

interface LevelEditorStore {
  level: LevelData;
  selectedTool: EditorTool;
  selectedPathIndex: number | null;
  isDirty: boolean;
  savedLevels: LevelData[];
  showSaveDialog: boolean;
  showLoadDialog: boolean;

  setTool: (tool: EditorTool) => void;
  setLevelName: (name: string) => void;
  setLevelDescription: (description: string) => void;
  setInitialGold: (gold: number) => void;
  setInitialLives: (lives: number) => void;

  handleGridClick: (gridPos: Position) => void;
  handlePathPointClick: (index: number) => void;
  movePathPoint: (index: number, newPos: Position) => void;
  insertPathPoint: (afterIndex: number, pos: Position) => void;
  deletePathPoint: (index: number) => void;

  toggleBuildablePosition: (pos: Position) => void;
  addBuildablePosition: (pos: Position) => void;
  removeBuildablePosition: (pos: Position) => void;
  clearBuildablePositions: () => void;
  generateBuildablePositions: () => void;

  setWaves: (waves: WaveConfig[]) => void;
  addWave: () => void;
  removeWave: (index: number) => void;
  updateWave: (index: number, wave: WaveConfig) => void;

  newLevel: () => void;
  loadLevel: (level: LevelData) => void;
  saveLevel: () => void;
  saveLevelAs: (name: string) => void;
  deleteSavedLevel: (id: string) => void;
  refreshSavedLevels: () => void;

  setShowSaveDialog: (show: boolean) => void;
  setShowLoadDialog: (show: boolean) => void;

  validateLevel: () => { valid: boolean; errors: string[] };
}

export const useLevelEditorStore = create<LevelEditorStore>((set, get) => ({
  level: createEmptyLevel(),
  selectedTool: 'path',
  selectedPathIndex: null,
  isDirty: false,
  savedLevels: loadLevelsFromStorage(),
  showSaveDialog: false,
  showLoadDialog: false,

  setTool: (tool) => {
    set({ selectedTool: tool, selectedPathIndex: null });
  },

  setLevelName: (name) => {
    const { level } = get();
    set({
      level: { ...level, name, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  setLevelDescription: (description) => {
    const { level } = get();
    set({
      level: { ...level, description, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  setInitialGold: (gold) => {
    const { level } = get();
    set({
      level: { ...level, initialGold: gold, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  setInitialLives: (lives) => {
    const { level } = get();
    set({
      level: { ...level, initialLives: lives, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  handleGridClick: (gridPos) => {
    const { selectedTool, level } = get();
    
    if (selectedTool === 'build') {
      get().toggleBuildablePosition(gridPos);
    } else if (selectedTool === 'erase') {
      get().removeBuildablePosition(gridPos);
    }
  },

  handlePathPointClick: (index) => {
    set({ selectedPathIndex: index });
  },

  movePathPoint: (index, newPos) => {
    const { level } = get();
    const newPath = [...level.path];
    newPath[index] = { ...newPos };
    
    set({
      level: { ...level, path: newPath, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  insertPathPoint: (afterIndex, pos) => {
    const { level } = get();
    const newPath = [...level.path];
    newPath.splice(afterIndex + 1, 0, pos);
    
    set({
      level: { ...level, path: newPath, updatedAt: Date.now() },
      selectedPathIndex: afterIndex + 1,
      isDirty: true,
    });
  },

  deletePathPoint: (index) => {
    const { level } = get();
    if (level.path.length <= 2) return;
    
    const newPath = level.path.filter((_, i) => i !== index);
    
    set({
      level: { ...level, path: newPath, updatedAt: Date.now() },
      selectedPathIndex: null,
      isDirty: true,
    });
  },

  toggleBuildablePosition: (pos) => {
    const { level } = get();
    const exists = level.buildablePositions.some(
      (p) => p.x === pos.x && p.y === pos.y
    );
    
    if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) {
      return;
    }
    
    if (isPositionOnPath(pos, level.path)) {
      return;
    }
    
    let newPositions;
    if (exists) {
      newPositions = level.buildablePositions.filter(
        (p) => !(p.x === pos.x && p.y === pos.y)
      );
    } else {
      newPositions = [...level.buildablePositions, { ...pos }];
    }
    
    set({
      level: { ...level, buildablePositions: newPositions, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  addBuildablePosition: (pos) => {
    const { level } = get();
    const exists = level.buildablePositions.some(
      (p) => p.x === pos.x && p.y === pos.y
    );
    
    if (exists) return;
    if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) return;
    if (isPositionOnPath(pos, level.path)) return;
    
    set({
      level: {
        ...level,
        buildablePositions: [...level.buildablePositions, { ...pos }],
        updatedAt: Date.now(),
      },
      isDirty: true,
    });
  },

  removeBuildablePosition: (pos) => {
    const { level } = get();
    const newPositions = level.buildablePositions.filter(
      (p) => !(p.x === pos.x && p.y === pos.y)
    );
    
    set({
      level: { ...level, buildablePositions: newPositions, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  clearBuildablePositions: () => {
    const { level } = get();
    set({
      level: { ...level, buildablePositions: [], updatedAt: Date.now() },
      isDirty: true,
    });
  },

  generateBuildablePositions: () => {
    const { level } = get();
    const positions: Position[] = [];
    
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        if (!isPositionOnPath({ x, y }, level.path)) {
          positions.push({ x, y });
        }
      }
    }
    
    set({
      level: { ...level, buildablePositions: positions, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  setWaves: (waves) => {
    const { level } = get();
    set({
      level: { ...level, waves, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  addWave: () => {
    const { level } = get();
    const newWave: WaveConfig = {
      enemies: [{ type: 'normal', count: 5, interval: 1.5 }],
    };
    
    set({
      level: {
        ...level,
        waves: [...level.waves, newWave],
        updatedAt: Date.now(),
      },
      isDirty: true,
    });
  },

  removeWave: (index) => {
    const { level } = get();
    if (level.waves.length <= 1) return;
    
    const newWaves = level.waves.filter((_, i) => i !== index);
    
    set({
      level: { ...level, waves: newWaves, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  updateWave: (index, wave) => {
    const { level } = get();
    const newWaves = [...level.waves];
    newWaves[index] = wave;
    
    set({
      level: { ...level, waves: newWaves, updatedAt: Date.now() },
      isDirty: true,
    });
  },

  newLevel: () => {
    set({
      level: createEmptyLevel(),
      selectedPathIndex: null,
      isDirty: false,
    });
  },

  loadLevel: (levelData) => {
    set({
      level: { ...levelData, id: generateLevelId(), updatedAt: Date.now() },
      selectedPathIndex: null,
      isDirty: false,
      showLoadDialog: false,
    });
  },

  saveLevel: () => {
    const { level, savedLevels } = get();
    const updatedLevel = { ...level, updatedAt: Date.now() };
    
    const existingIndex = savedLevels.findIndex((l) => l.id === level.id);
    let newSavedLevels;
    
    if (existingIndex >= 0) {
      newSavedLevels = [...savedLevels];
      newSavedLevels[existingIndex] = updatedLevel;
    } else {
      newSavedLevels = [...savedLevels, updatedLevel];
    }
    
    saveLevelsToStorage(newSavedLevels);
    
    set({
      level: updatedLevel,
      savedLevels: newSavedLevels,
      isDirty: false,
      showSaveDialog: false,
    });
  },

  saveLevelAs: (name) => {
    const { level, savedLevels } = get();
    const newLevel: LevelData = {
      ...level,
      id: generateLevelId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const newSavedLevels = [...savedLevels, newLevel];
    saveLevelsToStorage(newSavedLevels);
    
    set({
      level: newLevel,
      savedLevels: newSavedLevels,
      isDirty: false,
      showSaveDialog: false,
    });
  },

  deleteSavedLevel: (id) => {
    const { savedLevels } = get();
    const newSavedLevels = savedLevels.filter((l) => l.id !== id);
    saveLevelsToStorage(newSavedLevels);
    set({ savedLevels: newSavedLevels });
  },

  refreshSavedLevels: () => {
    set({ savedLevels: loadLevelsFromStorage() });
  },

  setShowSaveDialog: (show) => {
    set({ showSaveDialog: show });
  },

  setShowLoadDialog: (show) => {
    set({ showLoadDialog: show });
  },

  validateLevel: () => {
    const { level } = get();
    const errors: string[] = [];
    
    if (level.path.length < 2) {
      errors.push('路径至少需要2个点');
    }
    
    const start = level.path[0];
    const end = level.path[level.path.length - 1];
    
    if (start.x > 0 && start.y > 0 && start.y < MAP_HEIGHT - 1) {
      if (start.x >= 0 && start.x < MAP_WIDTH) {
        errors.push('路径起点应该在地图边缘');
      }
    }
    
    if (level.buildablePositions.length === 0) {
      errors.push('至少需要1个可建造位置');
    }
    
    if (level.waves.length === 0) {
      errors.push('至少需要1波敌人');
    }
    
    if (level.initialGold <= 0) {
      errors.push('初始金币必须大于0');
    }
    
    if (level.initialLives <= 0) {
      errors.push('初始生命必须大于0');
    }
    
    if (!level.name.trim()) {
      errors.push('关卡名称不能为空');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
}));

export function getDefaultLevel(): LevelData {
  return {
    id: 'default',
    name: '默认关卡',
    description: '游戏默认的关卡',
    path: [
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
    ],
    buildablePositions: [
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
    ],
    waves: [...WAVE_CONFIGS],
    initialGold: INITIAL_GOLD,
    initialLives: INITIAL_LIVES,
    createdAt: 0,
    updatedAt: 0,
  };
}
