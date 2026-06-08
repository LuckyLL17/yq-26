import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { getDefaultLevel } from '@/game/levelEditor';
import { Play, Edit, Trash2, Map } from 'lucide-react';
import type { LevelData } from '@/game/types';

interface LevelSelectProps {
  onClose: () => void;
  onOpenEditor: () => void;
}

export default function LevelSelect({ onClose, onOpenEditor }: LevelSelectProps) {
  const { setLevel, startGame, currentLevelId } = useGameStore();
  const [savedLevels, setSavedLevels] = useState<LevelData[]>(() => {
    try {
      const stored = localStorage.getItem('td_custom_levels');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load levels:', e);
    }
    return [];
  });

  const defaultLevel = getDefaultLevel();

  const handlePlayLevel = (level: LevelData) => {
    setLevel(level);
    startGame();
    onClose();
  };

  const handleDeleteLevel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个关卡吗？')) {
      const newLevels = savedLevels.filter((l) => l.id !== id);
      setSavedLevels(newLevels);
      localStorage.setItem('td_custom_levels', JSON.stringify(newLevels));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-game-panel to-game-bg rounded-2xl border border-game-magic/30 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-game-magic/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="w-8 h-8 text-game-gold" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-game-gold to-purple-400 bg-clip-text text-transparent">
                选择关卡
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="text-sm font-bold text-game-gold mb-3 flex items-center gap-2">
            <span>🏆</span> 官方关卡
          </h3>
          
          <div
            onClick={() => handlePlayLevel(defaultLevel)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all mb-6 ${
              currentLevelId === 'default'
                ? 'bg-game-magic/20 border-game-gold/60'
                : 'bg-game-dark/50 border-game-magic/20 hover:border-game-magic/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">{defaultLevel.name}</h4>
                <p className="text-sm text-gray-400 mt-1">{defaultLevel.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>🎯 {defaultLevel.waves.length} 波</span>
                  <span>🏗️ {defaultLevel.buildablePositions.length} 建造位</span>
                  <span>💰 {defaultLevel.initialGold} 初始金币</span>
                  <span>❤️ {defaultLevel.initialLives} 初始生命</span>
                </div>
              </div>
              <button className="p-3 bg-green-600 hover:bg-green-500 rounded-full transition-colors">
                <Play className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-game-gold flex items-center gap-2">
              <span>✨</span> 自定义关卡
            </h3>
            <button
              onClick={onOpenEditor}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              关卡编辑器
            </button>
          </div>

          {savedLevels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🗺️</div>
              <p>暂无自定义关卡</p>
              <p className="text-sm mt-2">点击右上角"关卡编辑器"创建你的专属关卡！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedLevels.map((level) => (
                <div
                  key={level.id}
                  onClick={() => handlePlayLevel(level)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                    currentLevelId === level.id
                      ? 'bg-game-magic/20 border-game-gold/60'
                      : 'bg-game-dark/50 border-game-magic/20 hover:border-game-magic/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{level.name}</h4>
                      {level.description && (
                        <p className="text-sm text-gray-400 mt-1">{level.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>🎯 {level.waves.length} 波</span>
                        <span>🏗️ {level.buildablePositions.length} 建造位</span>
                        <span>💰 {level.initialGold} 金币</span>
                        <span>❤️ {level.initialLives} 生命</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteLevel(level.id, e)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-3 bg-green-600 hover:bg-green-500 rounded-full transition-colors">
                        <Play className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
