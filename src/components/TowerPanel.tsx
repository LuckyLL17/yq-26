import { useGameStore } from '@/game/store';
import { TOWER_CONFIGS, getTowerLevelConfig } from '@/game/config';
import type { TowerType } from '@/game/types';

export default function TowerPanel() {
  const { selectedTowerType, selectTowerType, gold, status } = useGameStore();

  const towerTypes = Object.entries(TOWER_CONFIGS) as [TowerType, typeof TOWER_CONFIGS.arrow][];

  return (
    <div className="bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>🏰</span> 防御塔
      </h3>

      <div className="space-y-2">
        {towerTypes.map(([type, config]) => {
          const levelConfig = getTowerLevelConfig(type, 1);
          const canAfford = gold >= levelConfig.cost;
          const isSelected = selectedTowerType === type;
          const isDisabled = !canAfford || status !== 'playing';

          return (
            <button
              key={type}
              onClick={() => !isDisabled && selectTowerType(isSelected ? null : type)}
              disabled={isDisabled}
              className={`
                w-full p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-game-magic bg-game-magic/20 shadow-lg shadow-game-magic/30 scale-105'
                  : 'border-game-panel-light bg-game-panel-light/50 hover:border-game-magic/50 hover:bg-game-panel-light'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: config.color + '30' }}
                >
                  {config.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{config.name}</span>
                    <span className={`text-sm font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                      💰 {levelConfig.cost}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>⚔️ {levelConfig.damage}</span>
                    <span>⏱️ {levelConfig.attackSpeed}s</span>
                    <span>📏 {levelConfig.range}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTowerType && (
        <p className="text-sm text-purple-400 mt-3 text-center animate-pulse">
          点击地图上的建造点放置防御塔
        </p>
      )}
    </div>
  );
}
