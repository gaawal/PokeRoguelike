import { Move, GamePokemon, StatStages } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';
import { STAT_ZH } from '../../constants';

export class StatChangeEffect implements MoveEffectStrategy {
  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    if (!move.statChanges) return { success: true, attacker, defender };

    const target = move.target === 'user' ? attacker : defender;
    const isContrary = target.abilities.some(a => a.ability.name === 'contrary');

    for (const sc of move.statChanges) {
      const statKey = sc.stat as keyof StatStages;
      const oldStage = target.statStages[statKey];
      const change = isContrary ? -sc.change : sc.change;
      const newStage = Math.max(-6, Math.min(6, oldStage + change));

      if (newStage !== oldStage) {
        target.statStages[statKey] = newStage;
        await context.addMessagesSequentially([`${target.name} 的 ${STAT_ZH[sc.stat] || sc.stat} ${change > 0 ? '提升' : '下降'}了！`]);
      }
    }

    context.updateStates(attacker, defender);
    return { success: true, attacker, defender };
  }
}
