import { Move, GamePokemon, Weather, Terrain, Dimension } from '../types';
import { TYPE_CHART, STAT_STAGE_MODIFIERS, ACC_EVA_STAGE_MODIFIERS } from '../constants/index';

export const getTypeEffectiveness = (moveType: string, defenderTypes: string[], weather: Weather = 'none') => {
  let multiplier = 1;
  defenderTypes.forEach(t => {
    let typeMult = TYPE_CHART[moveType]?.[t];
    if (typeMult !== undefined) {
      // Delta Stream: Flying weaknesses removed
      if (weather === 'strong_winds' && t === 'flying' && typeMult > 1) {
        typeMult = 1;
      }
      multiplier *= typeMult;
    }
  });
  return multiplier;
};

export const isGrounded = (pokemon: GamePokemon) => {
  return !pokemon.types.some(t => t.type.name === 'flying') && 
         !pokemon.abilities.some(a => a.ability.name === 'levitate') &&
         !pokemon.volatileStatus?.includes('magnet-rise');
};

export const calculateDamage = (
  move: Move,
  attacker: GamePokemon,
  defender: GamePokemon,
  context: {
    weather: Weather;
    terrain: Terrain;
    dimension: Dimension;
    atkBuff: boolean;
    defBuff: boolean;
  }
) => {
  const { weather, terrain, dimension } = context;

  if (move.damage_class === 'status') {
    return { damage: 0, multiplier: 1, isMiss: false, isCrit: false };
  }

  // Fixed damage moves
  if (move.id === 'night-shade' || move.id === 'seismic-toss') {
    return { damage: attacker.level, multiplier: 1, isMiss: false, isCrit: false };
  }
  if (move.id === 'dragon-rage') {
    return { damage: 40, multiplier: 1, isMiss: false, isCrit: false };
  }
  if (move.id === 'sonic-boom') {
    return { damage: 20, multiplier: 1, isMiss: false, isCrit: false };
  }

  const basePower = move.power || 40;
  const levelMult = (2 * attacker.level / 5) + 2;
  
  let atk = 50;
  let def = 50;
  
  // Wonder Room: Swap Def and SpDef
  const defStat = dimension === 'wonder_room' ? defender.calculatedStats.spDef : defender.calculatedStats.defense;
  const spDefStat = dimension === 'wonder_room' ? defender.calculatedStats.defense : defender.calculatedStats.spDef;
  const defStage = dimension === 'wonder_room' ? defender.statStages.spDef : defender.statStages.defense;
  const spDefStage = dimension === 'wonder_room' ? defender.statStages.defense : defender.statStages.spDef;

  const ignoreDefenderStages = attacker.abilities.some(a => a.ability.name === 'unaware');
  const ignoreAttackerStages = defender.abilities.some(a => a.ability.name === 'unaware');

  if (move.damage_class === 'special') {
    atk = attacker.calculatedStats.spAtk * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[attacker.statStages.spAtk as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    def = spDefStat * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[spDefStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
  } else {
    atk = attacker.calculatedStats.attack * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[attacker.statStages.attack as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    def = defStat * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[defStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
  }
  
  // Snow: Ice types get 1.5x Defense
  if (weather === 'snow' && defender.types.some(t => t.type.name === 'ice') && move.damage_class === 'physical') {
    def *= 1.5;
  }
  // Sandstorm: Rock types get 1.5x SpDef
  if (weather === 'sandstorm' && defender.types.some(t => t.type.name === 'rock') && move.damage_class === 'special') {
    def *= 1.5;
  }
  
  // 异常状态影响
  if (attacker.status === 'burn' && move.damage_class === 'physical') {
    atk *= 0.5;
  }

  // 属性克制
  let multiplier = getTypeEffectiveness(move.type, defender.types.map(t => t.type.name), weather);

  // Ability: Levitate
  if (move.type === 'ground' && defender.abilities.some(a => a.ability.name === 'levitate')) {
    return { damage: 0, multiplier: 0, isMiss: false, isCrit: false };
  }

  // Ability: Water Absorb / Volt Absorb
  if (move.type === 'water' && defender.abilities.some(a => a.ability.name === 'water-absorb')) {
    return { damage: -Math.floor(defender.maxHp / 4), multiplier: 0, isMiss: false, isCrit: false };
  }
  if (move.type === 'electric' && defender.abilities.some(a => a.ability.name === 'volt-absorb')) {
    return { damage: -Math.floor(defender.maxHp / 4), multiplier: 0, isMiss: false, isCrit: false };
  }

  // 天气影响
  if (weather === 'sunny' || weather === 'harsh_sunlight') {
    if (move.type === 'fire') multiplier *= 1.5;
    if (move.type === 'water') {
      if (weather === 'harsh_sunlight') multiplier = 0;
      else multiplier *= 0.5;
    }
  } else if (weather === 'rainy' || weather === 'heavy_rain') {
    if (move.type === 'water') multiplier *= 1.5;
    if (move.type === 'fire') {
      if (weather === 'heavy_rain') multiplier = 0;
      else multiplier *= 0.5;
    }
  }

  // Terrain influence
  const isAttackerGrounded = isGrounded(attacker);
  const isDefenderGrounded = isGrounded(defender);
  
  if (isAttackerGrounded) {
    if (terrain === 'electric' && move.type === 'electric') multiplier *= 1.3;
    if (terrain === 'grassy' && move.type === 'grass') multiplier *= 1.3;
    if (terrain === 'psychic' && move.type === 'psychic') multiplier *= 1.3;
  }
  if (isDefenderGrounded && terrain === 'misty' && move.type === 'dragon') {
    multiplier *= 0.5;
  }

  // 命中判断
  const accStage = attacker.statStages.accuracy;
  const evaStage = defender.statStages.evasion;
  const combinedStage = Math.max(-6, Math.min(6, accStage - evaStage));
  const accuracyMod = ACC_EVA_STAGE_MODIFIERS[combinedStage as keyof typeof ACC_EVA_STAGE_MODIFIERS] || 1;
  let finalAccuracy = (move.accuracy || 100) * accuracyMod;

  // Weather accuracy
  if (weather === 'sunny' || weather === 'harsh_sunlight') {
    if (move.id === 'thunder' || move.id === 'hurricane') finalAccuracy = 50;
  } else if (weather === 'rainy' || weather === 'heavy_rain') {
    if (move.id === 'thunder' || move.id === 'hurricane') finalAccuracy = 100;
  }

  const isMiss = move.accuracy !== null && Math.random() * 100 > finalAccuracy;
  if (isMiss) return { damage: 0, multiplier, isMiss: true, isCrit: false };

  // 暴击判断
  const critStages = [1/16, 1/8, 1/2, 1];
  const critStage = Math.min(3, (move.critRate || 0));
  const isCrit = Math.random() < critStages[critStage];

  const random = 0.85 + Math.random() * 0.15;
  const stab = attacker.types.some(t => t.type.name === move.type) ? 1.5 : 1;
  
  let damage = Math.floor((levelMult * basePower * atk / def / 50 + 2) * multiplier * random * stab * (isCrit ? 1.5 : 1));
  
  // Buffs
  if (context.atkBuff) damage = Math.floor(damage * 1.5);
  if (context.defBuff) damage = Math.floor(damage * 0.7);

  return { damage, multiplier, isMiss: false, isCrit };
};
