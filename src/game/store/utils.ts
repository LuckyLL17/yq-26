import type { Tower, Enemy, Position } from '../types';
import { TILE_SIZE } from '../config';

let idCounter = 0;
export const generateId = () => `id_${++idCounter}`;

export const resetIdCounter = () => {
  idCounter = 0;
};

export function isBuildable(
  position: Position,
  towers: Tower[],
  buildablePositions: Position[]
): boolean {
  const isOnBuildSpot = buildablePositions.some(
    (p) => p.x === position.x && p.y === position.y
  );
  if (!isOnBuildSpot) return false;
  const hasTower = towers.some(
    (t) => t.position.x === position.x && t.position.y === position.y
  );
  return !hasTower;
}

export function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getEnemyWorldPosition(enemy: Enemy): Position {
  return {
    x: enemy.position.x,
    y: enemy.position.y,
  };
}

export function getTowerWorldPosition(tower: Tower): Position {
  return {
    x: tower.position.x * TILE_SIZE + TILE_SIZE / 2,
    y: tower.position.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function moveEnemyAlongPath(
  enemy: Enemy,
  deltaTime: number,
  path: Position[]
): boolean {
  if (enemy.freezeDuration > 0) {
    enemy.freezeDuration -= deltaTime;
    return false;
  }

  let currentSpeed = enemy.speed;
  if (enemy.slowDuration > 0) {
    currentSpeed *= 1 - enemy.slowEffect;
    enemy.slowDuration -= deltaTime;
  }

  const targetPathPoint = path[enemy.pathIndex + 1];
  if (!targetPathPoint) {
    return true;
  }

  const targetX = targetPathPoint.x * TILE_SIZE + TILE_SIZE / 2;
  const targetY = targetPathPoint.y * TILE_SIZE + TILE_SIZE / 2;
  const currentX = enemy.position.x;
  const currentY = enemy.position.y;

  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) {
    enemy.pathIndex++;
    if (enemy.pathIndex >= path.length - 1) {
      return true;
    }
    return false;
  }

  const moveDistance = currentSpeed * deltaTime;
  const ratio = Math.min(moveDistance / distance, 1);

  enemy.position.x += dx * ratio;
  enemy.position.y += dy * ratio;

  return false;
}
