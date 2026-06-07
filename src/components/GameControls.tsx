import { useGameStore } from '@/game/store';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

export default function GameControls() {
  const {
    status,
    waveInProgress,
    wave,
    maxWaves,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    startWave,
  } = useGameStore();

  const canStartWave = !waveInProgress && wave < maxWaves && status === 'playing';

  return (
    <div className="bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>⚙️</span> 游戏控制
      </h3>

      <div className="space-y-2">
        {status === 'idle' && (
          <button
            onClick={startGame}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
          >
            <Play className="w-5 h-5" />
            开始游戏
          </button>
        )}

        {status === 'playing' && (
          <button
            onClick={pauseGame}
            className="w-full py-2 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Pause className="w-5 h-5" />
            暂停
          </button>
        )}

        {status === 'paused' && (
          <button
            onClick={resumeGame}
            className="w-full py-2 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            继续
          </button>
        )}

        {(status === 'playing' || status === 'paused') && (
          <>
            <button
              onClick={startWave}
              disabled={!canStartWave}
              className={`
                w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2
                ${canStartWave
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <SkipForward className="w-5 h-5" />
              {waveInProgress ? '战斗进行中...' : `开始第 ${wave + 1} 波`}
            </button>

            <button
              onClick={restartGame}
              className="w-full py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新开始
            </button>
          </>
        )}

        {(status === 'won' || status === 'lost') && (
          <button
            onClick={restartGame}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            再来一局
          </button>
        )}
      </div>

      <div className="mt-4 p-3 bg-game-panel-light/50 rounded-lg">
        <h4 className="text-sm font-bold text-gray-300 mb-2">📖 操作说明</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 选择防御塔后点击建造点放置</li>
          <li>• 选择卡牌后点击目标释放技能</li>
          <li>• 部分卡牌需要选择目标位置</li>
          <li>• 击败敌人获得金币和分数</li>
        </ul>
      </div>
    </div>
  );
}
