import type { SetState, GetState, GameStore } from './types';
import type { TowerType, Position, Tower, Effect } from '../types';
import { TOWER_CONFIGS, TILE_SIZE, getTowerLevelConfig } from '../config';
import { isBuildable, generateId } from './utils';

export function createTowerSlice(
  set: SetState,
  get: GetState
): Pick<
  GameStore,
  | 'selectTowerType'
  | 'selectTower'
  | 'buildTower'
  | 'upgradeTower'
  | 'sellTower'
> {
  return {
    selectTowerType: (type: TowerType | null) => {
      set({ selectedTowerType: type, selectedCard: null, selectedTowerId: null });
    },

    selectTower: (towerId: string | null) => {
      set({ selectedTowerId: towerId, selectedTowerType: null, selectedCard: null });
    },

    buildTower: (gridPosition: Position) => {
      const state = get();
      const { selectedTowerType, gold, towers, effects } = state;
      const buildablePositions = get().getBuildablePositions();

      if (!selectedTowerType) return;
      if (!isBuildable(gridPosition, towers, buildablePositions)) return;

      const config = TOWER_CONFIGS[selectedTowerType];
      const levelConfig = config.levels[0];
      if (gold < levelConfig.cost) return;

      const newTower: Tower = {
        id: generateId(),
        type: selectedTowerType,
        position: gridPosition,
        level: 1,
        lastAttackTime: 0,
        angle: 0,
      };

      const newEffect: Effect = {
        id: generateId(),
        type: 'build',
        position: {
          x: gridPosition.x * TILE_SIZE + TILE_SIZE / 2,
          y: gridPosition.y * TILE_SIZE + TILE_SIZE / 2,
        },
        duration: 0.5,
        maxDuration: 0.5,
        radius: TILE_SIZE,
      };

      set({
        towers: [...towers, newTower],
        gold: gold - levelConfig.cost,
        selectedTowerType: null,
        effects: [...effects, newEffect],
      });

      get().addBattleLog('build', `建造了 ${config.name}（花费 ${levelConfig.cost} 金币）`);
    },

    upgradeTower: (towerId: string) => {
      const state = get();
      const { towers, gold, effects } = state;

      const tower = towers.find((t) => t.id === towerId);
      if (!tower) return;

      const config = TOWER_CONFIGS[tower.type];
      if (tower.level >= config.maxLevel) return;

      const nextLevelConfig = config.levels[tower.level];
      if (gold < nextLevelConfig.cost) return;

      const upgradedTowers = towers.map((t) =>
        t.id === towerId ? { ...t, level: t.level + 1 } : t
      );

      const towerPos = {
        x: tower.position.x * TILE_SIZE + TILE_SIZE / 2,
        y: tower.position.y * TILE_SIZE + TILE_SIZE / 2,
      };

      const newEffects: Effect[] = [
        ...effects,
        {
          id: generateId(),
          type: 'upgrade',
          position: towerPos,
          duration: 0.8,
          maxDuration: 0.8,
          radius: TILE_SIZE * 1.5,
          towerId,
        },
        {
          id: generateId(),
          type: 'level_up',
          position: towerPos,
          duration: 1.2,
          maxDuration: 1.2,
          towerId,
        },
      ];

      set({
        towers: upgradedTowers,
        gold: gold - nextLevelConfig.cost,
        effects: newEffects,
      });

      get().addBattleLog(
        'upgrade',
        `${config.name} 升级到 ${tower.level + 1} 级（花费 ${nextLevelConfig.cost} 金币）`
      );
    },

    sellTower: (towerId: string) => {
      const state = get();
      const { towers, gold } = state;

      const tower = towers.find((t) => t.id === towerId);
      if (!tower) return;

      const config = TOWER_CONFIGS[tower.type];
      let totalCost = 0;
      for (let i = 0; i < tower.level; i++) {
        totalCost += config.levels[i].cost;
      }
      const sellValue = Math.floor(totalCost * 0.7);

      const remainingTowers = towers.filter((t) => t.id !== towerId);

      set({
        towers: remainingTowers,
        gold: gold + sellValue,
        selectedTowerId: null,
      });

      get().addBattleLog('sell', `出售了 ${config.name}（获得 ${sellValue} 金币）`);
    },
  };
}
