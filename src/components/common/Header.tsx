import React from 'react';
import { Coins, Trophy, RefreshCw, ChevronRight } from 'lucide-react';

interface HeaderProps {
  coins: number;
  stage: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const Header: React.FC<HeaderProps> = ({ coins, stage, t }) => {
  return (
    <div className="flex justify-between items-center px-12 py-6 bg-slate-900 text-white border-b-8 border-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      <div className="flex items-center gap-12 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-red-600 flex items-center justify-center border-4 border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-6">
            <span className="text-white font-black italic text-2xl rotate-6">PK</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black italic uppercase text-4xl tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              Pokemon Rogue
            </span>
            <div className="h-1.5 w-full bg-red-600 mt-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 px-6 py-2 border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -skew-x-12">
          <div className="skew-x-12 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-black italic text-xl uppercase tracking-tighter">{t('stage')} {stage}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 bg-yellow-400 px-8 py-3 border-4 border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -skew-x-12">
          <div className="skew-x-12 flex items-center gap-4">
            <Coins className="w-6 h-6 text-yellow-900" />
            <span className="font-black italic text-3xl text-yellow-900 tracking-tighter">{coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
