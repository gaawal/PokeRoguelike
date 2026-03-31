import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, ChevronRight } from 'lucide-react';

interface GameOverProps {
  stage: number;
  onRestart: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const GameOver: React.FC<GameOverProps> = ({ stage, onRestart, t }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 gap-16 p-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_white_180deg,_transparent_360deg)] animate-spin-slow" />
      
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-8 relative z-10"
      >
        <div className="w-40 h-40 bg-slate-800 flex items-center justify-center border-[12px] border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] -rotate-12">
          <span className="text-white font-black italic text-6xl rotate-12">GG</span>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-[10rem] font-black italic text-white uppercase tracking-tighter drop-shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center leading-none">
            {t('gameOver')}
          </h1>
          <div className="h-4 w-full bg-red-600 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.8em] text-xl text-center mt-4">
          {t('gameOverDesc')}
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-6 bg-slate-800 p-12 border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] -skew-x-6 relative z-10">
        <div className="skew-x-6 flex flex-col items-center">
          <span className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm mb-2">{t('finalScore')}</span>
          <span className="text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">{t('stage')} {stage}</span>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="px-24 py-8 bg-red-600 text-white font-black italic text-5xl uppercase tracking-tighter border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-12 relative z-10"
      >
        <div className="flex items-center gap-8 skew-x-12">
          <RefreshCw className="w-14 h-14" />
          <span>{t('tryAgain')}</span>
        </div>
      </button>
    </div>
  );
};
