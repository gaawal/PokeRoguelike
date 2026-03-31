import { Move, GamePokemon, Weather, Terrain, Dimension } from '../../types';
import { SkillContext, SkillResult } from '../skill/types';
import { SkillFactory } from '../skill/SkillFactory';

export class BattleEngine {
  static async executeTurn(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    isPlayerAttacker: boolean,
    context: Omit<SkillContext, 'attacker' | 'defender' | 'isPlayerAttacker'>
  ): Promise<SkillResult> {
    const strategy = SkillFactory.getStrategy(move);
    
    const fullContext: SkillContext = {
      ...context,
      attacker,
      defender,
      isPlayerAttacker
    };

    return await strategy.execute(move, fullContext);
  }
}
