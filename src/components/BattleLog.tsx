import { useGameStore } from '@/game/store';
import type { BattleLogType } from '@/game/types';
import { ScrollText, Settings } from 'lucide-react';
import { useState } from 'react';

const logTypeConfig: Record<BattleLogType, { icon: string; color: string; bgColor: string; label: string }> = {
  build: { icon: '🏗️', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: '建造' },
  upgrade: { icon: '⬆️', color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: '升级' },
  sell: { icon: '💰', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: '出售' },
  kill: { icon: '⚔️', color: 'text-red-400', bgColor: 'bg-red-500/10', label: '击杀' },
  damage: { icon: '💥', color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: '伤害' },
  wave: { icon: '🌊', color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: '波次' },
  card: { icon: '🃏', color: 'text-pink-400', bgColor: 'bg-pink-500/10', label: '卡牌' },
  heal: { icon: '💚', color: 'text-green-400', bgColor: 'bg-green-500/10', label: '治疗' },
  gold: { icon: '🪙', color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: '金币' },
  warning: { icon: '⚠️', color: 'text-red-500', bgColor: 'bg-red-500/10', label: '警告' },
  info: { icon: 'ℹ️', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: '信息' },
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function BattleLog() {
  const { battleLogs } = useGameStore();
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <div className="bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-purple-400" />
          战斗日志
        </h3>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            autoScroll
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
          }`}
          title={autoScroll ? '自动滚动已开启' : '自动滚动已关闭'}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
        <span>共 {battleLogs.length} 条记录</span>
        <span className={autoScroll ? 'text-purple-400' : 'text-gray-500'}>
          {autoScroll ? '● 自动滚动' : '○ 手动滚动'}
        </span>
      </div>

      <div
        className={`flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 ${
          autoScroll ? 'scroll-smooth' : ''
        }`}
        style={{ maxHeight: '280px' }}
      >
        {battleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <ScrollText className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">暂无战斗记录</p>
            <p className="text-xs mt-1">开始游戏后将显示战斗日志</p>
          </div>
        ) : (
          battleLogs.map((log, index) => {
            const config = logTypeConfig[log.type];
            return (
              <div
                key={log.id}
                className={`p-2 rounded-lg text-sm transition-all duration-300 ${
                  config.bgColor
                } ${index === 0 ? 'animate-pulse' : ''}`}
                style={{
                  animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`${config.color} font-medium leading-tight`}>
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
