import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/game/store';
import { useSettingsStore } from '@/game/settingsStore';
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
    selectedTowerId,
    selectedCard,
    buildTower,
    selectTower,
    playCard,
    tick,
  } = useGameStore();

  const canvasWidth = MAP_WIDTH * TILE_SIZE;
  const canvasHeight = MAP_HEIGHT * TILE_SIZE;

  const {
    backgroundTheme,
    particleIntensity,
    trailEffect,
    glowEffect,
    screenShake,
  } = useSettingsStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx, canvasWidth, canvasHeight);
    renderer.setSettings({
      backgroundTheme,
      particleIntensity,
      trailEffect,
      glowEffect,
      screenShake,
    });
    rendererRef.current = renderer;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.setSettings({
      backgroundTheme,
      particleIntensity,
      trailEffect,
      glowEffect,
      screenShake,
    });
  }, [backgroundTheme, particleIntensity, trailEffect, glowEffect, screenShake]);

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
    const path = currentState.getPath();
    const buildablePositions = currentState.getBuildablePositions();
    
    renderer.render(
      currentState.towers,
      currentState.enemies,
      currentState.projectiles,
      currentState.effects,
      currentState.selectedTowerType,
      currentState.selectedTowerId,
      currentState.selectedCard?.type || null,
      mousePosition,
      clampedDelta,
      path,
      buildablePositions
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
    } else {
      const clickedTower = towers.find((tower) => {
        const towerX = tower.position.x * TILE_SIZE + TILE_SIZE / 2;
        const towerY = tower.position.y * TILE_SIZE + TILE_SIZE / 2;
        const dist = Math.sqrt((x - towerX) ** 2 + (y - towerY) ** 2);
        return dist <= TILE_SIZE * 0.4;
      });

      if (clickedTower) {
        if (selectedTowerId === clickedTower.id) {
          selectTower(null);
        } else {
          selectTower(clickedTower.id);
        }
      } else {
        selectTower(null);
      }
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
