import { useNavigate } from "react-router-dom";
import LevelEditor from "@/components/LevelEditor";
import { useGameStore, loadLevelFromStorage } from "@/game/store";

export default function EditorPage() {
  const navigate = useNavigate();
  const { setLevel, startGame } = useGameStore();

  const handlePlay = (levelId: string) => {
    const level = loadLevelFromStorage(levelId);
    if (level) {
      setLevel(level);
      startGame();
      navigate('/');
    }
  };

  return <LevelEditor onBack={() => navigate('/')} onPlay={handlePlay} />;
}
