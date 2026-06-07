import { useGameStore } from '@/game/store';
import { Play, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StartScreen() {
  const { startGame, status } = useGameStore();
  const [particles, setParticles] = useState<{ x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  if (status !== 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-game-bg via-game-panel to-game-bg overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center px-4">
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>

          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
            魔法塔防
          </h1>
          <h2 className="text-2xl text-purple-300 mb-2">卡牌之战</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            建造防御塔，释放魔法卡牌，守护你的领地！
          </p>
        </div>

        <div className="flex justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="text-4xl mb-2">🏹</div>
            <div className="text-sm text-gray-400">箭塔</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🔮</div>
            <div className="text-sm text-gray-400">法师塔</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">❄️</div>
            <div className="text-sm text-gray-400">冰冻塔</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {['🔥', '🧊', '⚡', '💚', '💰', '💪'].map((icon, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-lg bg-game-panel/80 border border-game-magic/30 flex items-center justify-center text-2xl"
            >
              {icon}
            </div>
          ))}
        </div>

        <button
          onClick={startGame}
          className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xl font-bold rounded-full transition-all duration-300 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-3">
            <Play className="w-6 h-6" />
            开始游戏
          </span>
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="mt-10 text-sm text-gray-500 max-w-lg mx-auto">
          <p className="mb-2">🎮 游戏玩法</p>
          <p>
            在建造点放置防御塔来阻击敌人，使用卡牌释放强力技能。
            每波开始时会抽取新卡牌，合理搭配塔和卡牌来守护你的领地！
          </p>
        </div>
      </div>
    </div>
  );
}
