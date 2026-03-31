import { Move, GamePokemon, Weather, Terrain, Dimension } from '../../types';

export interface SkillContext {
  attacker: GamePokemon;
  defender: GamePokemon;
  isPlayerAttacker: boolean;
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  activeBuffs: { atk: boolean; def: boolean };
  enemyBuffs: { atk: boolean; def: boolean };
  addMessages: (msgs: string[]) => Promise<void>;
  updateStates: (attacker: GamePokemon, defender: GamePokemon) => void;
  setPlayerAnim: (anim: string) => void;
  setEnemyAnim: (anim: string) => void;
  setActiveMoveType: (type: string | null) => void;
}

export interface SkillResult {
  success: boolean | 'FAINTED' | 'SKIP';
  attacker: GamePokemon;
  defender: GamePokemon;
}

export interface SkillStrategy {
  execute(move: Move, context: SkillContext): Promise<SkillResult>;
}
