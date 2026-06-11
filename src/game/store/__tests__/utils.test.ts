import { describe, it, expect } from 'vitest';
import { moveEnemyAlongPath, isBuildable, getDistance, getEnemyWorldPosition, getTowerWorldPosition } from '../utils';
import type { Enemy, Tower, Position } from '../../types';

function createEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy_1',
    type: 'normal',
    position: { x: 75, y: 25 },
    health: 100,
    maxHealth: 100,
    speed: 50,
    pathIndex: 0,
    slowEffect: 0,
    slowDuration: 0,
    freezeDuration: 0,
    poisonDamage: 0,
    poisonDuration: 0,
    reward: 10,
    ...overrides,
  };
}

function createTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 'tower_1',
    type: 'arrow',
    position: { x: 2, y: 3 },
    level: 1,
    lastAttackTime: 0,
    angle: 0,
    ...overrides,
  };
}

describe('moveEnemyAlongPath', () => {
  const path: Position[] = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ];

  it('moves enemy along path correctly with normal speed', () => {
    const enemy = createEnemy({ pathIndex: 0, position: { x: 75, y: 25 } });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(result).toBe(false);
    expect(enemy.position.y).toBeGreaterThan(25);
  });

  it('enemy with freezeDuration > 0 does not move, freezeDuration decreases', () => {
    const enemy = createEnemy({
      freezeDuration: 3,
      position: { x: 75, y: 25 },
      pathIndex: 0,
    });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(result).toBe(false);
    expect(enemy.position.x).toBe(75);
    expect(enemy.position.y).toBe(25);
    expect(enemy.freezeDuration).toBe(2);
  });

  it('enemy with slowEffect moves at reduced speed', () => {
    const enemy = createEnemy({
      speed: 100,
      slowEffect: 0.5,
      slowDuration: 5,
      pathIndex: 0,
      position: { x: 75, y: 25 },
    });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(result).toBe(false);
    expect(enemy.position.y).toBeGreaterThan(25);
    expect(enemy.slowDuration).toBe(4);
  });

  it('enemy reaches end of path and returns true', () => {
    const enemy = createEnemy({
      pathIndex: 1,
      position: { x: 75, y: 124.5 },
    });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(result).toBe(true);
  });

  it('enemy at last path point returns true', () => {
    const enemy = createEnemy({
      pathIndex: 2,
      position: { x: 75, y: 125 },
    });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(result).toBe(true);
  });

  it('enemy advances pathIndex when reaching a waypoint', () => {
    const enemy = createEnemy({
      pathIndex: 0,
      position: { x: 75, y: 74.9 },
    });
    const result = moveEnemyAlongPath(enemy, 1, path);
    expect(enemy.pathIndex).toBe(1);
    expect(result).toBe(false);
  });
});

describe('isBuildable', () => {
  const buildablePositions: Position[] = [
    { x: 2, y: 3 },
    { x: 4, y: 5 },
  ];

  it('returns true for valid buildable position with no tower', () => {
    const result = isBuildable({ x: 4, y: 5 }, [], buildablePositions);
    expect(result).toBe(true);
  });

  it('returns false for position not in buildablePositions', () => {
    const result = isBuildable({ x: 9, y: 9 }, [], buildablePositions);
    expect(result).toBe(false);
  });

  it('returns false for position already occupied by a tower', () => {
    const towers = [createTower({ position: { x: 2, y: 3 } })];
    const result = isBuildable({ x: 2, y: 3 }, towers, buildablePositions);
    expect(result).toBe(false);
  });

  it('returns false for position not in buildable list even with no tower', () => {
    const result = isBuildable({ x: 0, y: 0 }, [], buildablePositions);
    expect(result).toBe(false);
  });
});

describe('getDistance', () => {
  it('returns correct distance between two points', () => {
    const a: Position = { x: 0, y: 0 };
    const b: Position = { x: 3, y: 4 };
    expect(getDistance(a, b)).toBeCloseTo(5);
  });

  it('returns 0 for same point', () => {
    const a: Position = { x: 5, y: 5 };
    expect(getDistance(a, a)).toBe(0);
  });
});

describe('getEnemyWorldPosition', () => {
  it('returns enemy position directly', () => {
    const enemy = createEnemy({ position: { x: 123, y: 456 } });
    const result = getEnemyWorldPosition(enemy);
    expect(result).toEqual({ x: 123, y: 456 });
  });
});

describe('getTowerWorldPosition', () => {
  it('converts grid position to world position using TILE_SIZE 50', () => {
    const tower = createTower({ position: { x: 2, y: 3 } });
    const result = getTowerWorldPosition(tower);
    expect(result).toEqual({ x: 125, y: 175 });
  });
});
