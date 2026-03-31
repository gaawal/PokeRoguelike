import React from 'react';
import { motion } from 'motion/react';
import { Sword, Trophy, RefreshCw, ChevronRight } from 'lucide-react';
import { GENERATIONS } from '../../constants';

interface StartScreenProps {
  step: number;
  onNext: () => void;
  selectedGens: number[];
  onGenToggle: (id: number) => void;
  difficulty: number;
  onDifficultyChange: (val: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  step, onNext, selectedGens, onGenToggle, difficulty, onDifficultyChange, t
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_white_180deg,_transparent_360deg)] animate-spin-slow" />
      
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-8 mb-16 relative z-10 flex-shrink-0"
      >
        <div className="w-40 h-40 bg-red-600 flex items-center justify-center border-[12px] border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] -rotate-12">
          <span className="text-white font-black italic text-6xl rotate-12">PK</span>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black italic text-white uppercase tracking-tighter drop-shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center leading-none">
            Pokemon Rogue
          </h1>
          <div className="h-4 w-full bg-red-600 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.8em] text-xl text-center mt-4">
          {t('rogueJourney')}
        </p>
      </motion.div>

      {step === 0 && (
        <motion.button 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={onNext}
          className="group relative z-10 px-24 py-8 bg-red-600 text-white font-black italic text-5xl uppercase tracking-tighter border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-12"
        >
          <div className="flex items-center gap-8 skew-x-12">
            <Sword className="w-14 h-14 group-hover:rotate-12 transition-transform" />
            <span>{t('startBattle')}</span>
          </div>
        </motion.button>
      )}

      {step === 1 && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-center gap-12 w-full max-w-5xl relative z-10"
        >
          <h2 className="text-5xl font-black italic uppercase text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] -skew-x-12 bg-red-600 px-12 py-3 border-4 border-slate-950">
            <span className="skew-x-12 inline-block">{t('selectRegion')}</span>
          </h2>
          <div className="grid grid-cols-3 gap-6 w-full">
            {GENERATIONS.map(gen => (
              <button 
                key={gen.id}
                onClick={() => onGenToggle(gen.id)}
                className={`p-8 border-8 border-slate-950 font-black italic uppercase tracking-tighter text-3xl transition-all -skew-x-6 ${selectedGens.includes(gen.id) ? 'bg-red-600 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
              >
                <div className="flex flex-col items-center gap-2 skew-x-6">
                  <span className="text-xs opacity-50 tracking-[0.3em]">{gen.name}</span>
                  <span>{gen.region}</span>
                </div>
              </button>
            ))}
          </div>
          <button 
            onClick={onNext}
            disabled={selectedGens.length === 0}
            className="mt-8 px-16 py-6 bg-white text-slate-900 font-black italic uppercase tracking-tighter text-4xl border-8 border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-50 -skew-x-12"
          >
            <span className="skew-x-12 inline-block">{t('nextStep')}</span>
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col items-center gap-16 w-full max-w-3xl relative z-10"
        >
          <h2 className="text-5xl font-black italic uppercase text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] -skew-x-12 bg-red-600 px-12 py-3 border-4 border-slate-950">
            <span className="skew-x-12 inline-block">{t('setDifficulty')}</span>
          </h2>
          <div className="w-full flex flex-col gap-8 bg-slate-800 p-12 border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] -skew-x-6">
            <div className="skew-x-6">
              <div className="flex justify-between font-black italic uppercase text-slate-400 text-xl tracking-widest mb-4">
                <span>Beginner</span>
                <span>Master</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="100" 
                step="5" 
                value={difficulty} 
                onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
                className="w-full h-8 bg-slate-900 rounded-none appearance-none border-4 border-slate-950 cursor-pointer accent-red-600"
              />
              <div className="text-center mt-8">
                <span className="text-9xl font-black italic text-red-600 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">Lv.{difficulty}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onNext}
            className="px-24 py-8 bg-red-600 text-white font-black italic text-5xl uppercase tracking-tighter border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-12"
          >
            <span className="skew-x-12 inline-block">{t('startAdventure')}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
