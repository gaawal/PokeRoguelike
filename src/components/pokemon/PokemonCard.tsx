import React from 'react';
import { motion } from 'motion/react';
import { GamePokemon } from '../../types';
import { TypeBadge } from '../common/TypeBadge';
import { getLocalized } from '../../utils/common';
import { Sword, Shield, Heart, Zap } from 'lucide-react';

interface PokemonCardProps {
  pokemon: GamePokemon;
  isEnemy?: boolean;
  animation?: 'idle' | 'attack' | 'hit' | 'faint';
  currentLanguage: string;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, isEnemy, animation, currentLanguage }) => {
  const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
  const hpColor = hpPercent > 50 ? 'bg-green-400' : hpPercent > 20 ? 'bg-yellow-400' : 'bg-red-500';

  const variants = {
    idle: { x: 0, y: 0, scale: 1, rotate: 0 },
    attack: { x: isEnemy ? -60 : 60, transition: { duration: 0.2, ease: "easeOut" } },
    hit: { x: [0, -15, 15, -15, 15, 0], transition: { duration: 0.4 } },
    faint: { y: 150, opacity: 0, transition: { duration: 0.6, ease: "easeIn" } }
  };

  return (
    <motion.div 
      animate={animation}
      variants={variants}
      className={`flex flex-col ${isEnemy ? 'items-end' : 'items-start'} gap-4`}
    >
      {/* HP Bar Container */}
      <div className={`relative ${isEnemy ? 'w-56' : 'w-72'} bg-slate-900/90 backdrop-blur-md p-4 border-4 border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -skew-x-12`}>
        <div className="skew-x-12">
          <div className="flex justify-between items-end mb-2">
            <span className="font-black italic text-2xl uppercase tracking-tighter text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {getLocalized(pokemon, currentLanguage)}
            </span>
            <span className="font-black italic text-slate-400 text-sm">Lv.{pokemon.level}</span>
          </div>
          
          <div className="flex gap-1 mb-3">
            {pokemon.types.map(t => (
              <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
            ))}
          </div>

          <div className="relative h-4 bg-slate-800 border-2 border-slate-950 overflow-hidden">
            <motion.div 
              initial={{ width: `${hpPercent}%` }}
              animate={{ width: `${hpPercent}%` }}
              className={`h-full ${hpColor} transition-colors duration-500 relative`}
            >
              {/* Shine effect on HP bar */}
              <div className="absolute inset-0 bg-white/20 h-1/2" />
            </motion.div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status: OK</span>
            </div>
            <div className="font-mono font-black text-xs text-white">
              <span className={hpPercent < 20 ? 'text-red-500 animate-pulse' : ''}>
                {Math.ceil(pokemon.currentHp)}
              </span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{pokemon.maxHp}</span>
            </div>
          </div>

          {pokemon.status && (
            <div className="mt-3 inline-block px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase italic border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {pokemon.status}
            </div>
          )}
        </div>
      </div>

      {/* Sprite Container */}
      <div className="relative group">
        {/* Shadow/Platform under Pokemon */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/20 blur-xl rounded-full" />
        
        <img 
          src={isEnemy ? pokemon.sprites.front_default : pokemon.sprites.back_default} 
          alt={pokemon.name}
          className={`${isEnemy ? 'w-40 h-40' : 'w-64 h-64'} pixelated drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] relative z-10 transition-transform group-hover:scale-110`}
          referrerPolicy="no-referrer"
        />
      </div>
    </motion.div>
  );
};
