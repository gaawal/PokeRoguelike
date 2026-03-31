import { useState, useCallback, useRef } from 'react';
import { GamePokemon, Move, Weather, Terrain, Dimension, BattleMenuTab, Item } from '../types';
import { BattleEngine } from '../core/battle/BattleEngine';
import { sleep } from '../utils/common';

export const useBattle = (
  initialPlayerTeam: GamePokemon[],
  initialEnemy: GamePokemon,
  context: {
    weather: Weather;
    terrain: Terrain;
    dimension: Dimension;
    activeBuffs: { atk: boolean; def: boolean };
    enemyBuffs: { atk: boolean; def: boolean };
    currentLanguage: string;
    onBattleEnd: (result: 'WIN' | 'LOSS' | 'RUN' | 'CATCH', data?: any) => void;
  }
) => {
  const [playerTeam, setPlayerTeam] = useState<GamePokemon[]>(initialPlayerTeam);
  const [enemy, setEnemy] = useState<GamePokemon>(initialEnemy);
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY'>('PLAYER');
  const [battleMenuTab, setBattleMenuTab] = useState<BattleMenuTab>('MAIN');
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [activeMoveType, setActiveMoveType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addMessages = useCallback(async (msgs: string[]) => {
    for (const msg of msgs) {
      setBattleLogs(prev => [...prev, msg]);
      await sleep(1000);
    }
  }, []);

  const updateStates = useCallback((attacker: GamePokemon, defender: GamePokemon) => {
    // This logic depends on who is attacking, which we'll handle in the execution
  }, []);

  const handleAttack = async (move: Move) => {
    if (isProcessing || turn !== 'PLAYER') return;
    setIsProcessing(true);
    setBattleMenuTab('MAIN');

    const playerPokemon = playerTeam[0];
    
    const result = await BattleEngine.executeTurn(move, playerPokemon, enemy, true, {
      weather: context.weather,
      terrain: context.terrain,
      dimension: context.dimension,
      activeBuffs: context.activeBuffs,
      enemyBuffs: context.enemyBuffs,
      addMessages,
      updateStates: (a, d) => {
        setPlayerTeam(prev => [a, ...prev.slice(1)]);
        setEnemy(d);
      },
      setPlayerAnim,
      setEnemyAnim,
      setActiveMoveType
    });

    if (result.success === 'FAINTED') {
      context.onBattleEnd('WIN');
      setIsProcessing(false);
      return;
    }

    setTurn('ENEMY');
    await executeEnemyTurn(result.defender, result.attacker);
    setIsProcessing(false);
  };

  const executeEnemyTurn = async (enemyPokemon: GamePokemon, playerPokemon: GamePokemon) => {
    await sleep(1000);
    const move = enemyPokemon.selectedMoves[Math.floor(Math.random() * enemyPokemon.selectedMoves.length)];
    
    const result = await BattleEngine.executeTurn(move, enemyPokemon, playerPokemon, false, {
      weather: context.weather,
      terrain: context.terrain,
      dimension: context.dimension,
      activeBuffs: context.activeBuffs,
      enemyBuffs: context.enemyBuffs,
      addMessages,
      updateStates: (a, d) => {
        setEnemy(a);
        setPlayerTeam(prev => [d, ...prev.slice(1)]);
      },
      setPlayerAnim,
      setEnemyAnim,
      setActiveMoveType
    });

    if (result.success === 'FAINTED') {
      context.onBattleEnd('LOSS');
      return;
    }

    setTurn('PLAYER');
  };

  return {
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
    handleAttack,
    logsEndRef
  };
};
