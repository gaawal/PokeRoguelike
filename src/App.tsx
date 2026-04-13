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
  CloudRain,
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
  Circle,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Coins,
  Mars,
  Venus
} from 'lucide-react';
import { getProcessedPokemon, getRandomPokemonId, getLearnableMoves, fetchEvolutionChain, fetchPokemon, fetchPokeBalls } from './services/pokeApi';
import { GamePokemon, GameState, Item, Move, BattleMenuTab, SUPPORTED_LANGUAGES, Nature, StatStages, Weather, Terrain, Dimension, Pokemon, Stats } from './types';
import { TYPE_CHART, TYPE_ZH, GENERATIONS, STAT_STAGE_MODIFIERS, AILMENT_ZH, STAT_ZH } from './constants';
import { calculateDamage, getTypeEffectiveness } from './lib/battleUtils';
import { MoveEffectFactory } from './strategies/moveEffects/MoveEffectFactory';
import { BattleContext } from './strategies/moveEffects/types';
import { useI18n } from './hooks/useI18n';
import { useBattle } from './hooks/useBattle';
import { useRewards } from './hooks/useRewards';
import { usePokemonManager } from './hooks/usePokemonManager';

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

const CATEGORY_ICONS: Record<string, any> = {
  physical: Sparkles,
  special: Circle,
  status: Shield,
};

const STRUGGLE_MOVE: Move = {
  id: 'struggle',
  name: 'struggle',
  type: 'normal',
  power: 50,
  accuracy: null,
  damage_class: 'physical',
  pp: 1,
  currentPP: 1,
  maxPP: 1,
  priority: 0,
  drain: -25,
  statChanges: null,
  ailment: null,
  ailmentChance: 0,
  target: 'selected-pokemon'
};

