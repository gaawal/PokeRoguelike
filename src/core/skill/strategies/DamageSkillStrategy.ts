import { Move, GamePokemon } from '../../../types';
import { SkillContext, SkillResult } from '../types';
import { BaseSkillStrategy } from '../BaseSkillStrategy';
import { calculateDamage, isGrounded } from '../../../utils/battle';
import { getLocalized } from '../../../utils/common';
import { AILMENT_ZH, STAT_ZH } from '../../../constants/index';

export class DamageSkillStrategy extends BaseSkillStrategy {
  async execute(move: Move, context: SkillContext): Promise<SkillResult> {
    const { attacker, defender, isPlayerAttacker, weather, terrain, dimension, activeBuffs, enemyBuffs, addMessages, updateStates, setPlayerAnim, setEnemyAnim, setActiveMoveType } = context;
    const attackerName = getLocalized(attacker, 'zh-hans');
    const defenderName = getLocalized(defender, 'zh-hans');

    if (!await this.checkAilmentRestrictions(attacker, attackerName, context)) {
      return { success: false, attacker, defender };
    }

    // Protect
    if (defender.volatileStatus?.includes('protect')) {
      await addMessages([`${defenderName} 守住了！`]);
      return { success: false, attacker, defender };
    }

    setActiveMoveType(move.type);
    if (isPlayerAttacker) setPlayerAnim('attack');
    else setEnemyAnim('attack');

    await addMessages([
      isPlayerAttacker 
        ? `你使用了 ${getLocalized(move, 'zh-hans')}！`
        : `对手的 ${attackerName} 使用了 ${getLocalized(move, 'zh-hans')}！`
    ]);

    // Update PP
    if (move.id !== 'struggle') {
      attacker.selectedMoves = attacker.selectedMoves.map(m => 
        m.id === move.id ? { ...m, currentPP: Math.max(0, (m.currentPP || 1) - 1) } : m
      );
      updateStates(attacker, defender);
    }

    // Psychic Terrain: Block priority moves from grounded attackers
    if (terrain === 'psychic' && isGrounded(defender) && move.priority && move.priority > 0) {
      await addMessages([`超能力场地保护了 ${defenderName}！`]);
      if (isPlayerAttacker) setPlayerAnim('idle');
      else setEnemyAnim('idle');
      setActiveMoveType(null);
      return { success: false, attacker, defender };
    }

    const { damage, multiplier, isMiss, isCrit } = calculateDamage(
      move, 
      attacker, 
      defender, 
      {
        weather,
        terrain,
        dimension,
        atkBuff: isPlayerAttacker ? activeBuffs.atk : enemyBuffs.atk,
        defBuff: isPlayerAttacker ? enemyBuffs.def : activeBuffs.def
      }
    );

    if (isMiss) {
      await addMessages([`${attackerName} 的攻击落空了！`]);
      if (isPlayerAttacker) setPlayerAnim('idle');
      else setEnemyAnim('idle');
      setActiveMoveType(null);
      return { success: false, attacker, defender };
    }

    if (isCrit) await addMessages(['击中了要害！']);

    if (damage < 0) {
      await addMessages([`${defenderName} 吸收了攻击并恢复了体力！`]);
    }

    let newDefenderHp = Math.max(0, Math.min(defender.maxHp, defender.currentHp - damage));

    // Focus Sash
    if (dimension !== 'magic_room' && newDefenderHp === 0 && defender.currentHp === defender.maxHp && defender.heldItem?.id === 'focus_sash') {
      newDefenderHp = 1;
      await addMessages([`${defenderName} 凭借气势披带撑住了！`]);
      defender.heldItem = undefined; // Consume
    }

    if (damage > 0) {
      if (isPlayerAttacker) setEnemyAnim('hit');
      else setPlayerAnim('hit');
    }

    // Update defender HP
    defender.currentHp = newDefenderHp;
    updateStates(attacker, defender);

    // Handle Drain/Healing
    let attackerHpChange = 0;
    if (move.id === 'struggle') {
      attackerHpChange -= Math.floor(attacker.maxHp / 4);
    } else if (move.drain !== 0 && damage > 0) {
      attackerHpChange += Math.floor(damage * move.drain / 100);
    }
    if (move.healing !== 0) attackerHpChange += Math.floor(attacker.maxHp * move.healing / 100);

    if (attackerHpChange !== 0) {
      attacker.currentHp = Math.max(0, Math.min(attacker.maxHp, attacker.currentHp + attackerHpChange));
      updateStates(attacker, defender);
      await addMessages([attackerHpChange > 0 ? `${attackerName} 恢复了体力！` : `${attackerName} 受到了反作用力伤害！`]);
    }

    // Effect messages
    if (damage > 0) {
      if (multiplier > 1) await addMessages(['效果绝佳！']);
      if (multiplier < 1 && multiplier > 0) await addMessages(['效果不好...']);
      if (multiplier === 0) await addMessages(['没有效果...']);
      await addMessages([`${attackerName} 造成了 ${damage} 点伤害！`]);
    }

    // Handle Ailments and Stat Changes
    if (defender.currentHp > 0) {
      const isTargetUser = move.target === 'user';
      const target = isTargetUser ? attacker : defender;

      if (move.ailment && !target.status && Math.random() * 100 < (move.ailmentChance || 100)) {
        const targetTypes = target.types.map(t => t.type.name);
        let immune = false;
        if (move.ailment === 'burn' && targetTypes.includes('fire')) immune = true;
        if (move.ailment === 'paralysis' && targetTypes.includes('electric')) immune = true;
        if (move.ailment === 'freeze' && targetTypes.includes('ice')) immune = true;
        if ((move.ailment === 'poison' || move.ailment === 'toxic') && (targetTypes.includes('poison') || targetTypes.includes('steel'))) immune = true;
        
        if (!immune) {
          target.status = move.ailment;
          updateStates(attacker, defender);
          await addMessages([`${getLocalized(target, 'zh-hans')} ${AILMENT_ZH[move.ailment] || move.ailment}了！`]);
        }
      }

      if (move.statChanges && Math.random() * 100 < (move.ailmentChance || 100)) {
        for (const sc of move.statChanges) {
          const currentStage = target.statStages[sc.stat as keyof typeof target.statStages] || 0;
          const newStage = Math.max(-6, Math.min(6, currentStage + sc.change));
          if (newStage !== currentStage) {
            target.statStages[sc.stat as keyof typeof target.statStages] = newStage;
            updateStates(attacker, defender);
            const changeText = sc.change > 0 ? '大幅提升了' : '大幅降低了';
            await addMessages([`${getLocalized(target, 'zh-hans')} 的 ${STAT_ZH[sc.stat] || sc.stat} ${changeText}！`]);
          }
        }
      }
    }

    if (isPlayerAttacker) setPlayerAnim('idle');
    else setEnemyAnim('idle');
    setActiveMoveType(null);

    if (defender.currentHp <= 0) {
      await addMessages([`${defenderName} 倒下了！`]);
      return { success: 'FAINTED', attacker, defender };
    }

    return { success: true, attacker, defender };
  }
}
