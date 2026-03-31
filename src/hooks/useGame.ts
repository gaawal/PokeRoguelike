import { useState, useCallback, useEffect } from 'react';
import { GameState, GamePokemon, Item, Weather, Terrain, Dimension } from '../types/index';
import { getRandomPokemonId, getProcessedPokemon, getLearnableMoves, fetchEvolutionChain } from '../services/pokeApi';
import { ITEMS } from '../constants/index';

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [startStep, setStartStep] = useState(0);
  const [selectedGens, setSelectedGens] = useState<number[]>([1]);
  const [difficulty, setDifficulty] = useState(5);
  const [coins, setCoins] = useState(0);
  const [stage, setStage] = useState(1);
  const [playerTeam, setPlayerTeam] = useState<GamePokemon[]>([]);
  const [inventory, setInventory] = useState<{ item: Item; count: number }[]>([]);
  const [enemyPokemon, setEnemyPokemon] = useState<GamePokemon | null>(null);
  const [starterOptions, setStarterOptions] = useState<GamePokemon[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<{ pokemon: GamePokemon; nextPokemon: GamePokemon } | null>(null);
  const [weather, setWeather] = useState<Weather>('NONE');
  const [terrain, setTerrain] = useState<Terrain>('NONE');
  const [dimension, setDimension] = useState<Dimension>('NONE');

  // Initialize game
  const startGame = useCallback(async () => {
    setGameState('LOADING');
    const options = [];
    for (let i = 0; i < 3; i++) {
      const id = await getRandomPokemonId(selectedGens);
      const p = await getProcessedPokemon(id, difficulty);
      options.push(p);
    }
    setStarterOptions(options);
    setGameState('STARTER_SELECT');
  }, [selectedGens, difficulty]);

  const selectStarter = useCallback((index: number) => {
    const starter = starterOptions[index];
    setPlayerTeam([starter]);
    setInventory([
      { item: ITEMS.find(i => i.id === 'poke-ball')!, count: 5 },
      { item: ITEMS.find(i => i.id === 'potion')!, count: 3 }
    ]);
    startNewBattle();
  }, [starterOptions]);

  const startNewBattle = useCallback(async () => {
    setGameState('LOADING');
    const id = await getRandomPokemonId(selectedGens);
    const enemyLevel = difficulty + Math.floor(stage / 2);
    const p = await getProcessedPokemon(id, enemyLevel);
    setEnemyPokemon(p);
    setGameState('BATTLE');
  }, [selectedGens, difficulty, stage]);

  const winBattle = useCallback(async () => {
    const coinReward = 50 + stage * 10;
    setCoins(prev => prev + coinReward);
    
    // Generate rewards
    const newRewards = [];
    // Item reward
    const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    newRewards.push({ type: 'ITEM', data: randomItem });
    // Pokemon reward
    const randomId = await getRandomPokemonId(selectedGens);
    const p = await getProcessedPokemon(randomId, difficulty + Math.floor(stage / 2));
    newRewards.push({ type: 'POKEMON', data: p });
    // Move reward
    const learnable = await getLearnableMoves(playerTeam[0], playerTeam[0].selectedMoves, 1);
    if (learnable.length > 0) {
      newRewards.push({ type: 'MOVE', data: learnable[0] });
    }

    setRewards(newRewards);
    setGameState('REWARD');
  }, [stage, selectedGens, difficulty, playerTeam]);

  const selectReward = useCallback(async (reward: any) => {
    if (reward.type === 'ITEM') {
      setInventory(prev => {
        const existing = prev.find(i => i.item.id === reward.data.id);
        if (existing) {
          return prev.map(i => i.item.id === reward.data.id ? { ...i, count: i.count + 1 } : i);
        }
        return [...prev, { item: reward.data, count: 1 }];
      });
    } else if (reward.type === 'POKEMON') {
      setPlayerTeam(prev => [...prev, reward.data].slice(-6));
    } else if (reward.type === 'MOVE') {
      setPlayerTeam(prev => {
        const newTeam = [...prev];
        const p = { ...newTeam[0] };
        p.selectedMoves = [...p.selectedMoves, reward.data].slice(-4);
        newTeam[0] = p;
        return newTeam;
      });
    }

    // Check evolution
    const activePokemon = playerTeam[0];
    if (activePokemon.level >= 15) { // Simple evolution trigger
      const nextIds = await fetchEvolutionChain(activePokemon.id);
      if (nextIds.length > 0) {
        const nextPokemon = await getProcessedPokemon(nextIds[0], activePokemon.level);
        setEvolutionData({ pokemon: activePokemon, nextPokemon });
        setGameState('EVOLUTION');
        return;
      }
    }

    goToShop();
  }, [playerTeam]);

  const goToShop = useCallback(() => {
    const items = [];
    for (let i = 0; i < 4; i++) {
      items.push(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
    }
    setShopItems(items);
    setGameState('SHOP');
  }, []);

  const buyItem = useCallback((item: Item) => {
    if (coins >= (item.price || 0)) {
      setCoins(prev => prev - (item.price || 0));
      setInventory(prev => {
        const existing = prev.find(i => i.item.id === item.id);
        if (existing) {
          return prev.map(i => i.item.id === item.id ? { ...i, count: i.count + 1 } : i);
        }
        return [...prev, { item, count: 1 }];
      });
    }
  }, [coins]);

  const nextStage = useCallback(() => {
    setStage(prev => prev + 1);
    startNewBattle();
  }, [startNewBattle]);

  const handleEvolution = useCallback(async () => {
    if (!evolutionData) return;
    setGameState('LOADING');
    setPlayerTeam(prev => {
      const newTeam = [...prev];
      newTeam[0] = evolutionData.nextPokemon;
      return newTeam;
    });
    setEvolutionData(null);
    goToShop();
  }, [evolutionData, goToShop]);

  const restartGame = useCallback(() => {
    setGameState('START');
    setStartStep(0);
    setStage(1);
    setCoins(0);
    setPlayerTeam([]);
    setInventory([]);
  }, []);

  return {
    gameState, setGameState,
    startStep, setStartStep,
    selectedGens, setSelectedGens,
    difficulty, setDifficulty,
    coins, setCoins,
    stage, setStage,
    playerTeam, setPlayerTeam,
    inventory, setInventory,
    enemyPokemon, setEnemyPokemon,
    starterOptions,
    shopItems,
    rewards,
    evolutionData,
    weather, setWeather,
    terrain, setTerrain,
    dimension, setDimension,
    startGame,
    selectStarter,
    winBattle,
    selectReward,
    buyItem,
    nextStage,
    handleEvolution,
    restartGame
  };
};
