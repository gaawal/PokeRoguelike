import { Move, GamePokemon } from '../../types';
import { MoveEffectStrategy, BattleContext, MoveEffectResult } from './types';
import { calculateDamage } from '../../lib/battleUtils';

export class DamageEffect implements MoveEffectStrategy {
  async execute(
    move: Move,
    attacker: GamePokemon,
    defender: GamePokemon,
    context: BattleContext
  ): Promise<MoveEffectResult> {
    const { damage, multiplier, isMiss, isCrit } = calculateDamage(
      move,
      attacker,
      defender,
      context.isPlayerAttacker ? context.activeBuffs.atk : context.enemyBuffs.atk,
      context.isPlayerAttacker ? context.enemyBuffs.def : context.activeBuffs.def,
      context.weather
    );

    if (isMiss) {
      await context.addMessagesSequentially([`${context.t('attackMissed', { name: attacker.name })}`]);
      return { success: false, attacker, defender };
    }

    if (isCrit) await context.addMessagesSequentially([context.t('criticalHit')]);

    let newDefenderHp = Math.max(0, Math.min(defender.maxHp, defender.currentHp - damage));

    // Focus Sash logic (simplified for strategy)
    if (context.dimension !== 'magic_room' && newDefenderHp === 0 && defender.currentHp === defender.maxHp && defender.heldItem?.id === 'focus_sash') {
      newDefenderHp = 1;
      await context.addMessagesSequentially([`${defender.name} 凭借气势披带撑住了！`]);
      defender.heldItem = undefined;
    }

    defender.currentHp = newDefenderHp;
    context.updateStates(attacker, defender);

    // Effectiveness messages
    if (multiplier > 1) await context.addMessagesSequentially([context.t('superEffective')]);
    if (multiplier < 1 && multiplier > 0) await context.addMessagesSequentially([context.t('notVeryEffective')]);
    if (multiplier === 0) await context.addMessagesSequentially([context.t('noEffect')]);

    if (defender.currentHp <= 0) {
      await context.addMessagesSequentially([context.t('fainted', { name: defender.name })]);
      return { success: 'FAINTED', attacker, defender };
    }

    return { success: true, attacker, defender };
  }
}
