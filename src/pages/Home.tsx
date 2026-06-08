import GameCanvas from '@/components/GameCanvas';
import StatusBar from '@/components/StatusBar';
import TowerPanel from '@/components/TowerPanel';
import TowerUpgradePanel from '@/components/TowerUpgradePanel';
import CardHand from '@/components/CardHand';
import GameControls from '@/components/GameControls';
import StartScreen from '@/components/StartScreen';
import GameOverModal from '@/components/GameOverModal';
import WaveRewardModal from '@/components/WaveRewardModal';
import BattleLog from '@/components/BattleLog';
import { useGameStore } from '@/game/store';

export default function Home() {
  const { status, selectedTowerId } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg via-game-panel to-game-bg">
      <StartScreen />
      <GameOverModal />
      <WaveRewardModal />

      {status !== 'idle' && (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ⚔️ 魔法塔防：卡牌之战 ⚔️
            </h1>
          </div>

          <div className="mb-4">
            <StatusBar />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-64 flex-shrink-0 order-2 lg:order-1 space-y-4">
              <TowerPanel />
              {selectedTowerId && <TowerUpgradePanel />}
            </div>

            <div className="flex-1 order-1 lg:order-2 flex justify-center">
              <GameCanvas />
            </div>

            <div className="lg:w-64 flex-shrink-0 order-3 space-y-4">
              <GameControls />
              <BattleLog />
            </div>
          </div>

          <div className="mt-4">
            <CardHand />
          </div>

          <div className="text-center mt-4 text-gray-600 text-sm">
            <p>💡 提示：建造防御塔阻击敌人，点击已建造的塔可以升级！</p>
          </div>
        </div>
      )}
    </div>
  );
}
