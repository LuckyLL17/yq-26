export type TowerType = 'arrow' | 'mage' | 'ice' | 'lightning' | 'poison' | 'sniper';

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export type CardType =
  | 'fireball'
  | 'freeze'
  | 'lightning'
  | 'heal'
  | 'gold_rain'
  | 'tower_boost'
  | 'meteor'
  | 'summon'
  | 'mana_surge'
  | 'time_warp'
  | 'divine_shield';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost' | 'wave_reward';

export type GameMode = 'normal' | 'endless';

export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Position;
  level: number;
  lastAttackTime: number;
  angle: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  slowEffect: number;
  slowDuration: number;
  freezeDuration: number;
  poisonDamage: number;
  poisonDuration: number;
  reward: number;
}

export interface Projectile {
  id: string;
  position: Position;
  targetId: string;
  speed: number;
  damage: number;
  type: TowerType;
  splashRadius?: number;
  slowEffect?: number;
  slowDuration?: number;
  chainCount?: number;
  chainDamageDecay?: number;
  hitTargets?: string[];
  poisonDamage?: number;
  poisonDuration?: number;
  isSniper?: boolean;
}

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  manaCost: number;
  icon: string;
  rarity: CardRarity;
}

export interface Effect {
  id: string;
  type:
    | 'explosion'
    | 'freeze'
    | 'lightning'
    | 'heal'
    | 'gold'
    | 'tower_boost'
    | 'build'
    | 'upgrade'
    | 'level_up'
    | 'poison'
    | 'sniper'
    | 'chain_lightning'
    | 'meteor'
    | 'summon'
    | 'mana_surge'
    | 'time_warp'
    | 'divine_shield'
    | 'death_explosion';
  position: Position;
  duration: number;
  maxDuration: number;
  radius?: number;
  towerId?: string;
  chainTargets?: Position[];
  enemyColor?: string;
  enemySize?: number;
}

export interface WaveConfig {
  enemies: { type: EnemyType; count: number; interval: number }[];
}

export interface TowerLevelConfig {
  damage: number;
  attackSpeed: number;
  range: number;
  cost: number;
  splashRadius?: number;
  slowEffect?: number;
  slowDuration?: number;
  chainCount?: number;
  chainDamageDecay?: number;
  poisonDamage?: number;
  poisonDuration?: number;
  critChance?: number;
  critMultiplier?: number;
}

export interface TowerConfig {
  name: string;
  levels: TowerLevelConfig[];
  color: string;
  projectileColor: string;
  projectileSpeed: number;
  icon: string;
  description: string;
  maxLevel: number;
}

export interface CardConfig {
  name: string;
  description: string;
  manaCost: number;
  icon: string;
  rarity: CardRarity;
  damage?: number;
  radius?: number;
  duration?: number;
  healAmount?: number;
  goldAmount?: number;
  boostMultiplier?: number;
  summonCount?: number;
  summonDamage?: number;
  manaAmount?: number;
  shieldAmount?: number;
  slowEffect?: number;
  timeScale?: number;
}

export interface EnemyConfig {
  name: string;
  health: number;
  speed: number;
  reward: number;
  color: string;
  size: number;
}

export interface GameState {
  status: GameStatus;
  gameMode: GameMode;
  gold: number;
  mana: number;
  maxMana: number;
  lives: number;
  wave: number;
  maxWaves: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  effects: Effect[];
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
  selectedCard: Card | null;
  score: number;
  waveInProgress: boolean;
  enemiesSpawned: number;
  totalEnemiesInWave: number;
  waveTime: number;
  spawnQueue: { type: EnemyType; spawnTime: number }[];
  towerBoostMultiplier: number;
  towerBoostDuration: number;
  divineShield: number;
  divineShieldDuration: number;
  timeWarpDuration: number;
  timeWarpScale: number;
  gameTime: number;
  battleLogs: BattleLogEntry[];
  currentLevelId: string;
  waveCountdown: number;
  isCountdownActive: boolean;
  nextWaveConfig: WaveConfig | null;
  waveRewardCards: Card[];
  autoStartWave: boolean;
}

export type BattleLogType =
  | 'build'
  | 'upgrade'
  | 'sell'
  | 'kill'
  | 'damage'
  | 'wave'
  | 'card'
  | 'heal'
  | 'gold'
  | 'warning'
  | 'info';

export interface BattleLogEntry {
  id: string;
  type: BattleLogType;
  message: string;
  timestamp: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESTART_GAME' }
  | { type: 'SELECT_TOWER_TYPE'; towerType: TowerType | null }
  | { type: 'BUILD_TOWER'; position: Position }
  | { type: 'SELECT_CARD'; card: Card | null }
  | { type: 'PLAY_CARD'; position?: Position }
  | { type: 'DRAW_CARD'; count: number }
  | { type: 'START_WAVE' }
  | { type: 'TICK'; deltaTime: number }
  | { type: 'ADD_EFFECT'; effect: Effect }
  | { type: 'SET_LEVEL'; level: LevelData }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'TOGGLE_AUTO_START' }
  | { type: 'SKIP_COUNTDOWN' }
  | { type: 'COLLECT_WAVE_REWARD'; cardId: string }
  | { type: 'SKIP_WAVE_REWARD' };

export interface LevelData {
  id: string;
  name: string;
  description: string;
  path: Position[];
  buildablePositions: Position[];
  waves: WaveConfig[];
  initialGold: number;
  initialLives: number;
  createdAt: number;
  updatedAt: number;
}

export type EditorTool = 'path' | 'build' | 'erase';

export interface LevelEditorState {
  level: LevelData;
  selectedTool: EditorTool;
  selectedPathIndex: number | null;
  isDirty: boolean;
  savedLevels: LevelData[];
}
