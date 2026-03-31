import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Coins, ChevronRight, Info } from 'lucide-react';
import { Item } from '../../types';

interface ShopProps {
  items: Item[];
  coins: number;
  onBuy: (item: Item) => void;
  onNext: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const Shop: React.FC<ShopProps> = ({ items, coins, onBuy, onNext, t }) => {
  return (
    <div className="flex flex-col items-center gap-16 py-24 px-12 bg-slate-900 h-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center relative z-10"
      >
        <div className="w-24 h-24 bg-yellow-400 flex items-center justify-center border-8 border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] -rotate-12 mb-6">
          <ShoppingCart className="w-12 h-12 text-yellow-900 rotate-12" />
        </div>
        <h1 className="text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          {t('pokeShop')}
        </h1>
        <div className="h-2 w-64 bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xl mt-4">
          {t('pokeShopDesc')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full max-w-7xl relative z-10">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group flex flex-col p-10 bg-slate-800 border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-6"
          >
            <div className="skew-x-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="p-6 bg-slate-900 border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-yellow-900/20 transition-colors">
                  <ChevronRight className="w-10 h-10 text-yellow-400" />
                </div>
                <div className="flex items-center gap-3 bg-yellow-400 px-5 py-2 border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Coins className="w-5 h-5 text-yellow-900" />
                  <span className="font-black italic text-2xl text-yellow-900 tracking-tighter">{item.price}</span>
                </div>
              </div>
              
              <h3 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {item.zhName}
              </h3>
              
              <p className="text-slate-400 text-lg font-black uppercase tracking-widest mb-10 flex-1 leading-tight">
                {item.description}
              </p>

              <button 
                onClick={() => onBuy(item)}
                disabled={coins < (item.price || 0)}
                className="w-full py-4 bg-slate-900 text-white font-black italic uppercase tracking-tighter text-2xl border-4 border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 -skew-x-12"
              >
                <span className="skew-x-12 inline-block">{t('buy')}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={onNext}
        className="mt-16 px-24 py-8 bg-red-600 text-white font-black italic text-5xl uppercase tracking-tighter border-8 border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all -skew-x-12"
      >
        <span className="skew-x-12 inline-block">{t('continueAdventure')}</span>
      </button>
    </div>
  );
};
