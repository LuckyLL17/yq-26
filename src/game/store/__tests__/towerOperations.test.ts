import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../index';

const DEFAULT_BUILD_POS = { x: 1, y: 3 };
const SECOND_BUILD_POS = { x: 1, y: 5 };
const NON_BUILD_POS = { x: 0, y: 0 };

function setupStore(overrides: Record<string, unknown> = {}) {
  useGameStore.setState({
    status: 'playing',
    gold: 500,
    selectedTowerType: 'arrow',
    selectedTowerId: null,
    currentLevelId: 'default',
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    battleLogs: [],
    gameTime: 0,
    ...overrides,
  });
}

function buildArrowTower(position = DEFAULT_BUILD_POS) {
  useGameStore.getState().buildTower(position);
  return useGameStore.getState().towers.find(
    (t) => t.position.x === position.x && t.position.y === position.y
  );
}

describe('buildTower', () => {
  beforeEach(() => {
    setupStore();
  });

  it('builds tower successfully - gold deducted, tower in array with correct type and position', () => {
    useGameStore.getState().buildTower(DEFAULT_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(1);
    expect(state.towers[0].type).toBe('arrow');
    expect(state.towers[0].position).toEqual(DEFAULT_BUILD_POS);
    expect(state.towers[0].level).toBe(1);
    expect(state.gold).toBe(450);
  });

  it('does not build without selectedTowerType', () => {
    useGameStore.setState({ selectedTowerType: null });
    useGameStore.getState().buildTower(DEFAULT_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(0);
    expect(state.gold).toBe(500);
  });

  it('does not build with insufficient gold', () => {
    useGameStore.setState({ gold: 30 });
    useGameStore.getState().buildTower(DEFAULT_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(0);
    expect(state.gold).toBe(30);
  });

  it('does not build on non-buildable position', () => {
    useGameStore.getState().buildTower(NON_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(0);
    expect(state.gold).toBe(500);
  });

  it('does not build on position already occupied by another tower', () => {
    buildArrowTower(DEFAULT_BUILD_POS);
    useGameStore.setState({ selectedTowerType: 'arrow' });
    useGameStore.getState().buildTower(DEFAULT_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(1);
    expect(state.gold).toBe(450);
  });

  it('clears selectedTowerType after build', () => {
    useGameStore.getState().buildTower(DEFAULT_BUILD_POS);
    const state = useGameStore.getState();

    expect(state.selectedTowerType).toBeNull();
  });
});

describe('upgradeTower', () => {
  beforeEach(() => {
    setupStore();
  });

  it('upgrades tower successfully - level increases and gold is deducted', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');
    const goldBefore = useGameStore.getState().gold;

    useGameStore.getState().upgradeTower(tower.id);
    const state = useGameStore.getState();

    const upgraded = state.towers.find((t) => t.id === tower.id);
    expect(upgraded?.level).toBe(2);
    expect(state.gold).toBe(goldBefore - 75);
  });

  it('does not upgrade tower at max level', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');

    useGameStore.getState().upgradeTower(tower.id);
    useGameStore.getState().upgradeTower(tower.id);

    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().upgradeTower(tower.id);
    const state = useGameStore.getState();

    const maxed = state.towers.find((t) => t.id === tower.id);
    expect(maxed?.level).toBe(3);
    expect(state.gold).toBe(goldBefore);
  });

  it('does not upgrade with insufficient gold', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');

    useGameStore.setState({ gold: 10 });
    useGameStore.getState().upgradeTower(tower.id);
    const state = useGameStore.getState();

    const upgraded = state.towers.find((t) => t.id === tower.id);
    expect(upgraded?.level).toBe(1);
    expect(state.gold).toBe(10);
  });

  it('does not upgrade non-existent tower', () => {
    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().upgradeTower('non_existent_id');
    const state = useGameStore.getState();

    expect(state.gold).toBe(goldBefore);
    expect(state.towers).toHaveLength(0);
  });
});

describe('sellTower', () => {
  beforeEach(() => {
    setupStore();
  });

  it('sells tower successfully - tower removed, gold increased by sell value (70% of total cost)', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');

    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().sellTower(tower.id);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(0);
    expect(state.gold).toBe(goldBefore + Math.floor(50 * 0.7));
  });

  it('sells upgraded tower with correct sell value', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');

    useGameStore.getState().upgradeTower(tower.id);
    const goldBefore = useGameStore.getState().gold;
    const totalCost = 50 + 75;
    const expectedSellValue = Math.floor(totalCost * 0.7);

    useGameStore.getState().sellTower(tower.id);
    const state = useGameStore.getState();

    expect(state.towers).toHaveLength(0);
    expect(state.gold).toBe(goldBefore + expectedSellValue);
  });

  it('does not crash when selling non-existent tower', () => {
    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().sellTower('non_existent_id');
    const state = useGameStore.getState();

    expect(state.gold).toBe(goldBefore);
  });

  it('clears selectedTowerId after sell', () => {
    const tower = buildArrowTower(DEFAULT_BUILD_POS);
    if (!tower) throw new Error('Tower not built');

    useGameStore.setState({ selectedTowerId: tower.id });
    useGameStore.getState().sellTower(tower.id);
    const state = useGameStore.getState();

    expect(state.selectedTowerId).toBeNull();
  });
});
