import { Move, GamePokemon } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';
import { AILMENT_ZH } from '../../constants';

export class StatusEffect implements MoveEffectStrategy {
  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    if (!move.ailment) return { success: true, attacker, defender };

    const target = move.target === 'user' ? attacker : defender;
    const chance = move.ailmentChance || 100;

    if (Math.random() * 100 < chance && !target.status) {
      // Basic immunity checks
      const targetTypes = target.types.map(t => t.type.name);
      let immune = false;
      if (move.ailment === 'burn' && targetTypes.includes('fire')) immune = true;
      if (move.ailment === 'paralysis' && targetTypes.includes('electric')) immune = true;
      if (move.ailment === 'freeze' && targetTypes.includes('ice')) immune = true;
      if ((move.ailment === 'poison' || move.ailment === 'toxic') && (targetTypes.includes('poison') || targetTypes.includes('steel'))) immune = true;

      if (!immune) {
        target.status = move.ailment;
        context.updateStates(attacker, defender);
        await context.addMessagesSequentially([`${target.name} ${AILMENT_ZH[move.ailment] || move.ailment}了！`]);
      }
    }

    return { success: true, attacker, defender };
  }
}
