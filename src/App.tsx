import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import LevelEditor from "@/components/LevelEditor";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/game/store";
import { loadLevelFromStorage } from "@/game/store";

function EditorPage() {
  const navigate = useNavigate();
  const { setLevel, startGame, currentLevelId } = useGameStore();

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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
