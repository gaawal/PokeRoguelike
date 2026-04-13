import { Move } from '../../types';
import { MoveEffectStrategy } from './types';
import { DamageEffect } from './DamageEffect';
import { StatusEffect } from './StatusEffect';
import { StatChangeEffect } from './StatChangeEffect';
import { CompositeEffect } from './CompositeEffect';

export class MoveEffectFactory {
  private static damageEffect = new DamageEffect();
  private static statusEffect = new StatusEffect();
  private static statChangeEffect = new StatChangeEffect();

  static getStrategy(move: Move): MoveEffectStrategy {
    const strategies: MoveEffectStrategy[] = [];

    // If it has power, it's a damage move
    if (move.power !== null && move.power > 0) {
      strategies.push(this.damageEffect);
    }

    // If it has ailment, add status effect
    if (move.ailment) {
      strategies.push(this.statusEffect);
    }

    // If it has stat changes, add stat change effect
    if (move.statChanges && move.statChanges.length > 0) {
      strategies.push(this.statChangeEffect);
    }

    if (strategies.length === 1) {
      return strategies[0];
    }

    if (strategies.length > 1) {
      return new CompositeEffect(strategies);
    }

    // Fallback for status moves with no specific effects defined yet in this refactor
    return this.damageEffect; 
  }
}
