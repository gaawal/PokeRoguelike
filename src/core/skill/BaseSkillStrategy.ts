import { Move, GamePokemon } from '../../types';
import { SkillContext, SkillResult, SkillStrategy } from './types';
import { calculateDamage, isGrounded } from '../../utils/battle';
import { getLocalized } from '../../utils/common';
import { AILMENT_ZH, STAT_ZH } from '../../constants/index';

export abstract class BaseSkillStrategy implements SkillStrategy {
  abstract execute(move: Move, context: SkillContext): Promise<SkillResult>;

  protected async checkAilmentRestrictions(attacker: GamePokemon, attackerName: string, context: SkillContext): Promise<boolean> {
    const { addMessages, updateStates } = context;

    if (attacker.status === 'sleep') {
      await addMessages([`${attackerName} 正在呼呼大睡...`]);
      const turns = (attacker.statusTurns || 0) + 1;
      if (turns >= 3 || Math.random() < 0.33) {
        attacker.status = undefined;
        attacker.statusTurns = 0;
        updateStates(attacker, context.defender);
        await addMessages([`${attackerName} 醒过来了！`]);
      } else {
        attacker.statusTurns = turns;
        updateStates(attacker, context.defender);
        return false;
      }
    }
    if (attacker.status === 'freeze') {
      await addMessages([`${attackerName} 冻得严严实实...`]);
      if (Math.random() < 0.2) {
        attacker.status = undefined;
        updateStates(attacker, context.defender);
        await addMessages([`${attackerName} 的冰融化了！`]);
      } else return false;
    }
    if (attacker.status === 'paralysis' && Math.random() < 0.25) {
      await addMessages([`${attackerName} 麻痹了，无法动弹！`]);
      return false;
    }

    // Confusion
    if (attacker.volatileStatus?.includes('confusion')) {
      await addMessages([`${attackerName} 混乱了！`]);
      if (Math.random() < 0.5) {
        await addMessages([`它在混乱中攻击了自己！`]);
        const selfDamage = Math.floor(((2 * attacker.level / 5 + 2) * 40 * attacker.calculatedStats.attack / attacker.calculatedStats.defense) / 50) + 2;
        attacker.currentHp = Math.max(0, attacker.currentHp - selfDamage);
        updateStates(attacker, context.defender);
        return false;
      }
    }

    // Infatuation
    if (attacker.volatileStatus?.includes('infatuation')) {
      await addMessages([`${attackerName} 陷入了爱河！`]);
      if (Math.random() < 0.5) {
        await addMessages([`${attackerName} 因为爱而无法攻击！`]);
        return false;
      }
    }

    return true;
  }
}
