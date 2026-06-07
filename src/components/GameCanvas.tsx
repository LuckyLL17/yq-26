import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/game/store';
import { GameRenderer } from '@/game/renderer';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/game/config';
import type { Position } from '@/game/types';

interface GameCanvasProps {
  onCardTargetSelect?: (position: Position) => void;
}

export default function GameCanvas({ onCardTargetSelect }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [mousePosition, setMousePosition] = useState<Position | null>(null);

  const {
    status,
    towers,
    enemies,
    projectiles,
    effects,
    selectedTowerType,
    selectedCard,
    buildTower,
    playCard,
    tick,
  } = useGameStore();

  const canvasWidth = MAP_WIDTH * TILE_SIZE;
  const canvasHeight = MAP_HEIGHT * TILE_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx, canvasWidth, canvasHeight);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasWidth, canvasHeight]);

  const gameLoop = useCallback((timestamp: number) => {
    const renderer = rendererRef.current;
    if (!renderer) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;

    const clampedDelta = Math.min(deltaTime, 0.1);

    if (status === 'playing') {
      tick(clampedDelta);
    }

    const currentState = useGameStore.getState();
    renderer.render(
      currentState.towers,
      currentState.enemies,
      currentState.projectiles,
      currentState.effects,
      currentState.selectedTowerType,
      currentState.selectedCard?.type || null,
      mousePosition,
      clampedDelta
    );

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [status, tick, mousePosition]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);

    if (selectedTowerType) {
      buildTower({ x: gridX, y: gridY });
    } else if (selectedCard) {
      playCard({ x, y });
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-lg border-2 border-game-magic/30 shadow-2xl cursor-crosshair"
        style={{ maxWidth: '100%', height: 'auto' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
}
