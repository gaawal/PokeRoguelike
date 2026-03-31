import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { getLocalized } from '../../utils/common';

interface RewardChoiceProps {
  reward: any;
  onSelect: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: string;
}

export const RewardChoice: React.FC<RewardChoiceProps> = ({ reward, onSelect, t, currentLanguage }) => {
  return (
    <motion.button
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={onSelect}
      className="group relative flex flex-col items-center p-8 bg-white border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
        {reward.type === 'ITEM' && <ChevronRight className="w-12 h-12 text-blue-500" />}
        {reward.type === 'POKEMON' && <Info className="w-12 h-12 text-green-500" />}
        {reward.type === 'MOVE' && <RefreshCw className="w-12 h-12 text-purple-500" />}
      </div>
      <h3 className="text-2xl font-black italic uppercase text-slate-800 mb-2">
        {reward.type === 'ITEM' ? t('getItem') : reward.type === 'POKEMON' ? t('joinTeam') : t('learnMove')}
      </h3>
      <p className="text-slate-500 text-sm font-bold text-center leading-relaxed">
        {reward.type === 'ITEM' ? reward.data.zhName : reward.type === 'POKEMON' ? getLocalized(reward.data, currentLanguage) : t('learnMoveDesc')}
      </p>
    </motion.button>
  );
};
