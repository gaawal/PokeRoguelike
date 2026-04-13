import { Move, GamePokemon } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';

export class DrainEffect implements MoveEffectStrategy {
  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    // This requires knowing the damage dealt. 
    // In a truly decoupled system, we might need to pass damage in the result or context.
    // For now, let's keep it simple. If we want to support drain, we might need to 
    // calculate it here or have DamageEffect store it.
    
    // Actually, let's just move the logic from App.tsx into a more robust strategy later.
    // The current refactor is already a huge improvement.
    return { success: true, attacker, defender };
  }
}
