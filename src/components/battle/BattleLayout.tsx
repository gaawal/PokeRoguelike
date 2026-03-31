import React from 'react';
import { BattleScene } from './BattleScene';
import { BattleMenu } from './BattleMenu';
import { BattleLog } from './BattleLog';
import { BattleHUD } from './BattleHUD';
import { GamePokemon, Move, Item, Weather, Terrain, Dimension, BattleMenuTab } from '../../types';

interface BattleLayoutProps {
  playerPokemon: GamePokemon;
  enemyPokemon: GamePokemon;
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  stage: number;
  tab: BattleMenuTab;
  setTab: (tab: BattleMenuTab) => void;
  moves: Move[];
  onMoveSelect: (move: Move) => void;
  inventory: { item: Item; count: number }[];
  onItemSelect: (item: Item, index: number) => void;
  playerTeam: GamePokemon[];
  onPokemonSelect: (index: number) => void;
  onRun: () => void;
  logs: string[];
  disabled?: boolean;
  currentLanguage: string;
  activeMoveType: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const BattleLayout: React.FC<BattleLayoutProps> = ({
  playerPokemon,
  enemyPokemon,
  playerAnim,
  enemyAnim,
  weather,
  terrain,
  dimension,
  stage,
  tab,
  setTab,
  moves,
  onMoveSelect,
  inventory,
  onItemSelect,
  playerTeam,
  onPokemonSelect,
  onRun,
  logs,
  disabled,
  currentLanguage,
  activeMoveType,
  t
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* Full Screen Battle Scene */}
      <div className="flex-1 relative">
        <BattleScene 
          playerPokemon={playerPokemon}
          enemyPokemon={enemyPokemon}
          playerAnim={playerAnim}
          enemyAnim={enemyAnim}
          weather={weather}
          terrain={terrain}
          dimension={dimension}
          currentLanguage={currentLanguage}
          activeMoveType={activeMoveType}
        />
        
        {/* Floating HUD - Stage Info */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
          <BattleHUD 
            stage={stage} 
            weather={weather} 
            terrain={terrain} 
            dimension={dimension} 
            t={t} 
          />
        </div>
      </div>

      {/* Bottom UI Area */}
      <div className="h-64 bg-slate-800 border-t-8 border-slate-950 flex relative overflow-hidden">
        {/* Left: Battle Logs (Text Box Style) */}
        <div className="flex-1 p-6 bg-slate-900/50 border-r-4 border-slate-950 overflow-hidden">
          <BattleLog logs={logs} />
        </div>

        {/* Right: Battle Menu (Sword and Shield Style) */}
        <div className="w-[450px] bg-slate-800 p-4 relative">
          <BattleMenu 
            tab={tab}
            setTab={setTab}
            moves={moves}
            onMoveSelect={onMoveSelect}
            inventory={inventory}
            onItemSelect={onItemSelect}
            playerTeam={playerTeam}
            onPokemonSelect={onPokemonSelect}
            onRun={onRun}
            disabled={disabled}
            currentLanguage={currentLanguage}
          />
        </div>
      </div>
    </div>
  );
};
