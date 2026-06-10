import type {
  GameState,
  TowerType,
  Card,
  Position,
  BattleLogType,
  LevelData,
  GameMode,
  WaveConfig,
  EnemyType,
} from '../types';

export interface GameStore extends GameState {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  selectTowerType: (type: TowerType | null) => void;
  selectTower: (towerId: string | null) => void;
  buildTower: (gridPosition: Position) => void;
  upgradeTower: (towerId: string) => void;
  sellTower: (towerId: string) => void;
  selectCard: (card: Card | null) => void;
  playCard: (targetPosition?: Position) => void;
  drawCards: (count: number) => void;
  startWave: () => void;
  tick: (deltaTime: number) => void;
  addBattleLog: (type: BattleLogType, message: string) => void;
  setLevel: (level: LevelData) => void;
  setGameMode: (mode: GameMode) => void;
  toggleAutoStart: () => void;
  skipCountdown: () => void;
  collectWaveReward: (cardId: string) => void;
  skipWaveReward: () => void;
  getPath: () => Position[];
  getBuildablePositions: () => Position[];
  getWaves: () => WaveConfig[];
  getInitialLives: () => number;
  generateWaveRewardCards: () => Card[];
}

export type SetState = (
  partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>),
  replace?: boolean
) => void;

export type GetState = () => GameStore;
