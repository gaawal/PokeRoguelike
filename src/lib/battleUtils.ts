import { GamePokemon, Move, Weather } from '../types';
import { TYPE_CHART, STAT_STAGE_MODIFIERS } from '../constants';

export const getTypeEffectiveness = (moveType: string, defenderTypes: { type: { name: string } }[]) => {
  let multiplier = 1;
  defenderTypes.forEach(t => {
    const effect = TYPE_CHART[moveType]?.[t.type.name];
    if (effect !== undefined) {
      multiplier *= effect;
    }
  });
  return multiplier;
};

export const calculateDamage = (
  move: Move,
  attacker: GamePokemon,
  defender: GamePokemon,
  atkBuff: boolean,
  defBuff: boolean,
  weather: Weather
) => {
  if (move.damage_class === 'status') {
    const typeMultiplier = getTypeEffectiveness(move.type, defender.types);
    return { damage: 0, multiplier: typeMultiplier, isMiss: false, isCrit: false };
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
  
  // 1. Calculate Level Factor
  const levelFactor = Math.floor(2 * attacker.level / 5) + 2;
  
  // 2. Determine Attack and Defense stats
  let atk = 1;
  let def = 1;
  
  const getAbilityName = (p: GamePokemon) => p.ability?.name || p.abilities[0]?.ability.name;
  const ignoreDefenderStages = getAbilityName(attacker) === 'unaware';
  const ignoreAttackerStages = getAbilityName(defender) === 'unaware';

  // Critical Hit check
  let critChance = 1/24;
  if (move.critRate === 1) critChance = 1/8;
  if (move.critRate === 2) critChance = 1/2;
  if (move.critRate >= 3) critChance = 1;
  const isCrit = Math.random() < critChance;

  if (move.damage_class === 'special') {
    let atkStage = attacker.statStages.spAtk;
    if (isCrit && atkStage < 0) atkStage = 0;
    atk = attacker.calculatedStats.spAtk * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[atkStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    
    let defStage = defender.statStages.spDef;
    if (isCrit && defStage > 0) defStage = 0;
    def = defender.calculatedStats.spDef * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[defStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    
    // Sandstorm: Rock types get 1.5x SpDef
    if (weather === 'sandstorm' && defender.types.some(t => t.type.name === 'rock')) {
      def = Math.floor(def * 1.5);
    }
  } else {
    let atkStage = attacker.statStages.attack;
    if (isCrit && atkStage < 0) atkStage = 0;
    atk = attacker.calculatedStats.attack * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[atkStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    
    let defStage = defender.statStages.defense;
    if (isCrit && defStage > 0) defStage = 0;
    def = defender.calculatedStats.defense * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[defStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
    
    // Snow: Ice types get 1.5x Defense
    if (weather === 'snow' && defender.types.some(t => t.type.name === 'ice')) {
      def = Math.floor(def * 1.5);
    }
  }

  // Apply custom game buffs
  if (atkBuff) atk = Math.floor(atk * 1.5);
  if (defBuff) def = Math.floor(def * 1.5);

  // 3. Base Damage calculation
  let damage = Math.floor(Math.floor(Math.floor(levelFactor * basePower * atk / def) / 50) + 2);

  // 4. Modifiers
  // Weather
  if (weather === 'sunny' || weather === 'harsh_sunlight') {
    if (move.type === 'fire') damage = Math.floor(damage * 1.5);
    if (move.type === 'water') {
      if (weather === 'harsh_sunlight') damage = 0;
      else damage = Math.floor(damage * 0.5);
    }
  } else if (weather === 'rainy' || weather === 'heavy_rain') {
    if (move.type === 'water') damage = Math.floor(damage * 1.5);
    if (move.type === 'fire') {
      if (weather === 'heavy_rain') damage = 0;
      else damage = Math.floor(damage * 0.5);
    }
  }

  // Critical Hit
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }

  // Type effectiveness
  const multiplier = getTypeEffectiveness(move.type, defender.types);
  damage = Math.floor(damage * multiplier);

  // Random factor
  const random = Math.floor(Math.random() * 16) + 85;
  damage = Math.floor(damage * random / 100);

  // Accuracy check
  const accuracy = move.accuracy || 100;
  const isMiss = Math.random() * 100 > accuracy;

  return { damage, multiplier, isMiss, isCrit };
};
