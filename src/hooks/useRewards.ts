import { useState } from 'react';
import { GamePokemon, Item } from '../types';

export const useRewards = () => {
  const [rewards, setRewards] = useState<{ type: 'ITEM' | 'POKEMON' | 'MOVE' | 'EVOLUTION' | 'SHOP_ITEM', data: any }[]>([]);
  const [rewardChoiceMade, setRewardChoiceMade] = useState(false);
  const [rerollCount, setRerollCount] = useState(0);
  const [rewardPokemonOptions, setRewardPokemonOptions] = useState<GamePokemon[]>([]);
  const [showRewardPokemonSelect, setShowRewardPokemonSelect] = useState(false);
  const [shopItems, setShopItems] = useState<{item: Item, price: number}[]>([]);

  return {
    rewards,
    setRewards,
    rewardChoiceMade,
    setRewardChoiceMade,
    rerollCount,
    setRerollCount,
    rewardPokemonOptions,
    setRewardPokemonOptions,
    showRewardPokemonSelect,
    setShowRewardPokemonSelect,
    shopItems,
    setShopItems,
  };
};
