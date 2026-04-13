import { GamePokemon, Move, Weather, Terrain, Dimension } from '../../types';

export interface BattleContext {
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  isPlayerAttacker: boolean;
  activeBuffs: { atk: boolean; def: boolean };
  enemyBuffs: { atk: boolean; def: boolean };
  t: (key: string, params?: Record<string, string | number>) => string;
  addMessagesSequentially: (messages: string[]) => Promise<void>;
  updateStates: (attacker: GamePokemon, defender: GamePokemon) => void;
}

export interface MoveEffectResult {
  success: boolean | 'FAINTED' | 'FLINCH' | 'SKIP';
  attacker: GamePokemon;
  defender: GamePokemon;
}

export interface MoveEffectStrategy {
  execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult>;
}
