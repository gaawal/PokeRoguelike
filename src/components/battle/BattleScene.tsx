import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamePokemon, Weather, Terrain, Dimension } from '../../types';
import { PokemonCard } from '../pokemon/PokemonCard';
import { CloudRain, Zap, Flame, Snowflake, Wind, Mountain, Eye, Sparkles } from 'lucide-react';

interface BattleSceneProps {
  playerPokemon: GamePokemon;
  enemyPokemon: GamePokemon;
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  currentLanguage: string;
  activeMoveType: string | null;
}

export const BattleScene: React.FC<BattleSceneProps> = ({
  playerPokemon,
  enemyPokemon,
  playerAnim,
  enemyAnim,
  weather,
  terrain,
  dimension,
  currentLanguage,
  activeMoveType
}) => {
  const getWeatherIcon = () => {
    switch (weather) {
      case 'rainy': case 'heavy_rain': return <CloudRain className="w-6 h-6 text-blue-400 animate-bounce" />;
      case 'sunny': case 'harsh_sunlight': return <Flame className="w-6 h-6 text-orange-400 animate-pulse" />;
      case 'sandstorm': return <Mountain className="w-6 h-6 text-yellow-700 animate-spin" />;
      case 'snow': return <Snowflake className="w-6 h-6 text-blue-200 animate-spin" />;
      case 'strong_winds': return <Wind className="w-6 h-6 text-slate-300 animate-pulse" />;
      default: return null;
    }
  };

  const getTerrainIcon = () => {
    switch (terrain) {
      case 'electric': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'grassy': return <Sparkles className="w-6 h-6 text-green-400" />;
      case 'psychic': return <Eye className="w-6 h-6 text-purple-400" />;
      case 'misty': return <Sparkles className="w-6 h-6 text-pink-300" />;
      default: return null;
    }
  };

  return (
    <div className="relative h-96 bg-gradient-to-b from-sky-300 to-emerald-400 overflow-hidden border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {weather === 'rainy' && <div className="absolute inset-0 bg-blue-900/30 animate-pulse" />}
        {weather === 'sunny' && <div className="absolute inset-0 bg-orange-200/30 animate-pulse" />}
      </div>

      {/* Environment Indicators */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {getWeatherIcon()}
        {getTerrainIcon()}
        {dimension !== 'none' && <Zap className="w-6 h-6 text-purple-600 animate-pulse" />}
      </div>

      {/* Enemy Side */}
      <div className="absolute top-12 right-12">
        <PokemonCard 
          pokemon={enemyPokemon} 
          isEnemy 
          animation={enemyAnim} 
          currentLanguage={currentLanguage} 
        />
      </div>

      {/* Player Side */}
      <div className="absolute bottom-4 left-12">
        <PokemonCard 
          pokemon={playerPokemon} 
          animation={playerAnim} 
          currentLanguage={currentLanguage} 
        />
      </div>

      {/* Move Animation Overlay */}
      <AnimatePresence>
        {activeMoveType && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
          >
            <div className="w-full h-full bg-white/10 backdrop-blur-[2px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
