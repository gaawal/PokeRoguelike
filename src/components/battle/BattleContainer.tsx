import React from 'react';
import { useBattle } from '../../hooks/useBattle';
import { BattleLayout } from './BattleLayout';
import { GamePokemon, Weather, Terrain, Dimension, Item, Move } from '../../types';

interface BattleContainerProps {
  playerTeam: GamePokemon[];
  enemyPokemon: GamePokemon;
  weather: Weather;
  terrain: Terrain;
  dimension: Dimension;
  stage: number;
  inventory: { item: Item; count: number }[];
  onBattleEnd: (result: 'WIN' | 'LOSS' | 'RUN' | 'CATCH', data?: any) => void;
  currentLanguage: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const BattleContainer: React.FC<BattleContainerProps> = ({
  playerTeam: initialPlayerTeam,
  enemyPokemon: initialEnemy,
  weather,
  terrain,
  dimension,
  stage,
  inventory,
  onBattleEnd,
  currentLanguage,
  t
}) => {
  const {
    playerTeam,
    enemy,
    turn,
    battleMenuTab,
    setBattleMenuTab,
    battleLogs,
    playerAnim,
    enemyAnim,
    activeMoveType,
    isProcessing,
    handleAttack
  } = useBattle(initialPlayerTeam, initialEnemy, {
    weather,
    terrain,
    dimension,
    activeBuffs: { atk: false, def: false },
    enemyBuffs: { atk: false, def: false },
    currentLanguage,
    onBattleEnd
  });

  return (
    <BattleLayout 
      playerPokemon={playerTeam[0]}
      enemyPokemon={enemy}
      playerAnim={playerAnim}
      enemyAnim={enemyAnim}
      weather={weather}
      terrain={terrain}
      dimension={dimension}
      stage={stage}
      tab={battleMenuTab}
      setTab={setBattleMenuTab}
      moves={playerTeam[0].selectedMoves}
      onMoveSelect={handleAttack}
      inventory={inventory}
      onItemSelect={(item) => {
        // Handle item use logic here or in useBattle
        console.log('Item selected:', item);
      }}
      playerTeam={playerTeam}
      onPokemonSelect={(idx) => {
        // Handle switch logic
        console.log('Pokemon selected:', idx);
      }}
      onRun={() => onBattleEnd('RUN')}
      logs={battleLogs}
      disabled={isProcessing || turn === 'ENEMY'}
      currentLanguage={currentLanguage}
      activeMoveType={activeMoveType}
      t={t}
    />
  );
};
