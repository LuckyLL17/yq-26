import { useGameStore } from '@/game/store';
import { Heart, Coins, Zap, Trophy, Layers } from 'lucide-react';

export default function StatusBar() {
  const { lives, gold, mana, maxMana, wave, maxWaves, score, waveInProgress } = useGameStore();

  const manaPercent = (mana / maxMana) * 100;

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

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <span className="text-white">
            第 <span className="text-purple-400 font-bold">{wave}</span> / {maxWaves} 波
          </span>
          {waveInProgress && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full animate-pulse">
              进行中
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>
    </div>
  );
}
