import React from 'react';
import { motion } from 'motion/react';

export const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white gap-12 p-12">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center border-8 border-slate-800 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="w-full h-2 bg-slate-800" />
        <div className="absolute w-12 h-12 bg-white rounded-full border-8 border-slate-800" />
      </motion.div>
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-4xl font-black italic text-slate-800 uppercase tracking-tighter animate-pulse">
          Loading...
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-xs">
          Preparing your adventure
        </p>
      </div>
    </div>
  );
};
