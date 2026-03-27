/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Trophy, 
  Skull, 
  RefreshCw, 
  ChevronRight,
  Info,
  Dna,
  Package,
  Target,
  Sparkles,
  Flame,
  Droplets,
  Leaf,
  Snowflake,
  Swords,
  Mountain,
  Wind,
  Eye,
  Bug,
  Gem,
  Ghost,
  Moon,
  Circle
} from 'lucide-react';
import { getProcessedPokemon, getRandomPokemonId, getLearnableMoves } from './services/pokeApi';
import { GamePokemon, GameState, Item, Move, BattleMenuTab } from './types';
import { TYPE_CHART, TYPE_ZH, GENERATIONS } from './constants';

// 属性颜色映射
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const TYPE_ICONS: Record<string, any> = {
  normal: Circle,
  fire: Flame,
  water: Droplets,
  grass: Leaf,
  electric: Zap,
  ice: Snowflake,
  fighting: Swords,
  poison: Skull,
  ground: Mountain,
  flying: Wind,
  psychic: Eye,
  bug: Bug,
  rock: Gem,
  ghost: Ghost,
  dragon: Dna,
  steel: Shield,
  fairy: Heart,
  dark: Moon,
};

const TypeBadge: React.FC<{ type: string, size?: 'xs' | 'sm' | 'md' | 'lg', className?: string }> = ({ type, size = 'sm', className = "" }) => {
  const Icon = TYPE_ICONS[type] || Sparkles;
  const color = TYPE_COLORS[type] || '#ccc';
  const zhName = TYPE_ZH[type] || type;
  
  const sizeClasses = {
    xs: 'text-[8px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-1 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2',
    lg: 'text-sm px-5 py-1.5 gap-2.5',
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div 
      className={`flex items-center text-white font-black italic uppercase shadow-md ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      <Icon className={`${iconSizes[size]} drop-shadow-sm`} />
      <span>{zhName}</span>
    </div>
  );
};

// 道具列表
const ALL_ITEMS: Item[] = [
  {
    id: 'potion',
    name: 'Potion',
    zhName: '回复药',
    description: 'Heal 50 HP',
    zhDescription: '恢复50点HP',
    effect: (p) => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + 50) })
  },
  {
    id: 'pokeball',
    name: 'Poke Ball',
    zhName: '精灵球',
    description: 'Used to catch wild Pokemon',
    zhDescription: '用于捕捉野生宝可梦',
    isBall: true,
    catchRate: 1.0,
    effect: (p) => p
  },
  {
    id: 'greatball',
    name: 'Great Ball',
    zhName: '超级球',
    description: 'Higher catch rate than Poke Ball',
    zhDescription: '比精灵球更容易捕捉',
    isBall: true,
    catchRate: 1.5,
    effect: (p) => p
  },
  {
    id: 'ultraball',
    name: 'Ultra Ball',
    zhName: '高级球',
    description: 'Very high catch rate',
    zhDescription: '捕捉概率非常高',
    isBall: true,
    catchRate: 2.0,
    effect: (p) => p
  },
  {
    id: 'masterball',
    name: 'Master Ball',
    zhName: '大师球',
    description: 'The ultimate ball that never fails',
    zhDescription: '绝对能捕捉到宝可梦的终极球',
    isBall: true,
    catchRate: 255, // 255 is guaranteed catch in my formula
    effect: (p) => p
  },
  {
    id: 'protein',
    name: 'Protein',
    zhName: '攻击增强',
    description: 'Increase Attack by 10%',
    zhDescription: '攻击力提升10%',
    effect: (p) => ({ ...p, calculatedStats: { ...p.calculatedStats, attack: Math.floor(p.calculatedStats.attack * 1.1) } })
  },
  {
    id: 'iron',
    name: 'Iron',
    zhName: '防御增强',
    description: 'Increase Defense by 10%',
    zhDescription: '防御力提升10%',
    effect: (p) => ({ ...p, calculatedStats: { ...p.calculatedStats, defense: Math.floor(p.calculatedStats.defense * 1.1) } })
  },
  {
    id: 'calcium',
    name: 'Calcium',
    zhName: '特攻增强',
    description: 'Increase Sp. Atk by 10%',
    zhDescription: '特攻提升10%',
    effect: (p) => ({ ...p, calculatedStats: { ...p.calculatedStats, spAtk: Math.floor(p.calculatedStats.spAtk * 1.1) } })
  },
  {
    id: 'zinc_item',
    name: 'Zinc',
    zhName: '特防增强',
    description: 'Increase Sp. Def by 10%',
    zhDescription: '特防提升10%',
    effect: (p) => ({ ...p, calculatedStats: { ...p.calculatedStats, spDef: Math.floor(p.calculatedStats.spDef * 1.1) } })
  },
  {
    id: 'carbos',
    name: 'Carbos',
    zhName: '速度增强',
    description: 'Increase Speed by 10%',
    zhDescription: '速度提升10%',
    effect: (p) => ({ ...p, calculatedStats: { ...p.calculatedStats, speed: Math.floor(p.calculatedStats.speed * 1.1) } })
  },
  {
    id: 'hp_up',
    name: 'HP Up',
    zhName: 'HP增强',
    description: 'Increase Max HP by 20%',
    zhDescription: '最大HP提升20%',
    effect: (p) => {
      const bonus = Math.floor(p.maxHp * 0.2);
      return { ...p, maxHp: p.maxHp + bonus, currentHp: Math.min(p.currentHp + bonus, p.maxHp + bonus) };
    }
  },
  {
    id: 'attack_up',
    name: 'Protein',
    zhName: '攻击增强',
    description: 'All moves power +10',
    zhDescription: '所有技能威力+10',
    effect: (p) => ({
      ...p,
      selectedMoves: p.selectedMoves.map(m => ({ ...m, power: (m.power || 0) + 10 }))
    })
  },
  {
    id: 'heal',
    name: 'Full Restore',
    zhName: '全复药',
    description: 'Fully heal your Pokemon',
    zhDescription: '完全恢复HP',
    effect: (p) => ({ ...p, currentHp: p.maxHp })
  },
  {
    id: 'battle_atk',
    name: 'X Attack',
    zhName: '力量强化',
    description: 'Next attack deals 50% more damage',
    zhDescription: '下一次攻击伤害提升50%',
    isBattleItem: true,
    effect: (p) => p // Effect handled in damage calc
  },
  {
    id: 'battle_def',
    name: 'X Defense',
    zhName: '防御强化',
    description: 'Reduce incoming damage by 30% for one turn',
    zhDescription: '本回合受到的伤害降低30%',
    isBattleItem: true,
    effect: (p) => p
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [startStep, setStartStep] = useState(0); // 0: Title, 1: Region, 2: Level
  const [coins, setCoins] = useState(0);
  const [shopItems, setShopItems] = useState<{item: Item, price: number}[]>([]);
  const [rewardChoiceMade, setRewardChoiceMade] = useState(false);
  const [playerTeam, setPlayerTeam] = useState<GamePokemon[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [enemy, setEnemy] = useState<GamePokemon | null>(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY'>('PLAYER');
  const [battleMenuTab, setBattleMenuTab] = useState<BattleMenuTab>('MAIN');
  const [rewards, setRewards] = useState<{ type: 'ITEM' | 'POKEMON' | 'MOVE', data: any }[]>([]);
  const [activeBuffs, setActiveBuffs] = useState<{ atk: boolean, def: boolean }>({ atk: false, def: false });
  const [enemyBuffs, setEnemyBuffs] = useState<{ atk: boolean, def: boolean }>({ atk: false, def: false });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMessageProcessing, setIsMessageProcessing] = useState(false);
  const [showReplaceUI, setShowReplaceUI] = useState<GamePokemon | null>(null);
  const [learningPokemonIdx, setLearningPokemonIdx] = useState<number | null>(null);
  const [potentialMoves, setPotentialMoves] = useState<Move[]>([]);
  const [selectedNewMove, setSelectedNewMove] = useState<Move | null>(null);
  const [selectedGens, setSelectedGens] = useState<number[]>([1]);
  const [startLevel, setStartLevel] = useState<number>(50);
  const [starterOptions, setStarterOptions] = useState<GamePokemon[]>([]);
  const [selectedStarterIdx, setSelectedStarterIdx] = useState<number | null>(null);
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null);
  const [infoPokemonIdx, setInfoPokemonIdx] = useState<number | null>(null);
  const [prevGameState, setPrevGameState] = useState<GameState>('START');
  const [showLogHistory, setShowLogHistory] = useState(false);

  // 动画状态
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [activeMoveType, setActiveMoveType] = useState<string | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [catchSuccess, setCatchSuccess] = useState<boolean | null>(null);

  const startGame = async () => {
    setLoading(true);
    try {
      // 生成3个随机宝可梦供选择
      const starterIds = [];
      for (let i = 0; i < 3; i++) {
        starterIds.push(await getRandomPokemonId(selectedGens));
      }
      const starters = await Promise.all(starterIds.map(id => getProcessedPokemon(id, startLevel)));
      setStarterOptions(starters);
      
      // 初始道具：1个回复药，5个精灵球
      const initialInventory: Item[] = [];
      const potion = ALL_ITEMS.find(i => i.id === 'potion');
      const pokeball = ALL_ITEMS.find(i => i.id === 'pokeball');
      if (potion) initialInventory.push(potion);
      if (pokeball) {
        for (let i = 0; i < 5; i++) initialInventory.push(pokeball);
      }
      
      setInventory(initialInventory);
      setCoins(0);
      setStage(1);
      setGameState('STARTER_SELECT');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectStarter = (index: number) => {
    setPlayerTeam([starterOptions[index]]);
    startBattleTransition();
    spawnEnemy(1);
  };

  const healAllPokemon = () => {
    setPlayerTeam(prev => prev.map(p => ({ ...p, currentHp: p.maxHp })));
  };

  const startBattleTransition = () => {
    setIsTransitioning(true);
    // 延长闭合时间，确保状态切换在完全闭合后发生
    setTimeout(() => {
      setGameState('BATTLE');
      // 稍微停顿一下，然后开始缓慢打开
      setTimeout(() => setIsTransitioning(false), 400);
    }, 800);
  };

  const spawnEnemy = async (currentStage: number) => {
    setLoading(true);
    try {
      const isGym = currentStage % 5 === 0;
      const id = await getRandomPokemonId(selectedGens);
      const level = isGym ? startLevel + 2 : startLevel;
      let p = await getProcessedPokemon(id, level);
      p.isGym = isGym;
      
      if (isGym) {
        // 道馆战强化
        p = {
          ...p,
          maxHp: Math.floor(p.maxHp * 1.5),
          currentHp: Math.floor(p.maxHp * 1.5),
          calculatedStats: {
            ...p.calculatedStats,
            attack: Math.floor(p.calculatedStats.attack * 1.2),
            defense: Math.floor(p.calculatedStats.defense * 1.2),
            spAtk: Math.floor(p.calculatedStats.spAtk * 1.2),
            spDef: Math.floor(p.calculatedStats.spDef * 1.2),
            speed: Math.floor(p.calculatedStats.speed * 1.2),
          }
        };
      }
      
      setEnemy(p);
      setBattleLog([]);
      if (isGym) {
        await addMessagesSequentially([`道馆馆主 派出了 ${p.zhName}！`]);
      } else {
        await addMessagesSequentially([`野生的 ${p.zhName} 出现了！`]);
      }
      setTurn('PLAYER');
      setBattleMenuTab('MAIN');
      setActiveBuffs({ atk: false, def: false });
      setEnemyBuffs({ atk: false, def: false });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const useItem = async (item: Item, index: number) => {
    if (gameState !== 'BATTLE' || turn !== 'PLAYER' || isMessageProcessing) return;

    // 消耗道具
    const newInventory = [...inventory];
    newInventory.splice(index, 1);
    setInventory(newInventory);

    await addMessagesSequentially([`你使用了 ${item.zhName}！`]);

    if (item.isBall) {
      if (enemy?.isGym) {
        await addMessagesSequentially(["不能捕捉道馆馆主的宝可梦！"]);
        setTurn('ENEMY');
        setBattleMenuTab('MAIN');
        return;
      }

      // 捕捉逻辑
      // 简化公式: catchRate = ((3 * maxHP - 2 * currentHP) * rate * ballModifier) / (3 * maxHP)
      const ballModifier = item.catchRate || 1;
      // 基础捕捉率 100
      const catchRate = ((3 * enemy!.maxHp - 2 * enemy!.currentHp) * 100 * ballModifier) / (3 * enemy!.maxHp);
      const random = Math.random() * 255; 

      const isSuccess = random < catchRate;
      setIsCatching(true);
      setCatchSuccess(isSuccess);
      
      await addMessagesSequentially(["正在捕捉..."]);
      
      if (isSuccess) {
        await addMessagesSequentially([`成功捕捉了 ${enemy!.zhName}！`]);
        
        // 加入队伍
        if (playerTeam.length < 6) {
          setPlayerTeam(prev => [...prev, { ...enemy!, currentHp: enemy!.maxHp }]);
          await addMessagesSequentially([`${enemy!.zhName} 已加入你的队伍！`]);
          setTimeout(() => {
            winBattle(true);
            setIsCatching(false);
            setCatchSuccess(null);
          }, 500);
        } else {
          setShowReplaceUI({ ...enemy!, currentHp: enemy!.maxHp });
          setTimeout(() => {
            winBattle(true);
            setIsCatching(false);
            setCatchSuccess(null);
          }, 500);
        }
      } else {
        await addMessagesSequentially([`${enemy!.zhName} 挣脱了！`]);
        // 立即恢复精灵展示，不再等待气泡动画完全结束
        setIsCatching(false);
        setCatchSuccess(null);
        setTurn('ENEMY');
        setBattleMenuTab('MAIN');
      }
      return;
    }

    // 非球类道具逻辑
    const updatedTeam = [...playerTeam];
    updatedTeam[0] = item.effect(updatedTeam[0]);
    setPlayerTeam(updatedTeam);

    if (item.id === 'battle_atk') setActiveBuffs(prev => ({ ...prev, atk: true }));
    if (item.id === 'battle_def') setActiveBuffs(prev => ({ ...prev, def: true }));

    setTurn('ENEMY');
    setBattleMenuTab('MAIN');
  };

  const switchPokemon = async (index: number) => {
    if (gameState !== 'BATTLE' || turn !== 'PLAYER' || index === 0 || isMessageProcessing) return;
    
    const newTeam = [...playerTeam];
    const temp = newTeam[0];
    newTeam[0] = newTeam[index];
    newTeam[index] = temp;
    
    setPlayerTeam(newTeam);
    await addMessagesSequentially([`你收回了 ${temp.zhName}！`, `你派出了 ${newTeam[0].zhName}！`]);
    setTurn('ENEMY');
    setBattleMenuTab('MAIN');
  };

  const addMessagesSequentially = async (messages: string[]) => {
    setIsMessageProcessing(true);
    for (const msg of messages) {
      setBattleLog(prev => [...prev, msg]);
      await new Promise(resolve => setTimeout(resolve, 1500)); // 每条消息停留1.5秒
    }
    setIsMessageProcessing(false);
  };

  const handleAttack = async (move: Move) => {
    if (!enemy || gameState !== 'BATTLE' || turn !== 'PLAYER' || isMessageProcessing) return;

    const player = playerTeam[0];
    setActiveMoveType(move.type);
    setPlayerAnim('attack');
    
    // 1. 使用技能消息
    await addMessagesSequentially([`${player.zhName} 使用了 ${move.zhName}！`]);
    
    const { damage, multiplier } = calculateDamage(move, player, enemy, activeBuffs.atk, enemyBuffs.def);
    const newEnemyHp = Math.max(0, enemy.currentHp - damage);
    
    setEnemyAnim('hit');
    setEnemy({ ...enemy, currentHp: newEnemyHp });
    setPlayerAnim('idle');
    setActiveMoveType(null);
    setActiveBuffs(prev => ({ ...prev, atk: false }));

    // 2. 效果消息
    const effectMessages = [];
    if (multiplier > 1) effectMessages.push("这一击效果绝佳！");
    if (multiplier < 1 && multiplier > 0) effectMessages.push("这一击收效甚微...");
    if (multiplier === 0) effectMessages.push("似乎没有效果...");
    
    if (effectMessages.length > 0) {
      await addMessagesSequentially(effectMessages);
    }

    // 3. 伤害消息
    await addMessagesSequentially([`${player.zhName} 造成了 ${damage} 点伤害。`]);
    
    setEnemyAnim('idle');
    
    if (newEnemyHp <= 0) {
      await addMessagesSequentially([`${enemy.zhName} 倒下了！`]);
      setTimeout(() => winBattle(), 500);
      return;
    }

    setTurn('ENEMY');
    setBattleMenuTab('MAIN');
  };

  const enemyTurn = useCallback(async () => {
    if (!enemy || !playerTeam[0] || turn !== 'ENEMY' || isMessageProcessing) return;

    const player = playerTeam[0];
    const move = enemy.selectedMoves[Math.floor(Math.random() * enemy.selectedMoves.length)];
    setActiveMoveType(move.type);
    setEnemyAnim('attack');
    
    // 1. 对手使用技能
    await addMessagesSequentially([`对手的 ${enemy.zhName} 使用了 ${move.zhName}！`]);

    const { damage, multiplier } = calculateDamage(move, enemy, player, enemyBuffs.atk, activeBuffs.def);
    const newPlayerHp = Math.max(0, player.currentHp - damage);
    
    setPlayerAnim('hit');
    const updatedTeam = [...playerTeam];
    updatedTeam[0] = { ...player, currentHp: newPlayerHp };
    setPlayerTeam(updatedTeam);
    setEnemyAnim('idle');
    setActiveMoveType(null);
    setActiveBuffs(prev => ({ ...prev, def: false }));

    // 2. 效果消息
    const effectMessages = [];
    if (multiplier > 1) effectMessages.push("这一击效果绝佳！");
    if (multiplier < 1 && multiplier > 0) effectMessages.push("这一击收效甚微...");
    if (multiplier === 0) effectMessages.push("似乎没有效果...");
    
    if (effectMessages.length > 0) {
      await addMessagesSequentially(effectMessages);
    }

    // 3. 伤害消息
    await addMessagesSequentially([`对手的 ${enemy.zhName} 造成了 ${damage} 点伤害。`]);

    setPlayerAnim('idle');
    
    if (newPlayerHp <= 0) {
      await addMessagesSequentially([`${player.zhName} 倒下了！`]);
      
      const aliveIdx = updatedTeam.findIndex(p => p.currentHp > 0);
      if (aliveIdx === -1) {
        setTimeout(() => setGameState('GAMEOVER'), 500);
      } else {
        // 自动切换
        const newTeam = [...updatedTeam];
        const temp = newTeam[0];
        newTeam[0] = newTeam[aliveIdx];
        newTeam[aliveIdx] = temp;
        setPlayerTeam(newTeam);
        await addMessagesSequentially([`你派出了 ${newTeam[0].zhName}！`]);
        setTurn('PLAYER');
        setBattleMenuTab('MAIN');
      }
      return;
    }

    setTurn('PLAYER');
    setBattleMenuTab('MAIN');
  }, [enemy, playerTeam, turn, activeBuffs, enemyBuffs, isMessageProcessing, gameState]);

  useEffect(() => {
    if (turn === 'ENEMY' && gameState === 'BATTLE') {
      enemyTurn();
    }
  }, [turn, gameState, enemyTurn]);

  const calculateDamage = (move: Move, attacker: GamePokemon, defender: GamePokemon, atkBuff: boolean, defBuff: boolean) => {
    const basePower = move.power || 40;
    const levelMult = (2 * attacker.level / 5) + 2;
    
    let atk = 50;
    let def = 50;
    
    if (move.damage_class === 'special') {
      atk = attacker.calculatedStats.spAtk;
      def = defender.calculatedStats.spDef;
    } else {
      atk = attacker.calculatedStats.attack;
      def = defender.calculatedStats.defense;
    }
    
    // 计算属性克制
    let multiplier = 1;
    defender.types.forEach(t => {
      const typeMult = TYPE_CHART[move.type]?.[t.type.name];
      if (typeMult !== undefined) {
        multiplier *= typeMult;
      }
    });

    let damage = Math.floor((((levelMult * basePower * atk / def) / 50) + 2) * (Math.random() * 0.15 + 0.85) * multiplier);
    
    if (atkBuff) damage = Math.floor(damage * 1.5);
    if (defBuff) damage = Math.floor(damage * 0.7);
    
    return { damage, multiplier };
  };

  const winBattle = async (isCatch = false) => {
    setLoading(true);
    try {
      const isGym = stage % 5 === 0;
      // 获得金币
      let earnedCoins = 100 + Math.floor(Math.random() * 201); // 100-300
      if (isGym) earnedCoins *= 3; // 道馆战3倍金币
      
      setCoins(prev => prev + earnedCoins);

      const newRewards = [];
      
      // 随机道具
      const item1 = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
      newRewards.push({ type: 'ITEM' as const, data: item1 });
      
      // 随机宝可梦或技能
      if (Math.random() > 0.4) {
        const pokeId = await getRandomPokemonId(selectedGens);
        const newPoke = await getProcessedPokemon(pokeId, startLevel); // 奖励宝可梦也保持初始等级
        newRewards.push({ type: 'POKEMON' as const, data: newPoke });
      } else {
        newRewards.push({ type: 'MOVE' as const, data: null });
      }

      const item2 = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
      newRewards.push({ type: 'ITEM' as const, data: item2 });

      // 生成商店物品
      const newShopItems = [];
      for (let i = 0; i < 3; i++) {
        const randomItem = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
        newShopItems.push({
          item: randomItem,
          price: 50 + Math.floor(Math.random() * 151) // 50-200
        });
      }
      setShopItems(newShopItems);
      setRewardChoiceMade(false);

      setRewards(newRewards);
      setGameState('REWARD');
      
      const winMsg = isCatch ? `捕捉成功！获得了 ${earnedCoins} 金币！` : `战斗胜利！获得了 ${earnedCoins} 金币！`;
      await addMessagesSequentially([winMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectReward = (reward: any) => {
    if (rewardChoiceMade) return;
    setRewardChoiceMade(true);

    if (reward.type === 'ITEM') {
      setInventory(prev => [...prev, reward.data]);
      nextStage();
    } else if (reward.type === 'POKEMON') {
      if (playerTeam.length < 6) {
        setPlayerTeam(prev => [...prev, reward.data]);
        nextStage();
      } else {
        setShowReplaceUI(reward.data);
      }
    } else if (reward.type === 'MOVE') {
      setGameState('LEARN_MOVE');
      setLearningPokemonIdx(null);
      setPotentialMoves([]);
      setSelectedNewMove(null);
    }
  };

  const buyFromShop = (shopItem: {item: Item, price: number}) => {
    if (rewardChoiceMade || coins < shopItem.price) return;
    setRewardChoiceMade(true);
    setCoins(prev => prev - shopItem.price);
    setInventory(prev => [...prev, shopItem.item]);
    nextStage();
  };

  const nextStage = () => {
    healAllPokemon();
    setStage(prev => prev + 1);
    startBattleTransition();
    spawnEnemy(stage + 1);
  };

  const startLearningMove = async (idx: number) => {
    setLoading(true);
    setLearningPokemonIdx(idx);
    try {
      const moves = await getLearnableMoves(playerTeam[idx], playerTeam[idx].selectedMoves);
      setPotentialMoves(moves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLearnMove = (move: Move) => {
    if (learningPokemonIdx === null) return;
    const pokemon = playerTeam[learningPokemonIdx];
    
    if (pokemon.selectedMoves.length < 4) {
      const newTeam = [...playerTeam];
      newTeam[learningPokemonIdx] = {
        ...pokemon,
        selectedMoves: [...pokemon.selectedMoves, move]
      };
      setPlayerTeam(newTeam);
      finishReward();
    } else {
      setSelectedNewMove(move);
    }
  };

  const replaceMove = (oldMoveIdx: number) => {
    if (learningPokemonIdx === null || !selectedNewMove) return;
    const newTeam = [...playerTeam];
    const pokemon = { ...newTeam[learningPokemonIdx] };
    const newMoves = [...pokemon.selectedMoves];
    newMoves[oldMoveIdx] = selectedNewMove;
    pokemon.selectedMoves = newMoves;
    newTeam[learningPokemonIdx] = pokemon;
    setPlayerTeam(newTeam);
    finishReward();
  };

  const finishReward = () => {
    healAllPokemon();
    setGameState('BATTLE');
    setStage(prev => prev + 1);
    setLearningPokemonIdx(null);
    setPotentialMoves([]);
    setSelectedNewMove(null);
    startBattleTransition();
    spawnEnemy(stage + 1);
  };

  const replacePokemon = (index: number) => {
    if (!showReplaceUI) return;
    const newTeam = [...playerTeam];
    newTeam[index] = showReplaceUI;
    setPlayerTeam(newTeam);
    setShowReplaceUI(null);
    if (rewardChoiceMade) {
      nextStage();
    }
  };

  if (loading && gameState === 'START') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <RefreshCw className="animate-spin w-16 h-16 text-blue-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-black tracking-tighter uppercase italic">正在寻找宝可梦...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f0f0f0] text-slate-900 font-sans overflow-hidden select-none">
      {/* 剑盾风格背景装饰 */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#00a0e9_25%,transparent_25%,transparent_50%,#00a0e9_50%,#00a0e9_75%,transparent_75%,transparent)] bg-[length:100px_100px] animate-barber-pole"></div>
      </div>

      <div className="max-w-6xl mx-auto h-full flex flex-col p-2 md:p-4 relative z-10 overflow-hidden">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-center flex-none mb-2">
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-2 skew-x-[-12deg] shadow-md border-l-4 border-blue-500">
              <h1 className="text-xl font-black italic tracking-tighter skew-x-[12deg]">POKE ROGUELIKE</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white px-4 py-1 skew-x-[-12deg] shadow-sm border-r-4 border-yellow-500 mr-2">
              <span className="font-bold skew-x-[12deg] inline-block flex items-center gap-1">
                <span className="text-yellow-600">●</span> {coins}
              </span>
            </div>
            <div className="bg-white px-4 py-1 skew-x-[-12deg] shadow-sm border-r-4 border-red-500">
              <span className="font-bold skew-x-[12deg] inline-block">关卡 {stage}</span>
            </div>
            {gameState === 'STARTER_SELECT' && (
            <motion.div 
              key="starter-select"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col py-4 overflow-y-auto custom-scrollbar"
            >
              <div className="text-center mb-8 flex-none">
                <div className="inline-block bg-slate-900 px-12 py-3 skew-x-[-12deg] shadow-xl mb-4">
                  <h2 className="text-4xl font-black italic tracking-tighter skew-x-[12deg] text-white">选择你的初始伙伴</h2>
                </div>
                <p className="text-slate-500 font-bold italic text-sm">从这三只随机宝可梦中选择一只开始你的冒险</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 max-w-5xl mx-auto w-full">
                {starterOptions.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-8 shadow-2xl hover:shadow-blue-200 transition-all border-b-8 border-slate-100 hover:border-blue-500 group flex flex-col items-center relative"
                  >
                    <div className="absolute top-4 right-4 bg-slate-100 px-2 py-1 text-[10px] font-black italic">
                      Lv.{p.level}
                    </div>
                    <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500">
                      <div className="absolute inset-0 bg-blue-50 rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <img 
                        src={p.sprites.front_default} 
                        alt={p.zhName} 
                        className="w-40 h-40 object-contain relative z-10 drop-shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="text-3xl font-black italic mb-2 uppercase tracking-tighter">{p.zhName}</h3>
                    <div className="flex gap-1 mb-6">
                      {p.types.map((t: any) => (
                        <TypeBadge key={t.type.name} type={t.type.name} size="sm" className="skew-x-[-10deg]" />
                      ))}
                    </div>

                    <div className="w-full space-y-2 mb-8">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">初始技能</div>
                      {p.selectedMoves.map((m, mi) => (
                        <div key={mi} className="flex justify-between items-center bg-slate-50 p-2 text-xs font-bold italic border-l-4 border-slate-200">
                          <span>{m.zhName}</span>
                          <TypeBadge type={m.type} size="xs" />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 w-full mt-auto">
                      <button
                        onClick={() => {
                          setInfoPokemonIdx(idx);
                          setPrevGameState('STARTER_SELECT');
                          setGameState('POKEMON_INFO');
                        }}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-black italic hover:bg-slate-200 transition-all text-sm"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => selectStarter(idx)}
                        className="flex-[2] py-3 bg-slate-900 text-white font-black italic hover:bg-blue-600 transition-all text-sm shadow-lg"
                      >
                        就决定是你了！
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'BATTLE' && (
              <button 
                onClick={() => setShowLogHistory(!showLogHistory)}
                className={`p-2 skew-x-[-12deg] transition-all shadow-sm border ${showLogHistory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-900'}`}
                title="对战历史"
              >
                <RefreshCw className={`w-4 h-4 skew-x-[12deg] ${showLogHistory ? 'rotate-180' : ''} transition-transform duration-500`} />
              </button>
            )}
          </div>
        </header>

        {/* 对战历史悬浮窗 */}
        <AnimatePresence>
          {showLogHistory && gameState === 'BATTLE' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 right-4 z-[60] w-80 bg-white shadow-2xl border-4 border-slate-900 p-4 max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-black italic text-sm uppercase tracking-widest text-slate-400">对战历史</h3>
                <button onClick={() => setShowLogHistory(false)} className="text-slate-400 hover:text-slate-900"><Skull className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {battleLog.slice().reverse().map((log, i) => (
                  <div key={i} className={`text-xs font-bold italic ${i === 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {i === 0 ? '> ' : ''}{log}
                  </div>
                ))}
                {battleLog.length === 0 && <div className="text-center py-8 text-slate-300 italic">尚无记录</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isTransitioning && (
            <motion.div 
              key="transition-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2 }}
              className="fixed inset-0 z-[100] flex flex-col pointer-events-none"
            >
              {/* 上半部分 (红色) */}
              <motion.div 
                initial={{ y: '-100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '-100%' }}
                transition={{ 
                  duration: 0.6, 
                  ease: 'circOut',
                  exit: { duration: 1.2, ease: [0.45, 0, 0.55, 1] } 
                }}
                className="flex-1 bg-red-600 border-b-[12px] border-slate-900 relative"
              >
                {/* 精灵球中心按钮 */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-40 h-40 bg-white rounded-full border-[12px] border-slate-900 z-10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                  <div className="w-16 h-16 rounded-full border-[8px] border-slate-100 bg-white shadow-inner"></div>
                </div>
              </motion.div>

              {/* 下半部分 (白色) */}
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ 
                  duration: 0.6, 
                  ease: 'circOut',
                  exit: { duration: 1.2, ease: [0.45, 0, 0.55, 1] } 
                }}
                className="flex-1 bg-white border-t-[12px] border-slate-900"
              ></motion.div>
            </motion.div>
          )}

          {gameState === 'START' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex-1 flex flex-col items-center justify-center py-4 text-center overflow-y-auto custom-scrollbar"
            >
              {startStep === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-6">
                    <div className="w-48 h-48 bg-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-8 border-slate-100">
                      <Dna className="w-24 h-24 text-blue-500 relative z-10" />
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 opacity-10"></div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-red-500 text-white p-4 rounded-full shadow-lg">
                      <Sword className="w-8 h-8" />
                    </div>
                  </div>
                  <h2 className="text-6xl font-black mb-6 tracking-tighter italic text-slate-900 uppercase">Poke Roguelike</h2>
                  <p className="text-slate-500 max-w-md mb-12 text-lg font-medium italic">
                    随机对战之旅：在无尽的挑战中生存
                  </p>
                  <button 
                    onClick={() => setStartStep(1)}
                    className="group relative px-16 py-6 bg-slate-900 text-white rounded-none skew-x-[-12deg] font-black text-3xl transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-[12px_12px_0px_#00000022]"
                  >
                    <span className="flex items-center gap-3 skew-x-[12deg]">
                      开始对战 <ChevronRight className="w-10 h-10" />
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full max-w-3xl"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <button onClick={() => setStartStep(prev => prev - 1)} className="text-slate-400 font-black italic hover:text-slate-900 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 rotate-180" /> 返回
                    </button>
                    <div className="flex gap-2">
                      {[1, 2].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${startStep >= i ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 shadow-2xl border-b-8 border-slate-900 mb-12">
                    {startStep === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-2xl font-black italic mb-8 uppercase tracking-tighter flex items-center gap-3">
                          <Dna className="w-6 h-6 text-blue-500" /> 选择你的冒险地区
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {GENERATIONS.map((gen) => (
                            <button
                              key={gen.id}
                              onClick={() => {
                                setSelectedGens(prev => 
                                  prev.includes(gen.id) 
                                    ? (prev.length > 1 ? prev.filter(id => id !== gen.id) : prev)
                                    : [...prev, gen.id]
                                );
                              }}
                              className={`p-4 border-4 skew-x-[-4deg] transition-all relative overflow-hidden group ${
                                selectedGens.includes(gen.id)
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="skew-x-[4deg] relative z-10">
                                <div className="font-black text-lg italic">{gen.name}</div>
                                <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{gen.region}</div>
                              </div>
                              {selectedGens.includes(gen.id) && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 flex items-center justify-center skew-x-[4deg] -translate-y-2 translate-x-2">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setStartStep(2)}
                          className="mt-12 w-full py-5 bg-blue-600 text-white font-black text-xl italic skew-x-[-10deg] hover:bg-blue-700 transition-all shadow-lg"
                        >
                          <span className="skew-x-[10deg] inline-block">下一步：选择等级</span>
                        </button>
                      </motion.div>
                    )}

                    {startStep === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-2xl font-black italic mb-8 uppercase tracking-tighter flex items-center gap-3">
                          <Zap className="w-6 h-6 text-yellow-500" /> 设定初始挑战难度
                        </h3>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                          {[30, 50].map((lv) => (
                            <button
                              key={lv}
                              onClick={() => setStartLevel(lv)}
                              className={`flex-1 py-8 px-10 text-4xl font-black italic transition-all skew-x-[-10deg] border-4 ${
                                startLevel === lv
                                  ? 'bg-yellow-400 text-white border-yellow-400 shadow-2xl scale-105'
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="skew-x-[10deg]">
                                <div className="text-sm uppercase opacity-60 mb-2">Level</div>
                                <div>{lv}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={startGame}
                          disabled={loading}
                          className="mt-12 w-full py-6 bg-slate-900 text-white font-black text-2xl italic skew-x-[-10deg] hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
                        >
                          <span className="skew-x-[10deg] inline-block flex items-center justify-center gap-3">
                            {loading ? <RefreshCw className="animate-spin w-6 h-6" /> : '开启冒险之旅'}
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {gameState === 'BATTLE' && playerTeam[0] && enemy && (
            <motion.div 
              key="battle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-4 min-h-0"
            >
              {/* 战斗场景 */}
              <div className="relative flex-[72] bg-white rounded-none skew-x-[-1deg] shadow-2xl overflow-hidden border-y-8 border-slate-900 min-h-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#e0e0e0,#ffffff)]"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-slate-100 skew-y-[-2deg] origin-left"></div>
                
                {/* 敌人 */}
                <div className="absolute top-8 right-12 flex flex-col items-end">
                  <div className="bg-white p-3 shadow-lg border-r-8 border-red-500 w-72 skew-x-[-10deg] mb-4">
                    <div className="skew-x-[10deg] flex flex-col gap-1">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-xl italic uppercase">{enemy.zhName}</span>
                        <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5">Lv.{enemy.level}</span>
                      </div>
                      <div className="flex gap-1 mb-1">
                        {enemy.types.map(t => (
                          <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                        ))}
                      </div>
                      <div className="h-2 bg-slate-200 rounded-none relative overflow-hidden border border-slate-300">
                        <motion.div 
                          animate={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                          className={`h-full transition-colors ${enemy.currentHp / enemy.maxHp < 0.2 ? 'bg-red-500' : enemy.currentHp / enemy.maxHp < 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                      {/* 隐藏具体数值 */}
                      <div className="text-right text-[10px] font-black italic text-slate-300">
                        ??? / ???
                      </div>
                    </div>
                  </div>
                  <motion.img 
                    animate={isCatching ? { scale: 0, opacity: 0 } : enemyAnim === 'attack' ? { x: -40, scale: 1, opacity: 1 } : enemyAnim === 'hit' ? { x: [0, 10, -10, 10, 0], opacity: [1, 0.5, 1], scale: 1 } : { y: [0, -5, 0], scale: 1, opacity: 1 }}
                    transition={isCatching ? { duration: 0.5 } : enemyAnim === 'idle' ? { y: { repeat: Infinity, duration: 2 }, scale: { duration: 0.3 }, opacity: { duration: 0.3 } } : { duration: 0.3 }}
                    src={enemy.sprites.front_default} 
                    className="w-48 h-48 object-contain drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* 玩家 */}
                <div className="absolute bottom-4 left-12 flex flex-col items-start">
                  <motion.img 
                    animate={playerAnim === 'attack' ? { x: 40 } : playerAnim === 'hit' ? { x: [0, -10, 10, -10, 0], opacity: [1, 0.5, 1] } : { y: [0, 5, 0] }}
                    transition={playerAnim === 'idle' ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
                    src={playerTeam[0].sprites.back_default || playerTeam[0].sprites.front_default} 
                    className="w-64 h-64 object-contain drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="bg-white p-3 shadow-lg border-l-8 border-blue-500 w-72 skew-x-[-10deg] mt-[-40px] relative z-20">
                    <div className="skew-x-[10deg] flex flex-col gap-1">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-xl italic uppercase">{playerTeam[0].zhName}</span>
                        <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5">Lv.{playerTeam[0].level}</span>
                      </div>
                      <div className="flex gap-1 mb-1">
                        {playerTeam[0].types.map(t => (
                          <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                        ))}
                      </div>
                      <div className="h-2 bg-slate-200 rounded-none relative overflow-hidden border border-slate-300">
                        <motion.div 
                          animate={{ width: `${(playerTeam[0].currentHp / playerTeam[0].maxHp) * 100}%` }}
                          className={`h-full transition-colors ${playerTeam[0].currentHp / playerTeam[0].maxHp < 0.2 ? 'bg-red-500' : playerTeam[0].currentHp / playerTeam[0].maxHp < 0.5 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        />
                      </div>
                      <div className="text-right text-[10px] font-black italic">
                        {playerTeam[0].currentHp} / {playerTeam[0].maxHp}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 特效层 */}
                <AnimatePresence>
                  {(playerAnim === 'attack' || enemyAnim === 'attack') && activeMoveType && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 2, rotate: 0 }}
                      exit={{ opacity: 0, scale: 3 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                    >
                      {(() => {
                        const Icon = TYPE_ICONS[activeMoveType] || Sparkles;
                        return (
                          <div className="relative">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="absolute inset-0 blur-xl rounded-full"
                              style={{ backgroundColor: TYPE_COLORS[activeMoveType] }}
                            />
                            <Icon 
                              className="w-32 h-32 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                              style={{ color: TYPE_COLORS[activeMoveType] }} 
                            />
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 捕捉动画 */}
                <AnimatePresence>
                  {isCatching && (
                    <motion.div
                      initial={{ x: -400, y: 200, opacity: 0, scale: 0.5, rotate: -360 }}
                      animate={{ 
                        x: 0, 
                        y: 0, 
                        opacity: 1, 
                        scale: 1, 
                        rotate: 0,
                      }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="absolute top-48 right-24 z-50 flex flex-col items-center"
                    >
                      {/* 精灵球本体 */}
                      {!(catchSuccess === false && battleLog[battleLog.length-1]?.includes('挣脱')) && (
                        <motion.div 
                          animate={catchSuccess === false ? { 
                            rotate: [0, -15, 15, -15, 15, 0],
                            x: [0, -5, 5, -5, 5, 0]
                          } : {}}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.5,
                            repeatDelay: 1
                          }}
                          className="relative w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-white shadow-2xl"
                        >
                          <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 border-b-4 border-slate-900"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-slate-900 z-10">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-200"></div>
                          </div>
                          {/* 成功捕获的高光 */}
                          {catchSuccess === true && (
                            <motion.div 
                              animate={{ opacity: [0.2, 0.5, 0.2] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 bg-yellow-400/20"
                            />
                          )}
                        </motion.div>
                      )}
                      
                      {/* 成功捕获的星星特效 */}
                      {catchSuccess === true && battleLog[battleLog.length-1]?.includes('成功捕捉') && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1, 0], 
                                x: Math.cos(i * Math.PI / 4) * 80, 
                                y: Math.sin(i * Math.PI / 4) * 80,
                                rotate: 360
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                              className="absolute"
                            >
                              <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                      
                      {/* 气泡炸开特效 */}
                      {catchSuccess === false && battleLog[battleLog.length-1]?.includes('挣脱') && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(16)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1.5, 0], 
                                x: (Math.random() - 0.5) * 300, 
                                y: (Math.random() - 0.5) * 300 
                              }}
                              transition={{ 
                                duration: 0.8, 
                                ease: "easeOut", 
                                delay: i * 0.01 
                              }}
                              className="absolute w-6 h-6 rounded-full bg-blue-200/40 border border-white/50 shadow-sm backdrop-blur-[2px]"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 统一操作与消息区域 */}
              <div className="relative h-[30%] flex-none bg-white shadow-2xl border-8 border-slate-900 overflow-hidden">
                <AnimatePresence mode="wait">
                  {(isMessageProcessing || turn === 'ENEMY') ? (
                    <motion.div 
                      key="battle-log-box"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-900 text-white p-6 flex items-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500"></div>
                      <AnimatePresence mode="wait">
                        {battleLog.length > 0 && (
                          <motion.div
                            key={battleLog.length}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full"
                          >
                            <p className="text-2xl font-black italic tracking-tight leading-tight">
                              {turn === 'ENEMY' && !isMessageProcessing ? '对手正在思考...' : battleLog[battleLog.length - 1]}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute bottom-4 right-8"
                      >
                        <ChevronRight className="w-8 h-8 text-blue-400" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="interaction-panel"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white grid grid-cols-1 lg:grid-cols-4 gap-0"
                    >
                      {/* 消息提示区 (左侧) */}
                      <div className="lg:col-span-2 p-6 border-r-4 border-slate-900 flex flex-col justify-center bg-slate-50">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">指令阶段</div>
                        <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                          该怎么办呢？
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {activeBuffs.atk && <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 font-black skew-x-[-10deg]"><span className="skew-x-[10deg] inline-block">攻击↑</span></span>}
                          {activeBuffs.def && <span className="bg-blue-500 text-white text-[8px] px-2 py-0.5 font-black skew-x-[-10deg]"><span className="skew-x-[10deg] inline-block">防御↑</span></span>}
                        </div>
                      </div>

                      {/* 操作按钮区 (右侧) */}
                      <div className="lg:col-span-2 p-3 bg-white relative">
                        <AnimatePresence mode="wait">
                          {turn === 'PLAYER' && battleMenuTab === 'MAIN' && (
                            <motion.div 
                              key="main-menu"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className="grid grid-cols-2 gap-3 h-full"
                            >
                              <button 
                                onClick={() => setBattleMenuTab('MOVES')}
                                className="group relative bg-red-500 text-white p-3 font-black italic text-xl skew-x-[-10deg] hover:bg-red-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Sword className="w-5 h-5" /> 战斗</span>
                              </button>
                              <button 
                                onClick={() => setBattleMenuTab('BAG')}
                                className="group relative bg-yellow-500 text-white p-3 font-black italic text-xl skew-x-[-10deg] hover:bg-yellow-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Package className="w-5 h-5" /> 背包</span>
                              </button>
                              <button 
                                onClick={() => setBattleMenuTab('POKEMON')}
                                className="group relative bg-emerald-500 text-white p-3 font-black italic text-xl skew-x-[-10deg] hover:bg-emerald-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Dna className="w-5 h-5" /> 宝可梦</span>
                              </button>
                              <button 
                                onClick={() => setGameState('GAMEOVER')}
                                className="group relative bg-slate-500 text-white p-3 font-black italic text-xl skew-x-[-10deg] hover:bg-slate-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><RefreshCw className="w-5 h-5" /> 逃跑</span>
                              </button>
                            </motion.div>
                          )}

                          {turn === 'PLAYER' && battleMenuTab === 'BAG' && (
                            <motion.div 
                              key="items"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-4"
                            >
                              <div className="flex justify-between items-center">
                                <h3 className="font-black italic flex items-center gap-2"><Package className="w-5 h-5" /> 我的背包</h3>
                                <button onClick={() => setBattleMenuTab('MAIN')} className="text-xs font-bold text-slate-400 hover:text-slate-900 underline">返回</button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {inventory.length > 0 ? inventory.map((item, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => useItem(item, idx)}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-none skew-x-[-4deg] transition-all text-left group"
                                  >
                                    <div className="skew-x-[4deg]">
                                      <div className="font-black text-sm group-hover:text-blue-600">{item.zhName}</div>
                                      <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.zhDescription}</div>
                                    </div>
                                  </button>
                                )) : (
                                  <div className="col-span-full py-8 text-center text-slate-300 font-bold italic">背包空空如也</div>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {turn === 'PLAYER' && battleMenuTab === 'POKEMON' && (
                            <motion.div 
                              key="pokemon-list"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-4"
                            >
                              <div className="flex justify-between items-center">
                                <h3 className="font-black italic flex items-center gap-2"><Dna className="w-5 h-5" /> 我的队伍</h3>
                                <button onClick={() => setBattleMenuTab('MAIN')} className="text-xs font-bold text-slate-400 hover:text-slate-900 underline">返回</button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {playerTeam.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 border skew-x-[-4deg] transition-all flex items-center gap-2 ${idx === 0 ? 'bg-blue-50 border-blue-500' : p.currentHp <= 0 ? 'opacity-50 bg-slate-100' : 'bg-white border-slate-200'}`}
                                  >
                                    <div className="skew-x-[4deg] flex items-center gap-2 w-full">
                                      <img src={p.sprites.front_default} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                                      <div className="flex-1 overflow-hidden">
                                        <div className="font-black text-[10px] truncate uppercase">{p.zhName}</div>
                                        <div className="h-1.5 bg-slate-200 mt-1">
                                          <div className="h-full bg-blue-500" style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }}></div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <button
                                          disabled={p.currentHp <= 0 || idx === 0 || isMessageProcessing}
                                          onClick={() => switchPokemon(idx)}
                                          className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black italic hover:bg-blue-600 disabled:opacity-50"
                                        >
                                          出战
                                        </button>
                                        <button
                                          onClick={() => {
                                            setInfoPokemonIdx(idx);
                                            setPrevGameState(gameState);
                                            setGameState('POKEMON_INFO');
                                          }}
                                          className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black italic hover:bg-slate-700"
                                        >
                                          详情
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {turn === 'PLAYER' && battleMenuTab === 'MOVES' && (
                            <motion.div 
                              key="moves"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="h-full flex flex-col"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-black italic flex items-center gap-2 text-sm"><Zap className="w-4 h-4" /> 选择技能</h3>
                                <button onClick={() => setBattleMenuTab('MAIN')} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 underline">返回</button>
                              </div>
                              <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0">
                                {playerTeam[0].selectedMoves.map((move, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleAttack(move)}
                                    className="relative p-2 bg-slate-900 text-white hover:bg-blue-600 transition-all text-left overflow-hidden group flex flex-col justify-center"
                                  >
                                    <div className="absolute top-0 right-0 w-12 h-full opacity-10 skew-x-[-20deg] bg-white translate-x-6 group-hover:translate-x-3 transition-transform"></div>
                                    <div className="relative z-10 w-full">
                                      <div className="font-black text-sm italic tracking-tighter uppercase truncate">{move.zhName}</div>
                                      <div className="flex justify-between items-center mt-0.5">
                                        <TypeBadge type={move.type} size="xs" />
                                        <span className="text-[8px] font-black opacity-60">威力: {move.power || '--'}</span>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {gameState === 'REWARD' && (
            <motion.div 
              key="reward"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col py-4 overflow-y-auto custom-scrollbar"
            >
              <div className="text-center mb-8 flex-none">
                <div className="inline-block bg-yellow-400 px-12 py-3 skew-x-[-12deg] shadow-xl mb-4">
                  <h2 className="text-4xl font-black italic tracking-tighter skew-x-[12deg] text-white">胜利！</h2>
                </div>
                <p className="text-slate-500 font-bold italic text-sm">选择一项奖励以继续你的冒险</p>
                <button 
                  onClick={() => {
                    setInfoPokemonIdx(0);
                    setPrevGameState(gameState);
                    setGameState('POKEMON_INFO');
                  }}
                  className="mt-2 px-6 py-2 bg-slate-100 text-slate-500 font-black italic text-xs hover:bg-slate-200 transition-all skew-x-[-10deg]"
                >
                  <span className="skew-x-[10deg] inline-block flex items-center gap-2"><Dna className="w-4 h-4" /> 查看我的队伍</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
                <div className="col-span-full flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <h3 className="text-xs font-black italic text-slate-400 uppercase tracking-widest">随机奖励</h3>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                {rewards.map((reward, i) => (
                  <button
                    key={i}
                    disabled={rewardChoiceMade}
                    onClick={() => selectReward(reward)}
                    className={`group relative bg-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 text-center border-b-8 border-slate-100 hover:border-blue-500 ${rewardChoiceMade ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    {reward.type === 'ITEM' ? (
                      <>
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                          <Package className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black italic mb-2">{reward.data.zhName}</h3>
                        <p className="text-sm text-slate-400 font-medium">{reward.data.zhDescription}</p>
                        <div className="mt-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest">获得道具</div>
                      </>
                    ) : reward.type === 'MOVE' ? (
                      <>
                        <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                          <Zap className="w-12 h-12 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-black italic mb-2">学习新技能</h3>
                        <p className="text-sm text-slate-400 font-medium">让队伍中的一只宝可梦学习一个新技能</p>
                        <div className="mt-4 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">特殊奖励</div>
                      </>
                    ) : (
                      <>
                        <div className="relative mb-8 group-hover:scale-110 transition-transform">
                          <img 
                            src={reward.data.sprites.front_default} 
                            alt={reward.data.name}
                            className="w-32 h-32 object-contain mx-auto relative z-10 drop-shadow-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h3 className="text-2xl font-black italic mb-1 uppercase">{reward.data.zhName}</h3>
                        <div className="text-xs text-emerald-500 font-black mb-4 uppercase tracking-widest italic">加入队伍</div>
                        <div className="flex justify-center gap-2 mb-6">
                          {reward.data.types.map((t: any) => (
                            <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-8 py-3 px-6 bg-slate-900 text-white font-black italic skew-x-[-10deg] group-hover:bg-blue-600 transition-colors">
                      <span className="skew-x-[10deg] inline-block">选择此项</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 mt-12">
                <div className="col-span-full flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <h3 className="text-sm font-black italic text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    神秘商店 (使用金币购买)
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </h3>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                {shopItems.map((item, i) => (
                  <button
                    key={i}
                    disabled={rewardChoiceMade || coins < item.price}
                    onClick={() => buyFromShop(item)}
                    className={`group relative bg-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 text-center border-b-8 border-slate-100 hover:border-yellow-500 ${rewardChoiceMade || coins < item.price ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                      <Package className="w-12 h-12 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-black italic mb-2">{item.item.zhName}</h3>
                    <p className="text-sm text-slate-400 font-medium">{item.item.zhDescription}</p>
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <div className="bg-yellow-400 text-white px-4 py-1 skew-x-[-10deg] font-black italic flex items-center gap-2">
                        <Sparkles className="w-4 h-4 skew-x-[10deg]" />
                        <span className="skew-x-[10deg]">{item.price}</span>
                      </div>
                    </div>
                    <div className="mt-8 py-3 px-6 bg-slate-900 text-white font-black italic skew-x-[-10deg] group-hover:bg-yellow-500 transition-colors">
                      <span className="skew-x-[10deg] inline-block">{coins < item.price ? '金币不足' : '购买道具'}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 替换界面 */}
              <AnimatePresence>
                {showReplaceUI && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <div className="bg-white max-w-2xl w-full p-8 skew-x-[-2deg] shadow-2xl relative">
                      <div className="skew-x-[2deg]">
                        <h2 className="text-3xl font-black italic mb-2 tracking-tighter">队伍已满！</h2>
                        <p className="text-slate-500 mb-8 font-bold italic">选择一只宝可梦进行替换，以加入新的伙伴：<span className="text-blue-600 uppercase">{showReplaceUI.zhName}</span></p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {playerTeam.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => replacePokemon(idx)}
                              className="p-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 transition-all text-left flex items-center gap-4 group"
                            >
                              <img src={p.sprites.front_default} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-black text-lg uppercase group-hover:text-blue-600">{p.zhName}</div>
                                <div className="text-xs font-bold text-slate-400">Lv.{p.level}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={() => setShowReplaceUI(null)}
                          className="mt-8 w-full py-4 bg-slate-200 text-slate-600 font-black italic hover:bg-slate-300 transition-all"
                        >
                          取消替换
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === 'LEARN_MOVE' && (
            <motion.div 
              key="learn-move"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col py-4 overflow-y-auto custom-scrollbar"
            >
              <div className="text-center mb-8 flex-none">
                <div className="inline-block bg-slate-900 px-12 py-3 skew-x-[-12deg] shadow-xl mb-4">
                  <h2 className="text-4xl font-black italic tracking-tighter skew-x-[12deg] text-white">学习新技能</h2>
                </div>
                <p className="text-slate-500 font-bold italic text-sm">选择一只宝可梦来学习新的力量</p>
              </div>

              {learningPokemonIdx === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8">
                  {playerTeam.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-6 shadow-xl hover:shadow-2xl transition-all border-b-4 border-slate-100 hover:border-blue-500 group flex flex-col items-center"
                    >
                      <img src={p.sprites.front_default} className="w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      <div className="font-black italic text-xl uppercase">{p.zhName}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-2 mb-4">
                        {p.selectedMoves.length}/4 技能
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => startLearningMove(idx)}
                          className="flex-1 py-2 bg-blue-500 text-white font-black italic text-sm hover:bg-blue-600 transition-colors skew-x-[-10deg]"
                        >
                          <span className="skew-x-[10deg] inline-block">学习技能</span>
                        </button>
                        <button
                          onClick={() => {
                            setInfoPokemonIdx(idx);
                            setPrevGameState(gameState);
                            setGameState('POKEMON_INFO');
                          }}
                          className="px-3 py-2 bg-slate-900 text-white font-black italic text-sm hover:bg-slate-700 transition-colors skew-x-[-10deg]"
                        >
                          <span className="skew-x-[10deg] inline-block">详情</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center py-20">
                  <RefreshCw className="animate-spin w-12 h-12 text-blue-500 mb-4" />
                  <p className="font-black italic text-slate-400">正在检索可学习的技能...</p>
                </div>
              ) : selectedNewMove ? (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white p-8 shadow-2xl skew-x-[-2deg] border-l-8 border-red-500">
                    <div className="skew-x-[2deg]">
                      <h3 className="text-3xl font-black italic mb-2 tracking-tighter">替换哪个技能？</h3>
                      <p className="text-slate-500 mb-8 font-bold italic">
                        <span className="text-blue-600 uppercase">{playerTeam[learningPokemonIdx].zhName}</span> 已经学会了4个技能。
                        请选择一个旧技能来替换为 <span className="text-red-500 uppercase">{selectedNewMove.zhName}</span>。
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 relative">
                        {playerTeam[learningPokemonIdx].selectedMoves.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => replaceMove(idx)}
                            onMouseEnter={() => setHoveredMove(m)}
                            onMouseLeave={() => setHoveredMove(null)}
                            className="p-4 bg-slate-900 text-white hover:bg-red-600 transition-all text-left group relative overflow-hidden flex justify-between items-center cursor-help"
                          >
                            <div className="relative z-10">
                              <div className="font-black text-lg italic uppercase">{m.zhName}</div>
                              <div className="text-[10px] opacity-60">威力: {m.power} / PP: {m.pp}</div>
                            </div>
                            <TypeBadge type={m.type} size="xs" className="relative z-10" />
                          </button>
                        ))}

                        {/* 技能详情浮层 */}
                        <AnimatePresence>
                          {hoveredMove && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-full left-0 right-0 mb-4 bg-slate-900 text-white p-4 shadow-2xl z-50 border-t-4 border-blue-500"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-black italic text-lg">{hoveredMove.zhName}</div>
                                <div className="text-[10px] px-2 py-0.5 bg-white text-slate-900 font-bold uppercase">{hoveredMove.damage_class === 'special' ? '特攻' : '物理'}</div>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed italic">{hoveredMove.zhDescription}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button 
                        onClick={() => setSelectedNewMove(null)}
                        className="mt-8 w-full py-4 bg-slate-100 text-slate-400 font-black italic hover:bg-slate-200 transition-all"
                      >
                        返回选择技能
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-center gap-4">
                    <img src={playerTeam[learningPokemonIdx].sprites.front_default} className="w-20 h-20" referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <div className="text-2xl font-black italic uppercase">{playerTeam[learningPokemonIdx].zhName}</div>
                      <div className="text-xs font-bold text-slate-400">正在学习新技能...</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {potentialMoves.map((move, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLearnMove(move)}
                        onMouseEnter={() => setHoveredMove(move)}
                        onMouseLeave={() => setHoveredMove(null)}
                        className="bg-white p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 text-left border-b-4 border-slate-100 hover:border-yellow-500 group cursor-help"
                      >
                        <div className="font-black italic text-2xl mb-2 group-hover:text-yellow-600">{move.zhName}</div>
                        <div className="flex justify-between items-center mb-4">
                          <TypeBadge type={move.type} size="xs" />
                          <span className="text-[10px] font-black text-slate-400">威力: {move.power || '--'} / PP: {move.pp || '--'}</span>
                        </div>
                        <div className="py-2 px-4 bg-slate-900 text-white text-center font-black italic text-sm group-hover:bg-yellow-500 transition-colors">
                          学习此技能
                        </div>
                      </button>
                    ))}

                    {/* 技能详情浮层 */}
                    <AnimatePresence>
                      {hoveredMove && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute bottom-full left-0 right-0 mb-4 bg-slate-900 text-white p-6 shadow-2xl z-50 border-t-8 border-yellow-500"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div className="font-black italic text-2xl">{hoveredMove.zhName}</div>
                            <div className="flex gap-2">
                               <span className="text-xs px-3 py-1 bg-white text-slate-900 font-black italic uppercase">{hoveredMove.damage_class === 'special' ? '特攻' : '物理'}</span>
                               <TypeBadge type={hoveredMove.type} size="md" />
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed italic mb-4">{hoveredMove.zhDescription}</p>
                          <div className="flex gap-6 text-[10px] font-black italic text-slate-400 border-t border-slate-800 pt-4">
                            <span>威力: {hoveredMove.power || '--'}</span>
                            <span>命中: {hoveredMove.accuracy || '--'}</span>
                            <span>PP: {hoveredMove.pp || '--'}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {potentialMoves.length === 0 && (
                      <div className="col-span-full py-20 text-center text-slate-300 font-black italic">
                        这只宝可梦暂时没有更多可学习的技能了。
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setLearningPokemonIdx(null)}
                    className="block mx-auto text-slate-400 font-bold italic hover:text-slate-900 underline"
                  >
                    重新选择宝可梦
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {gameState === 'POKEMON_INFO' && infoPokemonIdx !== null && (
            <motion.div
              key="pokemon-info"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex-1 flex flex-col max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar pb-8"
            >
              {(() => {
                const displayPokemon = prevGameState === 'STARTER_SELECT' 
                  ? starterOptions[infoPokemonIdx] 
                  : playerTeam[infoPokemonIdx];
                
                return (
                  <div className="bg-white shadow-2xl overflow-hidden border-y-8 border-slate-900 flex-none">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* 左侧：基本信息与大图 */}
                  <div className="p-8 bg-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="text-6xl font-black italic text-slate-200 tracking-tighter">
                        #{String(displayPokemon.id).padStart(3, '0')}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="bg-slate-900 text-white px-4 py-1 skew-x-[-12deg] font-black italic text-xl">
                          <span className="skew-x-[12deg]">LV.{displayPokemon.level}</span>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">{displayPokemon.zhName}</h2>
                      </div>
                      <div className="flex gap-3 mb-8">
                        {displayPokemon.types.map(t => (
                          <TypeBadge key={t.type.name} type={t.type.name} size="lg" />
                        ))}
                      </div>
                      <div className="flex justify-center py-12">
                        <motion.img 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          src={displayPokemon.sprites.front_default} 
                          className="w-64 h-64 object-contain drop-shadow-2xl" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="bg-white p-4 border-l-4 border-slate-900 shadow-sm">
                        <div className="text-xs font-black text-slate-400 uppercase mb-1">特性</div>
                        <div className="font-black italic text-lg">
                          {displayPokemon.abilities[0]?.ability.zhName || '无'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：能力值与技能 */}
                  <div className="p-8 bg-white">
                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">能力值</h3>
                        <div className="text-[10px] font-bold text-blue-500 italic">
                          {displayPokemon.nature.zhName} 性格 
                          ({displayPokemon.nature.plus ? `+${displayPokemon.nature.plus === 'spAtk' ? '特攻' : displayPokemon.nature.plus === 'spDef' ? '特防' : displayPokemon.nature.plus === 'attack' ? '攻击' : displayPokemon.nature.plus === 'defense' ? '防御' : '速度'}` : ''}
                          {displayPokemon.nature.minus ? `, -${displayPokemon.nature.minus === 'spAtk' ? '特攻' : displayPokemon.nature.minus === 'spDef' ? '特防' : displayPokemon.nature.minus === 'attack' ? '攻击' : displayPokemon.nature.minus === 'defense' ? '防御' : '速度'}` : ''})
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { key: 'hp', name: 'HP', color: 'bg-red-500' },
                          { key: 'attack', name: '攻击', color: 'bg-orange-500' },
                          { key: 'defense', name: '防御', color: 'bg-yellow-500' },
                          { key: 'spAtk', name: '特攻', color: 'bg-blue-500' },
                          { key: 'spDef', name: '特防', color: 'bg-green-500' },
                          { key: 'speed', name: '速度', color: 'bg-pink-500' }
                        ].map((s, i) => {
                          const val = (displayPokemon.calculatedStats as any)[s.key];
                          const base = (displayPokemon.baseStats as any)[s.key];
                          const iv = (displayPokemon.ivs as any)[s.key];
                          const max = 400; 
                          
                          return (
                            <div key={i} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[10px] font-bold italic">
                                <div className="text-slate-500">{s.name}</div>
                                <div className="text-slate-300">种族: {base} / 个体: {iv}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(val / max) * 100}%` }}
                                    className={`h-full ${s.color}`}
                                  />
                                </div>
                                <div className="w-8 text-right font-black italic text-sm">{val}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-2">当前技能</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {displayPokemon.selectedMoves.map((m, i) => (
                          <div 
                            key={i} 
                            onMouseEnter={() => setHoveredMove(m)}
                            onMouseLeave={() => setHoveredMove(null)}
                            className="flex items-center justify-between p-3 bg-slate-50 border-l-4 border-slate-900 group hover:bg-slate-100 transition-colors cursor-help"
                          >
                            <div>
                              <div className="font-black italic uppercase">{m.zhName}</div>
                              <div className="text-[10px] text-slate-400 font-bold italic">威力: {m.power || '--'} / 命中: {m.accuracy || '--'} / PP: {m.pp || '--'}</div>
                            </div>
                            <TypeBadge type={m.type} size="xs" />
                          </div>
                        ))}
                      </div>

                      {/* 技能详情浮层 */}
                      <AnimatePresence>
                        {hoveredMove && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 right-0 mb-4 bg-slate-900 text-white p-4 shadow-2xl z-50 border-t-4 border-blue-500"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-black italic text-lg">{hoveredMove.zhName}</div>
                              <div className="text-[10px] px-2 py-0.5 bg-white text-slate-900 font-bold uppercase">{hoveredMove.damage_class === 'special' ? '特攻' : '物理'}</div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">{hoveredMove.zhDescription}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 p-4 flex justify-end">
                  <button 
                    onClick={() => setGameState(prevGameState)}
                    className="px-8 py-2 bg-white text-slate-900 font-black italic skew-x-[-12deg] hover:bg-blue-500 hover:text-white transition-all"
                  >
                    <span className="skew-x-[12deg]">返回</span>
                  </button>
                </div>
              </div>
            );
          })()}
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="bg-red-500 p-8 skew-x-[-12deg] shadow-2xl mb-8">
                <Skull className="w-20 h-20 text-white skew-x-[12deg]" />
              </div>
              <h2 className="text-7xl font-black mb-4 tracking-tighter italic text-slate-900">挑战结束</h2>
              <p className="text-slate-500 text-2xl font-bold italic mb-12">你在第 {stage} 关倒下了</p>
              
              <button 
                onClick={() => setGameState('START')}
                className="px-12 py-5 bg-slate-900 text-white font-black text-2xl skew-x-[-12deg] hover:bg-blue-600 transition-all shadow-xl"
              >
                <span className="flex items-center gap-3 skew-x-[12deg]">
                  <RefreshCw className="w-6 h-6" /> 重新开始
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        
        body {
          background-color: #f0f0f0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1e293b;
        }

        /* 模拟剑盾风格的斜角和粗体字 */
        h1, h2, h3, button {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
