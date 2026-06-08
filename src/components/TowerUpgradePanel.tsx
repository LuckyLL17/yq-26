import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { TOWER_CONFIGS, getTowerLevelConfig } from '@/game/config';

export default function TowerUpgradePanel() {
  const { selectedTowerId, towers, gold, upgradeTower, sellTower, selectTower, status } = useGameStore();
  const [isVisible, setIsVisible] = useState(false);

  const tower = towers.find((t) => t.id === selectedTowerId);

  useEffect(() => {
    if (tower) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedTowerId, tower]);

  if (!tower) return null;

  const config = TOWER_CONFIGS[tower.type];
  const currentLevelConfig = getTowerLevelConfig(tower.type, tower.level);
  const nextLevelConfig = tower.level < config.maxLevel ? getTowerLevelConfig(tower.type, tower.level + 1) : null;
  const isMaxLevel = tower.level >= config.maxLevel;
  const canUpgrade = nextLevelConfig && gold >= nextLevelConfig.cost && status === 'playing';
  const upgradeCost = nextLevelConfig?.cost || 0;

  let totalCost = 0;
  for (let i = 0; i < tower.level; i++) {
    totalCost += config.levels[i].cost;
  }
  const sellValue = Math.floor(totalCost * 0.7);

  const handleUpgrade = () => {
    if (canUpgrade) {
      upgradeTower(tower.id);
    }
  };

  const handleSell = () => {
    if (status === 'playing') {
      sellTower(tower.id);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => selectTower(null), 200);
  };

  const renderStatBar = (
    label: string,
    currentValue: number,
    nextValue: number | undefined,
    icon: string,
    format: (v: number) => string = (v) => v.toString()
  ) => {
    const hasUpgrade = nextValue !== undefined && nextValue !== currentValue;
    const isImproved = nextValue !== undefined && nextValue > currentValue;
    const isReduced = nextValue !== undefined && nextValue < currentValue;

    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">{format(currentValue)}</span>
          {hasUpgrade && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                isImproved
                  ? 'text-green-400 bg-green-400/10'
                  : isReduced
                  ? 'text-red-400 bg-red-400/10'
                  : 'text-gray-400 bg-gray-400/10'
              }`}
            >
              {isImproved ? '+' : ''}
              {nextValue !== undefined ? format(nextValue - currentValue) : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-game-panel/95 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/40 shadow-lg shadow-yellow-500/10 relative transition-all duration-300 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-all duration-200 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 hover:rotate-90"
      >
        ✕
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl relative"
          style={{ 
            backgroundColor: config.color + '30',
            boxShadow: `0 0 20px ${config.color}40, inset 0 0 20px ${config.color}20`
          }}
        >
          <span className="animate-pulse">{config.icon}</span>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-game-panel border-2 flex items-center justify-center text-xs font-bold"
            style={{ borderColor: config.color, color: config.color }}
          >
            {tower.level}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{config.name}</h3>
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: config.maxLevel }).map((_, i) => (
              <span
                key={i}
                className={`text-base transition-all duration-300 ${
                  i < tower.level 
                    ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]' 
                    : 'text-gray-600'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
        </div>
      </div>

      <div className="space-y-1 border-t border-b border-white/10 py-3 mb-3">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
          当前属性
          {nextLevelConfig && <span className="text-yellow-500 ml-2">→ 下一级增益</span>}
        </div>

        {renderStatBar(
          '攻击力',
          currentLevelConfig.damage,
          nextLevelConfig?.damage,
          '⚔️'
        )}

        {renderStatBar(
          '攻击速度',
          currentLevelConfig.attackSpeed,
          nextLevelConfig?.attackSpeed,
          '⏱️',
          (v) => v.toFixed(2) + 's'
        )}

        {renderStatBar(
          '攻击射程',
          currentLevelConfig.range,
          nextLevelConfig?.range,
          '📏'
        )}

        {currentLevelConfig.splashRadius !== undefined &&
          renderStatBar(
            '范围伤害',
            currentLevelConfig.splashRadius,
            nextLevelConfig?.splashRadius,
            '💥'
          )}

        {currentLevelConfig.slowEffect !== undefined &&
          renderStatBar(
            '减速效果',
            currentLevelConfig.slowEffect * 100,
            nextLevelConfig?.slowEffect ? nextLevelConfig.slowEffect * 100 : undefined,
            '🐌',
            (v) => v.toFixed(0) + '%'
          )}

        {currentLevelConfig.slowDuration !== undefined &&
          renderStatBar(
            '减速时长',
            currentLevelConfig.slowDuration,
            nextLevelConfig?.slowDuration,
            '⏳',
            (v) => v.toFixed(1) + 's'
          )}
      </div>

      <div className="space-y-2 mt-4">
        {!isMaxLevel ? (
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className={`
              w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200
              flex items-center justify-center gap-2 relative overflow-hidden
              ${canUpgrade
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400 hover:scale-[1.02] shadow-lg shadow-yellow-500/30 active:scale-[0.98]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {canUpgrade && (
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-500" />
            )}
            <span className="relative z-10">⬆️</span>
            <span className="relative z-10">升级到 {tower.level + 1} 级</span>
            <span className="relative z-10 ml-1 bg-black/20 px-2 py-0.5 rounded-full">💰 {upgradeCost}</span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-bold text-sm shadow-lg shadow-purple-500/30 relative overflow-hidden">
            <span className="absolute inset-0 bg-white/10 animate-pulse" />
            <span className="relative z-10">✨ 已达最高等级 ✨</span>
          </div>
        )}

        <button
          onClick={handleSell}
          disabled={status !== 'playing'}
          className={`
            w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200
            flex items-center justify-center gap-2 group
            ${status === 'playing'
              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-300'
              : 'bg-gray-700/50 text-gray-500 border border-gray-600/30 cursor-not-allowed'
            }
          `}
        >
          <span className="group-hover:scale-110 transition-transform">💸</span>
          <span>出售</span>
          <span className="ml-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
            +💰 {sellValue}
          </span>
        </button>
      </div>

      {!canUpgrade && !isMaxLevel && status === 'playing' && (
        <p className="text-xs text-red-400 mt-2 text-center">
          金币不足，还差 💰 {upgradeCost - gold}
        </p>
      )}
    </div>
  );
}
