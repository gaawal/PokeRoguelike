import { Pokemon, GamePokemon, Stats, StatStages, Nature } from '../../types';
import { NATURES } from '../../constants';

export class PokemonEntity {
  static createGamePokemon(pokemon: Pokemon, level: number): GamePokemon {
    const nature = NATURES[Math.floor(Math.random() * NATURES.length)];
    const ivs: Stats = {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      spAtk: Math.floor(Math.random() * 32),
      spDef: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32),
    };

    const baseStats: Stats = {
      hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 50,
      attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 50,
      defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 50,
      spAtk: pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50,
      spDef: pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50,
      speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 50,
    };

    const calculatedStats = this.calculateStats(baseStats, ivs, nature, level);

    return {
      ...pokemon,
      level,
      nature,
      ivs,
      baseStats,
      calculatedStats,
      currentHp: calculatedStats.hp,
      maxHp: calculatedStats.hp,
      selectedMoves: [], // To be filled by caller
      statStages: {
        attack: 0,
        defense: 0,
        spAtk: 0,
        spDef: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
      volatileStatus: [],
      ability: pokemon.abilities && pokemon.abilities.length > 0 ? {
        name: pokemon.abilities[0].ability.name,
        zhName: pokemon.abilities[0].ability.zhName || pokemon.abilities[0].ability.name,
        description: '',
        zhDescription: ''
      } : undefined
    };
  }

  static calculateStats(base: Stats, ivs: Stats, nature: Nature, level: number): Stats {
    const calc = (b: number, i: number, statName: string) => {
      let val = Math.floor((2 * b + i + 0) * level / 100 + 5);
      if (nature.plus === statName) val = Math.floor(val * 1.1);
      if (nature.minus === statName) val = Math.floor(val * 0.9);
      return val;
    };

    return {
      hp: Math.floor((2 * base.hp + ivs.hp + 0) * level / 100 + level + 10),
      attack: calc(base.attack, ivs.attack, 'attack'),
      defense: calc(base.defense, ivs.defense, 'defense'),
      spAtk: calc(base.spAtk, ivs.spAtk, 'spAtk'),
      spDef: calc(base.spDef, ivs.spDef, 'spDef'),
      speed: calc(base.speed, ivs.speed, 'speed'),
    };
  }
}
