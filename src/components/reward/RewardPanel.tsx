import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { getLocalized } from '../../utils/common';

interface RewardPanelProps {
  rewards: any[];
  onSelect: (reward: any) => void;
  onReroll: () => void;
  rerollCost: number;
  coins: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: string;
}

export const RewardPanel: React.FC<RewardPanelProps> = ({ rewards, onSelect, onReroll, rerollCost, coins, t, currentLanguage }) => {
  return (
    <div className="flex flex-col items-center gap-12 py-20 bg-slate-900 h-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <div className="bg-yellow-400 p-10 flex items-center justify-center border-8 border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] -rotate-6">
          <Trophy className="w-20 h-20 text-yellow-900 rotate-6" />
        </div>
        <h1 className="text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] mt-4">
          {t('victory')}
        </h1>
        <div className="h-2 w-48 bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xl mt-4">
          {t('chooseReward')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl px-8 relative z-10">
        {rewards.map((reward, idx) => (
          <motion.button
            key={idx}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(reward)}
            className="group relative flex flex-col items-center p-10 bg-slate-800 border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all overflow-hidden -skew-x-6"
          >
            <div className="skew-x-6 flex flex-col items-center w-full">
              <div className="absolute top-0 left-0 w-full h-4 bg-blue-600 shadow-[0_4px_0_0_rgba(0,0,0,1)]" />
              <div className="mb-8 p-8 bg-slate-900 border-4 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:bg-blue-900/20 transition-colors">
                {reward.type === 'ITEM' && <ChevronRight className="w-16 h-16 text-blue-400" />}
                {reward.type === 'POKEMON' && <Info className="w-16 h-16 text-green-400" />}
                {reward.type === 'MOVE' && <RefreshCw className="w-16 h-16 text-purple-400" />}
              </div>
              <h3 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {reward.type === 'ITEM' ? t('getItem') : reward.type === 'POKEMON' ? t('joinTeam') : t('learnMove')}
              </h3>
              <p className="text-slate-400 text-lg font-black uppercase tracking-widest text-center leading-tight">
                {reward.type === 'ITEM' ? reward.data.zhName : reward.type === 'POKEMON' ? getLocalized(reward.data, currentLanguage) : t('learnMoveDesc')}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <button 
        onClick={onReroll}
        disabled={coins < rerollCost}
        className="mt-12 flex items-center gap-6 px-12 py-6 bg-slate-800 text-white font-black italic uppercase tracking-tighter text-3xl border-8 border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-50 -skew-x-12"
      >
        <div className="skew-x-12 flex items-center gap-6">
          <RefreshCw className="w-8 h-8 text-yellow-400" />
          <span>{t('reroll')} ({rerollCost} Coins)</span>
        </div>
      </button>
    </div>
  );
};
