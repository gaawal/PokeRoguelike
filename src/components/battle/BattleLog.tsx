import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BattleLogProps {
  logs: string[];
  showHistory?: boolean;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, showHistory }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 font-mono text-sm border-l-4 border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-200">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="font-black italic uppercase text-slate-400">Battle Feed</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-col gap-2">
          {logs.map((log, idx) => (
            <motion.div 
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`p-2 rounded ${idx === logs.length - 1 ? 'bg-white border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-500'}`}
            >
              <span className="text-slate-300 mr-2">[{idx + 1}]</span>
              <span className="font-bold">{log}</span>
            </motion.div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
