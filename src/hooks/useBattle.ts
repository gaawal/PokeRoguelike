import { useState, useCallback } from 'react';
import { GamePokemon, Move, Weather, Terrain, Dimension, BattleMenuTab } from '../types';

export const useBattle = () => {
  const [enemy, setEnemy] = useState<GamePokemon | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY'>('PLAYER');
  const [battleMenuTab, setBattleMenuTab] = useState<BattleMenuTab>('MAIN');
  const [weather, setWeather] = useState<Weather>('none');
  const [weatherTurns, setWeatherTurns] = useState(0);
  const [terrain, setTerrain] = useState<Terrain>('none');
  const [terrainTurns, setTerrainTurns] = useState(0);
  const [dimension, setDimension] = useState<Dimension>('none');
  const [dimensionTurns, setDimensionTurns] = useState(0);

  const addLog = useCallback((message: string) => {
    setBattleLog(prev => [message, ...prev].slice(0, 100));
  }, []);

  const clearLog = useCallback(() => {
    setBattleLog([]);
  }, []);

  return {
    enemy,
    setEnemy,
    battleLog,
    setBattleLog,
    addLog,
    clearLog,
    turn,
    setTurn,
    battleMenuTab,
    setBattleMenuTab,
    weather,
    setWeather,
    weatherTurns,
    setWeatherTurns,
    terrain,
    setTerrain,
    terrainTurns,
    setTerrainTurns,
    dimension,
    setDimension,
    dimensionTurns,
    setDimensionTurns,
  };
};
