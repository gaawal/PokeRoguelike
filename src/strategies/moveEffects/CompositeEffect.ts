import { Move, GamePokemon } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';

export class CompositeEffect implements MoveEffectStrategy {
  constructor(private strategies: MoveEffectStrategy[]) {}

  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    let currentAttacker = attacker;
    let currentDefender = defender;
    let finalResult: MoveEffectResult = { success: true, attacker, defender };

    for (const strategy of this.strategies) {
      const result = await strategy.execute(move, currentAttacker, currentDefender, context);
      currentAttacker = result.attacker;
      currentDefender = result.defender;
      finalResult = result;

      if (result.success === 'FAINTED' || result.success === 'SKIP') {
        break;
      }
    }

    return finalResult;
  }
}
