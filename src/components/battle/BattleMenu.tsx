import React from 'react';
import { Move, Item, GamePokemon, BattleMenuTab } from '../../types/index';
import { getLocalized } from '../../utils/common';
import { TYPE_COLORS } from '../../constants/index';
import { Sword, Package, RefreshCw, ChevronRight, ShoppingCart } from 'lucide-react';

interface BattleMenuProps {
  tab: BattleMenuTab;
  setTab: (tab: BattleMenuTab) => void;
  moves: Move[];
  onMoveSelect: (move: Move) => void;
  inventory: { item: Item; count: number }[];
  onItemSelect: (item: Item, index: number) => void;
  playerTeam: GamePokemon[];
  onPokemonSelect: (index: number) => void;
  onRun: () => void;
  disabled?: boolean;
  currentLanguage: string;
}

export const BattleMenu: React.FC<BattleMenuProps> = ({ 
  tab, setTab, moves, onMoveSelect, inventory, onItemSelect, playerTeam, onPokemonSelect, onRun, disabled, currentLanguage 
}) => {
  if (tab === 'MAIN') {
    return (
      <div className="grid grid-cols-2 gap-6 h-full p-4">
        <button 
          onClick={() => setTab('MOVES')}
          disabled={disabled}
          className="relative group overflow-hidden bg-red-500 hover:bg-red-600 text-white font-black italic text-4xl uppercase tracking-tighter border-8 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 -skew-x-12"
        >
          <div className="flex items-center justify-center gap-6 skew-x-12">
            <Sword className="w-10 h-10" />
            <span>Fight</span>
          </div>
        </button>
        <button 
          onClick={() => setTab('BAG')}
          disabled={disabled}
          className="relative group overflow-hidden bg-orange-400 hover:bg-orange-500 text-white font-black italic text-4xl uppercase tracking-tighter border-8 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 -skew-x-12"
        >
          <div className="flex items-center justify-center gap-6 skew-x-12">
            <Package className="w-10 h-10" />
            <span>Bag</span>
          </div>
        </button>
        <button 
          onClick={() => setTab('POKEMON')}
          disabled={disabled}
          className="relative group overflow-hidden bg-green-500 hover:bg-green-600 text-white font-black italic text-4xl uppercase tracking-tighter border-8 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 -skew-x-12"
        >
          <div className="flex items-center justify-center gap-6 skew-x-12">
            <RefreshCw className="w-10 h-10" />
            <span>Pkmn</span>
          </div>
        </button>
        <button 
          onClick={onRun}
          disabled={disabled}
          className="relative group overflow-hidden bg-blue-500 hover:bg-blue-600 text-white font-black italic text-4xl uppercase tracking-tighter border-8 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 -skew-x-12"
        >
          <div className="flex items-center justify-center gap-6 skew-x-12">
            <ChevronRight className="w-10 h-10" />
            <span>Run</span>
          </div>
        </button>
      </div>
    );
  }

  if (tab === 'MOVES') {
    return (
      <div className="flex flex-col gap-2 h-full p-2 overflow-y-auto custom-scrollbar">
        {moves.map((move, idx) => (
          <button 
            key={idx}
            onClick={() => onMoveSelect(move)}
            disabled={disabled || (move.currentPP || 0) <= 0}
            className="flex items-center justify-between p-4 bg-white border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 -skew-x-6"
          >
            <div className="flex flex-col items-start skew-x-6">
              <span className="font-black italic text-xl uppercase tracking-tight text-slate-900">{getLocalized(move, currentLanguage)}</span>
              <div className="flex gap-2 items-center mt-1">
                <div 
                  className="w-4 h-4 border-2 border-slate-950" 
                  style={{ backgroundColor: TYPE_COLORS[move.type] }}
                />
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">{move.type}</span>
              </div>
            </div>
            <div className="flex flex-col items-end skew-x-6">
              <span className="font-mono font-black text-sm text-slate-800">PP {move.currentPP}/{move.maxPP}</span>
            </div>
          </button>
        ))}
        <button 
          onClick={() => setTab('MAIN')}
          className="mt-2 p-2 font-black italic uppercase text-slate-400 hover:text-slate-800 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-slate-400 font-black italic uppercase text-xl">
      Coming Soon...
      <button 
        onClick={() => setTab('MAIN')}
        className="ml-4 text-slate-800 underline"
      >
        Back
      </button>
    </div>
  );
};
