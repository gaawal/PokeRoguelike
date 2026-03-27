import { Pokemon, Move, GamePokemon, Stats, Nature } from '../types';
import { GENERATIONS, NATURES } from '../constants';

const BASE_URL = 'https://pokeapi.co/api/v2';

export async function getRandomPokemonId(selectedGens: number[] = [1]): Promise<number> {
  const possibleGens = GENERATIONS.filter(g => selectedGens.includes(g.id));
  const targetGen = possibleGens[Math.floor(Math.random() * possibleGens.length)] || GENERATIONS[0];
  const [start, end] = targetGen.range;
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

export async function fetchPokemon(id: number): Promise<Pokemon> {
  const response = await fetch(`${BASE_URL}/pokemon/${id}`);
  if (!response.ok) throw new Error('Failed to fetch pokemon');
  const data = await response.json();
  
  // Fetch Chinese name
  try {
    const speciesRes = await fetch(data.species.url);
    const speciesData = await speciesRes.json();
    const zhName = speciesData.names.find((n: any) => n.language.name === 'zh-Hans')?.name;
    data.zhName = zhName || data.name;
    
    // Fetch ability names
    for (const a of data.abilities) {
      a.ability.zhName = await fetchAbility(a.ability.url);
    }
  } catch (e) {
    data.zhName = data.name;
  }
  
  return data;
}

export async function fetchAbility(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const data = await response.json();
    const zhName = data.names.find((n: any) => n.language.name === 'zh-Hans')?.name;
    return zhName || data.name;
  } catch (e) {
    return '';
  }
}

export async function fetchMove(url: string): Promise<Move> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch move');
  const data = await response.json();
  
  const zhName = data.names.find((n: any) => n.language.name === 'zh-Hans')?.name;
  const zhDescription = data.flavor_text_entries.find((e: any) => e.language.name === 'zh-Hans')?.flavor_text;
  
  return {
    name: data.name,
    zhName: zhName || data.name,
    power: data.power,
    accuracy: data.accuracy,
    type: data.type.name,
    damage_class: data.damage_class.name,
    pp: data.pp,
    zhDescription: zhDescription || '暂无描述',
  };
}

export async function getLearnableMoves(pokemon: any, currentMoves: Move[], count: number = 3): Promise<Move[]> {
  const currentNames = currentMoves.map(m => m.name);
  const potentialMoves = pokemon.moves.filter((m: any) => !currentNames.includes(m.move.name));
  
  const shuffled = potentialMoves.sort(() => 0.5 - Math.random());
  const selected = [];
  
  for (const m of shuffled) {
    try {
      const move = await fetchMove(m.move.url);
      if (move.power !== null) {
        selected.push(move);
        if (selected.length >= count) break;
      }
    } catch (e) {
      continue;
    }
  }
  
  return selected;
}

function calculateStat(base: number, iv: number, level: number, isHp: boolean = false, natureMod: number = 1): number {
  if (isHp) {
    return Math.floor((base * 2 + iv) * level / 100) + level + 10;
  }
  return Math.floor((Math.floor((base * 2 + iv) * level / 100) + 5) * natureMod);
}

export async function getProcessedPokemon(id: number, level: number = 50): Promise<GamePokemon> {
  const raw = await fetchPokemon(id);
  
  // Pick random moves that have power
  const validMoves: Move[] = [];
  const shuffledMoves = raw.moves.sort(() => 0.5 - Math.random());
  
  for (const m of shuffledMoves) {
    try {
      const move = await fetchMove(m.move.url);
      if (move.power !== null) {
        validMoves.push(move);
        if (validMoves.length >= 4) break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (validMoves.length === 0) {
    validMoves.push({
      name: 'tackle',
      zhName: '撞击',
      power: 40,
      accuracy: 100,
      type: 'normal',
      damage_class: 'physical',
      pp: 35,
      zhDescription: '用整个身体撞向对手进行攻击。'
    });
  }

  // Generate IVs
  const ivs: Stats = {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    spAtk: Math.floor(Math.random() * 32),
    spDef: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };

  // Pick Nature
  const nature = NATURES[Math.floor(Math.random() * NATURES.length)];

  // Base Stats
  const baseStats: Stats = {
    hp: raw.stats.find(s => s.stat.name === 'hp')?.base_stat || 50,
    attack: raw.stats.find(s => s.stat.name === 'attack')?.base_stat || 50,
    defense: raw.stats.find(s => s.stat.name === 'defense')?.base_stat || 50,
    spAtk: raw.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50,
    spDef: raw.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50,
    speed: raw.stats.find(s => s.stat.name === 'speed')?.base_stat || 50,
  };

  // Calculate Final Stats
  const getMod = (statName: string) => {
    if (nature.plus === statName) return 1.1;
    if (nature.minus === statName) return 0.9;
    return 1;
  };

  const calculatedStats: Stats = {
    hp: calculateStat(baseStats.hp, ivs.hp, level, true),
    attack: calculateStat(baseStats.attack, ivs.attack, level, false, getMod('attack')),
    defense: calculateStat(baseStats.defense, ivs.defense, level, false, getMod('defense')),
    spAtk: calculateStat(baseStats.spAtk, ivs.spAtk, level, false, getMod('spAtk')),
    spDef: calculateStat(baseStats.spDef, ivs.spDef, level, false, getMod('spDef')),
    speed: calculateStat(baseStats.speed, ivs.speed, level, false, getMod('speed')),
  };

  return {
    ...raw,
    level,
    maxHp: calculatedStats.hp,
    currentHp: calculatedStats.hp,
    selectedMoves: validMoves,
    nature,
    ivs,
    baseStats,
    calculatedStats,
  };
}