const TypeBadge: React.FC<{ type: string, size?: 'xs' | 'sm' | 'md' | 'lg', className?: string }> = ({ type, size = 'sm', className = "" }) => {
  const Icon = TYPE_ICONS[type] || Sparkles;
  const color = TYPE_COLORS[type] || '#ccc';
  
  // 这里可以根据 currentLanguage 返回对应的属性名，但目前 TYPE_ZH 只有中文
  // 简单处理：如果是 en，返回 type 原名，否则返回 TYPE_ZH
  const getTypeName = () => {
    return TYPE_ZH[type] || type;
  };
  
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
      <span>{getTypeName()}</span>
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
    ballModifier: 1.0,
    effect: (p) => p
  },
  {
    id: 'greatball',
    name: 'Great Ball',
    zhName: '超级球',
    description: 'Higher catch rate than Poke Ball',
    zhDescription: '比精灵球更容易捕捉',
    isBall: true,
    ballModifier: 1.5,
    effect: (p) => p
  },
  {
    id: 'ultraball',
    name: 'Ultra Ball',
    zhName: '高级球',
    description: 'Very high catch rate',
    zhDescription: '捕捉概率非常高',
    isBall: true,
    ballModifier: 2.0,
    effect: (p) => p
  },
  {
    id: 'masterball',
    name: 'Master Ball',
    zhName: '大师球',
    description: 'The ultimate ball that never fails',
    zhDescription: '绝对能捕捉到宝可梦的终极球',
    isBall: true,
    ballModifier: 255, // 255 is guaranteed catch in my formula
    effect: (p) => p
  },
  {
    id: 'leftovers',
    name: 'Leftovers',
    zhName: '吃剩的东西',
    description: 'Heal a little HP each turn',
    zhDescription: '每回合恢复一点HP',
    isBattleItem: true,
    effect: (p) => ({ ...p, heldItem: ALL_ITEMS.find(i => i.id === 'leftovers') })
  },
  {
    id: 'focus_sash',
    name: 'Focus Sash',
    zhName: '气势披带',
    description: 'Survive one hit at full HP',
    zhDescription: '满HP时受到致命伤会保留1点HP',
    isBattleItem: true,
    effect: (p) => ({ ...p, heldItem: ALL_ITEMS.find(i => i.id === 'focus_sash') })
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

// --- Evolution Animation Component ---
const EvolutionAnimation = ({ from, to, onComplete, t, getLocalized }: { 
  from: GamePokemon; 
  to: Pokemon; 
  onComplete: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLocalized: (obj: any) => string;
}) => {
  const [phase, setPhase] = useState<'START' | 'FLICKER' | 'FLASH' | 'RESULT'>('START');
  const [showTo, setShowTo] = useState(false);
  const [flickerSpeed, setFlickerSpeed] = useState(400);

  useEffect(() => {
    // Phase 1: Start
    const startTimer = setTimeout(() => setPhase('FLICKER'), 1000);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'FLICKER') return;

    let timer: NodeJS.Timeout;
    const flicker = () => {
      setShowTo(prev => !prev);
      setFlickerSpeed(prev => Math.max(50, prev * 0.9));
      
      if (flickerSpeed <= 60) {
        setPhase('FLASH');
      } else {
        timer = setTimeout(flicker, flickerSpeed);
      }
    };

    timer = setTimeout(flicker, flickerSpeed);
    return () => clearTimeout(timer);
  }, [phase, flickerSpeed]);

  useEffect(() => {
    if (phase !== 'FLASH') return;
    const flashTimer = setTimeout(() => setPhase('RESULT'), 500);
    return () => clearTimeout(flashTimer);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className="bg-white w-full max-w-[400px] aspect-square relative flex flex-col items-center justify-center border-8 border-slate-900 shadow-[20px_20px_0px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* 背景装饰 - 扁平化几何图形 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rotate-12"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 -rotate-12"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-2 border-slate-100 rounded-full"></div>
        </div>

        {phase === 'FLASH' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white"
          />
        )}

        <div className="relative w-48 h-48 md:w-56 md:h-56 z-10">
          <AnimatePresence mode="wait">
            {phase === 'RESULT' ? (
              <motion.div
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="flex flex-col items-center w-full h-full"
              >
                <img 
                  src={to.sprites.front_default} 
                  alt={getLocalized(to)}
                  className="w-full h-full object-contain pixelated drop-shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ) : (
              <motion.div
                key={showTo ? 'to' : 'from'}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="w-full h-full"
              >
                <img 
                  src={showTo ? to.sprites.front_default : from.sprites.front_default} 
                  alt="evolving"
                  className={`w-full h-full object-contain pixelated ${phase === 'FLICKER' ? 'brightness-150 grayscale' : ''}`}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
          {phase === 'RESULT' ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-slate-900 w-full py-3 px-4 skew-x-[-6deg] shadow-lg border-l-8 border-blue-500">
                <h2 className="text-sm md:text-base font-black italic tracking-tighter skew-x-[6deg] text-white uppercase text-center leading-tight">
                  {t('evolveSuccessMsg', { name: getLocalized(from), target: getLocalized(to) })}
                </h2>
              </div>
              <button
                onClick={onComplete}
                className="w-full py-3 bg-blue-600 text-white font-black italic text-lg skew-x-[-6deg] hover:bg-blue-700 transition-all shadow-[6px_6px_0px_rgba(0,0,0,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span className="skew-x-[6deg] inline-block">{t('confirm')}</span>
              </button>
            </motion.div>
          ) : (
            <div className="bg-slate-900 text-white w-full py-3 px-4 skew-x-[-6deg] animate-pulse text-center border-l-8 border-yellow-400">
              <span className="skew-x-[6deg] inline-block font-black italic tracking-widest text-sm uppercase">正在进化中...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 雷达图组件 (六边形战士)
const RadarChart = ({ stats, t, calculatedStats }: { 
  stats: { hp: number, attack: number, defense: number, spAtk: number, spDef: number, speed: number }, 
  t: any,
  calculatedStats?: { hp: number, attack: number, defense: number, spAtk: number, spDef: number, speed: number }
}) => {
  const size = 220;
  const center = size / 2;
  const radius = size * 0.3;
  const angleStep = (Math.PI * 2) / 6;
  
  // 属性顺序: HP, 攻击, 防御, 速度, 特防, 特攻 (顺时针)
  const statKeys = ['hp', 'attack', 'defense', 'speed', 'spDef', 'spAtk'] as const;
  const maxStat = 255; // 种族值最大通常为255

  const points = statKeys.map((key, i) => {
    const val = stats[key];
    const r = (val / maxStat) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  });

  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  // 背景网格
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    return statKeys.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * level;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
  });

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* 背景网格 */}
        {gridPolygons.map((p, i) => (
          <polygon key={i} points={p} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {/* 轴线 */}
        {statKeys.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        {/* 数据填充 */}
        <polygon 
          points={pointsStr} 
          fill="rgba(59, 130, 246, 0.4)" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          className="drop-shadow-sm"
        />
        {/* 顶点标签和数值 */}
        {statKeys.map((key, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelRadius = radius + 25;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          
          const baseVal = stats[key];
          const calcVal = calculatedStats ? calculatedStats[key] : null;

          return (
            <g key={key}>
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-black italic fill-slate-400 uppercase"
              >
                {t(key)}
              </text>
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[12px] font-black italic fill-slate-900"
              >
                {baseVal}
              </text>
              {calcVal !== null && (
                <text
                  x={x}
                  y={y + 16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] font-bold fill-blue-600"
                >
                  ({calcVal})
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex gap-4 text-[9px] font-bold italic uppercase tracking-widest">
        <span className="text-slate-400">{t('baseStats')}</span>
        <span className="text-blue-600">{t('actualStats')}</span>
      </div>
    </div>
  );
};

export default function App() {
  const {
    currentLanguage,
    setCurrentLanguage,
    t,
    getLocalized,
    getLocalizedDesc,
    getLocalizedNature,
    getStatName
  } = useI18n();

  const {
    enemy, setEnemy,
    battleLog, setBattleLog, addLog, clearLog,
    turn, setTurn,
    battleMenuTab, setBattleMenuTab,
    weather, setWeather, weatherTurns, setWeatherTurns,
    terrain, setTerrain, terrainTurns, setTerrainTurns,
    dimension, setDimension, dimensionTurns, setDimensionTurns,
  } = useBattle();

  const {
    rewards, setRewards,
    rewardChoiceMade, setRewardChoiceMade,
    rerollCount, setRerollCount,
    rewardPokemonOptions, setRewardPokemonOptions,
    showRewardPokemonSelect, setShowRewardPokemonSelect,
    shopItems, setShopItems,
  } = useRewards();

  const {
    playerTeam, setPlayerTeam,
    showReplaceUI, setShowReplaceUI,
    learningPokemonIdx, setLearningPokemonIdx,
    potentialMoves, setPotentialMoves,
    selectedNewMove, setSelectedNewMove,
    evolutionTarget, setEvolutionTarget,
    isEvolving, setIsEvolving,
    evolvedPokemon, setEvolvedPokemon,
    evolutionChoices, setEvolutionChoices,
    selectedPokemonForEvolution, setSelectedPokemonForEvolution,
    canEvolveMap, setCanEvolveMap,
    isCheckingEvolution, setIsCheckingEvolution,
    isEvolutionAnimating, setIsEvolutionAnimating,
    evolutionConfirmChoice, setEvolutionConfirmChoice,
  } = usePokemonManager();

  const [gameState, setGameState] = useState<GameState>('START');
  const [startStep, setStartStep] = useState(0); // 0: Title, 1: Region, 2: Level
  const [coins, setCoins] = useState(0);
  const [activeBuffs, setActiveBuffs] = useState<{ atk: boolean, def: boolean }>({ atk: false, def: false });
  const [enemyBuffs, setEnemyBuffs] = useState<{ atk: boolean, def: boolean }>({ atk: false, def: false });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMessageProcessing, setIsMessageProcessing] = useState(false);
  const [selectedGens, setSelectedGens] = useState<number[]>([1]);
  const [startLevel, setStartLevel] = useState<number>(50);
  const [starterOptions, setStarterOptions] = useState<GamePokemon[]>([]);
  const [selectedStarterIndices, setSelectedStarterIndices] = useState<number[]>([]);
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null);
  const [infoPokemonIdx, setInfoPokemonIdx] = useState<number | null>(null);
  const [prevGameState, setPrevGameState] = useState<GameState>('START');
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [pendingRewardAction, setPendingRewardAction] = useState<'MOVE' | 'EVOLUTION' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [stage, setStage] = useState(1);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (pendingRewardAction === 'EVOLUTION') {
      const checkEvolutions = async () => {
        setIsCheckingEvolution(true);
        const results: Record<number, boolean> = {};
        await Promise.all(playerTeam.map(async (p, idx) => {
          try {
            const nextEvolutionIds = await fetchEvolutionChain(p.id);
            results[idx] = nextEvolutionIds.length > 0;
          } catch (e) {
            results[idx] = false;
          }
        }));
        setCanEvolveMap(results);
        setIsCheckingEvolution(false);
      };
      checkEvolutions();
    }
  }, [pendingRewardAction, playerTeam, setIsCheckingEvolution, setCanEvolveMap]);

  // 动画状态
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [infoTab, setInfoTab] = useState<'STATS' | 'STATUS'>('STATS');
  const [showTeamActionMenu, setShowTeamActionMenu] = useState<number | null>(null);
  const [isFaintedReplacement, setIsFaintedReplacement] = useState(false);
  const [activeMoveType, setActiveMoveType] = useState<string | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [catchSuccess, setCatchSuccess] = useState<boolean | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [pokeBalls, setPokeBalls] = useState<Item[]>([]);
  const [battleTurnCount, setBattleTurnCount] = useState(1);
  const [activeBall, setActiveBall] = useState<Item | null>(null);

  useEffect(() => {
    const loadBalls = async () => {
      const balls = await fetchPokeBalls();
      setPokeBalls(balls);
    };
    loadBalls();
  }, []);

  const startGame = async () => {
    setLoading(true);
    setError(null);
    try {
      // 生成6个随机宝可梦供选择
      const starterIds = [];
      for (let i = 0; i < 6; i++) {
        starterIds.push(await getRandomPokemonId(selectedGens));
      }
      const starters = await Promise.all(starterIds.map(id => getProcessedPokemon(id, startLevel)));
      setStarterOptions(starters);
      setSelectedStarterIndices([]);
      setInfoPokemonIdx(0); // Default to first one
      
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
      setError(t('fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleStarterSelection = (index: number) => {
    setSelectedStarterIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length < 3) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const confirmStarters = async () => {
    if (selectedStarterIndices.length !== 3) return;
    
    const starters = selectedStarterIndices.map(idx => starterOptions[idx]);
    setPlayerTeam(starters);
    startBattleTransition();
    
    // Initialize the first battle
    const enemyPoke = await spawnEnemy(1);
    if (enemyPoke) {
      await triggerAbility(starters[0], enemyPoke, true);
      await triggerAbility(enemyPoke, starters[0], false);
    }
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

  const spawnEnemy = async (currentStage: number): Promise<GamePokemon | null> => {
    setLoading(true);
    setError(null);
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
        await addMessagesSequentially([`道馆馆主 派出了 ${getLocalized(p)}！`]);
      } else {
        await addMessagesSequentially([`野生的 ${getLocalized(p)} 出现了！`]);
      }
      setTurn('PLAYER');
      setBattleMenuTab('MAIN');
      setActiveBuffs({ atk: false, def: false });
      setEnemyBuffs({ atk: false, def: false });
      return p;
    } catch (err) {
      console.error(err);
      setError(t('fetchFailed'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const useItem = async (item: Item, index: number) => {
    if ((gameState !== 'BATTLE' && gameState !== 'BAG') || turn !== 'PLAYER' || isMessageProcessing) return;
    if (gameState === 'BAG') setGameState('BATTLE');

    if (dimension === 'magic_room') {
      await addMessagesSequentially([t('dimension_magic_room_block')]);
      return;
    }

    // 消耗道具
    const newInventory = [...inventory];
    newInventory.splice(index, 1);
    setInventory(newInventory);

    await addMessagesSequentially([`你使用了 ${getLocalized(item)}！`]);

    if (item.isBall) {
      if (enemy?.isGym) {
        await addMessagesSequentially([t('cannotCatchGym')]);
        await executeEnemyTurn(playerTeam);
        return;
      }

      setActiveBall(item);
      // 捕捉逻辑 (第七世代公式)
      // a = ((3 * HPmax - 2 * HPcurrent) * Rate * BallMod) / (3 * HPmax) * StatusMod
      const baseCatchRate = enemy!.captureRate || 100;
      let ballModifier = item.ballModifier || 1.0;
      
      // 特殊球逻辑
      if (item.id === 'timer-ball') {
        ballModifier = Math.min(4, 1 + battleTurnCount * 0.3);
      } else if (item.id === 'net-ball') {
        const isWaterOrBug = enemy!.types.some(t => t.type.name === 'water' || t.type.name === 'bug');
        if (isWaterOrBug) ballModifier = 3.5;
      } else if (item.id === 'quick-ball') {
        if (battleTurnCount === 1) ballModifier = 5.0;
      } else if (item.id === 'dusk-ball') {
        // 简单判定：如果是 5 的倍数关卡（BOSS战通常在洞穴或晚上感觉）
        if (stage % 5 === 0) ballModifier = 3.0;
      }

      // 异常状态修正
      let statusMod = 1.0;
      if (enemy!.status === 'sleep' || enemy!.status === 'freeze') statusMod = 2.5;
      else if (enemy!.status === 'paralysis' || enemy!.status === 'poison' || enemy!.status === 'burn' || enemy!.status === 'toxic') statusMod = 1.5;

      const a = Math.floor(((3 * enemy!.maxHp - 2 * enemy!.currentHp) * baseCatchRate * ballModifier) / (3 * enemy!.maxHp) * statusMod);
      
      // 判定逻辑 (随机数)
      // Y = 65536 / (255 / a)^(1/4)
      const y = a >= 255 ? 65535 : Math.floor(65536 * Math.pow(a / 255, 0.25));

      setIsCatching(true);
      setShakeCount(0);
      setCatchSuccess(null);

      await addMessagesSequentially([t('catching')]);

      let shakes = 0;
      let caught = true;

      if (a < 255) {
        for (let i = 0; i < 4; i++) {
          // 模拟摇晃等待
          await new Promise(resolve => setTimeout(resolve, 800));
          const rand = Math.floor(Math.random() * 65536);
          if (rand >= y) {
            caught = false;
            break;
          }
          shakes++;
          setShakeCount(shakes);
        }
      } else {
        // 大师球或必中
        for (let i = 1; i <= 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setShakeCount(i);
        }
        shakes = 4;
      }

      setCatchSuccess(caught);
      
      if (caught) {
        await addMessagesSequentially([t('catchSuccessMsg').replace('{name}', getLocalized(enemy!))]);
        
        // 加入队伍
        if (playerTeam.length < 6) {
          setPlayerTeam(prev => [...prev, { ...enemy!, currentHp: enemy!.maxHp }]);
          await addMessagesSequentially([t('joinedTeam').replace('{name}', getLocalized(enemy!))]);
          setTimeout(() => {
            winBattle(true);
            setIsCatching(false);
            setCatchSuccess(null);
            setShakeCount(0);
          }, 500);
        } else {
          setShowReplaceUI({ ...enemy!, currentHp: enemy!.maxHp });
          setTimeout(() => {
            winBattle(true);
            setIsCatching(false);
            setCatchSuccess(null);
            setShakeCount(0);
          }, 500);
        }
      } else {
        await addMessagesSequentially([t('brokeFree').replace('{name}', getLocalized(enemy!))]);
        // 立即恢复精灵展示
        setTimeout(() => {
          setIsCatching(false);
          setCatchSuccess(null);
          setShakeCount(0);
        }, 1000);
        await executeEnemyTurn(playerTeam);
      }
      return;
    }

    // 非球类道具逻辑
    const updatedTeam = [...playerTeam];
    updatedTeam[0] = item.effect(updatedTeam[0]);
    setPlayerTeam(updatedTeam);

    if (item.id === 'battle_atk') setActiveBuffs(prev => ({ ...prev, atk: true }));
    if (item.id === 'battle_def') setActiveBuffs(prev => ({ ...prev, def: true }));

    await executeEnemyTurn(updatedTeam);
  };

  const switchPokemon = async (index: number) => {
    // 基础验证：必须是合法的游戏状态，且不能选择当前在场上的宝可梦（index 0）
    if ((gameState !== 'BATTLE' && gameState !== 'POKEMON_INFO') || index === 0) return;
    
    // 如果正在处理消息，通常不允许操作，但如果是被迫换人（首位倒下），则允许操作以防卡死
    if (isMessageProcessing && !isFaintedReplacement) return;

    // 验证回合：如果不是被迫换人，则必须是玩家回合
    if (!isFaintedReplacement && turn !== 'PLAYER') return;

    // 如果是从信息界面进入的，切换回战斗界面
    if (gameState === 'POKEMON_INFO') setGameState('BATTLE');
    
    const newTeam = [...playerTeam];
    const temp = newTeam[0];
    newTeam[0] = newTeam[index];
    newTeam[index] = temp;
    
    setPlayerTeam(newTeam);
    await addMessagesSequentially([t('withdrew').replace('{name}', getLocalized(temp)), t('sentOut').replace('{name}', getLocalized(newTeam[0]))]);
    
    if (enemy) {
      await triggerAbility(newTeam[0], enemy, true);
    }

    if (isFaintedReplacement) {
      setIsFaintedReplacement(false);
      setTurn('PLAYER');
    } else {
      await executeEnemyTurn(newTeam);
    }
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

  const isGrounded = (p: GamePokemon) => !p.types.some(t => t.type.name === 'flying');
  const isRockGroundSteel = (p: GamePokemon) => p.types.some(t => ['rock', 'ground', 'steel'].includes(t.type.name));
  const isIce = (p: GamePokemon) => p.types.some(t => t.type.name === 'ice');

  const triggerAbility = async (pokemon: GamePokemon, target: GamePokemon, isPlayer: boolean) => {
    const ability = pokemon.ability?.name || pokemon.abilities[0]?.ability.name;
    const pokeName = getLocalized(pokemon);
    const targetName = getLocalized(target);

    if (ability === 'intimidate') {
      await addMessagesSequentially([`${pokeName} 的威吓降低了 ${targetName} 的攻击！`]);
      const newStatStages = { ...target.statStages };
      newStatStages.attack = Math.max(-6, newStatStages.attack - 1);
      target.statStages = newStatStages;
      if (isPlayer) setEnemy({ ...target });
      else setPlayerTeam(prev => [{ ...prev[0], statStages: target.statStages }, ...prev.slice(1)]);
    }
  };

  const checkBerries = async (pokemon: GamePokemon, isPlayer: boolean) => {
    if (pokemon.currentHp > 0 && pokemon.currentHp <= pokemon.maxHp / 4) {
      // For simplicity, let's assume they might have a berry if they are a Gym leader or just random chance
      if (pokemon.isGym || Math.random() < 0.3) {
         const heal = Math.floor(pokemon.maxHp / 4);
         pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
         await addMessagesSequentially([`${getLocalized(pokemon)} 使用了 橙橙果 恢复了体力！`]);
         if (isPlayer) setPlayerTeam(prev => [{ ...prev[0], currentHp: pokemon.currentHp }, ...prev.slice(1)]);
         else setEnemy({ ...pokemon });
      }
    }
  };

  const setEnvironmentFromMove = async (move: Move) => {
    const isPrimalWeather = ['heavy_rain', 'harsh_sunlight', 'strong_winds'].includes(weather);

    // Weather moves
    if (move.id === 'sunny-day' && !isPrimalWeather) { setWeather('sunny'); setWeatherTurns(5); await addMessagesSequentially([t('weather_sunny_start')]); }
    if (move.id === 'rain-dance' && !isPrimalWeather) { setWeather('rainy'); setWeatherTurns(5); await addMessagesSequentially([t('weather_rainy_start')]); }
    if (move.id === 'sandstorm' && !isPrimalWeather) { setWeather('sandstorm'); setWeatherTurns(5); await addMessagesSequentially([t('weather_sandstorm_start')]); }
    if (move.id === 'snowscape' && !isPrimalWeather) { setWeather('snow'); setWeatherTurns(5); await addMessagesSequentially([t('weather_snow_start')]); }
    
    // Primal Weathers (Triggered by specific moves for now)
    if (move.id === 'origin-pulse') { setWeather('heavy_rain'); setWeatherTurns(-1); await addMessagesSequentially([t('weather_heavy_rain_start')]); }
    if (move.id === 'precipice-blades') { setWeather('harsh_sunlight'); setWeatherTurns(-1); await addMessagesSequentially([t('weather_harsh_sunlight_start')]); }
    if (move.id === 'dragon-ascent') { setWeather('strong_winds'); setWeatherTurns(-1); await addMessagesSequentially([t('weather_strong_winds_start')]); }

    // Terrain moves
    if (move.id === 'electric-terrain') { setTerrain('electric'); setTerrainTurns(5); await addMessagesSequentially([t('terrain_electric_start')]); }
    if (move.id === 'grassy-terrain') { setTerrain('grassy'); setTerrainTurns(5); await addMessagesSequentially([t('terrain_grassy_start')]); }
    if (move.id === 'psychic-terrain') { setTerrain('psychic'); setTerrainTurns(5); await addMessagesSequentially([t('terrain_psychic_start')]); }
    if (move.id === 'misty-terrain') { setTerrain('misty'); setTerrainTurns(5); await addMessagesSequentially([t('terrain_misty_start')]); }

    // Dimension moves
    if (move.id === 'trick-room') { 
      if (dimension === 'trick_room') { setDimension('none'); setDimensionTurns(0); await addMessagesSequentially([t('dimension_trick_room_end')]); }
      else { setDimension('trick_room'); setDimensionTurns(5); await addMessagesSequentially([t('dimension_trick_room_start')]); }
    }
    if (move.id === 'magic-room') {
      if (dimension === 'magic_room') { setDimension('none'); setDimensionTurns(0); await addMessagesSequentially([t('dimension_magic_room_end')]); }
      else { setDimension('magic_room'); setDimensionTurns(5); await addMessagesSequentially([t('dimension_magic_room_start')]); }
    }
    if (move.id === 'wonder-room') {
      if (dimension === 'wonder_room') { setDimension('none'); setDimensionTurns(0); await addMessagesSequentially([t('dimension_wonder_room_end')]); }
      else { setDimension('wonder_room'); setDimensionTurns(5); await addMessagesSequentially([t('dimension_wonder_room_start')]); }
    }
  };

  const decrementEnvironments = async () => {
    if (weatherTurns > 0) {
      const nextTurns = weatherTurns - 1;
      setWeatherTurns(nextTurns);
      if (nextTurns === 0) {
        setWeather('none');
        await addMessagesSequentially([t('weather_end')]);
      }
    }
    // Primal weathers (turns = -1) do not decrement
    if (terrainTurns > 0) {
      const nextTurns = terrainTurns - 1;
      setTerrainTurns(nextTurns);
      if (nextTurns === 0) {
        setTerrain('none');
        await addMessagesSequentially([t('terrain_end')]);
      }
    }
    if (dimensionTurns > 0) {
      const nextTurns = dimensionTurns - 1;
      setDimensionTurns(nextTurns);
      if (nextTurns === 0) {
        setDimension('none');
        await addMessagesSequentially([t('dimension_end')]);
      }
    }
  };

  const executeAttack = async (move: Move, attacker: GamePokemon, defender: GamePokemon, isPlayerAttacker: boolean) => {
    // Clone to avoid direct mutation
    let currentAttacker = { 
      ...attacker, 
      statStages: { ...attacker.statStages },
      volatileStatus: attacker.volatileStatus ? [...attacker.volatileStatus] : undefined,
      selectedMoves: attacker.selectedMoves.map(m => ({ ...m }))
    };
    let currentDefender = { 
      ...defender, 
      statStages: { ...defender.statStages },
      volatileStatus: defender.volatileStatus ? [...defender.volatileStatus] : undefined,
      selectedMoves: defender.selectedMoves.map(m => ({ ...m }))
    };

    const attackerName = getLocalized(currentAttacker);
    const defenderName = getLocalized(currentDefender);

    const updateStates = (a: GamePokemon, d: GamePokemon) => {
      if (isPlayerAttacker) {
        setPlayerTeam(prev => [a, ...prev.slice(1)]);
        setEnemy(d);
      } else {
        setEnemy(a);
        setPlayerTeam(prev => [d, ...prev.slice(1)]);
      }
    };

    // 检查异常状态限制
    if (currentAttacker.status === 'sleep') {
      await addMessagesSequentially([`${attackerName} 正在呼呼大睡...`]);
      const turns = (currentAttacker.statusTurns || 0) + 1;
      if (turns >= 3 || Math.random() < 0.33) {
        currentAttacker.status = undefined;
        currentAttacker.statusTurns = 0;
        updateStates(currentAttacker, currentDefender);
        await addMessagesSequentially([`${attackerName} 醒过来了！`]);
      } else {
        currentAttacker.statusTurns = turns;
        updateStates(currentAttacker, currentDefender);
        return { success: false, attacker: currentAttacker, defender: currentDefender };
      }
    }
    if (currentAttacker.status === 'freeze') {
      await addMessagesSequentially([`${attackerName} 冻得严严实实...`]);
      if (Math.random() < 0.2 || move.type === 'fire') {
        currentAttacker.status = undefined;
        updateStates(currentAttacker, currentDefender);
        await addMessagesSequentially([`${attackerName} 的冰融化了！`]);
      } else return { success: false, attacker: currentAttacker, defender: currentDefender };
    }
    if (currentAttacker.status === 'paralysis' && Math.random() < 0.25) {
      await addMessagesSequentially([`${attackerName} 麻痹了，无法动弹！`]);
      return { success: false, attacker: currentAttacker, defender: currentDefender };
    }

    // Check Confusion
    if (currentAttacker.volatileStatus?.includes('confusion')) {
      await addMessagesSequentially([`${attackerName} 混乱了！`]);
      if (Math.random() < 0.5) {
        await addMessagesSequentially([`它在混乱中攻击了自己！`]);
        // Self damage: 40 power physical move
        const selfDamage = Math.floor(((2 * currentAttacker.level / 5 + 2) * 40 * currentAttacker.calculatedStats.attack / currentAttacker.calculatedStats.defense) / 50) + 2;
        currentAttacker.currentHp = Math.max(0, currentAttacker.currentHp - selfDamage);
        updateStates(currentAttacker, currentDefender);
        if (currentAttacker.currentHp <= 0) {
          await addMessagesSequentially([t('fainted').replace('{name}', attackerName)]);
          return { success: 'FAINTED', attacker: currentAttacker, defender: currentDefender };
        }
        return { success: false, attacker: currentAttacker, defender: currentDefender };
      }
    }

    // Check Infatuation
    if (currentAttacker.volatileStatus?.includes('infatuation')) {
      await addMessagesSequentially([`${attackerName} 陷入了爱河！`]);
      if (Math.random() < 0.5) {
        await addMessagesSequentially([`${attackerName} 因为爱而无法攻击！`]);
        return { success: false, attacker: currentAttacker, defender: currentDefender };
      }
    }

    // Check Protect
    if (currentDefender.volatileStatus?.includes('protect')) {
      await addMessagesSequentially([`${defenderName} 守住了！`]);
      return { success: false, attacker: currentAttacker, defender: currentDefender };
    }

    setActiveMoveType(move.type);
    if (isPlayerAttacker) setPlayerAnim('attack');
    else setEnemyAnim('attack');

    await addMessagesSequentially([
      isPlayerAttacker 
        ? t('usedMove').replace('{name}', attackerName).replace('{move}', getLocalized(move))
        : t('enemyUsedMove').replace('{name}', attackerName).replace('{move}', getLocalized(move))
    ]);

    // Update PP
    if (move.id !== 'struggle') {
      currentAttacker.selectedMoves = currentAttacker.selectedMoves.map(m => 
        m.id === move.id ? { ...m, currentPP: Math.max(0, (m.currentPP || 1) - 1) } : m
      );
      updateStates(currentAttacker, currentDefender);
    }

    // Psychic Terrain: Block priority moves from grounded attackers
    if (terrain === 'psychic' && isGrounded(currentDefender) && move.priority && move.priority > 0) {
      await addMessagesSequentially([t('terrain_psychic_block').replace('{name}', attackerName)]);
      if (isPlayerAttacker) setPlayerAnim('idle');
      else setEnemyAnim('idle');
      setActiveMoveType(null);
      return { success: false, attacker: currentAttacker, defender: currentDefender };
    }

    const context: BattleContext = {
      weather,
      terrain,
      dimension,
      isPlayerAttacker,
      activeBuffs,
      enemyBuffs,
      t,
      addMessagesSequentially,
      updateStates
    };

    const strategy = MoveEffectFactory.getStrategy(move);
    const result = await strategy.execute(move, currentAttacker, currentDefender, context);

    currentAttacker = result.attacker as GamePokemon;
    currentDefender = result.defender as GamePokemon;

    if (result.success === 'FLINCH') {
      return { success: 'FLINCH', attacker: currentAttacker, defender: currentDefender };
    }

    if (result.success === 'FAINTED') {
      return { success: 'FAINTED', attacker: currentAttacker, defender: currentDefender };
    }

    if (result.success === false) {
      return { success: false, attacker: currentAttacker, defender: currentDefender };
    }

    // Post-attack hooks (that were not moved to strategy yet)
    await checkBerries(currentDefender, !isPlayerAttacker);

    // Handle Drain/Healing (if not handled by strategy)
    // For now, let's assume strategy handled the core damage and HP updates.
    // But some special effects like Struggle recoil might still be here if not in strategy.
    
    // Actually, let's keep the recoil/drain here for now if they are not in strategy.
    // Wait, I should move them to strategy too.

    // Effect messages are already in strategy.
    // Environment setting is already in App.tsx (setEnvironmentFromMove).
    await setEnvironmentFromMove(move);

    // Contact abilities
    if (move.damage_class === 'physical' && currentDefender.currentHp > 0 && !currentAttacker.status) {
      const defAbility = currentDefender.ability?.name || currentDefender.abilities[0]?.ability.name;
      let ailment: string | undefined;
      if (defAbility === 'static' && Math.random() < 0.3) ailment = 'paralysis';
      if (defAbility === 'flame-body' && Math.random() < 0.3) ailment = 'burn';
      if (defAbility === 'poison-point' && Math.random() < 0.3) ailment = 'poison';

      if (ailment) {
        currentAttacker.status = ailment;
        updateStates(currentAttacker, currentDefender);
        await addMessagesSequentially([`${attackerName} 触碰了对方，${AILMENT_ZH[ailment] || ailment}了！`]);
      }
    }

    if (isPlayerAttacker) setPlayerAnim('idle');
    else setEnemyAnim('idle');
    setActiveMoveType(null);

    if (currentDefender.currentHp <= 0) {
      return { success: 'FAINTED', attacker: currentAttacker, defender: currentDefender };
    }

    return { success: true, attacker: currentAttacker, defender: currentDefender };
  };

  const executeEnemyTurn = async (currentTeam: GamePokemon[]) => {
    if (!enemy || currentTeam.length === 0) return;
    setTurn('ENEMY');
    const availableEnemyMoves = enemy.selectedMoves.filter(m => (m.currentPP || 0) > 0);
    const enemyMove = availableEnemyMoves.length > 0 
      ? availableEnemyMoves[Math.floor(Math.random() * availableEnemyMoves.length)]
      : STRUGGLE_MOVE;
    const res = await executeAttack(enemyMove, enemy, currentTeam[0], false);
    
    const currentPlayer = res.defender;
    const currentEnemy = res.attacker;

    if (currentEnemy.currentHp <= 0) {
      await winBattle();
    } else if (currentPlayer.currentHp <= 0) {
      const isAllFainted = currentTeam.slice(1).every(p => p.currentHp <= 0);
      if (isAllFainted) {
        setGameState('GAMEOVER');
      } else {
        setPrevGameState('BATTLE');
        setIsFaintedReplacement(true);
        setGameState('POKEMON_INFO');
      }
    } else {
      setTurn('PLAYER');
      setBattleMenuTab('MAIN');
    }
  };

  const handleAttack = async (playerMove: Move) => {
    if (!enemy || gameState !== 'BATTLE' || turn !== 'PLAYER' || isMessageProcessing) return;

    let currentPlayer = playerTeam[0];
    let currentEnemy = enemy;
    
    // Check if player must struggle
    let actualPlayerMove = playerMove;
    if (playerMove.currentPP === 0) {
      actualPlayerMove = STRUGGLE_MOVE;
    }

    // Enemy move selection
    const availableEnemyMoves = currentEnemy.selectedMoves.filter(m => (m.currentPP || 0) > 0);
    const enemyMove = availableEnemyMoves.length > 0 
      ? availableEnemyMoves[Math.floor(Math.random() * availableEnemyMoves.length)]
      : STRUGGLE_MOVE;

    const getEffectiveSpeed = (p: GamePokemon) => {
      let speed = p.calculatedStats.speed * (STAT_STAGE_MODIFIERS[p.statStages.speed as keyof typeof STAT_STAGE_MODIFIERS] || 1);
      if (p.status === 'paralysis') speed *= 0.5;
      
      const ability = p.ability?.name || p.abilities[0]?.ability.name;
      if (ability === 'chlorophyll' && (weather === 'sunny' || weather === 'harsh_sunlight')) speed *= 2;
      if (ability === 'swift-swim' && (weather === 'rainy' || weather === 'heavy_rain')) speed *= 2;
      
      return speed;
    };

    // Determine turn order
    let playerGoesFirst = true;
    const pSpeed = getEffectiveSpeed(currentPlayer);
    const eSpeed = getEffectiveSpeed(currentEnemy);
    const pPriority = actualPlayerMove.priority || 0;
    const ePriority = enemyMove.priority || 0;

    if (pPriority > ePriority) playerGoesFirst = true;
    else if (ePriority > pPriority) playerGoesFirst = false;
    else {
      if (dimension === 'trick_room') playerGoesFirst = pSpeed < eSpeed;
      else playerGoesFirst = pSpeed >= eSpeed;
    }

    const executeTurn = async (isPlayer: boolean, move: Move, attacker: GamePokemon, defender: GamePokemon) => {
      if (attacker.currentHp <= 0) return { success: 'SKIP', attacker, defender };
      return await executeAttack(move, attacker, defender, isPlayer);
    };

    if (playerGoesFirst) {
      const res1 = await executeTurn(true, actualPlayerMove, currentPlayer, currentEnemy);
      currentPlayer = res1.attacker;
      currentEnemy = res1.defender;
      if (res1.success === 'FAINTED') {
        const pAbility = currentPlayer.ability?.name || currentPlayer.abilities[0]?.ability.name;
        if (pAbility === 'moxie') {
          currentPlayer.statStages.attack = Math.min(6, currentPlayer.statStages.attack + 1);
          setPlayerTeam(prev => [{ ...prev[0], statStages: currentPlayer.statStages }, ...prev.slice(1)]);
          await addMessagesSequentially([`${getLocalized(currentPlayer)} 的自信过度提升了攻击！`]);
        }
        await winBattle();
        return;
      }
      if (res1.success !== 'FAINTED' && res1.success !== 'FLINCH' && currentEnemy.currentHp > 0) {
        const res2 = await executeTurn(false, enemyMove, currentEnemy, currentPlayer);
        currentEnemy = res2.attacker;
        currentPlayer = res2.defender;
        if (res2.success === 'FAINTED') {
          const eAbility = currentEnemy.ability?.name || currentEnemy.abilities[0]?.ability.name;
          if (eAbility === 'moxie') {
            currentEnemy.statStages.attack = Math.min(6, currentEnemy.statStages.attack + 1);
            setEnemy({ ...currentEnemy });
            await addMessagesSequentially([`${getLocalized(currentEnemy)} 的自信过度提升了攻击！`]);
          }
          // If player fainted, executeEnemyTurn logic handles it? 
          // No, handleAttack needs to handle it if it happens here.
          const isAllFainted = playerTeam.every(p => p.currentHp <= 0);
          if (isAllFainted) {
            setGameState('GAMEOVER');
          } else {
            setPrevGameState('BATTLE');
            setIsFaintedReplacement(true);
            setGameState('POKEMON_INFO');
          }
        }
      }
    } else {
      const res1 = await executeTurn(false, enemyMove, currentEnemy, currentPlayer);
      currentEnemy = res1.attacker;
      currentPlayer = res1.defender;
      if (res1.success === 'FAINTED') {
        const eAbility = currentEnemy.ability?.name || currentEnemy.abilities[0]?.ability.name;
        if (eAbility === 'moxie') {
          currentEnemy.statStages.attack = Math.min(6, currentEnemy.statStages.attack + 1);
          setEnemy({ ...currentEnemy });
          await addMessagesSequentially([`${getLocalized(currentEnemy)} 的自信过度提升了攻击！`]);
        }
        const isAllFainted = playerTeam.every(p => p.currentHp <= 0);
        if (isAllFainted) {
          setGameState('GAMEOVER');
        } else {
          setPrevGameState('BATTLE');
          setIsFaintedReplacement(true);
          setGameState('POKEMON_INFO');
        }
        return;
      }
      if (res1.success !== 'FAINTED' && res1.success !== 'FLINCH' && currentPlayer.currentHp > 0) {
        const res2 = await executeTurn(true, actualPlayerMove, currentPlayer, currentEnemy);
        currentPlayer = res2.attacker;
        currentEnemy = res2.defender;
        if (res2.success === 'FAINTED') {
          const pAbility = currentPlayer.ability?.name || currentPlayer.abilities[0]?.ability.name;
          if (pAbility === 'moxie') {
            currentPlayer.statStages.attack = Math.min(6, currentPlayer.statStages.attack + 1);
            setPlayerTeam(prev => [{ ...prev[0], statStages: currentPlayer.statStages }, ...prev.slice(1)]);
            await addMessagesSequentially([`${getLocalized(currentPlayer)} 的自信过度提升了攻击！`]);
          }
          await winBattle();
        }
      }
    }

    // End of turn effects
    if (currentPlayer.currentHp > 0 && currentEnemy.currentHp > 0) {
      // Weather damage
      if (weather === 'sandstorm') {
        if (!isRockGroundSteel(currentPlayer)) {
          const d = Math.floor(currentPlayer.maxHp / 16);
          currentPlayer.currentHp = Math.max(0, currentPlayer.currentHp - d);
          setPlayerTeam(prev => [{ ...prev[0], currentHp: currentPlayer.currentHp }, ...prev.slice(1)]);
          await addMessagesSequentially([t('weatherDamage').replace('{name}', getLocalized(currentPlayer))]);
        }
        if (currentEnemy.currentHp > 0 && !isRockGroundSteel(currentEnemy)) {
          const d = Math.floor(currentEnemy.maxHp / 16);
          currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - d);
          setEnemy({ ...currentEnemy });
          await addMessagesSequentially([t('weatherDamage').replace('{name}', getLocalized(currentEnemy))]);
        }
      }
      // Terrain heal
      if (terrain === 'grassy') {
        if (isGrounded(currentPlayer) && currentPlayer.currentHp < currentPlayer.maxHp) {
          const h = Math.floor(currentPlayer.maxHp / 16);
          currentPlayer.currentHp = Math.min(currentPlayer.maxHp, currentPlayer.currentHp + h);
          setPlayerTeam(prev => [{ ...prev[0], currentHp: currentPlayer.currentHp }, ...prev.slice(1)]);
          await addMessagesSequentially([t('terrain_grassy_heal').replace('{name}', getLocalized(currentPlayer))]);
        }
        if (currentEnemy.currentHp > 0 && isGrounded(currentEnemy) && currentEnemy.currentHp < currentEnemy.maxHp) {
          const h = Math.floor(currentEnemy.maxHp / 16);
          currentEnemy.currentHp = Math.min(currentEnemy.maxHp, currentEnemy.currentHp + h);
          setEnemy({ ...currentEnemy });
          await addMessagesSequentially([t('terrain_grassy_heal').replace('{name}', getLocalized(currentEnemy))]);
        }
      }
      // Held item: Leftovers
      if (dimension !== 'magic_room' && currentPlayer.heldItem?.id === 'leftovers' && currentPlayer.currentHp < currentPlayer.maxHp) {
        const h = Math.floor(currentPlayer.maxHp / 16);
        currentPlayer.currentHp = Math.min(currentPlayer.maxHp, currentPlayer.currentHp + h);
        setPlayerTeam(prev => [{ ...prev[0], currentHp: currentPlayer.currentHp }, ...prev.slice(1)]);
        await addMessagesSequentially([`${getLocalized(currentPlayer)} 的吃剩的东西恢复了体力！`]);
      }
      if (dimension !== 'magic_room' && currentEnemy.currentHp > 0 && currentEnemy.heldItem?.id === 'leftovers' && currentEnemy.currentHp < currentEnemy.maxHp) {
        const h = Math.floor(currentEnemy.maxHp / 16);
        currentEnemy.currentHp = Math.min(currentEnemy.maxHp, currentEnemy.currentHp + h);
        setEnemy({ ...currentEnemy });
        await addMessagesSequentially([`${getLocalized(currentEnemy)} 的吃剩的东西恢复了体力！`]);
      }
      // Leech Seed
      if (currentEnemy.volatileStatus?.includes('leech_seed')) {
        const d = Math.floor(currentEnemy.maxHp / 8);
        currentEnemy.currentHp = Math.max(0, currentEnemy.currentHp - d);
        currentPlayer.currentHp = Math.min(currentPlayer.maxHp, currentPlayer.currentHp + d);
        setPlayerTeam(prev => [{ ...prev[0], currentHp: currentPlayer.currentHp }, ...prev.slice(1)]);
        setEnemy({ ...currentEnemy });
        await addMessagesSequentially([`${getLocalized(currentEnemy)} 的种子正在吸收体力！`]);
      }
      if (currentPlayer.volatileStatus?.includes('leech_seed')) {
        const d = Math.floor(currentPlayer.maxHp / 8);
        currentPlayer.currentHp = Math.max(0, currentPlayer.currentHp - d);
        currentEnemy.currentHp = Math.min(currentEnemy.maxHp, currentEnemy.currentHp + d);
        setPlayerTeam(prev => [{ ...prev[0], currentHp: currentPlayer.currentHp }, ...prev.slice(1)]);
        setEnemy({ ...currentEnemy });
        await addMessagesSequentially([`${getLocalized(currentPlayer)} 的种子正在吸收体力！`]);
      }

      // Status damage
      const handleStatusDmg = async (poke: GamePokemon, isPlayer: boolean) => {
        if (poke.status === 'poison' || poke.status === 'burn' || poke.status === 'toxic') {
          let d = Math.floor(poke.maxHp / 8);
          if (poke.status === 'toxic') {
            const turns = (poke.statusTurns || 0) + 1;
            d = Math.floor(poke.maxHp * turns / 16);
            poke.statusTurns = turns;
          }
          const newHp = Math.max(0, poke.currentHp - d);
          poke.currentHp = newHp;
          if (isPlayer) setPlayerTeam(prev => [{ ...prev[0], currentHp: newHp, statusTurns: poke.statusTurns }, ...prev.slice(1)]);
          else setEnemy({ ...poke });
          await addMessagesSequentially([`${getLocalized(poke)} 受到了 ${AILMENT_ZH[poke.status] || poke.status} 伤害！`]);
          return newHp <= 0;
        }
        return false;
      };
      
      const pFainted = await handleStatusDmg(currentPlayer, true);
      const eFainted = await handleStatusDmg(currentEnemy, false);

      // Clear volatile statuses
      currentPlayer.volatileStatus = currentPlayer.volatileStatus?.filter(s => s !== 'protect');
      currentEnemy.volatileStatus = currentEnemy.volatileStatus?.filter(s => s !== 'protect');
      setPlayerTeam(prev => [{ ...prev[0], volatileStatus: currentPlayer.volatileStatus }, ...prev.slice(1)]);
      setEnemy({ ...currentEnemy });

      if (pFainted) {
        await addMessagesSequentially([t('fainted').replace('{name}', getLocalized(currentPlayer))]);
      }
      if (eFainted) {
        await addMessagesSequentially([t('fainted').replace('{name}', getLocalized(currentEnemy))]);
      }
    }

    if (currentEnemy.currentHp <= 0) {
      await winBattle();
    } else if (currentPlayer.currentHp <= 0) {
      const isAllFainted = playerTeam.slice(1).every(p => p.currentHp <= 0);
      if (isAllFainted) {
        setGameState('GAMEOVER');
      } else {
        setPrevGameState('BATTLE');
        setIsFaintedReplacement(true);
        setGameState('POKEMON_INFO');
      }
    } else {
      await decrementEnvironments();
      setBattleTurnCount(prev => prev + 1);
      setTurn('PLAYER');
      setBattleMenuTab('MAIN');
    }
  };

  const TYPE_GRADIENTS: Record<string, string> = {
    normal: 'from-slate-400 to-slate-600',
    fire: 'from-orange-400 to-red-600',
    water: 'from-blue-400 to-blue-600',
    electric: 'from-yellow-300 to-yellow-600',
    grass: 'from-emerald-400 to-green-600',
    ice: 'from-cyan-300 to-blue-500',
    fighting: 'from-red-600 to-red-800',
    poison: 'from-purple-400 to-purple-600',
    ground: 'from-yellow-600 to-yellow-800',
    flying: 'from-indigo-300 to-indigo-500',
    psychic: 'from-pink-400 to-pink-600',
    bug: 'from-lime-400 to-lime-600',
    rock: 'from-stone-500 to-stone-700',
    ghost: 'from-purple-600 to-indigo-800',
    dragon: 'from-indigo-600 to-purple-800',
    dark: 'from-slate-700 to-slate-900',
    steel: 'from-slate-300 to-slate-500',
    fairy: 'from-pink-300 to-pink-500',
  };

  const getEffectivenessText = (moveType: string, defender: GamePokemon) => {
    const multiplier = getTypeEffectiveness(moveType, defender.types);
    if (multiplier > 1) return { text: '效果绝佳', color: 'text-yellow-300', icon: '◎' };
    if (multiplier < 1 && multiplier > 0) return { text: '效果不好', color: 'text-slate-300', icon: '△' };
    if (multiplier === 0) return { text: '没有效果', color: 'text-slate-400', icon: '×' };
    return null;
  };

  const winBattle = async (isCatch = false) => {
    setLoading(true);
    try {
      const isGym = stage % 5 === 0;
      let earnedCoins = 100 + Math.floor(Math.random() * 201);
      if (isGym) earnedCoins *= 3;
      
      setCoins(prev => prev + earnedCoins);
      setRerollCount(0);

      const newRewards = await generateRewardSet();

      setRewardChoiceMade(false);
      setRewards(newRewards);
      setGameState('REWARD');
      
      const winMsg = isCatch 
        ? t('catchSuccess').replace('{name}', getLocalized(enemy!))
        : t('winBattle').replace('{name}', getLocalized(enemy!));
      
      await addMessagesSequentially([winMsg]);
      
      // 关卡进度
      setStage(prev => prev + 1);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateRewardSet = async () => {
    const newRewards = [];
    const usedPokemonIds = new Set();
    const usedItems = new Set();

    // 3 Free Rewards (Adventure Rewards)
    // Increase POKEMON probability slightly to allow multiple choices more often
    const freeTypes: ('ITEM' | 'POKEMON' | 'MOVE' | 'EVOLUTION')[] = ['ITEM', 'POKEMON', 'POKEMON', 'MOVE', 'EVOLUTION'];
    
    for (let i = 0; i < 3; i++) {
      let type = freeTypes[Math.floor(Math.random() * freeTypes.length)];
      
      if (type === 'ITEM') {
        let item;
        let attempts = 0;
        do {
          item = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
          attempts++;
        } while (usedItems.has(item.id) && attempts < 10);
        usedItems.add(item.id);
        newRewards.push({ type, data: item });
      } else if (type === 'POKEMON') {
        newRewards.push({ type, data: null });
      } else if (type === 'MOVE') {
        newRewards.push({ type, data: null });
      } else if (type === 'EVOLUTION') {
        newRewards.push({ type, data: null });
      }
    }
    
    // 3 Shop Items (Mystery Shop)
    for (let i = 0; i < 3; i++) {
      let item;
      let attempts = 0;
      const allAvailableItems = [...ALL_ITEMS, ...pokeBalls];
      do {
        item = allAvailableItems[Math.floor(Math.random() * allAvailableItems.length)];
        attempts++;
      } while (usedItems.has(item.id) && attempts < 10);
      usedItems.add(item.id);
      
      newRewards.push({ 
        type: 'SHOP_ITEM', 
        data: { 
          item, 
          price: 50 + Math.floor(Math.random() * 151) 
        } 
      });
    }
    return newRewards;
  };

  const rerollRewards = async () => {
    const cost = 50 + rerollCount * 50; // Increasing cost: 50, 100, 150...
    if (coins < cost) return;
    
    setLoading(true);
    try {
      setCoins(prev => prev - cost);
      setRerollCount(prev => prev + 1);
      const newRewards = await generateRewardSet();
      setRewards(newRewards);
      setRewardChoiceMade(false); // Allow picking a new free reward
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const selectReward = async (reward: any) => {
    if (reward.type === 'SHOP_ITEM') {
      if (coins < reward.data.price) return;
      setCoins(prev => prev - reward.data.price);
      setInventory(prev => [...prev, reward.data.item]);
      // Remove this item from the rewards list so it can't be bought again
      setRewards(prev => prev.filter(r => r !== reward));
      return;
    }

    if (rewardChoiceMade) return;
    
    if (reward.type === 'ITEM') {
      setRewardChoiceMade(true);
      setInventory(prev => [...prev, reward.data]);
    } else if (reward.type === 'POKEMON') {
      setLoading(true);
      try {
        const options = [];
        for (let i = 0; i < 3; i++) {
          options.push(await getRandomPokemonId(selectedGens));
        }
        const pokes = await Promise.all(options.map(id => getProcessedPokemon(id, startLevel)));
        setRewardPokemonOptions(pokes);
        setShowRewardPokemonSelect(true);
        setInfoPokemonIdx(0);
        setRewardChoiceMade(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (reward.type === 'MOVE') {
      setRewardChoiceMade(true);
      setPendingRewardAction('MOVE');
      setLearningPokemonIdx(null);
      setPotentialMoves([]);
      setSelectedNewMove(null);
    } else if (reward.type === 'EVOLUTION') {
      setRewardChoiceMade(true);
      setPendingRewardAction('EVOLUTION');
      setSelectedPokemonForEvolution(null);
      setEvolutionChoices([]);
    }
  };

  const confirmRewardPokemon = (pokemon: GamePokemon) => {
    if (playerTeam.length < 6) {
      setPlayerTeam(prev => [...prev, pokemon]);
    } else {
      setShowReplaceUI(pokemon);
    }
    setShowRewardPokemonSelect(false);
    setRewardPokemonOptions([]);
  };

  const startEvolution = async (pokemon: GamePokemon, index: number) => {
    setLoading(true);
    try {
      const nextEvolutionIds = await fetchEvolutionChain(pokemon.id);
      if (nextEvolutionIds.length === 0) {
        await addMessagesSequentially([t('cannotEvolve')]);
        return;
      }
      
      // Fetch full data for each choice
      const choices = await Promise.all(nextEvolutionIds.map(id => fetchPokemon(id)));
      
      setSelectedPokemonForEvolution({ pokemon, index });
      setEvolutionChoices(choices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const performEvolution = async (evolvedId: number) => {
    if (!selectedPokemonForEvolution) return;
    const { pokemon, index } = selectedPokemonForEvolution;
    setLoading(true);
    try {
      const evolved = await getProcessedPokemon(
        evolvedId, 
        pokemon.level, 
        pokemon.selectedMoves, 
        pokemon.ivs, // Inherit individual values (IVs) from the previous stage
        pokemon.nature
      );
      
      // Keep current HP percentage
      const hpPercent = pokemon.currentHp / pokemon.maxHp;
      evolved.currentHp = Math.floor(evolved.maxHp * hpPercent);
      
      setEvolutionTarget(pokemon);
      setEvolvedPokemon(evolved);
      setIsEvolutionAnimating(true);
      
      // Animation sequence handled by the component
      setTimeout(() => {
        setPlayerTeam(prev => {
          const newTeam = [...prev];
          newTeam[index] = evolved;
          return newTeam;
        });
      }, 5000); // Update team after flicker animation
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setEvolutionConfirmChoice(null);
    }
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
    setGameState('REWARD');
    setPendingRewardAction(null);
    setLearningPokemonIdx(null);
    setPotentialMoves([]);
    setSelectedNewMove(null);
    setSelectedPokemonForEvolution(null);
    setEvolutionChoices([]);
  };

  const replacePokemon = (index: number) => {
    if (!showReplaceUI) return;
    const newTeam = [...playerTeam];
    newTeam[index] = showReplaceUI;
    setPlayerTeam(newTeam);
    setShowReplaceUI(null);
    setRewardChoiceMade(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-sans p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="bg-red-100 p-6 rounded-full">
            <Skull className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-red-600">{t('errorOccurred')}</h2>
          <p className="text-lg font-bold text-slate-600">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              if (gameState === 'START') startGame();
              else if (gameState === 'BATTLE') spawnEnemy(stage);
              else window.location.reload();
            }}
            className="mt-4 px-12 py-4 bg-slate-900 text-white font-black italic text-xl skew-x-[-12deg] hover:bg-blue-600 transition-all shadow-2xl group"
          >
            <div className="flex items-center gap-3 skew-x-[12deg]">
              <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              <span>{t('retry')}</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-2xl font-black tracking-tighter uppercase italic">{t('searchingPokemon')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#f0f0f0] text-slate-900 font-sans overflow-hidden select-none">
      {/* 剑盾风格背景装饰 */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#00a0e9_25%,transparent_25%,transparent_50%,#00a0e9_50%,#00a0e9_75%,transparent_75%,transparent)] bg-[length:100px_100px] animate-barber-pole"></div>
      </div>

      <div className="max-w-6xl mx-auto h-full flex flex-col p-2 md:p-4 relative z-10 overflow-hidden">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-center flex-none mb-4 relative z-50">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 px-6 py-2 skew-x-[-12deg] shadow-xl border-l-4 border-blue-500">
              <h1 className="text-xl font-black italic tracking-tighter skew-x-[12deg] text-white uppercase">Poke Roguelike</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 语言切换器 */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="bg-white px-4 py-1.5 skew-x-[-12deg] shadow-sm border border-slate-200 hover:border-blue-500 transition-all group flex items-center gap-2 pointer-events-auto"
              >
                <div className="skew-x-[12deg] flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name}
                  </span>
                </div>
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-40 bg-white shadow-2xl border-4 border-slate-900 overflow-hidden z-[100] pointer-events-auto"
                  >
                    <div className="p-1 grid grid-cols-1">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`px-4 py-2 text-left text-[10px] font-black italic uppercase transition-all ${
                            currentLanguage === lang.code 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {gameState !== 'START' && (
              <>
                <div className="bg-white px-4 py-1.5 skew-x-[-12deg] shadow-sm border-r-4 border-yellow-500">
                  <span className="font-black italic skew-x-[12deg] inline-block flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> {coins}
                  </span>
                </div>
                <div className="bg-white px-4 py-1.5 skew-x-[-12deg] shadow-sm border-r-4 border-red-500">
                  <span className="font-black italic skew-x-[12deg] inline-block text-sm uppercase tracking-widest">
                    {currentLanguage.startsWith('zh') ? '关卡' : 'Stage'} {stage}
                  </span>
                </div>
              </>
            )}

            {gameState === 'BATTLE' && (
              <button 
                onClick={() => setShowLogHistory(!showLogHistory)}
                className={`p-2 skew-x-[-12deg] transition-all shadow-sm border pointer-events-auto ${showLogHistory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-900'}`}
                title={t('battleHistory')}
              >
                <RefreshCw className={`w-4 h-4 skew-x-[12deg] ${showLogHistory ? 'rotate-180' : ''} transition-transform duration-500`} />
              </button>
            )}
          </div>
        </header>

        {gameState === 'STARTER_SELECT' && (
          <motion.div 
            key="starter-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 flex justify-between items-center relative z-20">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md px-6 py-2 skew-x-[-10deg] border border-white/30">
                  <h2 className="text-2xl font-black italic tracking-tighter skew-x-[10deg] text-white uppercase">{t('chooseStarter')}</h2>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 ${selectedStarterIndices.length > i ? 'bg-yellow-400 border-yellow-400' : 'bg-transparent border-white/30'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-md px-6 py-2 skew-x-[-10deg] border border-white/10">
                <span className="text-white font-black italic skew-x-[10deg] inline-block uppercase tracking-widest">
                  {selectedStarterIndices.length}/3 {t('selectThreeStarters')}
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center relative px-8">
              {infoPokemonIdx !== null && starterOptions[infoPokemonIdx] && (
                <div className="w-full max-w-7xl grid grid-cols-12 gap-8 items-center">
                  {/* Left Panel: Stats */}
                  <motion.div 
                    key={`stats-${infoPokemonIdx}`}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="col-span-3 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <img src="/pokeball_icon.png" className="w-5 h-5 opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <h3 className="text-2xl font-black italic text-white tracking-tight uppercase">{getLocalized(starterOptions[infoPokemonIdx])}</h3>
                      {starterOptions[infoPokemonIdx].gender === 'male' && <Mars className="w-5 h-5 text-blue-400" />}
                      {starterOptions[infoPokemonIdx].gender === 'female' && <Venus className="w-5 h-5 text-pink-400" />}
                    </div>

                    <div className="flex gap-2 mb-6">
                      {starterOptions[infoPokemonIdx].types.map((t: any) => (
                        <div key={t.type.name} className="flex items-center gap-2 bg-slate-900/60 px-2 py-1 rounded-lg border border-white/10">
                          <TypeBadge type={t.type.name} size="xs" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 mb-8">
                      {Object.entries(starterOptions[infoPokemonIdx].calculatedStats).map(([stat, val]) => {
                        const numVal = val as number;
                        const maxVal = 255;
                        const percentage = (numVal / maxVal) * 100;
                        const statName = stat === 'hp' ? 'HP' : 
                                         stat === 'attack' ? '攻击' : 
                                         stat === 'defense' ? '防御' : 
                                         stat === 'special-attack' ? '特攻' : 
                                         stat === 'special-defense' ? '特防' : '速度';
                        const Icon = stat === 'hp' ? Heart : 
                                     stat === 'attack' ? Sword : 
                                     stat === 'defense' ? Shield : 
                                     stat === 'special-attack' ? Zap : 
                                     stat === 'special-defense' ? Shield : RefreshCw;
                        
                        return (
                          <div key={stat} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[11px] font-black italic text-white/80 uppercase">
                              <div className="flex items-center gap-2">
                                <Icon className="w-3 h-3" /> {statName}
                              </div>
                              <span>{val}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={`h-full rounded-full ${stat === 'hp' ? 'bg-pink-500' : 'bg-yellow-400'}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase mb-1">能力调整</div>
                        <div className="text-xs font-black italic text-white">--</div>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase mb-1">性格</div>
                        <div className="text-xs font-black italic text-white">{getLocalizedNature(starterOptions[infoPokemonIdx].nature)}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Center: Sprite */}
                  <div className="col-span-6 flex flex-col items-center justify-center relative">
                    <motion.div
                      key={`sprite-${infoPokemonIdx}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150" />
                      <img 
                        src={starterOptions[infoPokemonIdx].sprites.front_default} 
                        className="w-80 h-80 object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] pixelated"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                    
                    <button
                      onClick={() => toggleStarterSelection(infoPokemonIdx!)}
                      className={`mt-8 px-12 py-4 skew-x-[-12deg] font-black italic text-xl transition-all shadow-2xl ${
                        infoPokemonIdx !== null && selectedStarterIndices.includes(infoPokemonIdx)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                      }`}
                    >
                      <span className="skew-x-[12deg] inline-block uppercase">
                        {infoPokemonIdx !== null && selectedStarterIndices.includes(infoPokemonIdx) ? t('cancel') : t('confirm')}
                      </span>
                    </button>
                  </div>

                  {/* Right Panel: Moves & Ability */}
                  <motion.div 
                    key={`moves-${infoPokemonIdx}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="col-span-3 space-y-6"
                  >
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl">
                      <div className="text-[10px] font-black italic text-white/40 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">招式</div>
                      <div className="space-y-3">
                        {starterOptions[infoPokemonIdx].selectedMoves.slice(0, 4).map((m, mi) => (
                          <div key={mi} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors group">
                            <TypeBadge type={m.type} size="sm" />
                            <div className="flex-1">
                              <div className="text-sm font-black italic text-white group-hover:text-yellow-400 transition-colors">{getLocalized(m)}</div>
                              <div className="text-[9px] font-black text-white/40 uppercase">PP {m.pp}/{m.pp}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl">
                      <div className="text-[10px] font-black italic text-white/40 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">特性</div>
                      <div className="bg-white/90 px-6 py-3 rounded-xl text-center shadow-inner">
                        <div className="text-slate-900 font-black italic uppercase tracking-tighter">
                          {starterOptions[infoPokemonIdx].ability?.name ? getLocalized(starterOptions[infoPokemonIdx].ability) : '扬沙'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Bottom: Icon List */}
            <div className="p-8 pb-12 bg-black/20 backdrop-blur-md border-t border-white/10 flex justify-center gap-6 relative z-20">
              {starterOptions.map((p, idx) => {
                const isSelected = selectedStarterIndices.includes(idx);
                const isCurrent = infoPokemonIdx === idx;
                return (
                  <div 
                    key={idx} 
                    className="relative group cursor-pointer" 
                    onClick={() => setInfoPokemonIdx(idx)}
                  >
                    {isCurrent && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400"
                      >
                        <ChevronRight className="w-8 h-8 rotate-90 fill-current" />
                      </motion.div>
                    )}
                    <div className={`w-20 h-20 rounded-2xl border-4 transition-all overflow-hidden relative ${
                      isCurrent ? 'border-yellow-400 bg-white/30 scale-110 shadow-2xl' : 
                      isSelected ? 'border-blue-400 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}>
                      <img 
                        src={p.sprites.front_default} 
                        className={`w-full h-full object-contain pixelated transition-transform ${isCurrent ? 'scale-125' : 'group-hover:scale-110'}`} 
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1 shadow-lg">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Button Overlay */}
            {selectedStarterIndices.length === 3 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
              >
                <button
                  onClick={confirmStarters}
                  className="px-16 py-5 bg-slate-900 text-white font-black italic text-2xl skew-x-[-12deg] shadow-[12px_12px_0px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-2 border-white/20"
                >
                  <span className="flex items-center gap-4 skew-x-[12deg]">
                    {t('confirmSelection')} <ChevronRight className="w-8 h-8" />
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 奖励宝可梦选择界面 */}
        <AnimatePresence>
          {showRewardPokemonSelect && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-md flex flex-col overflow-hidden"
            >
              <div className="p-6 flex justify-between items-center relative z-20">
                <div className="bg-white/10 backdrop-blur-md px-6 py-2 skew-x-[-10deg] border border-white/20">
                  <h2 className="text-2xl font-black italic tracking-tighter skew-x-[10deg] text-white uppercase">{t('chooseNewPartner')}</h2>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative px-8">
                {infoPokemonIdx !== null && rewardPokemonOptions[infoPokemonIdx] && (
                  <div className="w-full max-w-7xl grid grid-cols-12 gap-8 items-center">
                    {/* Left Panel: Stats */}
                    <motion.div 
                      key={`reward-stats-${infoPokemonIdx}`}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="col-span-3 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-black italic text-white tracking-tight uppercase">{getLocalized(rewardPokemonOptions[infoPokemonIdx])}</h3>
                        {rewardPokemonOptions[infoPokemonIdx].gender === 'male' && <Mars className="w-5 h-5 text-blue-400" />}
                        {rewardPokemonOptions[infoPokemonIdx].gender === 'female' && <Venus className="w-5 h-5 text-pink-400" />}
                      </div>

                      <div className="flex gap-2 mb-6">
                        {rewardPokemonOptions[infoPokemonIdx].types.map((t: any) => (
                          <div key={t.type.name} className="flex items-center gap-2 bg-slate-900/60 px-2 py-1 rounded-lg border border-white/10">
                            <TypeBadge type={t.type.name} size="xs" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 mb-8">
                        {Object.entries(rewardPokemonOptions[infoPokemonIdx].calculatedStats).map(([stat, val]) => {
                          const numVal = val as number;
                          const maxVal = 255;
                          const percentage = (numVal / maxVal) * 100;
                          const statName = stat === 'hp' ? 'HP' : 
                                           stat === 'attack' ? '攻击' : 
                                           stat === 'defense' ? '防御' : 
                                           stat === 'special-attack' ? '特攻' : 
                                           stat === 'special-defense' ? '特防' : '速度';
                          
                          return (
                            <div key={stat} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[11px] font-black italic text-white/80 uppercase">
                                <span>{statName}</span>
                                <span>{val}</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className={`h-full rounded-full ${stat === 'hp' ? 'bg-pink-500' : 'bg-yellow-400'}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase mb-1">性格</div>
                        <div className="text-xs font-black italic text-white">{getLocalizedNature(rewardPokemonOptions[infoPokemonIdx].nature)}</div>
                      </div>
                    </motion.div>

                    {/* Center: Sprite */}
                    <div className="col-span-6 flex flex-col items-center justify-center relative">
                      <motion.div
                        key={`reward-sprite-${infoPokemonIdx}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150" />
                        <img 
                          src={rewardPokemonOptions[infoPokemonIdx].sprites.front_default} 
                          className="w-80 h-80 object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] pixelated"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                      
                      <button
                        onClick={() => infoPokemonIdx !== null && confirmRewardPokemon(rewardPokemonOptions[infoPokemonIdx])}
                        className="mt-8 px-16 py-5 bg-yellow-400 text-slate-900 font-black italic text-2xl skew-x-[-12deg] shadow-[12px_12px_0px_rgba(0,0,0,0.3)] hover:bg-yellow-500 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all border-2 border-white/20"
                      >
                        <span className="skew-x-[12deg] inline-block uppercase">{t('confirmSelection')}</span>
                      </button>
                    </div>

                    {/* Right Panel: Moves */}
                    <motion.div 
                      key={`reward-moves-${infoPokemonIdx}`}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="col-span-3"
                    >
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl">
                        <div className="text-[10px] font-black italic text-white/40 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">招式</div>
                        <div className="space-y-3">
                          {rewardPokemonOptions[infoPokemonIdx].selectedMoves.slice(0, 4).map((m, mi) => (
                            <div key={mi} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                              <TypeBadge type={m.type} size="sm" />
                              <div className="flex-1">
                                <div className="text-sm font-black italic text-white">{getLocalized(m)}</div>
                                <div className="text-[9px] font-black text-white/40 uppercase">PP {m.pp}/{m.pp}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Bottom: Icon List */}
              <div className="p-8 pb-12 bg-black/40 backdrop-blur-md border-t border-white/10 flex justify-center gap-8 relative z-20">
                {rewardPokemonOptions.map((p, idx) => {
                  const isCurrent = infoPokemonIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="relative group cursor-pointer" 
                      onClick={() => setInfoPokemonIdx(idx)}
                    >
                      {isCurrent && (
                        <motion.div 
                          layoutId="reward-active-indicator"
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400"
                        >
                          <ChevronRight className="w-8 h-8 rotate-90 fill-current" />
                        </motion.div>
                      )}
                      <div className={`w-24 h-24 rounded-2xl border-4 transition-all overflow-hidden relative ${
                        isCurrent ? 'border-yellow-400 bg-white/30 scale-110 shadow-2xl' : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}>
                        <img 
                          src={p.sprites.front_default} 
                          className={`w-full h-full object-contain pixelated transition-transform ${isCurrent ? 'scale-125' : 'group-hover:scale-110'}`} 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                  <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter italic text-slate-900 uppercase">Poke Roguelike</h2>
                  <p className="text-slate-500 max-w-md mb-12 text-base sm:text-lg font-medium italic px-4">
                    随机对战之旅：在无尽化挑战中生存
                  </p>
                  <button 
                    onClick={() => setStartStep(1)}
                    className="group relative px-10 sm:px-16 py-4 sm:py-6 bg-slate-900 text-white rounded-none skew-x-[-12deg] font-black text-xl sm:text-3xl transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-[12px_12px_0px_#00000022]"
                  >
                    <span className="flex items-center gap-3 skew-x-[12deg]">
                      开始对战 <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
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
                      <ArrowLeft className="w-5 h-5" /> {t('back')}
                    </button>
                    <div className="flex gap-2">
                      {[1, 2].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${startStep >= i ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 md:p-10 shadow-2xl border-b-8 border-slate-900 mb-6 md:mb-12">
                    {startStep === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-xl md:text-2xl font-black italic mb-6 md:mb-8 uppercase tracking-tighter flex items-center gap-3">
                          <Dna className="w-5 h-5 md:w-6 md:h-6 text-blue-500" /> 选择你的冒险地区
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
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
                              className={`p-3 md:p-4 border-2 md:border-4 skew-x-[-4deg] transition-all relative overflow-hidden group ${
                                selectedGens.includes(gen.id)
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="skew-x-[4deg] relative z-10">
                                <div className="font-black text-base md:text-lg italic">{gen.name}</div>
                                <div className="text-[8px] md:text-[10px] font-bold opacity-60 uppercase tracking-widest">{gen.region}</div>
                              </div>
                              {selectedGens.includes(gen.id) && (
                                <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-blue-500 flex items-center justify-center skew-x-[4deg] -translate-y-1 md:-translate-y-2 translate-x-1 md:translate-x-2">
                                  <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setStartStep(2)}
                          className="mt-8 md:mt-12 w-full py-4 md:py-5 bg-blue-600 text-white font-black text-lg md:text-xl italic skew-x-[-10deg] hover:bg-blue-700 transition-all shadow-lg"
                        >
                          <span className="skew-x-[10deg] inline-block">下一步：选择等级</span>
                        </button>
                      </motion.div>
                    )}

                    {startStep === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-xl md:text-2xl font-black italic mb-6 md:mb-8 uppercase tracking-tighter flex items-center gap-3">
                          <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" /> 设定初始挑战难度
                        </h3>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
                          {[30, 50].map((lv) => (
                            <button
                              key={lv}
                              onClick={() => setStartLevel(lv)}
                              className={`flex-1 py-6 md:py-8 px-8 md:px-10 text-3xl md:text-4xl font-black italic transition-all skew-x-[-10deg] border-2 md:border-4 ${
                                startLevel === lv
                                  ? 'bg-yellow-400 text-white border-yellow-400 shadow-2xl scale-105'
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="skew-x-[10deg]">
                                <div className="text-[10px] md:text-sm uppercase opacity-60 mb-1 md:mb-2">Level</div>
                                <div>{lv}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={startGame}
                          disabled={loading}
                          className="mt-8 md:mt-12 w-full py-5 md:py-6 bg-slate-900 text-white font-black text-xl md:text-2xl italic skew-x-[-10deg] hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
                        >
                          <span className="skew-x-[10deg] inline-block flex items-center justify-center gap-3">
                            {loading ? <RefreshCw className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : '开启冒险之旅'}
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
              className="flex-1 flex flex-col min-h-0 bg-slate-900 relative overflow-hidden"
            >
              {/* 战斗场景 (占据全屏) */}
              <div className="absolute inset-0 bg-white overflow-hidden">
                {/* Stadium Background */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 grayscale-[0.5]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-100 to-transparent"></div>
                
                {/* 顶部退出按钮 */}
                <div className="absolute top-4 left-4 z-50">
                  <button 
                    onClick={() => setGameState('GAMEOVER')}
                    className="bg-slate-900/60 hover:bg-slate-900/80 text-white p-2 rounded-lg border border-white/20 backdrop-blur-sm flex items-center gap-2 transition-all group"
                  >
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                      <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    </div>
                  </button>
                </div>

                {/* 环境状态 (Top Center) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1">
                  {weather !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-yellow-500">
                      <Zap className="w-3 h-3" /> {t(`weather_${weather}`)} ({weatherTurns})
                    </div>
                  )}
                  {terrain !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-green-500">
                      <Leaf className="w-3 h-3" /> {t(`terrain_${terrain}`)} ({terrainTurns})
                    </div>
                  )}
                  {dimension !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-purple-500">
                      <Dna className="w-3 h-3" /> {t(`dimension_${dimension}`)} ({dimensionTurns})
                    </div>
                  )}
                </div>

                {/* 敌人 HP Bar (Top Right) */}
                <div className="absolute top-4 right-4 z-30">
                  <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="relative"
                  >
                    {/* 背景斜切容器 */}
                    <div 
                      className="bg-gradient-to-b from-indigo-900 to-slate-900 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 w-56 sm:w-72"
                      style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
                    >
                      <div className="flex items-center gap-2 pl-6 pr-2">
                        {/* 敌人头像框 */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-lg border border-white/20 flex items-center justify-center overflow-hidden flex-none">
                          <img src={enemy.sprites.front_default} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-xs sm:text-sm italic text-white tracking-tighter uppercase">{getLocalized(enemy)}</span>
                              {enemy.gender === 'male' && <Mars className="w-3 h-3 text-blue-400" />}
                              {enemy.gender === 'female' && <Venus className="w-3 h-3 text-pink-400" />}
                            </div>
                            <div className="flex items-center gap-1">
                              {enemy.status && (
                                <span className="bg-white text-slate-900 text-[8px] px-1 font-black uppercase rounded">
                                  {AILMENT_ZH[enemy.status] || enemy.status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* HP 条 */}
                          <div className="relative h-3 sm:h-4 bg-slate-800 rounded-sm border border-black/40 overflow-hidden skew-x-[-15deg]">
                            <motion.div 
                              animate={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                              className={`h-full transition-colors shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] ${enemy.currentHp / enemy.maxHp < 0.2 ? 'bg-red-500' : enemy.currentHp / enemy.maxHp < 0.5 ? 'bg-yellow-500' : 'bg-emerald-400'}`}
                            />
                            <div className="absolute inset-0 flex items-center justify-end pr-2">
                              <span className="text-[10px] font-black italic text-white drop-shadow-md skew-x-[15deg]">
                                {Math.round((enemy.currentHp / enemy.maxHp) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 底部装饰图标 */}
                    <div className="flex items-center gap-1 mt-1 pl-10">
                      <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold italic">
                        <RefreshCw className="w-3 h-3" /> 06: 59
                      </div>
                      <div className="flex gap-0.5 ml-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-3 h-3 rounded-full border border-green-400 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* 敌人 Sprite */}
                <div className="absolute top-[100px] right-[10%] sm:right-[15%]">
                  <motion.div
                    animate={isCatching ? { scale: 0, opacity: 0 } : enemyAnim === 'attack' ? { x: -60, y: 30, scale: 1, opacity: 1 } : enemyAnim === 'hit' ? { x: [0, 10, -10, 10, 0], opacity: [1, 0.5, 1], scale: 1 } : { y: [0, -10, 0], scale: 1, opacity: 1 }}
                    transition={isCatching ? { duration: 0.5 } : enemyAnim === 'idle' ? { y: { repeat: Infinity, duration: 3, ease: "easeInOut" }, scale: { duration: 0.3 }, opacity: { duration: 0.3 } } : { duration: 0.3 }}
                    className="relative"
                  >
                    <img 
                      src={enemy.sprites.front_default} 
                      className="w-40 h-40 sm:w-72 sm:h-72 object-contain drop-shadow-2xl relative z-10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-10 bg-black/20 rounded-[100%] blur-xl -z-10"></div>
                  </motion.div>
                </div>

                {/* 玩家 HP Bar (Bottom Left) */}
                <div className="absolute bottom-6 left-6 z-30 flex flex-col items-start gap-2">
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="relative"
                  >
                    {/* 顶部装饰图标 */}
                    <div className="flex items-center gap-1 mb-1 pl-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-3 h-3 rounded-full border border-green-400 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold italic ml-2">
                        <RefreshCw className="w-3 h-3" /> 06: 56
                      </div>
                    </div>

                    {/* 背景斜切容器 */}
                    <div 
                      className="bg-gradient-to-b from-indigo-900 to-slate-900 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 w-64 sm:w-80"
                      style={{ clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)' }}
                    >
                      <div className="flex items-center gap-2 pr-6 pl-2">
                        {/* 玩家头像框 */}
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-lg border border-white/20 flex items-center justify-center overflow-hidden flex-none">
                          <img src={playerTeam[0].sprites.front_default} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-xs sm:text-sm italic text-white tracking-tighter uppercase">{getLocalized(playerTeam[0])}</span>
                              {playerTeam[0].gender === 'male' && <Mars className="w-3 h-3 text-blue-400" />}
                              {playerTeam[0].gender === 'female' && <Venus className="w-3 h-3 text-pink-400" />}
                            </div>
                            <div className="flex items-center gap-1">
                              {playerTeam[0].status && (
                                <span className="bg-white text-slate-900 text-[8px] px-1 font-black uppercase rounded">
                                  {AILMENT_ZH[playerTeam[0].status] || playerTeam[0].status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* HP 条 */}
                          <div className="relative h-4 sm:h-5 bg-slate-800 rounded-sm border border-black/40 overflow-hidden skew-x-[-15deg]">
                            <motion.div 
                              animate={{ width: `${(playerTeam[0].currentHp / playerTeam[0].maxHp) * 100}%` }}
                              className={`h-full transition-colors shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] ${playerTeam[0].currentHp / playerTeam[0].maxHp < 0.2 ? 'bg-red-500' : playerTeam[0].currentHp / playerTeam[0].maxHp < 0.5 ? 'bg-yellow-500' : 'bg-emerald-400'}`}
                            />
                          </div>
                          <div className="flex justify-end mt-0.5">
                            <span className="text-xs sm:text-sm font-black italic text-white drop-shadow-md">
                              {playerTeam[0].currentHp} <span className="text-white/60 text-[10px]">/ {playerTeam[0].maxHp}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 玩家 Sprite */}
                  <motion.div
                    animate={playerAnim === 'attack' ? { x: 60, y: -40 } : playerAnim === 'hit' ? { x: [0, -10, 10, -10, 0], opacity: [1, 0.5, 1] } : { y: [0, 10, 0] }}
                    transition={playerAnim === 'idle' ? { y: { repeat: Infinity, duration: 3, ease: "easeInOut" } } : { duration: 0.3 }}
                    className="relative ml-4"
                  >
                    <img 
                      src={playerTeam[0].sprites.back_default || playerTeam[0].sprites.front_default} 
                      onError={(e) => {
                        if (e.currentTarget.src !== playerTeam[0].sprites.front_default) {
                          e.currentTarget.src = playerTeam[0].sprites.front_default;
                        }
                      }}
                      className="w-56 h-56 sm:w-96 sm:h-96 object-contain drop-shadow-2xl opacity-95 relative z-10 pixelated"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[110%] h-14 bg-black/20 rounded-[100%] blur-xl -z-10"></div>
                  </motion.div>
                </div>

                {/* 剑盾风格操作菜单 (右侧) */}
                <AnimatePresence>
                  {turn === 'PLAYER' && !isMessageProcessing && (
                    <motion.div 
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 100, opacity: 0 }}
                      className="absolute right-6 bottom-6 z-50 flex flex-col items-end gap-4"
                    >
                      {battleMenuTab === 'MAIN' && (
                        <div className="flex flex-col gap-3">
                          {[
                            { id: 'FIGHT', label: t('battle'), icon: Sword, color: 'bg-red-500' },
                            { id: 'POKEMON', label: t('pokemon'), icon: Dna, color: 'bg-emerald-500' },
                            { id: 'BAG', label: t('bag'), icon: Package, color: 'bg-yellow-500' },
                            { id: 'RUN', label: t('run'), icon: RefreshCw, color: 'bg-purple-500' }
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => {
                                if (btn.id === 'FIGHT') setBattleMenuTab('MOVES');
                                else if (btn.id === 'POKEMON') {
                                  setPrevGameState('BATTLE');
                                  setGameState('POKEMON_INFO');
                                  setInfoPokemonIdx(null);
                                } else if (btn.id === 'BAG') {
                                  setPrevGameState('BATTLE');
                                  setGameState('BAG');
                                } else if (btn.id === 'RUN') {
                                  setGameState('GAMEOVER');
                                }
                              }}
                              className="group relative"
                            >
                              <div className={`flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 border-2 border-white/20 rounded-lg px-6 py-3 shadow-2xl transition-all w-40 sm:w-56 skew-x-[-12deg] backdrop-blur-sm`}>
                                <div className={`${btn.color} p-1.5 rounded-full shadow-lg skew-x-[12deg]`}>
                                  <btn.icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="flex-1 text-left font-black text-sm sm:text-lg italic text-white uppercase tracking-tighter skew-x-[12deg]">{btn.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {battleMenuTab === 'MOVES' && (
                        <div className="flex flex-col items-end gap-4">
                          {/* Command Menu */}
                          <div className="flex flex-col items-end gap-1 mr-4">
                            <div className="text-white/60 text-[10px] font-black italic uppercase tracking-widest mb-1">COMMAND <span className="text-white ml-1">41</span></div>
                            <div className="flex gap-2">
                              <button className="bg-indigo-900/80 border border-white/20 px-4 py-1 rounded skew-x-[-10deg] flex items-center gap-2 hover:bg-indigo-800 transition-colors">
                                <span className="bg-white text-indigo-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold skew-x-[10deg]">X</span>
                                <span className="text-white text-xs font-bold skew-x-[10deg]">查看状态</span>
                              </button>
                              <button className="bg-indigo-900/80 border border-white/20 px-4 py-1 rounded skew-x-[-10deg] flex items-center gap-2 hover:bg-indigo-800 transition-colors">
                                <span className="bg-white text-indigo-900 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold skew-x-[10deg]">Y</span>
                                <span className="text-white text-xs font-bold skew-x-[10deg]">招式说明</span>
                              </button>
                            </div>
                          </div>

                          {/* Move List */}
                          <div className="flex flex-col gap-2">
                            {playerTeam[0].selectedMoves.map((move, idx) => {
                              const effectiveness = getEffectivenessText(move.type, enemy);
                              return (
                                <button
                                  key={idx}
                                  onMouseEnter={() => setHoveredMove(move)}
                                  onMouseLeave={() => setHoveredMove(null)}
                                  onClick={() => handleAttack(move)}
                                  className="group relative"
                                >
                                  <div className={`flex items-center gap-3 bg-gradient-to-r ${TYPE_GRADIENTS[move.type] || 'from-slate-500 to-slate-700'} border-2 border-white/40 rounded-xl pl-4 pr-2 py-2 shadow-2xl hover:scale-105 transition-all w-64 sm:w-80 h-16 sm:h-20 skew-x-[-12deg] relative overflow-hidden`}>
                                    {/* 纹理背景 */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                                    
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm skew-x-[12deg] flex-none">
                                      {(() => {
                                        const Icon = TYPE_ICONS[move.type] || Sparkles;
                                        return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
                                      })()}
                                    </div>
                                    
                                    <div className="flex-1 text-left skew-x-[12deg]">
                                      <div className="flex items-center gap-2">
                                        <div className="font-black text-sm sm:text-lg italic text-white uppercase tracking-tighter leading-tight drop-shadow-md truncate max-w-[120px]">
                                          {getLocalized(move)}
                                        </div>
                                        {move.damage_class && (
                                          <div className="bg-white/20 p-0.5 rounded flex-none">
                                            {(() => {
                                              const CatIcon = CATEGORY_ICONS[move.damage_class] || Sparkles;
                                              return <CatIcon className="w-3 h-3 text-white" />;
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {move.power && (
                                          <div className="text-[10px] font-black italic text-white/80">
                                            威力: {move.power}
                                          </div>
                                        )}
                                        {effectiveness && (
                                          <div className={`text-[10px] font-black italic flex items-center gap-1 ${effectiveness.color}`}>
                                            <span>{effectiveness.icon}</span> {effectiveness.text}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end justify-center skew-x-[12deg] pr-2">
                                      <div className="text-[10px] font-bold text-white/60 uppercase">PP</div>
                                      <div className="flex items-baseline gap-0.5">
                                        <div className="text-[14px] sm:text-[20px] font-black italic text-white leading-none">{move.currentPP}</div>
                                        <div className="text-[10px] font-bold text-white/60">/ {move.maxPP}</div>
                                      </div>
                                    </div>

                                    {/* 选中指示器 */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Move Description Tooltip */}
                          <AnimatePresence>
                            {hoveredMove && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mr-4 bg-slate-900/90 backdrop-blur-md border border-white/20 p-3 rounded-lg w-64 sm:w-80 shadow-2xl z-50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-black italic text-xs uppercase">{getLocalized(hoveredMove)}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/60 text-[10px] font-bold">ACC: {hoveredMove.accuracy || '---'}</span>
                                    <span className="text-white/60 text-[10px] font-bold">PP: {hoveredMove.currentPP}/{hoveredMove.maxPP}</span>
                                  </div>
                                </div>
                                <p className="text-white/80 text-[10px] leading-relaxed italic">
                                  {getLocalizedDesc(hoveredMove)}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <button 
                            onClick={() => setBattleMenuTab('MAIN')}
                            className="mr-4 bg-white/20 hover:bg-white/40 px-6 py-1.5 rounded-full text-xs font-black italic uppercase text-white transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
                          >
                            <ArrowLeft className="w-3 h-3" /> {t('back')}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 消息对话框 (置于最上层的 Overlay) */}
                <AnimatePresence>
                  {(isMessageProcessing || turn === 'ENEMY') && (
                    <motion.div 
                      key="battle-message-overlay"
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="absolute bottom-0 left-0 w-full z-[100] p-3 sm:p-4"
                    >
                      <div className="bg-white/95 backdrop-blur-md border-4 border-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.2)] p-4 sm:p-6 relative min-h-[100px] sm:min-h-[140px] flex items-center">
                        {/* 装饰边角 */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-blue-500"></div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={battleLog.length}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="w-full"
                          >
                            <p className="text-base sm:text-2xl font-black italic tracking-tighter leading-tight uppercase text-slate-900">
                              {turn === 'ENEMY' && !isMessageProcessing ? '对手正在思考...' : 
                               battleLog[battleLog.length - 1]}
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {/* 指示箭头 */}
                        <motion.div 
                          animate={{ y: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="absolute bottom-3 right-4"
                        >
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-slate-900"></div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 特效层 */}
                <AnimatePresence>
                  {(playerAnim === 'attack' || enemyAnim === 'attack') && activeMoveType && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
                      exit={{ opacity: 0, scale: 2 }}
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
                              className="w-20 h-20 sm:w-32 h-32 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
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
                      className="absolute top-32 sm:top-48 right-12 sm:right-24 z-50 flex flex-col items-center"
                    >
                      {/* 精灵球本体 */}
                      <motion.div 
                        key={shakeCount + (catchSuccess === false ? '-fail' : '')}
                        animate={catchSuccess === false ? { 
                          scale: [1, 1.5, 0],
                          opacity: [1, 1, 0],
                          rotate: [0, 20, -20, 0]
                        } : shakeCount > 0 && catchSuccess === null ? { 
                          rotate: [0, -20, 20, -20, 20, 0],
                          x: [0, -8, 8, -8, 8, 0]
                        } : {}}
                        transition={{ 
                          duration: catchSuccess === false ? 0.4 : 0.6,
                          ease: "easeInOut"
                        }}
                        className="relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center"
                      >
                        {activeBall?.sprite ? (
                          <img 
                            src={activeBall.sprite} 
                            className="w-full h-full object-contain drop-shadow-2xl" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="relative w-full h-full rounded-full border-4 border-slate-900 overflow-hidden bg-white shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 border-b-4 border-slate-900"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-4 border-slate-900 z-10">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-slate-200"></div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {gameState === 'REWARD' && (
            <motion.div 
              key="reward"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-4 overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6 px-4 flex-none">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-400 px-6 py-2 skew-x-[-12deg] shadow-lg">
                    <h2 className="text-2xl font-black italic tracking-tighter skew-x-[12deg] text-white uppercase">{t('victory')}</h2>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 skew-x-[-10deg] shadow-md flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400 skew-x-[10deg]" />
                    <span className="text-white font-black italic text-sm skew-x-[10deg]">{coins}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!rewardChoiceMade && (
                    <button 
                      onClick={rerollRewards}
                      disabled={coins < (50 + rerollCount * 50) || loading}
                      className={`px-3 md:px-4 py-2 font-black italic text-[10px] md:text-xs transition-all skew-x-[-10deg] flex items-center gap-2 ${
                        coins < (50 + rerollCount * 50) 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 shadow-md'
                      }`}
                    >
                      <span className="skew-x-[10deg] inline-block flex items-center gap-1 md:gap-2">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 
                        {t('reroll')} 
                        <span className="bg-slate-900/10 px-1.5 py-0.5 rounded text-[8px] md:text-[10px] flex items-center gap-1">
                          <Coins className="w-2 h-2" />{50 + rerollCount * 50}
                        </span>
                      </span>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setInfoPokemonIdx(null);
                      setPrevGameState(gameState);
                      setGameState('POKEMON_INFO');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-500 font-black italic text-xs hover:bg-slate-200 transition-all skew-x-[-10deg]"
                  >
                    <span className="skew-x-[10deg] inline-block flex items-center gap-2"><Dna className="w-3 h-3" /> {t('viewTeam')}</span>
                  </button>
                  <button 
                    onClick={nextStage}
                    disabled={!rewardChoiceMade || !!pendingRewardAction}
                    className={`px-8 py-2 font-black italic text-sm transition-all skew-x-[-10deg] shadow-lg ${
                      !rewardChoiceMade || !!pendingRewardAction
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse'
                    }`}
                  >
                    <span className="skew-x-[10deg] inline-block flex items-center gap-2">{t('nextLevel')} <ChevronRight className="w-4 h-4" /></span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                  {rewards.map((reward, i) => {
                    const isShop = reward.type === 'SHOP_ITEM';
                    const isClaimed = rewardChoiceMade && !isShop;
                    const canAfford = !isShop || coins >= reward.data.price;
                    
                    return (
                      <button
                        key={i}
                        disabled={isClaimed || !canAfford}
                        onClick={() => selectReward(reward)}
                        className={`group relative bg-white p-5 shadow-lg transition-all border-b-4 flex flex-col items-center justify-between min-h-[240px] ${
                          isClaimed ? 'opacity-40 grayscale cursor-not-allowed border-slate-200' : 
                          !canAfford ? 'opacity-60 grayscale cursor-not-allowed border-orange-200' : 
                          isShop ? 'hover:border-orange-500 hover:-translate-y-1 border-orange-100' : 'hover:border-blue-500 hover:-translate-y-1 border-blue-100'
                        }`}
                      >
                        {/* Type Label */}
                        <div className={`absolute top-0 left-0 px-3 py-1 text-[9px] font-black italic text-white skew-x-[-10deg] z-20 ${isShop ? 'bg-orange-500' : 'bg-blue-500'}`}>
                          <span className="skew-x-[10deg] inline-block uppercase">{isShop ? t('mysteryShop') : t('randomRewards')}</span>
                        </div>

                        <div className="w-full flex flex-col items-center pt-4">
                          {reward.type === 'ITEM' ? (
                            <>
                              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Package className="w-8 h-8 text-blue-500" />
                              </div>
                              <h4 className="text-base font-black italic mb-1 leading-tight text-center">{getLocalized(reward.data)}</h4>
                              <p className="text-[10px] text-slate-400 font-bold line-clamp-2 text-center px-2">{getLocalizedDesc(reward.data)}</p>
                            </>
                          ) : reward.type === 'MOVE' ? (
                            <>
                              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8 text-yellow-500" />
                              </div>
                              <h4 className="text-base font-black italic mb-1 leading-tight text-center">{t('learnMove')}</h4>
                              <p className="text-[10px] text-slate-400 font-bold line-clamp-2 text-center px-2">{t('learnMoveDesc')}</p>
                            </>
                          ) : reward.type === 'EVOLUTION' ? (
                            <>
                              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Dna className="w-8 h-8 text-purple-500" />
                              </div>
                              <h4 className="text-base font-black italic mb-1 leading-tight text-center">{t('evolutionReward')}</h4>
                              <p className="text-[10px] text-slate-400 font-bold line-clamp-2 text-center px-2">{t('evolutionRewardDesc')}</p>
                            </>
                          ) : reward.type === 'POKEMON' ? (
                            <>
                              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-8 h-8 text-blue-500" />
                              </div>
                              <h4 className="text-base font-black italic mb-1 leading-tight text-center">{t('newPartner')}</h4>
                              <p className="text-[10px] text-slate-400 font-bold line-clamp-2 text-center px-2">{t('newPartnerDesc')}</p>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Package className="w-8 h-8 text-orange-500" />
                              </div>
                              <h4 className="text-base font-black italic mb-1 leading-tight text-center">{getLocalized(reward.data.item)}</h4>
                              <p className="text-[10px] text-slate-400 font-bold line-clamp-2 text-center px-2">{getLocalizedDesc(reward.data.item)}</p>
                              <div className="mt-3 flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
                                <Coins className="w-3 h-3 text-orange-600" />
                                <span className="text-xs font-black text-orange-700">{reward.data.price}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className={`mt-6 w-full py-2 px-4 text-white font-black italic skew-x-[-10deg] transition-all text-xs shadow-md ${
                          isClaimed ? 'bg-slate-300' : 
                          !canAfford ? 'bg-slate-400' :
                          isShop ? 'bg-orange-600 group-hover:bg-orange-700' : 'bg-slate-900 group-hover:bg-blue-600'
                        }`}>
                          <span className="skew-x-[10deg] inline-block uppercase">
                            {isClaimed ? 'CLAIMED' : isShop ? (canAfford ? t('buyItem') : t('insufficientCoins')) : t('selectThis')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Action Overlays (Learn Move / Evolution) */}
              <AnimatePresence>
                {pendingRewardAction === 'MOVE' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col p-8 overflow-y-auto custom-scrollbar"
                  >
                    <div className="text-center mb-8 flex-none">
                      <div className="inline-block bg-blue-600 px-12 py-3 skew-x-[-12deg] shadow-xl mb-4">
                        <h2 className="text-3xl font-black italic tracking-tighter skew-x-[12deg] text-white">{t('learnMove')}</h2>
                      </div>
                      <p className="text-slate-300 font-bold italic text-sm">{t('selectToLearn')}</p>
                    </div>

                    {learningPokemonIdx === null ? (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
                          {playerTeam.map((p, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all border-b-4 border-slate-100 hover:border-blue-500 group flex items-center md:flex-col gap-4 md:gap-0"
                            >
                              <img src={p.sprites.front_default} className="w-16 h-16 md:w-24 md:h-24 group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                              <div className="flex-1 md:flex-none text-left md:text-center">
                                <div className="font-black italic text-base md:text-xl uppercase truncate">{getLocalized(p)}</div>
                                <div className="text-[8px] md:text-[10px] font-bold text-slate-400 mt-1 mb-2 md:mb-4">
                                  {t('movesCount').replace('{count}', p.selectedMoves.length.toString())}
                                </div>
                                <button
                                  onClick={() => startLearningMove(idx)}
                                  className="w-full py-2 bg-blue-500 text-white font-black italic text-[10px] md:text-sm hover:bg-blue-600 transition-colors skew-x-[-10deg]"
                                >
                                  <span className="skew-x-[10deg] inline-block">{t('learnMoveBtn')}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto pt-4 flex-none">
                          <button 
                            onClick={() => setPendingRewardAction(null)}
                            className="w-full py-3 bg-slate-800 text-white font-black italic skew-x-[-12deg] hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="skew-x-[12deg] inline-block flex items-center gap-2">
                              <ArrowLeft className="w-4 h-4" /> {t('back')}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : loading ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <RefreshCw className="animate-spin w-12 h-12 text-blue-500 mb-4" />
                        <p className="font-black italic text-slate-400">{t('retrievingMoves')}</p>
                      </div>
                    ) : selectedNewMove ? (
                      <div className="max-w-2xl mx-auto w-full">
                        <div className="bg-white p-8 shadow-2xl skew-x-[-2deg] border-l-8 border-red-500">
                          <div className="skew-x-[2deg]">
                            <h3 className="text-3xl font-black italic mb-2 tracking-tighter">{t('replaceWhichMove')}</h3>
                            <p className="text-slate-500 mb-8 font-bold italic">
                              {t('selectOldToReplace').replace('{move}', getLocalized(selectedNewMove))}
                            </p>
                            
                            <div className="grid grid-cols-1 gap-3">
                              {playerTeam[learningPokemonIdx].selectedMoves.map((m, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => replaceMove(idx)}
                                  onMouseEnter={() => setHoveredMove(m)}
                                  onMouseLeave={() => setHoveredMove(null)}
                                  className="p-4 bg-slate-50 hover:bg-red-50 border-2 border-slate-100 hover:border-red-500 transition-all flex justify-between items-center group"
                                >
                                  <div className="flex items-center gap-3">
                                    <TypeBadge type={m.type} size="xs" />
                                    <span className="font-black italic uppercase group-hover:text-red-600">{getLocalized(m)}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-400 uppercase">{m.damage_class === 'special' ? t('special') : t('physical')}</div>
                                </button>
                              ))}
                            </div>

                            <button 
                              onClick={() => setSelectedNewMove(null)}
                              className="mt-6 w-full py-3 bg-slate-100 text-slate-500 font-black italic hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" /> {t('back')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-8">
                          {potentialMoves.map((move, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleLearnMove(move)}
                              onMouseEnter={() => setHoveredMove(move)}
                              onMouseLeave={() => setHoveredMove(null)}
                              className="bg-white p-5 shadow-lg hover:shadow-2xl transition-all border-b-4 border-slate-100 hover:border-blue-500 flex flex-col items-center text-center group"
                            >
                              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-blue-500" />
                              </div>
                              <div className="font-black italic text-lg uppercase mb-1">{getLocalized(move)}</div>
                              <TypeBadge type={move.type} size="xs" />
                              <div className="mt-3 w-full py-1.5 bg-slate-900 text-white font-black italic text-[10px] skew-x-[-10deg]">
                                <span className="skew-x-[10deg] inline-block uppercase">{t('learnThisMove')}</span>
                              </div>
                            </button>
                          ))}
                          {potentialMoves.length === 0 && (
                            <div className="col-span-full text-center py-12">
                              <p className="text-slate-400 font-bold italic">{t('noMoreMoves')}</p>
                              <button 
                                onClick={() => setLearningPokemonIdx(null)}
                                className="mt-4 px-6 py-2 bg-slate-800 text-white font-black italic skew-x-[-10deg] flex items-center gap-2 mx-auto"
                              >
                                <span className="skew-x-[10deg] inline-block flex items-center gap-2">
                                  <ArrowLeft className="w-4 h-4" /> {t('reselectPokemon')}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {pendingRewardAction === 'EVOLUTION' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col p-8 overflow-y-auto custom-scrollbar"
                  >
                    <div className="text-center mb-8 flex-none">
                      <div className="inline-block bg-purple-600 px-12 py-3 skew-x-[-12deg] shadow-xl mb-4">
                        <h2 className="text-3xl font-black italic tracking-tighter skew-x-[12deg] text-white">{t('evolution')}</h2>
                      </div>
                      <p className="text-slate-300 font-bold italic text-sm">
                        {selectedPokemonForEvolution ? t('chooseEvolution') : t('selectToEvolve')}
                      </p>
                    </div>

                    {!selectedPokemonForEvolution ? (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8 overflow-y-auto custom-scrollbar pr-2">
                          {playerTeam.map((p, idx) => {
                            const canEvolve = canEvolveMap[idx];
                            return (
                              <div
                                key={idx}
                                className={`bg-white p-6 shadow-xl transition-all border-b-4 flex flex-col items-center text-center ${
                                  canEvolve ? 'border-purple-500 hover:shadow-2xl' : 'border-slate-200 opacity-75'
                                }`}
                              >
                                <div className="relative">
                                  <img 
                                    src={p.sprites.front_default} 
                                    className={`w-32 h-32 mx-auto mb-2 transition-transform ${canEvolve ? 'group-hover:scale-110' : 'grayscale'}`} 
                                    referrerPolicy="no-referrer" 
                                  />
                                  {isCheckingEvolution ? (
                                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 font-bold italic rounded-full animate-pulse">
                                      {t('checkingEvolution')}
                                    </div>
                                  ) : (
                                    <div className={`absolute top-0 right-0 text-[10px] px-2 py-1 font-black italic rounded-full skew-x-[-10deg] ${
                                      canEvolve ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      <span className="skew-x-[10deg] inline-block uppercase">
                                        {canEvolve ? t('canEvolve') : t('cannotEvolveShort')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="font-black italic text-xl uppercase text-slate-900">{getLocalized(p)}</div>
                                <div className="flex gap-1 mt-2">
                                  {p.types.map(t => (
                                    <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                                  ))}
                                </div>
                                <button
                                  disabled={!canEvolve || isCheckingEvolution}
                                  onClick={() => startEvolution(p, idx)}
                                  className={`w-full mt-6 py-3 font-black italic text-base transition-all skew-x-[-10deg] ${
                                    canEvolve 
                                      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-purple-200' 
                                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  <span className="skew-x-[10deg] inline-block">{t('evolve')}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-auto pt-4 flex-none">
                          <button 
                            onClick={() => setPendingRewardAction(null)}
                            className="w-full py-3 bg-slate-800 text-white font-black italic skew-x-[-12deg] hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="skew-x-[12deg] inline-block flex items-center gap-2">
                              <ArrowLeft className="w-4 h-4" /> {t('back')}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
                          {evolutionChoices.map((choice) => (
                            <motion.button
                              key={choice.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setEvolutionConfirmChoice(choice)}
                              className="aspect-square bg-white rounded-2xl shadow-xl border-4 border-purple-100 hover:border-purple-500 transition-all flex flex-col items-center justify-center p-4 group relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 skew-x-[45deg] translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform" />
                              <img 
                                src={choice.sprites.front_default} 
                                className="w-24 h-24 sm:w-32 sm:h-32 group-hover:scale-110 transition-transform z-10 object-contain" 
                                referrerPolicy="no-referrer" 
                              />
                              <div className="z-10 mt-2 w-full">
                                <div className="font-black italic text-xs sm:text-sm uppercase text-slate-900 truncate">{getLocalized(choice)}</div>
                                <div className="mt-1 flex justify-center gap-1">
                                  {choice.types.map(t => (
                                    <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                                  ))}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <div className="flex-none">
                          <button 
                            onClick={() => {
                              setSelectedPokemonForEvolution(null);
                              setEvolutionChoices([]);
                            }}
                            className="w-full py-3 bg-slate-800 text-white font-black italic skew-x-[-12deg] hover:bg-slate-700 transition-colors"
                          >
                            <span className="skew-x-[12deg] inline-block">{t('back')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 进化确认弹窗 */}
                    <AnimatePresence>
                      {evolutionConfirmChoice && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
                        >
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white max-w-md w-full p-8 shadow-2xl skew-x-[-2deg]"
                          >
                            <div className="skew-x-[2deg] text-center">
                              <h3 className="text-2xl font-black italic mb-4 uppercase">{t('confirmEvolution')}</h3>
                              <p className="text-slate-600 font-bold italic mb-8">
                                {t('confirmEvolutionDesc', { 
                                  name: getLocalized(selectedPokemonForEvolution?.pokemon), 
                                  target: getLocalized(evolutionConfirmChoice) 
                                })}
                              </p>
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => setEvolutionConfirmChoice(null)}
                                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-black italic hover:bg-slate-200 transition-all skew-x-[-10deg]"
                                >
                                  <span className="skew-x-[10deg]">{t('cancel')}</span>
                                </button>
                                <button 
                                  onClick={() => performEvolution(evolutionConfirmChoice.id)}
                                  className="flex-1 py-3 bg-purple-600 text-white font-black italic hover:bg-purple-700 transition-all skew-x-[-10deg] shadow-lg"
                                >
                                  <span className="skew-x-[10deg]">{t('confirm')}</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 替换界面 */}
              <AnimatePresence>
                {showReplaceUI && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white max-w-2xl w-full border-4 border-slate-900 shadow-[16px_16px_0px_rgba(0,0,0,0.2)] overflow-hidden relative"
                    >
                      <div className="bg-slate-900 p-6">
                        <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase">{t('teamFull')}</h2>
                        <p className="text-slate-400 font-bold italic mt-1">{t('replacePartner')}：<span className="text-lime-400 uppercase">{getLocalized(showReplaceUI)}</span></p>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {playerTeam.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => replacePokemon(idx)}
                            className="relative h-20 group transition-all"
                          >
                            <div className="absolute inset-0 skew-x-[-6deg] border-2 border-slate-200 bg-slate-50 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all" />
                            <div className="relative z-10 flex items-center px-4 gap-4">
                              <img src={p.sprites.front_default} className="w-14 h-14 object-contain pixelated" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-black text-sm uppercase text-slate-900 group-hover:text-blue-600 italic">{getLocalized(p)}</div>
                                <div className="text-[10px] font-black italic text-slate-400 uppercase">等级 {p.level}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="p-6 pt-0">
                        <button 
                          onClick={() => setShowReplaceUI(null)}
                          className="w-full py-4 bg-slate-100 text-slate-500 font-black italic uppercase tracking-widest hover:bg-slate-200 transition-all skew-x-[-6deg]"
                        >
                          <span className="skew-x-[6deg] inline-block">{t('cancelReplace')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === 'BAG' && (
            <motion.div 
              key="bag-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-100 flex flex-col"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 bg-white border-b border-slate-200 relative z-20">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setGameState(prevGameState || 'BATTLE')}
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all rounded-full"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase flex items-center gap-3">
                      <Package className="w-6 h-6 text-blue-600" /> {t('bag')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 text-white px-4 py-1 skew-x-[-10deg] text-sm font-black italic">
                      <span className="skew-x-[10deg] inline-block">ITEMS: {inventory.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {inventory.length > 0 ? inventory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => useItem(item, idx)}
                        className="relative h-24 group transition-all"
                      >
                        <div className="absolute inset-0 skew-x-[-6deg] border-2 border-slate-200 bg-white group-hover:border-blue-500 group-hover:bg-blue-50 transition-all shadow-sm" />
                        <div className="relative z-10 flex items-center px-4 gap-4 h-full">
                          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                            <Package className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-black text-sm uppercase text-slate-900 group-hover:text-blue-600 italic truncate">{getLocalized(item)}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-bold leading-tight line-clamp-2 italic">{getLocalizedDesc(item)}</div>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                        <Package className="w-16 h-16 text-slate-200" />
                        <div className="text-slate-300 font-black italic text-2xl uppercase tracking-widest">{t('bagEmpty')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'POKEMON_INFO' && (
            <motion.div 
              key="pokemon_info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden relative bg-slate-100"
            >
              {(() => {
                const infoSource = prevGameState === 'STARTER_SELECT' ? starterOptions : playerTeam;
                const p = infoPokemonIdx !== null ? infoSource[infoPokemonIdx] : (infoSource.length > 0 ? infoSource[0] : null);
                const currentIdx = infoPokemonIdx !== null ? infoPokemonIdx : (infoSource.length > 0 ? 0 : null);
                const ability = p?.ability || p?.abilities?.[0]?.ability;

                return (
                  <div className="absolute inset-0 z-[150] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 md:p-6 bg-white border-b border-slate-200 relative z-20">
                      <div className="flex items-center gap-4">
                        {!isFaintedReplacement && (
                          <button 
                            onClick={() => {
                              setInfoPokemonIdx(null);
                              setGameState(prevGameState || 'MENU');
                            }}
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all rounded-full"
                          >
                            <ArrowLeft className="w-6 h-6" />
                          </button>
                        )}
                        <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">
                          {prevGameState === 'STARTER_SELECT' ? t('chooseStarter') : t('myTeam')}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-900 text-white px-4 py-1 skew-x-[-10deg] text-sm font-black italic">
                          <span className="skew-x-[10deg] inline-block">LV.{p?.level || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6">
                      {/* Left Column: Team List */}
                      <div className="w-full md:w-80 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4 flex-none">
                        {infoSource.map((tp, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInfoPokemonIdx(idx);
                            }}
                            className={`
                              group relative min-h-[80px] transition-all flex flex-col
                              ${currentIdx === idx ? 'scale-[1.02] z-10' : 'hover:scale-[1.01]'}
                            `}
                          >
                            {/* Slanted Background */}
                            <div 
                              className={`
                                absolute inset-0 skew-x-[-10deg] transition-all border-2
                                ${currentIdx === idx 
                                  ? 'bg-white border-lime-400 shadow-[8px_8px_0px_rgba(163,230,53,0.2)]' 
                                  : 'bg-white border-slate-200 group-hover:border-slate-300 shadow-sm'}
                              `}
                            />
                            
                            {/* Active Indicator */}
                            {currentIdx === idx && (
                              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-2 h-12 bg-lime-400 skew-x-[-10deg] z-20" />
                            )}

                            <div className="relative z-10 flex flex-col w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative flex-none">
                                  <img 
                                    src={tp.sprites.front_default} 
                                    className={`w-14 h-14 object-contain pixelated ${tp.currentHp <= 0 ? 'grayscale opacity-50' : ''}`} 
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-black italic text-sm uppercase truncate text-slate-900">
                                      {getLocalized(tp)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {tp.gender === 'male' && <Mars className="w-3 h-3 text-blue-500" />}
                                      {tp.gender === 'female' && <Venus className="w-3 h-3 text-pink-500" />}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                      <div 
                                        className={`h-full transition-all ${tp.currentHp / tp.maxHp > 0.5 ? 'bg-green-400' : tp.currentHp / tp.maxHp > 0.2 ? 'bg-yellow-400' : 'bg-red-400'}`} 
                                        style={{ width: `${(tp.currentHp / tp.maxHp) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-black italic text-slate-500 whitespace-nowrap">
                                      {tp.currentHp}/{tp.maxHp}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Switch Button (Always visible in battle for non-active healthy pokemon) */}
                              {prevGameState === 'BATTLE' && idx !== 0 && tp.currentHp > 0 && (
                                <div className="mt-2 flex justify-end">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchPokemon(idx);
                                    }}
                                    className="bg-slate-900 text-white text-[10px] font-black px-4 py-1 skew-x-[-10deg] hover:bg-slate-800 transition-all uppercase italic shadow-lg"
                                  >
                                    <span className="skew-x-[10deg] inline-block">{t('switch')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {idx === 0 && prevGameState === 'BATTLE' && (
                              <div className="absolute top-[-4px] right-2 bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 skew-x-[-10deg] z-20 uppercase tracking-tighter">
                                <span className="skew-x-[10deg] inline-block">{t('active')}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Center Panel: Details */}
                      <div className="flex-1 flex flex-col bg-white border-2 border-slate-200 relative overflow-hidden">
                        {p ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Tabs */}
                            <div className="flex bg-slate-50 border-b-2 border-slate-200">
                              <button 
                                onClick={() => setInfoTab('STATS')}
                                className={`
                                  px-8 py-3 font-black italic uppercase text-sm tracking-widest transition-all relative
                                  ${infoTab === 'STATS' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
                                `}
                              >
                                能力
                                {infoTab === 'STATS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600" />}
                              </button>
                              <button 
                                onClick={() => setInfoTab('STATUS')}
                                className={`
                                  px-8 py-3 font-black italic uppercase text-sm tracking-widest transition-all relative
                                  ${infoTab === 'STATUS' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
                                `}
                              >
                                状态
                                {infoTab === 'STATUS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600" />}
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                              {infoTab === 'STATS' ? (
                                <div className="flex flex-col gap-8">
                                  {/* Top: Image and Type */}
                                  <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner relative">
                                      <img 
                                        src={p.sprites.front_default} 
                                        className="w-40 h-40 object-contain pixelated drop-shadow-xl z-10" 
                                        referrerPolicy="no-referrer" 
                                      />
                                      <div className="absolute -bottom-2 flex gap-2">
                                        {p.types.map(t => (
                                          <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                      {['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'].map((key) => {
                                        const isPlus = p.nature.plus === key;
                                        const isMinus = p.nature.minus === key;
                                        const val = p.calculatedStats[key as keyof Stats];
                                        const baseVal = p.baseStats[key as keyof Stats];
                                        const percent = (baseVal / 255) * 100;

                                        return (
                                          <div key={key} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-end">
                                              <span className={`text-[10px] font-black italic uppercase ${isPlus ? 'text-red-500' : isMinus ? 'text-blue-500' : 'text-slate-400'}`}>
                                                {t(key)} {isPlus && '↑'} {isMinus && '↓'}
                                              </span>
                                              <span className="text-lg font-black italic text-slate-900 leading-none">{val}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                className={`h-full ${isPlus ? 'bg-red-400' : isMinus ? 'bg-blue-400' : 'bg-slate-400'}`}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Moves Section */}
                                  <div className="flex flex-col gap-4">
                                    <h4 className="text-sm font-black italic uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">技能列表</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {p.selectedMoves.map((move, i) => (
                                        <div 
                                          key={i} 
                                          className="relative h-14 flex items-center group"
                                        >
                                          <div 
                                            className="absolute inset-0 skew-x-[-6deg] border-2 border-slate-200 bg-white group-hover:border-slate-300 transition-all"
                                            style={{ borderLeftWidth: '8px', borderLeftColor: TYPE_COLORS[move.type.name] || '#ccc' }}
                                          />
                                          <div className="relative z-10 flex items-center justify-between w-full px-4">
                                            <div className="flex flex-col">
                                              <span className="font-black italic uppercase text-xs text-slate-900">{getLocalized(move)}</span>
                                              <div className="flex items-center gap-2">
                                                <TypeBadge type={move.type.name} size="xs" />
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{move.damage_class}</span>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-[8px] font-black italic text-slate-400 uppercase leading-none mb-0.5">PP</div>
                                              <div className="text-xs font-black italic text-slate-700">{move.currentPP}/{move.pp}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-8">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">特性</span>
                                      <div className="bg-slate-50 p-4 border-2 border-slate-200 skew-x-[-4deg]">
                                        <div className="skew-x-[4deg]">
                                          <div className="font-black italic text-blue-600 text-sm mb-1 uppercase">{getLocalized(ability)}</div>
                                          <p className="text-[11px] text-slate-500 italic leading-tight">{getLocalizedDesc(ability)}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">性格</span>
                                      <div className="bg-slate-50 p-4 border-2 border-slate-200 skew-x-[-4deg]">
                                        <div className="skew-x-[4deg]">
                                          <div className="font-black italic text-slate-900 text-sm uppercase">{getLocalizedNature(p.nature)}</div>
                                          <div className="flex gap-4 mt-1">
                                            {p.nature.plus && <span className="text-[10px] font-bold text-red-500 uppercase">提升: {t(p.nature.plus)}</span>}
                                            {p.nature.minus && <span className="text-[10px] font-bold text-blue-500 uppercase">降低: {t(p.nature.minus)}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">对战历史</span>
                                    <div className="bg-slate-50 p-6 border-2 border-slate-200 min-h-[200px] flex items-center justify-center">
                                      <p className="text-slate-300 font-black italic uppercase tracking-widest">尚无记录</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                            <Dna className="w-24 h-24 mb-4 opacity-20" />
                            <p className="font-black italic uppercase tracking-widest opacity-50">请选择一只宝可梦</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Decorative/Enemy List */}
                      <div className="hidden lg:flex w-48 flex-col gap-3 opacity-30 pointer-events-none">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-16 bg-slate-200 skew-x-[-10deg] border-2 border-slate-300" />
                        ))}
                      </div>
                    </div>

                    {/* Team Action Menu Popup */}
                    <AnimatePresence>
                      {showTeamActionMenu !== null && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                          onClick={() => setShowTeamActionMenu(null)}
                        >
                          <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-[280px] border-4 border-slate-900 shadow-[12px_12px_0px_rgba(0,0,0,0.2)] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="bg-slate-900 p-4">
                              <h3 className="text-white font-black italic uppercase tracking-widest text-center">
                                {getLocalized(infoSource[showTeamActionMenu])}
                              </h3>
                            </div>
                            <div className="p-2 flex flex-col gap-2">
                              <button 
                                disabled={infoSource[showTeamActionMenu].currentHp <= 0 || showTeamActionMenu === 0 || (isMessageProcessing && !isFaintedReplacement)}
                                onClick={() => {
                                  switchPokemon(showTeamActionMenu);
                                  setShowTeamActionMenu(null);
                                }}
                                className={`
                                  w-full py-4 font-black italic uppercase tracking-widest transition-all
                                  ${infoSource[showTeamActionMenu].currentHp <= 0 || showTeamActionMenu === 0 || (isMessageProcessing && !isFaintedReplacement)
                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'bg-white text-slate-900 hover:bg-lime-400 hover:text-white border-2 border-slate-900'}
                                `}
                              >
                                {isFaintedReplacement ? '派它上场' : '替换'}
                              </button>
                              <button 
                                onClick={() => setShowTeamActionMenu(null)}
                                className="w-full py-4 bg-white text-slate-400 font-black italic uppercase tracking-widest hover:bg-slate-50 transition-all"
                              >
                                退出
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </motion.div>
          )}
          {isEvolutionAnimating && evolutionTarget && evolvedPokemon && (
            <motion.div 
              key="evolution"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
            >
              <EvolutionAnimation 
                from={evolutionTarget} 
                to={evolvedPokemon} 
                onComplete={() => {
                  setIsEvolutionAnimating(false);
                  setPendingRewardAction(null);
                  setSelectedPokemonForEvolution(null);
                  setEvolutionChoices([]);
                  setEvolutionTarget(null);
                  setEvolvedPokemon(null);
                  finishReward();
                }}
                t={t}
                getLocalized={getLocalized}
              />
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-4 text-center"
            >
              <div className="bg-red-500 p-6 md:p-8 skew-x-[-12deg] shadow-2xl mb-6 md:mb-8">
                <Skull className="w-12 h-12 md:w-20 md:h-20 text-white skew-x-[12deg]" />
              </div>
              <h2 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter italic text-slate-900 uppercase">{t('gameOver')}</h2>
              <div className="bg-slate-900 text-white px-6 py-2 skew-x-[-10deg] mb-8">
                <p className="font-black italic text-lg md:text-2xl skew-x-[10deg]">{t('reachedFloor', { stage })}</p>
              </div>
              
              <button 
                onClick={() => setGameState('START')}
                className="px-10 md:px-12 py-4 md:py-5 bg-slate-900 text-white font-black text-xl md:text-2xl skew-x-[-12deg] hover:bg-blue-600 transition-all shadow-xl"
              >
                <span className="flex items-center gap-3 skew-x-[12deg]">
                  <RefreshCw className="w-5 h-5 md:w-6 md:h-6" /> {t('restart')}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
