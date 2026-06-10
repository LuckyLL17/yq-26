import type { SetState, GetState, GameStore } from './types';
import type { BattleLogType, BattleLogEntry } from '../types';
import { MAX_BATTLE_LOGS } from '../config';
import { generateId } from './utils';

export function createBattleLogSlice(
  set: SetState,
  get: GetState
): Pick<GameStore, 'addBattleLog'> {
  return {
    addBattleLog: (type: BattleLogType, message: string) => {
      const { battleLogs, gameTime } = get();
      const newLog: BattleLogEntry = {
        id: generateId(),
        type,
        message,
        timestamp: gameTime,
      };
      const newLogs = [newLog, ...battleLogs].slice(0, MAX_BATTLE_LOGS);
      set({ battleLogs: newLogs });
    },
  };
}
