import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamePokemon, Pokemon } from '../../types';

interface EvolutionAnimationProps {
  from: GamePokemon;
  to: Pokemon;
  onComplete: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLocalized: (obj: any) => string;
}

export const EvolutionAnimation: React.FC<EvolutionAnimationProps> = ({ from, to, onComplete, t, getLocalized }) => {
  const [phase, setPhase] = useState<'START' | 'FLICKER' | 'FLASH' | 'RESULT'>('START');
  const [showTo, setShowTo] = useState(false);
  const [flickerSpeed, setFlickerSpeed] = useState(400);

  useEffect(() => {
    const startTimer = setTimeout(() => setPhase('FLICKER'), 1000);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'FLICKER') return;

    let timer: NodeJS.Timeout;
    const flicker = () => {
      setShowTo(prev => !prev);
      setFlickerSpeed(prev => Math.max(50, prev * 0.9));
      
      if (flickerSpeed <= 60) {
        setPhase('FLASH');
      } else {
        timer = setTimeout(flicker, flickerSpeed);
      }
    };

    timer = setTimeout(flicker, flickerSpeed);
    return () => clearTimeout(timer);
  }, [phase, flickerSpeed]);

  useEffect(() => {
    if (phase !== 'FLASH') return;
    const flashTimer = setTimeout(() => setPhase('RESULT'), 500);
    return () => clearTimeout(flashTimer);
  }, [phase]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-white">
      {phase === 'FLASH' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-white"
        />
      )}

      <div className="relative w-64 h-64 mb-8">
        <AnimatePresence mode="wait">
          {phase === 'RESULT' ? (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="flex flex-col items-center"
            >
              <img 
                src={to.sprites.front_default} 
                alt={getLocalized(to.names)}
                className="w-full h-full object-contain pixelated"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ) : (
            <motion.div
              key={showTo ? 'to' : 'from'}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className="w-full h-full"
            >
              <img 
                src={showTo ? to.sprites.front_default : from.sprites.front_default} 
                alt="evolving"
                className={`w-full h-full object-contain pixelated ${phase === 'FLICKER' ? 'brightness-150' : ''}`}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'RESULT' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center px-4"
        >
          <h2 className="text-3xl font-bold text-blue-600 mb-4">
            {t('evolveSuccessMsg', { from: getLocalized(from.names), to: getLocalized(to.names) })}
          </h2>
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-blue-500 text-white rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors"
          >
            {t('confirm')}
          </button>
        </motion.div>
      )}
      
      {phase !== 'RESULT' && (
        <div className="text-gray-400 font-mono animate-pulse">
          EVOLVING...
        </div>
      )}
    </div>
  );
};
