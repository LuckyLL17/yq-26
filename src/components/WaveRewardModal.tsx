import { useGameStore } from '@/game/store';
import { RARITY_COLORS, RARITY_NAMES } from '@/game/config';
import { Gift, SkipForward } from 'lucide-react';

export default function WaveRewardModal() {
  const { status, waveRewardCards, wave, collectWaveReward, skipWaveReward } = useGameStore();

  if (status !== 'wave_reward') return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-game-panel border-2 border-game-magic/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl shadow-game-magic/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg shadow-yellow-500/30">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">第 {wave} 波完成！</h2>
          <p className="text-gray-400">选择一张卡牌加入你的牌组</p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {waveRewardCards.map((card) => {
            const rarityColor = RARITY_COLORS[card.rarity];
            
            return (
              <button
                key={card.id}
                onClick={() => collectWaveReward(card.id)}
                className="relative w-28 h-40 rounded-xl border-2 transition-all duration-300
                  flex flex-col items-center justify-between p-3
                  bg-gradient-to-b from-game-panel-light to-game-panel
                  hover:scale-110 hover:-translate-y-2 cursor-pointer
                  group"
                style={{
                  borderColor: rarityColor + '80',
                  boxShadow: `0 0 20px ${rarityColor}30`,
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-game-panel"
                  style={{ backgroundColor: rarityColor }}
                >
                  {card.manaCost}
                </div>

                <div
                  className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: rarityColor + '30',
                    color: rarityColor,
                  }}
                >
                  {RARITY_NAMES[card.rarity]}
                </div>

                <div className="text-4xl mt-6">{card.icon}</div>

                <div className="text-center">
                  <div className="text-sm font-bold text-white mb-1">{card.name}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-2">
                    {card.description}
                  </div>
                </div>

                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 30px ${rarityColor}40`,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={skipWaveReward}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200"
          >
            <SkipForward className="w-4 h-4" />
            跳过（全部加入弃牌堆）
          </button>
        </div>
      </div>
    </div>
  );
}
