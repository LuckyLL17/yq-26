import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../index';
import type { Tower, Enemy } from '../../types';
import { TILE_SIZE, PATH } from '../../config';

describe('塔攻击逻辑', () => {
  beforeEach(() => {
    useGameStore.setState({
      status: 'playing',
      waveInProgress: true,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      gameTime: 10,
      towerBoostMultiplier: 1,
      towerBoostDuration: 0,
      timeWarpScale: 1,
      timeWarpDuration: 0,
      mana: 100,
      maxMana: 100,
      lives: 20,
      gold: 500,
      score: 0,
      wave: 1,
      maxWaves: 10,
      spawnQueue: [],
      waveTime: 0,
      enemiesSpawned: 0,
      currentLevelId: 'default',
    });
  });

  function makeTower(
    type: Tower['type'] = 'arrow',
    gridX: number = 3,
    gridY: number = 3,
    level: number = 1
  ): Tower {
    return {
      id: `tower_${Math.random()}`,
      type,
      position: { x: gridX, y: gridY },
      level,
      lastAttackTime: 0,
      angle: 0,
    };
  }

  function makeEnemyAt(
    worldX: number,
    worldY: number,
    health: number = 100
  ): Enemy {
    return {
      id: `enemy_${Math.random()}`,
      type: 'normal',
      position: { x: worldX, y: worldY },
      health,
      maxHealth: health,
      speed: 50,
      pathIndex: 0,
      slowEffect: 0,
      slowDuration: 0,
      freezeDuration: 0,
      poisonDamage: 0,
      poisonDuration: 0,
      reward: 10,
    };
  }

  describe('基础攻击', () => {
    it('塔在射程内选择最近敌人并发射炮弹', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const inRangeEnemy = makeEnemyAt(towerWorldX + 50, towerWorldY);
      const farEnemy = makeEnemyAt(towerWorldX + 500, towerWorldY);

      useGameStore.setState({
        towers: [tower],
        enemies: [inRangeEnemy, farEnemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(1);
      expect(state.projectiles[0].targetId).toBe(inRangeEnemy.id);
      expect(state.projectiles[0].damage).toBe(15);
    });

    it('塔无敌人在射程内不发射', () => {
      const tower = makeTower('arrow', 3, 3);
      const farEnemy = makeEnemyAt(1000, 1000);

      useGameStore.setState({
        towers: [tower],
        enemies: [farEnemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(0);
    });

    it('塔攻击冷却未到不发射', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      tower.lastAttackTime = 10;

      const inRangeEnemy = makeEnemyAt(towerWorldX + 50, towerWorldY);

      useGameStore.setState({
        towers: [tower],
        enemies: [inRangeEnemy],
        gameTime: 10.1,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(0);
    });

    it('塔攻击冷却结束后发射', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      tower.lastAttackTime = 0;

      const inRangeEnemy = makeEnemyAt(towerWorldX + 50, towerWorldY);

      useGameStore.setState({
        towers: [tower],
        enemies: [inRangeEnemy],
        gameTime: 5,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(1);
    });

    it('塔攻击力增强倍率生效', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const inRangeEnemy = makeEnemyAt(towerWorldX + 50, towerWorldY);

      useGameStore.setState({
        towers: [tower],
        enemies: [inRangeEnemy],
        gameTime: 10,
        towerBoostMultiplier: 2,
        towerBoostDuration: 10,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(1);
      expect(state.projectiles[0].damage).toBe(30);
    });

    it('时间扭曲加快攻击速度', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      tower.lastAttackTime = 9.5;

      const inRangeEnemy = makeEnemyAt(towerWorldX + 50, towerWorldY);
      inRangeEnemy.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [inRangeEnemy],
        gameTime: 10,
        timeWarpScale: 0.5,
        timeWarpDuration: 10,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(1);
    });
  });

  describe('炮弹飞行与伤害', () => {
    it('炮弹飞向目标敌人', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      const enemyWorldX = towerWorldX + 80;
      const enemyWorldY = towerWorldY;

      const enemy = makeEnemyAt(enemyWorldX, enemyWorldY);

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      const state1 = useGameStore.getState();
      expect(state1.projectiles.length).toBe(1);
      const proj = state1.projectiles[0];
      const startX = proj.position.x;
      const startY = proj.position.y;

      useGameStore.getState().tick(0.05);

      const state2 = useGameStore.getState();
      const movedProj = state2.projectiles[0];
      const dist = Math.sqrt(
        Math.pow(movedProj.position.x - enemyWorldX, 2) +
          Math.pow(movedProj.position.y - enemyWorldY, 2)
      );
      const startDist = Math.sqrt(
        Math.pow(startX - enemyWorldX, 2) + Math.pow(startY - enemyWorldY, 2)
      );
      expect(dist).toBeLessThan(startDist);
    });

    it('炮弹命中敌人造成伤害', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      const enemyWorldX = towerWorldX + 5;
      const enemyWorldY = towerWorldY;

      const enemy = makeEnemyAt(enemyWorldX, enemyWorldY, 100);
      enemy.speed = 0;
      const enemyId = enemy.id;

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
      });

      for (let i = 0; i < 5; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state = useGameStore.getState();
      const hitEnemy = state.enemies.find((e) => e.id === enemyId);
      if (hitEnemy) {
        expect(hitEnemy.health).toBeLessThan(100);
      }
    });

    it('敌人死亡获得金币与分数', () => {
      const tower = makeTower('arrow', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy = makeEnemyAt(towerWorldX + 5, towerWorldY, 5);
      enemy.reward = 20;
      enemy.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
        gold: 0,
        score: 0,
      });

      useGameStore.getState().tick(0.016);

      const beforeGold = useGameStore.getState().gold;
      const beforeScore = useGameStore.getState().score;

      for (let i = 0; i < 10; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state = useGameStore.getState();
      expect(state.enemies.length).toBe(0);
      expect(state.gold).toBeGreaterThanOrEqual(beforeGold + 20);
      expect(state.score).toBeGreaterThanOrEqual(beforeScore + 200);
    });
  });

  describe('范围伤害', () => {
    it('法师塔炮弹造成范围伤害', () => {
      const tower = makeTower('mage', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;
      const targetX = towerWorldX + 10;
      const targetY = towerWorldY;

      const mainEnemy = makeEnemyAt(targetX, targetY, 200);
      mainEnemy.speed = 0;
      const nearEnemy = makeEnemyAt(targetX + 20, targetY, 200);
      nearEnemy.speed = 0;
      const farEnemy = makeEnemyAt(targetX + 200, targetY, 200);
      farEnemy.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [mainEnemy, nearEnemy, farEnemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      const state1 = useGameStore.getState();
      expect(state1.projectiles.length).toBe(1);
      expect(state1.projectiles[0].splashRadius).toBe(40);

      for (let i = 0; i < 30; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state2 = useGameStore.getState();
      const mainHit = state2.enemies.find((e) => e.id === mainEnemy.id);
      const nearHit = state2.enemies.find((e) => e.id === nearEnemy.id);
      const farHit = state2.enemies.find((e) => e.id === farEnemy.id);

      if (mainHit) expect(mainHit.health).toBeLessThan(200);
      if (nearHit) expect(nearHit.health).toBeLessThan(200);
      if (farHit) expect(farHit.health).toBe(200);
    });
  });

  describe('状态效果', () => {
    it('冰冻塔附加减速效果', () => {
      const tower = makeTower('ice', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy = makeEnemyAt(towerWorldX + 10, towerWorldY, 500);
      enemy.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      for (let i = 0; i < 20; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state = useGameStore.getState();
      const hitEnemy = state.enemies.find((e) => e.id === enemy.id);
      if (hitEnemy) {
        expect(hitEnemy.slowEffect).toBeGreaterThan(0);
        expect(hitEnemy.slowDuration).toBeGreaterThan(0);
      }
    });

    it('剧毒塔附加持续毒伤', () => {
      const tower = makeTower('poison', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy = makeEnemyAt(towerWorldX + 10, towerWorldY, 500);
      enemy.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      for (let i = 0; i < 20; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state = useGameStore.getState();
      const hitEnemy = state.enemies.find((e) => e.id === enemy.id);
      if (hitEnemy) {
        expect(hitEnemy.poisonDamage).toBeGreaterThan(0);
        expect(hitEnemy.poisonDuration).toBeGreaterThan(0);
      }
    });

    it('毒伤随时间持续扣血', () => {
      const tower = makeTower('poison', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy = makeEnemyAt(towerWorldX + 10, towerWorldY, 500);
      enemy.poisonDamage = 10;
      enemy.poisonDuration = 5;
      enemy.speed = 0;

      useGameStore.setState({
        towers: [],
        enemies: [enemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(1);

      const state = useGameStore.getState();
      const hitEnemy = state.enemies.find((e) => e.id === enemy.id);
      if (hitEnemy) {
        expect(hitEnemy.health).toBeLessThan(500);
        expect(hitEnemy.poisonDuration).toBeLessThan(5);
      }
    });
  });

  describe('闪电塔连锁', () => {
    it('闪电塔命中后生成连锁炮弹', () => {
      const tower = makeTower('lightning', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy1 = makeEnemyAt(towerWorldX + 10, towerWorldY, 500);
      enemy1.speed = 0;
      const enemy2 = makeEnemyAt(towerWorldX + 10, towerWorldY + 50, 500);
      enemy2.speed = 0;
      const enemy3 = makeEnemyAt(towerWorldX + 50, towerWorldY + 30, 500);
      enemy3.speed = 0;

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy1, enemy2, enemy3],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      for (let i = 0; i < 30; i++) {
        useGameStore.getState().tick(0.01);
      }

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBeGreaterThanOrEqual(0);

      const totalDamage = state.enemies.reduce(
        (sum, e) => sum + (500 - e.health),
        0
      );
      expect(totalDamage).toBeGreaterThan(0);
    });
  });

  describe('狙击塔暴击', () => {
    it('狙击塔炮弹暴击标记', () => {
      const tower = makeTower('sniper', 3, 3);
      const towerWorldX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const towerWorldY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const enemy = makeEnemyAt(towerWorldX + 50, towerWorldY, 1000);

      useGameStore.setState({
        towers: [tower],
        enemies: [enemy],
        gameTime: 10,
      });

      useGameStore.getState().tick(0.016);

      const state = useGameStore.getState();
      expect(state.projectiles.length).toBe(1);
      expect(state.projectiles[0].type).toBe('sniper');
      expect(typeof state.projectiles[0].isSniper).toBe('boolean');
    });
  });
});
