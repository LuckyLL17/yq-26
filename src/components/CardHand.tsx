import { useGameStore } from '@/game/store';
import { RARITY_COLORS, RARITY_NAMES } from '@/game/config';
import type { Card } from '@/game/types';

export default function CardHand() {
  const { hand, selectedCard, selectCard, mana, deck, discardPile, status } = useGameStore();

  const canUseCard = (card: Card) => mana >= card.manaCost && status === 'playing';

  const isTargetedCard = (cardType: string) => {
    return ['fireball', 'freeze', 'meteor'].includes(cardType);
  };

  return (
    <div className="bg-game-panel/90 backdrop-blur-sm rounded-xl p-4 border border-game-magic/30 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🃏</span> 卡牌
        </h3>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>牌库: {deck.length}</span>
          <span>弃牌: {discardPile.length}</span>
        </div>
      </div>

      <div className="flex justify-center gap-2 min-h-[140px] items-end">
        {hand.map((card, index) => {
          const canUse = canUseCard(card);
          const isSelected = selectedCard?.id === card.id;
          const rotation = (index - (hand.length - 1) / 2) * 5;

          return (
            <button
              key={card.id}
              onClick={() => canUse && selectCard(isSelected ? null : card)}
              disabled={!canUse}
              className={`
                relative w-20 h-28 rounded-lg border-2 transition-all duration-300
                flex flex-col items-center justify-between p-2
                ${isSelected
                  ? 'border-game-gold bg-gradient-to-b from-game-panel-light to-game-panel -translate-y-4 shadow-xl shadow-game-gold/30 scale-110 z-10'
                  : canUse
                    ? 'border-game-magic/50 bg-gradient-to-b from-game-panel-light to-game-panel hover:-translate-y-2 hover:border-game-magic hover:shadow-lg hover:shadow-game-magic/30'
                    : 'border-gray-700 bg-gray-800/50 opacity-60 cursor-not-allowed'
                }
              `}
              style={{
                transform: `rotate(${rotation}deg) ${isSelected ? 'translateY(-16px) scale(1.1)' : ''}`,
                borderColor: !isSelected && canUse ? RARITY_COLORS[card.rarity] + '80' : undefined,
                boxShadow: !isSelected && canUse && card.rarity !== 'common'
                  ? `0 0 10px ${RARITY_COLORS[card.rarity]}40`
                  : undefined,
              }}
            >
              <div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-game-panel"
                style={{ backgroundColor: RARITY_COLORS[card.rarity] }}
              >
                {card.manaCost}
              </div>

              <div
                className="absolute top-1 left-1 text-[8px] font-bold px-1 rounded"
                style={{
                  backgroundColor: RARITY_COLORS[card.rarity] + '30',
                  color: RARITY_COLORS[card.rarity],
                }}
              >
                {RARITY_NAMES[card.rarity]}
              </div>

              <div className="text-3xl mt-4">{card.icon}</div>

              <div className="text-center">
                <div className="text-xs font-bold text-white">{card.name}</div>
              </div>

              {isSelected && isTargetedCard(card.type) && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-game-gold whitespace-nowrap animate-pulse">
                  选择目标
                </div>
              )}
            </button>
          );
        })}

        {hand.length === 0 && (
          <div className="text-gray-500 text-sm">
            手牌为空
          </div>
        )}
      </div>

      {selectedCard && (
        <div className="mt-4 p-3 bg-game-panel-light/50 rounded-lg border border-game-magic/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selectedCard.icon}</span>
            <span className="font-bold text-white">{selectedCard.name}</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: RARITY_COLORS[selectedCard.rarity] + '30',
                color: RARITY_COLORS[selectedCard.rarity],
              }}
            >
              {RARITY_NAMES[selectedCard.rarity]}
            </span>
            <span className="text-blue-400 text-sm ml-auto">消耗 {selectedCard.manaCost} 法力</span>
          </div>
          <p className="text-sm text-gray-300">{selectedCard.description}</p>
          {isTargetedCard(selectedCard.type) ? (
            <p className="text-xs text-game-gold mt-2">💡 点击地图选择目标位置</p>
          ) : (
            <p className="text-xs text-game-green mt-2">💡 再次点击卡牌使用</p>
          )}
        </div>
      )}
    </div>
  );
}
