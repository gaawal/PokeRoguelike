import React from 'react';
import { GamePokemon, Weather, Terrain, Dimension } from '../../types';
import { CloudRain, Zap, Flame, Snowflake, Wind, Mountain, Eye, Sparkles } from 'lucide-react';

interface BattleHUDProps {
  stage: number;
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({ stage, weather, terrain, dimension, t }) => {
  return (
    <div className="flex justify-between items-center px-12 py-4 bg-slate-900/90 backdrop-blur-md text-white border-4 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -skew-x-12">
      <div className="flex items-center gap-8 skew-x-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 flex items-center justify-center border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12">
            <span className="text-xl font-black italic -rotate-12">PK</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-0.5">Current Stage</span>
            <span className="font-black italic uppercase tracking-tighter text-3xl leading-none">{t('stage')} {stage}</span>
          </div>
        </div>
        
        <div className="h-10 w-1 bg-slate-700" />
        
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[8px]">Weather</span>
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span>{t(`weather_${weather}`)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[8px]">Terrain</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>{t(`terrain_${terrain}`)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[8px]">Dimension</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{t(`dimension_${dimension}`)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
