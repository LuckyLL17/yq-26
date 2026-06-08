import { useGameStore } from '@/game/store';
import { ENEMY_CONFIGS } from '@/game/config';
import type { EnemyType } from '@/game/types';
import { Heart, Coins, Zap, Trophy, Layers, Clock, Eye } from 'lucide-react';

export default function StatusBar() {
  const {
    lives,
    gold,
    mana,
    maxMana,
    wave,
    maxWaves,
    score,
    waveInProgress,
    isCountdownActive,
    waveCountdown,
    nextWaveConfig,
    gameMode,
    status,
  } = useGameStore();

  const manaPercent = (mana / maxMana) * 100;
  const displayMaxWaves = gameMode === 'endless' ? '∞' : maxWaves;
  const showNextWavePreview = !waveInProgress && nextWaveConfig && status !== 'won' && status !== 'lost';
  const showCountdown = showNextWavePreview && isCountdownActive;

  const getTotalEnemies = () => {
    if (!nextWaveConfig) return 0;
    return nextWaveConfig.enemies.reduce((sum, e) => sum + e.count, 0);
  };

  return (
    <div className="flex items-center justify-between bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <span className="text-xl font-bold text-white">{lives}</span>
        </div>

        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">{gold}</span>
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400 fill-blue-400" />
          <div className="w-24 h-4 bg-game-panel-light rounded-full overflow-hidden border border-blue-500/30">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
          <span className="text-sm text-blue-300 w-12">{Math.floor(mana)}/{maxMana}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <span className="text-white">
            第 <span className="text-purple-400 font-bold text-lg">{wave}</span> / {displayMaxWaves} 波
          </span>
          {waveInProgress && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full animate-pulse">
              进行中
            </span>
          )}
          {gameMode === 'endless' && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
              无尽模式
            </span>
          )}
        </div>

        {showCountdown && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">
              下一波倒计时: {Math.ceil(waveCountdown)}秒
            </span>
          </div>
        )}

        {showNextWavePreview && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-game-panel-light/80 rounded-lg border border-game-magic/20">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">下一波 ({getTotalEnemies()}个敌人):</span>
            <div className="flex items-center gap-2">
              {nextWaveConfig.enemies.map((enemy, idx) => {
                const config = ENEMY_CONFIGS[enemy.type as EnemyType];
                if (!config) return null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1"
                    title={`${config.name} x${enemy.count}`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-gray-300 text-sm font-medium">x{enemy.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <span className="text-yellow-400 font-bold text-lg">{score}</span>
      </div>
    </div>
  );
}
