import { useGameStore } from '@/game/store';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

export default function GameOverModal() {
  const { status, score, wave, restartGame } = useGameStore();

  const isVisible = status === 'won' || status === 'lost';
  const isWin = status === 'won';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-game-panel to-game-bg rounded-2xl p-8 border-2 border-game-magic/50 shadow-2xl max-w-md w-full mx-4 animate-[scale-in_0.3s_ease-out]">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <div className={`
            w-32 h-32 rounded-full flex items-center justify-center
            ${isWin
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50'
              : 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/50'
            }
          `}>
            {isWin ? (
              <Trophy className="w-16 h-16 text-yellow-900" />
            ) : (
              <Skull className="w-16 h-16 text-red-900" />
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <h2 className={`text-4xl font-bold mb-2 ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWin ? '胜利！' : '失败'}
          </h2>
          <p className="text-gray-400 mb-6">
            {isWin ? '恭喜你成功守护了领地！' : '你的领地被敌人攻破了...'}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-game-panel-light rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-400">{score}</div>
              <div className="text-sm text-gray-400">最终得分</div>
            </div>
            <div className="bg-game-panel-light rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{wave}</div>
              <div className="text-sm text-gray-400">到达波次</div>
            </div>
          </div>

          <button
            onClick={restartGame}
            className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
