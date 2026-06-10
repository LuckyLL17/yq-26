import type { SetState, GetState, GameStore } from './types';
import type { Card, CardType, Position } from '../types';
import {
  CARD_CONFIGS,
  RARITY_WEIGHTS,
  WAVE_REWARD_CARD_COUNT,
  MAX_HAND_SIZE,
  TILE_SIZE,
  shuffleDeck,
} from '../config';
import { generateId, getDistance, getEnemyWorldPosition } from './utils';

export function createCardSlice(
  set: SetState,
  get: GetState
): Pick<
  GameStore,
  | 'selectCard'
  | 'playCard'
  | 'drawCards'
  | 'generateWaveRewardCards'
> {
  return {
    selectCard: (card: Card | null) => {
      const { selectedCard, mana } = get();
      if (card && card.manaCost > mana) return;
      set({
        selectedCard: selectedCard?.id === card?.id ? null : card,
        selectedTowerType: null,
        selectedTowerId: null,
      });
    },

    playCard: (targetPosition?: Position) => {
      const state = get();
      const {
        selectedCard,
        hand,
        discardPile,
        mana,
        effects,
        enemies,
        gold,
        lives,
        towerBoostMultiplier,
        towerBoostDuration,
        divineShield,
        divineShieldDuration,
        timeWarpDuration,
        timeWarpScale,
        maxMana,
      } = state;

      if (!selectedCard) return;
      if (mana < selectedCard.manaCost) return;

      const config = CARD_CONFIGS[selectedCard.type];
      const newEffects = [...effects];
      let newEnemies = [...enemies];
      let newGold = gold;
      let newLives = lives;
      let newMana = mana;
      let newTowerBoostMultiplier = towerBoostMultiplier;
      let newTowerBoostDuration = towerBoostDuration;
      let newDivineShield = divineShield;
      let newDivineShieldDuration = divineShieldDuration;
      let newTimeWarpDuration = timeWarpDuration;
      let newTimeWarpScale = timeWarpScale;
      const initialLives = get().getInitialLives();

      switch (selectedCard.type) {
        case 'fireball':
          if (targetPosition) {
            newEffects.push({
              id: generateId(),
              type: 'explosion',
              position: targetPosition,
              duration: 0.6,
              maxDuration: 0.6,
              radius: config.radius,
            });
            newEnemies = newEnemies.map((enemy) => {
              const enemyWorldPos = getEnemyWorldPosition(enemy);
              const dist = getDistance(enemyWorldPos, targetPosition);
              if (dist <= (config.radius || 0)) {
                return { ...enemy, health: enemy.health - (config.damage || 0) };
              }
              return enemy;
            });
          }
          break;

        case 'freeze':
          if (targetPosition) {
            newEffects.push({
              id: generateId(),
              type: 'freeze',
              position: targetPosition,
              duration: 1,
              maxDuration: 1,
              radius: config.radius,
            });
            newEnemies = newEnemies.map((enemy) => {
              const enemyWorldPos = getEnemyWorldPosition(enemy);
              const dist = getDistance(enemyWorldPos, targetPosition);
              if (dist <= (config.radius || 0)) {
                return { ...enemy, freezeDuration: config.duration || 3 };
              }
              return enemy;
            });
          }
          break;

        case 'lightning': {
          const damage = config.damage || 50;
          const targetCount = 3;
          const sortedEnemies = [...newEnemies].sort((a, b) => b.health - a.health);
          const targets = sortedEnemies.slice(0, targetCount);
          const targetIds = new Set(targets.map((t) => t.id));

          targets.forEach((target) => {
            newEffects.push({
              id: generateId(),
              type: 'lightning',
              position: getEnemyWorldPosition(target),
              duration: 0.3,
              maxDuration: 0.3,
            });
          });

          newEnemies = newEnemies.map((enemy) => {
            if (targetIds.has(enemy.id)) {
              return { ...enemy, health: enemy.health - damage };
            }
            return enemy;
          });
          break;
        }

        case 'heal':
          newLives = Math.min(initialLives, lives + (config.healAmount || 5));
          newEffects.push({
            id: generateId(),
            type: 'heal',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 100,
          });
          break;

        case 'gold_rain':
          newGold = gold + (config.goldAmount || 100);
          newEffects.push({
            id: generateId(),
            type: 'gold',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 80,
          });
          break;

        case 'tower_boost':
          newTowerBoostMultiplier = config.boostMultiplier || 1.5;
          newTowerBoostDuration = config.duration || 10;
          newEffects.push({
            id: generateId(),
            type: 'tower_boost',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 200,
          });
          break;

        case 'meteor':
          if (targetPosition) {
            newEffects.push({
              id: generateId(),
              type: 'meteor',
              position: targetPosition,
              duration: 1.2,
              maxDuration: 1.2,
              radius: config.radius,
            });
            newEnemies = newEnemies.map((enemy) => {
              const enemyWorldPos = getEnemyWorldPosition(enemy);
              const dist = getDistance(enemyWorldPos, targetPosition);
              if (dist <= (config.radius || 0)) {
                return { ...enemy, health: enemy.health - (config.damage || 0) };
              }
              return enemy;
            });
          }
          break;

        case 'summon':
          newEnemies = newEnemies.map((enemy) => {
            return {
              ...enemy,
              health:
                enemy.health -
                (config.summonDamage || 30) * (config.summonCount || 3),
            };
          });
          newEffects.push({
            id: generateId(),
            type: 'summon',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 150,
          });
          break;

        case 'mana_surge':
          newMana = Math.min(maxMana, mana + (config.manaAmount || 50));
          newEffects.push({
            id: generateId(),
            type: 'mana_surge',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 100,
          });
          break;

        case 'time_warp':
          newTimeWarpScale = config.timeScale || 0.5;
          newTimeWarpDuration = config.duration || 8;
          newEffects.push({
            id: generateId(),
            type: 'time_warp',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1,
            maxDuration: 1,
            radius: 200,
          });
          break;

        case 'divine_shield':
          newDivineShield = (newDivineShield || 0) + (config.shieldAmount || 10);
          newDivineShieldDuration = Math.max(
            newDivineShieldDuration,
            config.duration || 30
          );
          newEffects.push({
            id: generateId(),
            type: 'divine_shield',
            position: { x: (TILE_SIZE * 16) / 2, y: (TILE_SIZE * 10) / 2 },
            duration: 1.5,
            maxDuration: 1.5,
            radius: 120,
          });
          break;
      }

      const newHand = hand.filter((c) => c.id !== selectedCard.id);
      const newDiscardPile = [...discardPile, selectedCard];

      set({
        hand: newHand,
        discardPile: newDiscardPile,
        mana: newMana - selectedCard.manaCost,
        selectedCard: null,
        effects: newEffects,
        enemies: newEnemies,
        gold: newGold,
        lives: newLives,
        towerBoostMultiplier: newTowerBoostMultiplier,
        towerBoostDuration: newTowerBoostDuration,
        divineShield: newDivineShield,
        divineShieldDuration: newDivineShieldDuration,
        timeWarpDuration: newTimeWarpDuration,
        timeWarpScale: newTimeWarpScale,
      });

      get().addBattleLog('card', `使用了 ${selectedCard.name}`);
    },

    drawCards: (count: number) => {
      const state = get();
      let { deck, hand, discardPile } = state;

      for (let i = 0; i < count; i++) {
        if (hand.length >= MAX_HAND_SIZE) break;

        if (deck.length === 0) {
          if (discardPile.length === 0) break;
          deck = shuffleDeck([...discardPile]);
          discardPile = [];
        }

        const card = deck[deck.length - 1];
        deck = deck.slice(0, -1);
        hand = [...hand, card];
      }

      set({ deck, hand, discardPile });
    },

    generateWaveRewardCards: () => {
      const state = get();
      const wave = state.wave;

      const rewardCards: Card[] = [];
      const cardCount = WAVE_REWARD_CARD_COUNT;

      const rarityBonus = Math.floor(wave / 5) * 0.05;
      const adjustedWeights = {
        common: Math.max(20, RARITY_WEIGHTS.common - rarityBonus * 50),
        rare: RARITY_WEIGHTS.rare + rarityBonus * 20,
        epic: RARITY_WEIGHTS.epic + rarityBonus * 20,
        legendary: RARITY_WEIGHTS.legendary + rarityBonus * 10,
      };

      const totalWeight = Object.values(adjustedWeights).reduce(
        (sum, w) => sum + w,
        0
      );

      const rarityCards: Record<string, string[]> = {};
      Object.entries(CARD_CONFIGS).forEach(([type, config]) => {
        if (!rarityCards[config.rarity]) {
          rarityCards[config.rarity] = [];
        }
        rarityCards[config.rarity].push(type);
      });

      for (let i = 0; i < cardCount; i++) {
        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedRarity = 'common';

        for (const [rarity, weight] of Object.entries(adjustedWeights)) {
          cumulative += weight;
          if (roll <= cumulative) {
            selectedRarity = rarity;
            break;
          }
        }

        const cardsOfRarity = rarityCards[selectedRarity] || rarityCards['common'];
        const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
        const cardType = cardsOfRarity[randomIndex];
        const config = CARD_CONFIGS[cardType];

        rewardCards.push({
          id: generateId(),
          type: cardType as CardType,
          name: config.name,
          description: config.description,
          manaCost: config.manaCost,
          icon: config.icon,
          rarity: config.rarity,
        });
      }

      return rewardCards;
    },
  };
}
