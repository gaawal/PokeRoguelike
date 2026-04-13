import { Move, GamePokemon } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';

export class EnvironmentEffect implements MoveEffectStrategy {
  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    // This would need access to setWeather, setTerrain, etc.
    // Since those are state setters in App.tsx, we might need to pass them in context
    // or handle them as a return value.
    // For now, let's assume we add them to context if we want full decoupling.
    
    // However, to keep it simple and avoid passing too many setters, 
    // we can just return a "side effect" flag or handle it in App.tsx.
    
    // But the goal is decoupling. Let's add setters to context.
    return { success: true, attacker, defender };
  }
}
