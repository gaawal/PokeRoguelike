import { Move } from '../../types';
import { SkillStrategy } from './types';
import { DamageSkillStrategy } from './strategies/DamageSkillStrategy';

export class SkillFactory {
  private static strategies: Record<string, SkillStrategy> = {
    default: new DamageSkillStrategy(),
    // Add more specialized strategies here
  };

  static getStrategy(move: Move): SkillStrategy {
    // For now, most moves use DamageSkillStrategy
    // In a real game, you'd map specific move IDs or categories to strategies
    if (move.damage_class === 'status') {
      // return this.strategies['status'];
    }
    
    return this.strategies['default'];
  }
}
