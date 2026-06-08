import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';
import { ENEMY_CONFIGS, INITIAL_LIVES } from '@/game/config';
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

  const [goldAnimating, setGoldAnimating] = useState(false);
  const [manaAnimating, setManaAnimating] = useState(false);
  const [livesAnimating, setLivesAnimating] = useState(false);
  const prevGoldRef = useRef(gold);
  const prevManaRef = useRef(mana);
  const prevLivesRef = useRef(lives);

  const lowHealthThreshold = INITIAL_LIVES * 0.3;
  const isLowHealth = lives <= lowHealthThreshold && status === 'playing';

  useEffect(() => {
    if (prevGoldRef.current !== gold) {
      setGoldAnimating(true);
      const timer = setTimeout(() => setGoldAnimating(false), 500);
      prevGoldRef.current = gold;
      return () => clearTimeout(timer);
    }
  }, [gold]);

  useEffect(() => {
    if (prevManaRef.current !== mana) {
      setManaAnimating(true);
      const timer = setTimeout(() => setManaAnimating(false), 500);
      prevManaRef.current = mana;
      return () => clearTimeout(timer);
    }
  }, [mana]);

  useEffect(() => {
    if (prevLivesRef.current !== lives) {
      setLivesAnimating(true);
      const timer = setTimeout(() => setLivesAnimating(false), 500);
      prevLivesRef.current = lives;
      return () => clearTimeout(timer);
    }
  }, [lives]);

  const manaPercent = (mana / maxMana) * 100;
  const displayMaxWaves = gameMode === 'endless' ? '∞' : maxWaves;
  const showNextWavePreview = !waveInProgress && nextWaveConfig && status !== 'won' && status !== 'lost';
  const showCountdown = showNextWavePreview && isCountdownActive;

  const getTotalEnemies = () => {
    if (!nextWaveConfig) return 0;
    return nextWaveConfig.enemies.reduce((sum, e) => sum + e.count, 0);
  };

  const livesContainerClass = `flex items-center gap-2 transition-all duration-200 ${livesAnimating ? 'scale-110' : 'scale-100'}`;
  const heartClass = `w-6 h-6 transition-all duration-300 ${isLowHealth ? 'text-red-400 fill-red-400 animate-pulse' : 'text-red-500 fill-red-500'}`;
  const livesTextClass = `text-xl font-bold transition-all duration-200 ${isLowHealth ? 'text-red-400 animate-pulse' : 'text-white'} ${livesAnimating ? 'scale-125' : 'scale-100'}`;

  const goldContainerClass = `flex items-center gap-2 transition-all duration-200 ${goldAnimating ? 'scale-110' : 'scale-100'}`;
  const coinsClass = `w-6 h-6 transition-all duration-300 ${goldAnimating ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-400 fill-yellow-400'}`;
  const goldTextClass = `text-xl font-bold transition-all duration-200 ${goldAnimating ? 'text-yellow-300 scale-125' : 'text-yellow-400'}`;
  const goldTextStyle = {
    animation: goldAnimating ? 'gold-shine 0.5s ease-in-out' : 'none',
    textShadow: goldAnimating ? '0 0 10px rgba(250, 204, 21, 0.8)' : 'none',
  };

  const manaContainerClass = `flex items-center gap-2 transition-all duration-200 ${manaAnimating ? 'scale-105' : 'scale-100'}`;
  const zapClass = `w-6 h-6 transition-all duration-300 ${manaAnimating ? 'text-blue-300 fill-blue-300' : 'text-blue-400 fill-blue-400'}`;
  const manaTextClass = `text-sm font-semibold w-12 transition-all duration-200 ${manaAnimating ? 'text-blue-200' : 'text-blue-300'}`;
  const manaTextStyle = {
    animation: manaAnimating ? 'mana-glow 0.5s ease-in-out' : 'none',
  };

  return (
    <div className="flex items-center justify-between bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className={livesContainerClass}>
          <Heart className={heartClass} />
          <span className={livesTextClass}>
            {lives}
          </span>
        </div>

        <div className={goldContainerClass}>
          <Coins className={coinsClass} />
          <span className={goldTextClass} style={goldTextStyle}>
            {gold}
          </span>
        </div>

        <div className={manaContainerClass}>
          <Zap className={zapClass} />
          <div className="w-24 h-4 bg-game-panel-light rounded-full overflow-hidden border border-blue-500/30">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
          <span className={manaTextClass} style={manaTextStyle}>
            {Math.floor(mana)}/{maxMana}
          </span>
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
