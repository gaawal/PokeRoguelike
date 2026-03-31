import React from 'react';
import { motion } from 'motion/react';
import { GamePokemon } from '../../types';
import { getLocalized } from '../../utils/common';
import { TypeBadge } from '../common/TypeBadge';
import { Sword, Shield, Zap, Heart } from 'lucide-react';

interface StarterSelectProps {
  options: GamePokemon[];
  onSelect: (index: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: string;
}

export const StarterSelect: React.FC<StarterSelectProps> = ({ options, onSelect, t, currentLanguage }) => {
  return (
    <div className="flex flex-col items-center gap-16 py-24 px-12 bg-slate-900 h-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center relative z-10"
      >
        <h1 className="text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          {t('chooseStarter')}
        </h1>
        <div className="h-2 w-64 bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xl mt-4">
          {t('chooseStarterDesc')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full max-w-7xl relative z-10">
        {options.map((pokemon, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col items-center p-12 bg-slate-800 border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-6"
          >
            <div className="skew-x-6 flex flex-col items-center w-full">
              <div className="relative mb-12 p-10 bg-slate-900 border-4 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:bg-red-900/20 transition-colors">
                <img 
                  src={pokemon.sprites.front_default} 
                  alt={pokemon.name}
                  className="w-56 h-56 pixelated drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h3 className="text-5xl font-black italic uppercase text-white mb-6 tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                {getLocalized(pokemon, currentLanguage)}
              </h3>
              
              <div className="flex gap-3 mb-10">
                {pokemon.types.map(t => (
                  <TypeBadge key={t.type.name} type={t.type.name} size="md" />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6 w-full mb-16 px-6 bg-slate-900/50 p-6 border-4 border-slate-950">
                <div className="flex items-center gap-4">
                  <Heart className="w-6 h-6 text-red-500" />
                  <span className="font-black italic text-white text-xl">{pokemon.maxHp}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Sword className="w-6 h-6 text-orange-500" />
                  <span className="font-black italic text-white text-xl">{pokemon.calculatedStats.attack}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Shield className="w-6 h-6 text-blue-500" />
                  <span className="font-black italic text-white text-xl">{pokemon.calculatedStats.defense}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <span className="font-black italic text-white text-xl">{pokemon.calculatedStats.speed}</span>
                </div>
              </div>

              <button 
                onClick={() => onSelect(idx)}
                className="w-full py-6 bg-red-600 text-white font-black italic uppercase tracking-tighter text-3xl border-8 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all -skew-x-12"
              >
                <span className="skew-x-12 inline-block">{t('iChooseYou')}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
