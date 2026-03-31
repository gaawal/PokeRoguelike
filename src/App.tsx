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

const AILMENT_ZH: Record<string, string> = {
  poison: '中毒',
  toxic: '剧毒',
  paralysis: '麻痹',
  burn: '灼伤',
  freeze: '冰冻',
  sleep: '睡眠',
  confusion: '混乱',
  infatuation: '着迷',
  trap: '束缚',
  nightmare: '噩梦',
  leech_seed: '寄生种子',
};

const STAT_ZH: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  spAtk: '特攻',
  spDef: '特防',
  speed: '速度',
  accuracy: '命中',
  evasion: '闪避',
};

const STAT_STAGE_MODIFIERS: Record<number, number> = {
  '-6': 2 / 8,
  '-5': 2 / 7,
  '-4': 2 / 6,
  '-3': 2 / 5,
  '-2': 2 / 4,
  '-1': 2 / 3,
  '0': 1,
  '1': 1.5,
  '2': 2,
  '3': 2.5,
  '4': 3,
  '5': 3.5,
  '6': 4,
};

const ACC_EVA_STAGE_MODIFIERS: Record<number, number> = {
  '-6': 3 / 9,
  '-5': 3 / 8,
  '-4': 3 / 7,
  '-3': 3 / 6,
  '-2': 3 / 5,
  '-1': 3 / 4,
  '0': 1,
  '1': 4 / 3,
  '2': 5 / 3,
  '3': 6 / 3,
  '4': 7 / 3,
  '5': 8 / 3,
  '6': 9 / 3,
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
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm overflow-hidden">
      {/* 剑盾风格背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#00a0e9_25%,transparent_25%,transparent_50%,#00a0e9_50%,#00a0e9_75%,transparent_75%,transparent)] bg-[length:100px_100px] animate-barber-pole"></div>
      </div>

      {phase === 'FLASH' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-white"
        />
      )}

      <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
        <AnimatePresence mode="wait">
          {phase === 'RESULT' ? (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="flex flex-col items-center"
            >
              <img 
                src={to.sprites.front_default} 
                alt={getLocalized(to)}
                className="w-full h-full object-contain pixelated drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
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
                className={`w-full h-full object-contain pixelated ${phase === 'FLICKER' ? 'brightness-150' : ''}`}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'RESULT' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center px-4 z-10"
        >
          <div className="bg-slate-900 px-8 py-3 skew-x-[-12deg] shadow-2xl mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl md:text-3xl font-black italic tracking-tighter skew-x-[12deg] text-white uppercase">
              {t('evolveSuccessMsg', { name: getLocalized(from), target: getLocalized(to) })}
            </h2>
          </div>
          <button
            onClick={onComplete}
            className="px-12 py-4 bg-blue-600 text-white font-black italic text-lg md:text-xl skew-x-[-12deg] hover:bg-blue-700 transition-all shadow-xl"
          >
            <span className="skew-x-[12deg] inline-block">{t('confirm')}</span>
          </button>
        </motion.div>
      )}
      
      {phase !== 'RESULT' && (
        <div className="bg-slate-900 text-white px-6 py-2 skew-x-[-10deg] animate-pulse">
          <span className="skew-x-[10deg] inline-block font-black italic tracking-widest">EVOLVING...</span>
        </div>
      )}
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
  const [gameState, setGameState] = useState<GameState>('START');
  const [startStep, setStartStep] = useState(0); // 0: Title, 1: Region, 2: Level
  const [coins, setCoins] = useState(0);
  const [shopItems, setShopItems] = useState<{item: Item, price: number}[]>([]);
  const [rewardChoiceMade, setRewardChoiceMade] = useState(false);
  const [rerollCount, setRerollCount] = useState(0);
  const [playerTeam, setPlayerTeam] = useState<GamePokemon[]>([]);
  const [rewards, setRewards] = useState<{ type: 'ITEM' | 'POKEMON' | 'MOVE' | 'EVOLUTION' | 'SHOP_ITEM', data: any }[]>([]);
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
  const [selectedStarterIndices, setSelectedStarterIndices] = useState<number[]>([]);
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null);
  const [infoPokemonIdx, setInfoPokemonIdx] = useState<number | null>(null);
  const [prevGameState, setPrevGameState] = useState<GameState>('START');
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('zh-hans');
  const [pendingRewardAction, setPendingRewardAction] = useState<'MOVE' | 'EVOLUTION' | null>(null);
  const [evolutionConfirmChoice, setEvolutionConfirmChoice] = useState<Pokemon | null>(null);
  const [isEvolutionAnimating, setIsEvolutionAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [stage, setStage] = useState(1);
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
  const [evolutionTarget, setEvolutionTarget] = useState<GamePokemon | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolvedPokemon, setEvolvedPokemon] = useState<GamePokemon | null>(null);
  const [evolutionChoices, setEvolutionChoices] = useState<Pokemon[]>([]);
  const [selectedPokemonForEvolution, setSelectedPokemonForEvolution] = useState<{pokemon: GamePokemon, index: number} | null>(null);

  const uiStrings: Record<string, Record<string, string>> = {
    'zh-hans': {
      stage: '关卡',
      switch: '出战',
      info: '详情',
      selectMove: '选择技能',
      back: '返回',
      victory: '胜利！',
      chooseReward: '选择一项奖励以继续你的冒险',
      viewTeam: '查看我的队伍',
      teamList: '队伍列表',
      randomRewards: '随机奖励',
      getItem: '获得道具',
      learnMove: '学习新技能',
      learnMoveDesc: '让队伍中的一只宝可梦学习一个新技能',
      evolutionReward: '宝可梦进化',
      evolutionRewardDesc: '让队伍中的一只宝可梦进化到下一阶段',
      specialReward: '特殊奖励',
      joinTeam: '加入队伍',
      selectThis: '选择此项',
      mysteryShop: '神秘商店',
      buyItem: '购买道具',
      insufficientCoins: '金币不足',
      winBattle: '胜利！击败了 {name}！',
      terrain_grassy_heal: '{name} 通过青草场地恢复了体力！',
      weatherDamage: '{name} 受到了天气伤害！',
      dimension_magic_room_block: '魔法空间生效中，无法使用道具！',
      catchSuccess: '捕捉成功！获得了 {coins} 金币！',
      battleVictory: '胜利！获得了 {coins} 金币！',
      teamFull: '队伍已满！',
      replacePartner: '选择一只宝可梦进行替换，以加入新的伙伴',
      power: '威力',
      accuracy: '命中',
      pp: 'PP',
      nature: '性格',
      ability: '特性',
      none: '无',
      stats: '能力值',
      baseStats: '种族值',
      actualStats: '最终能力',
      currentMoves: '当前技能',
      base: '种族',
      iv: '个体值',
      physical: '物理',
      special: '特攻',
      status: '变化',
      confirm: '确认',
      cancel: '取消',
      battleLog: '战斗记录',
      hp: 'HP',
      attack: '攻击',
      defense: '防御',
      spAtk: '特攻',
      spDef: '特防',
      speed: '速度',
      selectToLearn: '选择一只宝可梦来学习新的力量',
      retrievingMoves: '正在检索可学习的技能...',
      replaceWhichMove: '替换哪个技能？',
      alreadyKnows4: '{name} 已经学会了4个技能。',
      selectOldToReplace: '请选择一个旧技能来替换为 {move}。',
      movesCount: '{count}/4 技能',
      learnMoveBtn: '学习技能',
      cancelReplace: '取消替换',
      searchingPokemon: '正在寻找宝可梦...',
      battleHistory: '对战历史',
      chooseStarter: '选择你的初始伙伴',
      chooseStarterDesc: '请选择2只宝可梦作为你的初始伙伴。点击卡片进行选择，再次点击取消。',
      selectTwoStarters: '请选择2只宝可梦',
      confirmSelection: '确认选择并开始冒险',
      startingMoves: '初始技能',
      viewDetails: '查看详情',
      iChooseYou: '就决定是你了！',
      gymLeaderSent: '道馆馆主 派出了 {name}！',
      wildPokemonAppeared: '野生的 {name} 出现了！',
      youUsed: '你使用了 {name}！',
      cannotCatchGym: '不能捕捉道馆馆主的宝可梦！',
      catching: '正在捕捉...',
      catchSuccessMsg: '成功捕捉了 {name}！',
      joinedTeam: '{name} 已加入你的队伍！',
      brokeFree: '{name} 挣脱了！',
      withdrew: '你收回了 {name}！',
      sentOut: '你派出了 {name}！',
      usedMove: '{name} 使用了 {move}！',
      superEffective: '这一击效果绝佳！',
      notVeryEffective: '这一击收效甚微...',
      noEffect: '似乎没有效果...',
      causedDamage: '{name} 造成了 {damage} 点伤害。',
      fainted: '{name} 倒下了！',
      enemyUsedMove: '对手的 {name} 使用了 {move}！',
      enemyCausedDamage: '对手的 {name} 造成了 {damage} 点伤害。',
      noRecords: '尚无记录',
      rogueJourney: '随机对战之旅：在无尽的挑战中生存',
      startBattle: '开始对战',
      selectRegion: '选择你的冒险地区',
      nextStep: '下一步：选择等级',
      setDifficulty: '设定初始挑战难度',
      startAdventure: '开启冒险之旅',
      nextLevel: '下一关',
      thinking: '对手正在思考...',
      commandPhase: '指令阶段',
      whatToDo: '该怎么办呢？',
      atkUp: '攻击↑',
      defUp: '防御↑',
      battle: '战斗',
      bag: '背包',
      pokemon: '宝可梦',
      run: '逃跑',
      myBag: '我的背包',
      myTeam: '我的队伍',
      bagEmpty: '背包空空如也',
      backToMoves: '返回选择技能',
      evolution: '进化',
      evolveSuccess: '{name} 进化成了 {target}！',
      cannotEvolve: '这只宝可梦目前无法进化。',
      selectToEvolve: '选择一只宝可梦进行进化',
      chooseEvolution: '选择进化形态',
      evolve: '进化',
      confirmEvolution: '确认进化',
      confirmEvolutionDesc: '是否确定将 {name} 进化为 {target}？',
      evolveSuccessMsg: '恭喜！{name} 进化成为了 {target}！',
      shop: '商店',
      price: '价格',
      learningNewMove: '正在学习新技能...',
      learnThisMove: '学习此技能',
      noMoreMoves: '这只宝可梦暂时没有更多可学习的技能了。',
      reselectPokemon: '重新选择宝可梦',
      challengeEnd: '挑战结束',
      fellAtStage: '你在第 {stage} 关倒下了',
      restart: '重新开始',
      weather_none: '天气：无',
      weather_sunny: '天气：大晴天',
      weather_rainy: '天气：下雨',
      weather_sandstorm: '天气：沙暴',
      weather_snow: '天气：下雪',
      weather_heavy_rain: '天气：始源之海',
      weather_harsh_sunlight: '天气：终结之地',
      weather_strong_winds: '天气：德尔塔气流',
      weather_sunny_effect: '阳光增强了火属性技能，削弱了水属性技能。',
      weather_rainy_effect: '降雨增强了水属性技能，削弱了火属性技能。',
      weather_sandstorm_effect: '沙暴正在肆虐！岩石、地面和钢属性以外的宝可梦会受到伤害。',
      weather_snow_effect: '大雪正在降下！冰属性宝可梦的防御提升。',
      weather_heavy_rain_effect: '始源之海正在肆虐！火属性技能无效。',
      weather_harsh_sunlight_effect: '终结之地正在肆虐！水属性技能无效。',
      weather_strong_winds_effect: '德尔塔气流正在肆虐！飞行属性的弱点消失。',
      
      terrain_none: '场地：无',
      terrain_electric: '场地：电气场地',
      terrain_grassy: '场地：青草场地',
      terrain_psychic: '场地：精神场地',
      terrain_misty: '场地：薄雾场地',
      terrain_electric_effect: '电属性技能威力提升，地面上的宝可梦无法入眠。',
      terrain_grassy_effect: '草属性技能威力提升，地面上的宝可梦每回合回复HP。',
      terrain_psychic_effect: '超能力属性技能威力提升，地面上的宝可梦免疫先制技能。',
      terrain_misty_effect: '龙属性技能伤害减半，地面上的宝可梦免疫异常状态。',

      dimension_none: '维度：无',
      dimension_trick_room: '维度：戏法空间',
      dimension_magic_room: '维度：魔术空间',
      dimension_wonder_room: '维度：奇妙空间',
      dimension_trick_room_effect: '速度慢的宝可梦先行动。',
      dimension_magic_room_effect: '所有宝可梦的携带道具无效。',
      dimension_wonder_room_effect: '所有宝可梦的防御与特防互换。',
      reroll: '重新选择',
      rerollCost: '消耗 {cost} 金币',
      reachedFloor: '你在第 {stage} 关倒下了',
      gameOver: '挑战结束'
    },
    'zh-hant': {
      stage: '關卡',
      switch: '出戰',
      info: '詳情',
      selectMove: '選擇技能',
      back: '返回',
      victory: '勝利！',
      chooseReward: '選擇一項獎勵以繼續你的冒險',
      viewTeam: '查看我的隊伍',
      teamList: '隊伍列表',
      randomRewards: '隨機獎勵',
      getItem: '獲得道具',
      learnMove: '學習新技能',
      learnMoveDesc: '讓隊伍中的一隻寶可夢學習一個新技能',
      evolutionReward: '寶可夢進化',
      evolutionRewardDesc: '讓隊伍中的一隻寶可夢進化到下一階段',
      specialReward: '特殊獎勵',
      joinTeam: '加入隊伍',
      selectThis: '選擇此項',
      mysteryShop: '神秘商店 (使用金幣購買)',
      insufficientCoins: '金幣不足',
      buyItem: '購買道具',
      teamFull: '隊伍已滿！',
      replacePartner: '選擇一隻寶可夢進行替換，以加入新的夥伴',
      power: '威力',
      accuracy: '命中',
      pp: 'PP',
      nature: '性格',
      ability: '特性',
      none: '無',
      stats: '能力值',
      baseStats: '種族值',
      actualStats: '最終能力',
      currentMoves: '當前技能',
      base: '種族',
      iv: '個體值',
      physical: '物理',
      special: '特攻',
      status: '變化',
      confirm: '確認',
      cancel: '取消',
      battleLog: '戰鬥記錄',
      hp: 'HP',
      attack: '攻擊',
      defense: '防禦',
      spAtk: '特攻',
      spDef: '特防',
      speed: '速度',
      catchSuccess: '捕捉成功！獲得了 {coins} 金幣！',
      battleVictory: '戰鬥勝利！獲得了 {coins} 金幣！',
      selectToLearn: '選擇一隻寶可夢來學習新的力量',
      retrievingMoves: '正在檢索可學習的技能...',
      replaceWhichMove: '替換哪個技能？',
      alreadyKnows4: '{name} 已經學會了4個技能。',
      selectOldToReplace: '請選擇一個舊技能來替換為 {move}。',
      movesCount: '{count}/4 技能',
      learnMoveBtn: '學習技能',
      cancelReplace: '取消替換',
      searchingPokemon: '正在尋找寶可夢...',
      battleHistory: '對戰歷史',
      chooseStarter: '選擇你的初始夥伴',
      chooseStarterDesc: '請選擇2隻寶可夢作為你的初始夥伴。點擊卡片進行選擇，再次點擊取消。',
      selectTwoStarters: '請選擇2隻寶可夢',
      confirmSelection: '確認選擇並開始冒險',
      startingMoves: '初始技能',
      viewDetails: '查看詳情',
      iChooseYou: '就決定是你了！',
      gymLeaderSent: '道館館主 派出了 {name}！',
      wildPokemonAppeared: '野生的 {name} 出現了！',
      youUsed: '你使用了 {name}！',
      cannotCatchGym: '不能捕捉道館館主的寶可夢！',
      catching: '正在捕捉...',
      catchSuccessMsg: '成功捕捉了 {name}！',
      joinedTeam: '{name} 已加入你的隊伍！',
      brokeFree: '{name} 掙脫了！',
      withdrew: '你收回了 {name}！',
      sentOut: '你派出了 {name}！',
      usedMove: '{name} 使用了 {move}！',
      superEffective: '這一擊效果絕佳！',
      notVeryEffective: '這一擊收效甚微...',
      noEffect: '似乎沒有效果...',
      causedDamage: '{name} 造成了 {damage} 點傷害。',
      fainted: '{name} 倒下了！',
      enemyUsedMove: '對手的 {name} 使用了 {move}！',
      enemyCausedDamage: '對手的 {name} 造成了 {damage} 點傷害。',
      noRecords: '尚無記錄',
      rogueJourney: '隨機對戰之旅：在無盡的挑戰中生存',
      startBattle: '開始對戰',
      selectRegion: '選擇你的冒險地區',
      nextStep: '下一步：選擇等級',
      setDifficulty: '設定初始挑戰難度',
      startAdventure: '開啟冒險之旅',
      nextLevel: '下一關',
      thinking: '對手正在思考...',
      commandPhase: '指令階段',
      whatToDo: '該怎麼辦呢？',
      atkUp: '攻擊↑',
      defUp: '防禦↑',
      battle: '戰鬥',
      bag: '背包',
      pokemon: '寶可夢',
      run: '逃跑',
      myBag: '我的背包',
      myTeam: '我的隊伍',
      bagEmpty: '背包空空如也',
      backToMoves: '返回選擇技能',
      evolution: '進化',
      evolveSuccess: '{name} 進化成了 {target}！',
      cannotEvolve: '這隻寶可夢目前無法進化。',
      selectToEvolve: '選擇一隻寶可夢進行進化',
      chooseEvolution: '選擇進化形態',
      evolve: '進化',
      confirmEvolution: '確認進化',
      confirmEvolutionDesc: '是否確定將 {name} 進化為 {target}？',
      evolveSuccessMsg: '恭喜！{name} 進化成为了 {target}！',
      shop: '商店',
      price: '價格',
      learningNewMove: '正在學習新技能...',
      learnThisMove: '學習此技能',
      noMoreMoves: '這隻寶可夢暫時沒有更多可學習的技能了。',
      reselectPokemon: '重新選擇寶可夢',
      challengeEnd: '挑戰結束',
      fellAtStage: '你在第 {stage} 關倒下了',
      restart: '重新開始',
      weather_none: '天氣：無',
      weather_sunny: '天氣：大晴天',
      weather_rainy: '天氣：下雨',
      weather_sandstorm: '天氣：沙暴',
      weather_snow: '天氣：下雪',
      weather_heavy_rain: '天氣：始源之海',
      weather_harsh_sunlight: '天氣：終結之地',
      weather_strong_winds: '天氣：德爾塔氣流',
      weather_sunny_effect: '陽光增強了火屬性技能，削弱了水屬性技能。',
      weather_rainy_effect: '降雨增強了水屬性技能，削弱了火屬性技能。',
      weather_sandstorm_effect: '沙暴正在肆虐！岩石、地面和鋼屬性以外的寶可夢會受到傷害。',
      weather_snow_effect: '大雪正在降下！冰屬性寶可夢的防禦提升。',
      weather_heavy_rain_effect: '始源之海正在肆虐！火屬性技能無效。',
      weather_harsh_sunlight_effect: '終結之地正在肆虐！水屬性技能無效。',
      weather_strong_winds_effect: '德爾塔氣流正在肆虐！飛行屬性的弱點消失。',

      terrain_none: '場地：無',
      terrain_electric: '場地：電氣場地',
      terrain_grassy: '場地：青草場地',
      terrain_psychic: '場地：精神場地',
      terrain_misty: '場地：薄霧場地',
      terrain_electric_effect: '電屬性技能威力提升，地面上的寶可夢無法入眠。',
      terrain_grassy_effect: '草屬性技能威力提升，地面上的寶可夢每回合回復HP。',
      terrain_psychic_effect: '超能力屬性技能威力提升，地面上的寶可夢免疫先制技能。',
      terrain_misty_effect: '龍屬性技能傷害減半，地面上的寶可夢免疫異常狀態。',

      dimension_none: '維度：無',
      dimension_trick_room: '維度：戲法空間',
      dimension_magic_room: '維度：魔術空間',
      dimension_wonder_room: '維度：奇妙空間',
      dimension_trick_room_effect: '速度慢的寶可夢先行動。',
      dimension_magic_room_effect: '所有寶可夢的攜帶道具無效。',
      dimension_wonder_room_effect: '所有寶可夢的防禦與特防互換。',
      reroll: '重新選擇',
      rerollCost: '消耗 {cost} 點金幣',
      reachedFloor: '你在第 {stage} 關倒下了',
      gameOver: '挑戰結束'
    },
    'en': {
      stage: 'Stage',
      switch: 'Switch',
      info: 'Info',
      selectMove: 'Select Move',
      back: 'Back',
      victory: 'Victory!',
      chooseReward: 'Choose a reward to continue your adventure',
      viewTeam: 'View My Team',
      teamList: 'Team List',
      randomRewards: 'Random Rewards',
      getItem: 'Get Item',
      learnMove: 'Learn New Move',
      learnMoveDesc: 'Let a Pokemon in your team learn a new move',
      evolutionReward: 'Pokemon Evolution',
      evolutionRewardDesc: 'Let a Pokemon in your team evolve to the next stage',
      specialReward: 'Special Reward',
      joinTeam: 'Join Team',
      selectThis: 'Select This',
      mysteryShop: 'Mystery Shop (Buy with Coins)',
      insufficientCoins: 'Insufficient Coins',
      buyItem: 'Buy Item',
      teamFull: 'Team Full!',
      replacePartner: 'Select a Pokemon to replace with the new partner',
      power: 'Power',
      accuracy: 'Accuracy',
      pp: 'PP',
      nature: 'Nature',
      ability: 'Ability',
      none: 'None',
      stats: 'Stats',
      baseStats: 'Base Stats',
      actualStats: 'Final Stats',
      currentMoves: 'Current Moves',
      base: 'Base',
      iv: 'IV',
      physical: 'Physical',
      special: 'Special',
      status: 'Status',
      confirm: 'Confirm',
      cancel: 'Cancel',
      battleLog: 'Battle Log',
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      spAtk: 'Sp. Atk',
      spDef: 'Sp. Def',
      speed: 'Speed',
      winBattle: 'Victory! Defeated {name}!',
      terrain_grassy_heal: '{name} restored HP from Grassy Terrain!',
      weatherDamage: '{name} took damage from the weather!',
      dimension_magic_room_block: 'Magic Room is in effect! Items cannot be used!',
      catchSuccess: 'Caught successfully! Earned {coins} coins!',
      battleVictory: 'Victory! Earned {coins} coins!',
      selectToLearn: 'Select a Pokemon to learn new power',
      retrievingMoves: 'Retrieving learnable moves...',
      replaceWhichMove: 'Replace which move?',
      alreadyKnows4: '{name} already knows 4 moves.',
      selectOldToReplace: 'Please select an old move to replace with {move}.',
      movesCount: '{count}/4 Moves',
      learnMoveBtn: 'Learn Move',
      cancelReplace: 'Cancel',
      searchingPokemon: 'Searching for Pokemon...',
      battleHistory: 'Battle History',
      chooseStarter: 'Choose Your Starter',
      chooseStarterDesc: 'Please select 2 Pokemon as your initial partners. Click a card to select, click again to deselect.',
      selectTwoStarters: 'Please select 2 Pokemon',
      confirmSelection: 'Confirm & Start Adventure',
      startingMoves: 'Starting Moves',
      viewDetails: 'View Details',
      iChooseYou: 'I choose you!',
      gymLeaderSent: 'Gym Leader sent out {name}!',
      wildPokemonAppeared: 'A wild {name} appeared!',
      youUsed: 'You used {name}!',
      cannotCatchGym: 'Cannot catch Gym Leader\'s Pokemon!',
      catching: 'Catching...',
      catchSuccessMsg: 'Caught {name} successfully!',
      joinedTeam: '{name} joined your team!',
      brokeFree: '{name} broke free!',
      withdrew: 'You withdrew {name}!',
      sentOut: 'You sent out {name}!',
      usedMove: '{name} used {move}!',
      superEffective: 'It\'s super effective!',
      notVeryEffective: 'It\'s not very effective...',
      noEffect: 'It had no effect...',
      causedDamage: '{name} caused {damage} damage.',
      fainted: '{name} fainted!',
      enemyUsedMove: 'Enemy {name} used {move}!',
      enemyCausedDamage: 'Enemy {name} caused {damage} damage.',
      noRecords: 'No records',
      rogueJourney: 'Roguelike Journey: Survive in endless challenges',
      startBattle: 'Start Battle',
      selectRegion: 'Select Your Region',
      nextStep: 'Next: Select Level',
      setDifficulty: 'Set Initial Difficulty',
      startAdventure: 'Start Adventure',
      nextLevel: 'Next Level',
      thinking: 'Enemy is thinking...',
      commandPhase: 'Command Phase',
      whatToDo: 'What will you do?',
      atkUp: 'Atk↑',
      defUp: 'Def↑',
      battle: 'Battle',
      bag: 'Bag',
      pokemon: 'Pokemon',
      run: 'Run',
      myBag: 'My Bag',
      myTeam: 'My Team',
      bagEmpty: 'Bag is empty',
      backToMoves: 'Back to Moves',
      evolution: 'Evolution',
      evolveSuccess: '{name} evolved into {target}!',
      cannotEvolve: 'This Pokemon cannot evolve at this time.',
      selectToEvolve: 'Select a Pokemon to evolve',
      chooseEvolution: 'Choose Evolution Form',
      evolve: 'Evolve',
      confirmEvolution: 'Confirm Evolution',
      confirmEvolutionDesc: 'Are you sure you want to evolve {name} into {target}?',
      evolveSuccessMsg: 'Congratulations! {name} evolved into {target}!',
      shop: 'Shop',
      price: 'Price',
      learningNewMove: 'Learning new move...',
      learnThisMove: 'Learn this move',
      noMoreMoves: 'This Pokemon has no more learnable moves for now.',
      reselectPokemon: 'Reselect Pokemon',
      challengeEnd: 'Challenge Ended',
      fellAtStage: 'You fell at Stage {stage}',
      restart: 'Restart',
      weather_none: 'Weather: None',
      weather_sunny: 'Weather: Sunny',
      weather_rainy: 'Weather: Rainy',
      weather_sandstorm: 'Weather: Sandstorm',
      weather_snow: 'Weather: Snow',
      weather_heavy_rain: 'Weather: Primordial Sea',
      weather_harsh_sunlight: 'Weather: Desolate Land',
      weather_strong_winds: 'Weather: Delta Stream',
      weather_sunny_effect: 'The sunlight is strong! Fire moves are boosted, Water moves are weakened.',
      weather_rainy_effect: 'It is raining! Water moves are boosted, Fire moves are weakened.',
      weather_sandstorm_effect: 'A sandstorm is raging! Non-Rock/Ground/Steel Pokemon take damage.',
      weather_snow_effect: 'Snow is falling! Ice Pokemon defense is boosted.',
      weather_heavy_rain_effect: 'The Primordial Sea is raging! Fire moves are neutralized.',
      weather_harsh_sunlight_effect: 'The Desolate Land is raging! Water moves are neutralized.',
      weather_strong_winds_effect: 'The Delta Stream is raging! Flying types weaknesses are removed.',

      terrain_none: 'Terrain: None',
      terrain_electric: 'Terrain: Electric',
      terrain_grassy: 'Terrain: Grassy',
      terrain_psychic: 'Terrain: Psychic',
      terrain_misty: 'Terrain: Misty',
      terrain_electric_effect: 'Electric moves are boosted. Pokemon on the ground cannot sleep.',
      terrain_grassy_effect: 'Grassy moves are boosted. Pokemon on the ground restore HP each turn.',
      terrain_psychic_effect: 'Psychic moves are boosted. Pokemon on the ground are immune to priority moves.',
      terrain_misty_effect: 'Dragon moves are halved. Pokemon on the ground are immune to status ailments.',

      dimension_none: 'Dimension: None',
      dimension_trick_room: 'Dimension: Trick Room',
      dimension_magic_room: 'Dimension: Magic Room',
      dimension_wonder_room: 'Dimension: Wonder Room',
      dimension_trick_room_effect: 'Slower Pokemon move first.',
      dimension_magic_room_effect: 'Held items have no effect.',
      dimension_wonder_room_effect: 'Defense and Sp. Def are swapped.',
      reroll: 'Reroll',
      rerollCost: 'Cost {cost} Coins',
      reachedFloor: 'You reached floor {stage}',
      gameOver: 'GAME OVER'
    }
  };

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const lang = currentLanguage.startsWith('zh') ? currentLanguage : (uiStrings[currentLanguage] ? currentLanguage : 'en');
    let str = uiStrings[lang]?.[key] || uiStrings['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.split(`{${k}}`).join(String(v));
      });
    }
    return str;
  }, [currentLanguage]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // 本地化辅助函数
  const getLocalized = useCallback((obj: any, key: string = 'name') => {
    if (!obj) return '';
    
    // 如果是道具，直接返回 zhName (目前道具是硬编码的)
    if (obj.id && (obj.id === 'potion' || obj.id === 'pokeball' || obj.isBall || obj.isBattleItem)) {
      return currentLanguage.startsWith('zh') ? obj.zhName : obj.name;
    }

    // 查找 names 数组
    if (obj.names && Array.isArray(obj.names)) {
      const entry = obj.names.find((n: any) => n.language.name === currentLanguage);
      if (entry) return entry.name;
      
      // 备选方案：如果是中文，尝试找另一种中文
      if (currentLanguage === 'zh-hans') {
        const alt = obj.names.find((n: any) => n.language.name === 'zh-hant');
        if (alt) return alt.name;
      } else if (currentLanguage === 'zh-hant') {
        const alt = obj.names.find((n: any) => n.language.name === 'zh-hans');
        if (alt) return alt.name;
      }
      
      // 默认返回英文
      const en = obj.names.find((n: any) => n.language.name === 'en');
      if (en) return en.name;
    }

    // 默认回退
    return obj.zhName || obj.name || '';
  }, [currentLanguage]);

  const getLocalizedDesc = useCallback((obj: any) => {
    if (!obj) return '';
    
    // 道具回退
    if (obj.id && (obj.id === 'potion' || obj.id === 'pokeball' || obj.isBall || obj.isBattleItem)) {
      return currentLanguage.startsWith('zh') ? obj.zhDescription : obj.description;
    }

    if (obj.flavor_text_entries && Array.isArray(obj.flavor_text_entries)) {
      const entry = obj.flavor_text_entries.find((e: any) => e.language.name === currentLanguage);
      if (entry) return entry.flavor_text.replace(/\f/g, ' ');

      // 备选方案
      if (currentLanguage === 'zh-hans') {
        const alt = obj.flavor_text_entries.find((e: any) => e.language.name === 'zh-hant');
        if (alt) return alt.flavor_text.replace(/\f/g, ' ');
      } else if (currentLanguage === 'zh-hant') {
        const alt = obj.flavor_text_entries.find((e: any) => e.language.name === 'zh-hans');
        if (alt) return alt.flavor_text.replace(/\f/g, ' ');
      }

      const en = obj.flavor_text_entries.find((e: any) => e.language.name === 'en');
      if (en) return en.flavor_text.replace(/\f/g, ' ');
    }

    return obj.zhDescription || obj.description || '';
  }, [currentLanguage]);

  const getLocalizedNature = useCallback((nature: Nature) => {
    if (currentLanguage.startsWith('zh')) return nature.zhName;
    return nature.name;
  }, [currentLanguage]);

  const getStatName = useCallback((stat: string) => {
    return t(stat) || stat;
  }, [t]);

  // 动画状态
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
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
    try {
      // 生成4个随机宝可梦供选择
      const starterIds = [];
      for (let i = 0; i < 4; i++) {
        starterIds.push(await getRandomPokemonId(selectedGens));
      }
      const starters = await Promise.all(starterIds.map(id => getProcessedPokemon(id, startLevel)));
      setStarterOptions(starters);
      setSelectedStarterIndices([]);
      
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

  const toggleStarterSelection = (index: number) => {
    setSelectedStarterIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length < 2) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const confirmStarters = async () => {
    if (selectedStarterIndices.length !== 2) return;
    
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
    if ((gameState !== 'BATTLE' && gameState !== 'POKEMON_INFO') || index === 0 || isMessageProcessing) return;
    if (gameState === 'POKEMON_INFO') setGameState('BATTLE');
    if (!isFaintedReplacement && turn !== 'PLAYER') return;
    
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
    const ability = pokemon.abilities[0]?.ability.name;
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
    const currentAttacker = { 
      ...attacker, 
      statStages: { ...attacker.statStages },
      volatileStatus: attacker.volatileStatus ? [...attacker.volatileStatus] : undefined,
      selectedMoves: attacker.selectedMoves.map(m => ({ ...m }))
    };
    const currentDefender = { 
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

    const { damage, multiplier, isMiss, isCrit } = calculateDamage(
      move, 
      currentAttacker, 
      currentDefender, 
      isPlayerAttacker ? activeBuffs.atk : enemyBuffs.atk, 
      isPlayerAttacker ? enemyBuffs.def : activeBuffs.def
    );

    if (isMiss) {
      await addMessagesSequentially([`${attackerName} 的攻击落空了！`]);
      if (isPlayerAttacker) setPlayerAnim('idle');
      else setEnemyAnim('idle');
      setActiveMoveType(null);
      return { success: false, attacker: currentAttacker, defender: currentDefender };
    }

    if (isCrit) await addMessagesSequentially(['击中了要害！']);

    if (damage < 0) {
      await addMessagesSequentially([`${defenderName} 吸收了攻击并恢复了体力！`]);
    }

    let newDefenderHp = Math.max(0, Math.min(currentDefender.maxHp, currentDefender.currentHp - damage));

    // Focus Sash
    if (dimension !== 'magic_room' && newDefenderHp === 0 && currentDefender.currentHp === currentDefender.maxHp && currentDefender.heldItem?.id === 'focus_sash') {
      newDefenderHp = 1;
      await addMessagesSequentially([`${defenderName} 凭借气势披带撑住了！`]);
      currentDefender.heldItem = undefined; // Consume
    }

    if (damage > 0) {
      if (isPlayerAttacker) setEnemyAnim('hit');
      else setPlayerAnim('hit');
    }

    // Update defender HP
    currentDefender.currentHp = newDefenderHp;
    updateStates(currentAttacker, currentDefender);

    await checkBerries(currentDefender, !isPlayerAttacker);

    // Handle Drain/Healing
    let attackerHpChange = 0;
    if (move.id === 'struggle') {
      attackerHpChange -= Math.floor(currentAttacker.maxHp / 4);
    } else if (move.drain !== 0 && damage > 0) {
      attackerHpChange += Math.floor(damage * move.drain / 100);
    }
    if (move.healing !== 0) attackerHpChange += Math.floor(currentAttacker.maxHp * move.healing / 100);

    if (attackerHpChange !== 0) {
      currentAttacker.currentHp = Math.max(0, Math.min(currentAttacker.maxHp, currentAttacker.currentHp + attackerHpChange));
      updateStates(currentAttacker, currentDefender);
      await addMessagesSequentially([attackerHpChange > 0 ? `${attackerName} 恢复了体力！` : `${attackerName} 受到了反作用力伤害！`]);
    }

    // Effect messages
    const effectMessages = [];
    if (damage > 0) {
      if (multiplier > 1) effectMessages.push(t('superEffective'));
      if (multiplier < 1 && multiplier > 0) effectMessages.push(t('notVeryEffective'));
      if (multiplier === 0) effectMessages.push(t('noEffect'));
      await addMessagesSequentially(effectMessages);
      await addMessagesSequentially([t('causedDamage').replace('{name}', attackerName).replace('{damage}', damage.toString())]);
    }

    // Set environment
    await setEnvironmentFromMove(move);

    // Handle Protect move
    if (move.id === 'protect') {
      currentAttacker.volatileStatus = [...(currentAttacker.volatileStatus || []), 'protect'];
      updateStates(currentAttacker, currentDefender);
      await addMessagesSequentially([`${attackerName} 进入了守住状态！`]);
    }

    // Handle Ailments and Stat Changes
    if (currentDefender.currentHp > 0) {
      const isTargetUser = move.target === 'user';
      const target = isTargetUser ? currentAttacker : currentDefender;
      const isPlayerTarget = (isPlayerAttacker && isTargetUser) || (!isPlayerAttacker && !isTargetUser);

      if (move.ailment && !target.status && Math.random() * 100 < (move.ailmentChance || 100)) {
        const targetTypes = target.types.map(t => t.type.name);
        let immune = false;
        if (move.ailment === 'burn' && targetTypes.includes('fire')) immune = true;
        if (move.ailment === 'paralysis' && targetTypes.includes('electric')) immune = true;
        if (move.ailment === 'freeze' && targetTypes.includes('ice')) immune = true;
        if ((move.ailment === 'poison' || move.ailment === 'toxic') && (targetTypes.includes('poison') || targetTypes.includes('steel'))) immune = true;
        
        if (immune) {
          // No message needed usually, just fails
        } else if (terrain === 'misty' && isGrounded(target)) {
          await addMessagesSequentially([t('terrain_misty_block').replace('{name}', getLocalized(target))]);
        } else if (move.ailment === 'sleep' && terrain === 'electric' && isGrounded(target)) {
          await addMessagesSequentially([t('terrain_electric_block').replace('{name}', getLocalized(target))]);
        } else {
          target.status = move.ailment;
          updateStates(currentAttacker, currentDefender);
          await addMessagesSequentially([`${getLocalized(target)} ${AILMENT_ZH[move.ailment] || move.ailment}了！`]);
        }
      }

      if (move.statChanges) {
        const newStatStages = { ...target.statStages };
        let changed = false;
        const isContrary = target.abilities.some(a => a.ability.name === 'contrary');
        for (const sc of move.statChanges) {
          const statKey = sc.stat as keyof StatStages;
          const oldStage = newStatStages[statKey];
          const change = isContrary ? -sc.change : sc.change;
          const newStage = Math.max(-6, Math.min(6, oldStage + change));
          if (newStage !== oldStage) {
            newStatStages[statKey] = newStage;
            changed = true;
            await addMessagesSequentially([`${getLocalized(target)} 的 ${STAT_ZH[sc.stat] || sc.stat} ${change > 0 ? '提升' : '下降'}了！`]);
          }
        }
        if (changed) {
          target.statStages = newStatStages;
          updateStates(currentAttacker, currentDefender);
        }
      }

      if (Math.random() * 100 < (move.flinchChance || 0)) {
        await addMessagesSequentially([`${defenderName} 畏缩了，无法动弹！`]);
        return { success: 'FLINCH', attacker: currentAttacker, defender: currentDefender };
      }
    }

    // Contact abilities
    if (damage > 0 && move.damage_class === 'physical' && currentDefender.currentHp > 0 && !currentAttacker.status) {
      const defAbility = currentDefender.abilities[0]?.ability.name;
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
      await addMessagesSequentially([t('fainted').replace('{name}', defenderName)]);
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
      winBattle();
    } else if (currentPlayer.currentHp <= 0) {
      const isAllFainted = currentTeam.slice(1).every(p => p.currentHp <= 0);
      if (isAllFainted) {
        setGameState('GAMEOVER');
      } else {
        setIsFaintedReplacement(true);
        setBattleMenuTab('POKEMON');
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
      
      const ability = p.abilities[0]?.ability.name;
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
        if (currentPlayer.abilities.some(a => a.ability.name === 'moxie')) {
          currentPlayer.statStages.attack = Math.min(6, currentPlayer.statStages.attack + 1);
          setPlayerTeam(prev => [{ ...prev[0], statStages: currentPlayer.statStages }, ...prev.slice(1)]);
          await addMessagesSequentially([`${getLocalized(currentPlayer)} 的自信过度提升了攻击！`]);
        }
      }
      if (res1.success !== 'FAINTED' && res1.success !== 'FLINCH' && currentEnemy.currentHp > 0) {
        const res2 = await executeTurn(false, enemyMove, currentEnemy, currentPlayer);
        currentEnemy = res2.attacker;
        currentPlayer = res2.defender;
        if (res2.success === 'FAINTED') {
          if (currentEnemy.abilities.some(a => a.ability.name === 'moxie')) {
            currentEnemy.statStages.attack = Math.min(6, currentEnemy.statStages.attack + 1);
            setEnemy({ ...currentEnemy });
            await addMessagesSequentially([`${getLocalized(currentEnemy)} 的自信过度提升了攻击！`]);
          }
        }
      }
    } else {
      const res1 = await executeTurn(false, enemyMove, currentEnemy, currentPlayer);
      currentEnemy = res1.attacker;
      currentPlayer = res1.defender;
      if (res1.success === 'FAINTED') {
        if (currentEnemy.abilities.some(a => a.ability.name === 'moxie')) {
          currentEnemy.statStages.attack = Math.min(6, currentEnemy.statStages.attack + 1);
          setEnemy({ ...currentEnemy });
          await addMessagesSequentially([`${getLocalized(currentEnemy)} 的自信过度提升了攻击！`]);
        }
      }
      if (res1.success !== 'FAINTED' && res1.success !== 'FLINCH' && currentPlayer.currentHp > 0) {
        const res2 = await executeTurn(true, actualPlayerMove, currentPlayer, currentEnemy);
        currentPlayer = res2.attacker;
        currentEnemy = res2.defender;
        if (res2.success === 'FAINTED') {
          if (currentPlayer.abilities.some(a => a.ability.name === 'moxie')) {
            currentPlayer.statStages.attack = Math.min(6, currentPlayer.statStages.attack + 1);
            setPlayerTeam(prev => [{ ...prev[0], statStages: currentPlayer.statStages }, ...prev.slice(1)]);
            await addMessagesSequentially([`${getLocalized(currentPlayer)} 的自信过度提升了攻击！`]);
          }
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
      winBattle();
    } else if (currentPlayer.currentHp <= 0) {
      if (playerTeam.every(p => p.currentHp <= 0)) {
        setGameState('GAMEOVER');
      } else {
        setIsFaintedReplacement(true);
        setBattleMenuTab('POKEMON');
      }
    } else {
      await decrementEnvironments();
      setBattleTurnCount(prev => prev + 1);
      setTurn('PLAYER');
      setBattleMenuTab('MAIN');
    }
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

  const getTypeEffectiveness = (moveType: string, defenderTypes: { type: { name: string } }[]) => {
    let multiplier = 1;
    defenderTypes.forEach(t => {
      const effect = TYPE_CHART[moveType]?.[t.type.name];
      if (effect !== undefined) {
        multiplier *= effect;
      }
    });
    return multiplier;
  };

  const calculateDamage = (move: Move, attacker: GamePokemon, defender: GamePokemon, atkBuff: boolean, defBuff: boolean) => {
    if (move.damage_class === 'status') {
      return { damage: 0, multiplier: 1, isMiss: false, isCrit: false };
    }

    // Fixed damage moves
    if (move.id === 'night-shade' || move.id === 'seismic-toss') {
      return { damage: attacker.level, multiplier: 1, isMiss: false, isCrit: false };
    }
    if (move.id === 'dragon-rage') {
      return { damage: 40, multiplier: 1, isMiss: false, isCrit: false };
    }
    if (move.id === 'sonic-boom') {
      return { damage: 20, multiplier: 1, isMiss: false, isCrit: false };
    }

    const basePower = move.power || 40;
    
    // 1. Calculate Level Factor
    const levelFactor = Math.floor(2 * attacker.level / 5) + 2;
    
    // 2. Determine Attack and Defense stats
    let atk = 1;
    let def = 1;
    
    const ignoreDefenderStages = attacker.abilities.some(a => a.ability.name === 'unaware');
    const ignoreAttackerStages = defender.abilities.some(a => a.ability.name === 'unaware');

    // Critical Hit check
    let critChance = 1/24;
    if (move.critRate === 1) critChance = 1/8;
    if (move.critRate === 2) critChance = 1/2;
    if (move.critRate >= 3) critChance = 1;
    const isCrit = Math.random() < critChance;

    if (move.damage_class === 'special') {
      let atkStage = attacker.statStages.spAtk;
      if (isCrit && atkStage < 0) atkStage = 0;
      atk = attacker.calculatedStats.spAtk * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[atkStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
      
      let defStage = defender.statStages.spDef;
      if (isCrit && defStage > 0) defStage = 0;
      def = defender.calculatedStats.spDef * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[defStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
      
      // Sandstorm: Rock types get 1.5x SpDef
      if (weather === 'sandstorm' && defender.types.some(t => t.type.name === 'rock')) {
        def = Math.floor(def * 1.5);
      }
    } else {
      let atkStage = attacker.statStages.attack;
      if (isCrit && atkStage < 0) atkStage = 0;
      atk = attacker.calculatedStats.attack * (ignoreAttackerStages ? 1 : (STAT_STAGE_MODIFIERS[atkStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
      
      let defStage = defender.statStages.defense;
      if (isCrit && defStage > 0) defStage = 0;
      def = defender.calculatedStats.defense * (ignoreDefenderStages ? 1 : (STAT_STAGE_MODIFIERS[defStage as keyof typeof STAT_STAGE_MODIFIERS] || 1));
      
      // Snow: Ice types get 1.5x Defense
      if (weather === 'snow' && defender.types.some(t => t.type.name === 'ice')) {
        def = Math.floor(def * 1.5);
      }
    }

    // Apply custom game buffs (e.g. from items or stage effects)
    if (atkBuff) atk = Math.floor(atk * 1.5);
    if (defBuff) def = Math.floor(def * 1.5);

    // 3. Base Damage calculation
    let damage = Math.floor(Math.floor(Math.floor(levelFactor * basePower * atk / def) / 50) + 2);

    // 4. Modifiers
    // Weather
    if (weather === 'sunny' || weather === 'harsh_sunlight') {
      if (move.type === 'fire') damage = Math.floor(damage * 1.5);
      if (move.type === 'water') {
        if (weather === 'harsh_sunlight') damage = 0;
        else damage = Math.floor(damage * 0.5);
      }
    } else if (weather === 'rainy' || weather === 'heavy_rain') {
      if (move.type === 'water') damage = Math.floor(damage * 1.5);
      if (move.type === 'fire') {
        if (weather === 'heavy_rain') damage = 0;
        else damage = Math.floor(damage * 0.5);
      }
    }

    // Critical Hit
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    // Random Factor (0.85 - 1.00)
    const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
    damage = Math.floor(damage * randomFactor);

    // STAB
    if (attacker.types.some(t => t.type.name === move.type)) {
      damage = Math.floor(damage * 1.5);
    }

    // Type Effectiveness
    const typeMultiplier = getTypeEffectiveness(move.type, defender.types);
    damage = Math.floor(damage * typeMultiplier);

    // Burn
    if (attacker.status === 'burn' && move.damage_class === 'physical') {
      damage = Math.floor(damage * 0.5);
    }

    return { damage: Math.max(1, damage), multiplier: typeMultiplier, isMiss: false, isCrit };
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
        let pokeId;
        let attempts = 0;
        do {
          pokeId = await getRandomPokemonId(selectedGens);
          attempts++;
        } while (usedPokemonIds.has(pokeId) && attempts < 10);
        usedPokemonIds.add(pokeId);
        const newPoke = await getProcessedPokemon(pokeId, startLevel);
        newRewards.push({ type, data: newPoke });
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


  const selectReward = (reward: any) => {
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
      if (playerTeam.length < 6) {
        setRewardChoiceMade(true);
        setPlayerTeam(prev => [...prev, reward.data]);
      } else {
        setShowReplaceUI(reward.data);
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
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col py-4 overflow-hidden h-full"
            >
              <div className="text-center mb-4 flex-none px-4">
                <div className="inline-block bg-slate-900 px-6 md:px-12 py-2 md:py-3 skew-x-[-12deg] shadow-xl mb-2 md:mb-4">
                  <h2 className="text-xl md:text-3xl font-black italic tracking-tighter skew-x-[12deg] text-white uppercase">{t('chooseStarter')}</h2>
                </div>
                <div className="flex justify-center gap-2 mb-2">
                  {[0, 1].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full border-2 ${selectedStarterIndices.length > i ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-300'}`} />
                  ))}
                  <span className="text-xs font-black italic text-slate-400 ml-2 uppercase">
                    {selectedStarterIndices.length}/2 {t('selectTwoStarters')}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24">
                <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto w-full">
                  {starterOptions.map((p, idx) => {
                    const isSelected = selectedStarterIndices.includes(idx);
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleStarterSelection(idx)}
                        className={`bg-white p-3 md:p-6 shadow-lg transition-all border-4 cursor-pointer flex flex-col items-center relative ${isSelected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-1 rounded-full shadow-lg z-20">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-slate-100 px-1.5 py-0.5 text-[8px] md:text-[10px] font-black italic">
                          Lv.{p.level}
                        </div>
                        <div className="relative mb-1 md:mb-2">
                          <div className={`absolute inset-0 bg-blue-50 rounded-full scale-110 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                          <img 
                            src={p.sprites.front_default} 
                            alt={getLocalized(p)} 
                            className="w-16 h-16 md:w-24 md:h-24 object-contain relative z-10 drop-shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <h3 className="text-sm md:text-lg font-black italic uppercase tracking-tighter truncate max-w-[120px] md:max-w-[180px] text-center">{getLocalized(p)}</h3>
                            {p.gender === 'male' && <Mars className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />}
                            {p.gender === 'female' && <Venus className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />}
                          </div>
                          <div className="flex flex-wrap justify-center gap-1">
                            {p.types.map((t: any) => (
                              <TypeBadge key={t.type.name} type={t.type.name} size="xs" className="skew-x-[-10deg]" />
                            ))}
                            <div className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-black italic text-slate-500 uppercase">
                              {getLocalizedNature(p.nature)}
                            </div>
                          </div>
                        </div>

                        <div className="w-full space-y-1 mb-3">
                          <div className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{t('startingMoves')}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {p.selectedMoves.slice(0, 4).map((m, mi) => (
                              <div key={mi} className="flex justify-between items-center bg-slate-50 p-1 text-[7px] md:text-[8px] font-bold italic border-l-2 border-slate-200">
                                <span className="truncate pr-1">{getLocalized(m)}</span>
                                <TypeBadge type={m.type} size="xs" />
                              </div>
                            ))}
                            {/* Fill empty slots if less than 4 moves */}
                            {Array.from({ length: Math.max(0, 4 - p.selectedMoves.length) }).map((_, i) => (
                              <div key={`empty-${i}`} className="bg-slate-50/50 p-1 text-[8px] font-bold italic border-l-2 border-slate-100 text-slate-300">
                                --
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoPokemonIdx(idx);
                            setPrevGameState('STARTER_SELECT');
                            setGameState('POKEMON_INFO');
                          }}
                          className="mt-auto w-full py-1 bg-slate-100 text-slate-500 font-black italic hover:bg-slate-200 transition-all text-[8px] md:text-[10px] uppercase"
                        >
                          {t('viewDetails')}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {selectedStarterIndices.length === 2 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center z-50">
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={confirmStarters}
                    className="px-12 py-4 bg-blue-600 text-white font-black italic text-lg md:text-xl skew-x-[-12deg] shadow-[8px_8px_0px_#1e3a8a] hover:bg-blue-700 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    <span className="flex items-center gap-3 skew-x-[12deg]">
                      {t('confirmSelection')} <ChevronRight className="w-6 h-6" />
                    </span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
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
              className="flex-1 flex flex-col gap-4 min-h-0"
            >
              {/* 战斗场景 */}
              <div className="relative flex-[6] bg-white rounded-none skew-x-[-1deg] shadow-2xl overflow-hidden border-y-8 border-slate-900 min-h-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#e0e0e0,#ffffff)]"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-slate-100 skew-y-[-2deg] origin-left"></div>
                
                {/* 环境层 */}
                <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                  {weather !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-blue-500">
                      <CloudRain className="w-3 h-3" /> {t(`weather_${weather}`)} ({weatherTurns})
                    </div>
                  )}
                  {terrain !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-emerald-500">
                      <Zap className="w-3 h-3" /> {t(`terrain_${terrain}`)} ({terrainTurns})
                    </div>
                  )}
                  {dimension !== 'none' && (
                    <div className="bg-slate-900/80 text-white px-3 py-1 text-[10px] font-black italic uppercase flex items-center gap-2 border-l-4 border-purple-500">
                      <Dna className="w-3 h-3" /> {t(`dimension_${dimension}`)} ({dimensionTurns})
                    </div>
                  )}
                </div>

                {/* 敌人 */}
                <div className="absolute top-4 sm:top-8 right-4 sm:right-12 flex flex-col items-end">
                  <div className="bg-white p-2 sm:p-3 shadow-lg border-r-8 border-red-500 w-48 sm:w-72 skew-x-[-10deg] mb-2 sm:mb-4">
                    <div className="skew-x-[10deg] flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex justify-between items-center flex-wrap gap-y-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-black text-sm sm:text-xl italic uppercase truncate max-w-[80px] sm:max-w-none">{getLocalized(enemy)}</span>
                          {enemy.status && (
                            <span className="bg-slate-900 text-white text-[6px] sm:text-[8px] px-1 py-0.5 font-black uppercase tracking-tighter">
                              {AILMENT_ZH[enemy.status] || enemy.status}
                            </span>
                          )}
                          <div className="flex gap-1">
                            {enemy.types.map(t => (
                              <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                            ))}
                          </div>
                        </div>
                        <span className="text-[8px] sm:text-xs font-bold bg-slate-900 text-white px-1.5 sm:px-2 py-0.5">Lv.{enemy.level}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-slate-200 rounded-none relative overflow-hidden border border-slate-300">
                        <motion.div 
                          animate={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                          className={`h-full transition-colors ${enemy.currentHp / enemy.maxHp < 0.2 ? 'bg-red-500' : enemy.currentHp / enemy.maxHp < 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                      <div className="text-right text-[8px] sm:text-[10px] font-black italic text-slate-300">
                        ??? / ???
                      </div>
                    </div>
                  </div>
                  <motion.img 
                    animate={isCatching ? { scale: 0, opacity: 0 } : enemyAnim === 'attack' ? { x: -40, scale: 1, opacity: 1 } : enemyAnim === 'hit' ? { x: [0, 10, -10, 10, 0], opacity: [1, 0.5, 1], scale: 1 } : { y: [0, -5, 0], scale: 1, opacity: 1 }}
                    transition={isCatching ? { duration: 0.5 } : enemyAnim === 'idle' ? { y: { repeat: Infinity, duration: 2 }, scale: { duration: 0.3 }, opacity: { duration: 0.3 } } : { duration: 0.3 }}
                    src={enemy.sprites.front_default} 
                    className="w-32 h-32 sm:w-48 sm:h-48 object-contain drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* 玩家 */}
                <div className="absolute bottom-2 sm:bottom-4 left-4 sm:left-12 flex flex-col items-start">
                  <motion.img 
                    animate={playerAnim === 'attack' ? { x: 40 } : playerAnim === 'hit' ? { x: [0, -10, 10, -10, 0], opacity: [1, 0.5, 1] } : { y: [0, 5, 0] }}
                    transition={playerAnim === 'idle' ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
                    src={playerTeam[0].sprites.back_default || playerTeam[0].sprites.front_default} 
                    className="w-40 h-40 sm:w-64 sm:h-64 object-contain drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="bg-white p-2 sm:p-3 shadow-lg border-l-8 border-blue-500 w-48 sm:w-72 skew-x-[-10deg] mt-[-20px] sm:mt-[-40px] relative z-20">
                    <div className="skew-x-[10deg] flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex justify-between items-center flex-wrap gap-y-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-black text-sm sm:text-xl italic uppercase truncate max-w-[80px] sm:max-w-none">{getLocalized(playerTeam[0])}</span>
                          {playerTeam[0].status && (
                            <span className="bg-slate-900 text-white text-[6px] sm:text-[8px] px-1 py-0.5 font-black uppercase tracking-tighter">
                              {AILMENT_ZH[playerTeam[0].status] || playerTeam[0].status}
                            </span>
                          )}
                          <div className="flex gap-1">
                            {playerTeam[0].types.map(t => (
                              <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                            ))}
                          </div>
                        </div>
                        <span className="text-[8px] sm:text-xs font-bold bg-slate-900 text-white px-1.5 sm:px-2 py-0.5">Lv.{playerTeam[0].level}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-slate-200 rounded-none relative overflow-hidden border border-slate-300">
                        <motion.div 
                          animate={{ width: `${(playerTeam[0].currentHp / playerTeam[0].maxHp) * 100}%` }}
                          className={`h-full transition-colors ${playerTeam[0].currentHp / playerTeam[0].maxHp < 0.2 ? 'bg-red-500' : playerTeam[0].currentHp / playerTeam[0].maxHp < 0.5 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        />
                      </div>
                      <div className="text-right text-[8px] sm:text-[10px] font-black italic">
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
                        {/* 成功捕获的高光 */}
                        {catchSuccess === true && (
                          <motion.div 
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-yellow-400/20 rounded-full"
                          />
                        )}
                      </motion.div>
                      
                      {/* 成功捕获的星星特效 */}
                      {catchSuccess === true && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1, 0], 
                                x: Math.cos(i * Math.PI / 4) * 60, 
                                y: Math.sin(i * Math.PI / 4) * 60,
                                rotate: 360
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                              className="absolute"
                            >
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
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
                                x: (Math.random() - 0.5) * 200, 
                                y: (Math.random() - 0.5) * 200 
                              }}
                              transition={{ 
                                duration: 0.8, 
                                ease: "easeOut", 
                                delay: i * 0.01 
                              }}
                              className="absolute w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-blue-200/40 border border-white/50 shadow-sm backdrop-blur-[2px]"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 统一操作与消息区域 */}
              <div className="relative flex-[4] bg-white shadow-2xl border-4 sm:border-8 border-slate-900 overflow-hidden">
                <AnimatePresence mode="wait">
                  {(isMessageProcessing || turn === 'ENEMY') ? (
                    <motion.div 
                      key="battle-log-box"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-900 text-white p-4 sm:p-6 flex items-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-full h-1 sm:h-2 bg-red-500"></div>
                      <AnimatePresence mode="wait">
                        {battleLog.length > 0 && (
                          <motion.div
                            key={battleLog.length}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full"
                          >
                            <p className="text-lg sm:text-2xl font-black italic tracking-tight leading-tight">
                              {turn === 'ENEMY' && !isMessageProcessing ? '对手正在思考...' : battleLog[battleLog.length - 1]}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute bottom-2 sm:bottom-4 right-4 sm:right-8"
                      >
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="interaction-panel"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white grid grid-cols-1 md:grid-cols-4 gap-0 overflow-y-auto custom-scrollbar"
                    >
                      {/* 消息提示区 (左侧) */}
                      <div className="md:col-span-2 p-4 sm:p-6 border-b-4 md:border-b-0 md:border-r-4 border-slate-900 flex flex-col justify-center bg-slate-50">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">指令阶段</div>
                        <div className="text-xl sm:text-3xl font-black italic tracking-tighter text-slate-900">
                          该怎么办呢？
                        </div>
                        <div className="mt-2 sm:mt-4 flex flex-wrap gap-2">
                          {activeBuffs.atk && <span className="bg-red-500 text-white text-[6px] sm:text-[8px] px-2 py-0.5 font-black skew-x-[-10deg]"><span className="skew-x-[10deg] inline-block">攻击↑</span></span>}
                          {activeBuffs.def && <span className="bg-blue-500 text-white text-[6px] sm:text-[8px] px-2 py-0.5 font-black skew-x-[-10deg]"><span className="skew-x-[10deg] inline-block">防御↑</span></span>}
                        </div>
                      </div>

                      {/* 操作按钮区 (右侧) */}
                      <div className="md:col-span-2 p-2 sm:p-3 bg-white relative">
                        <AnimatePresence mode="wait">
                          {turn === 'PLAYER' && battleMenuTab === 'MAIN' && (
                            <motion.div 
                              key="main-menu"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className="grid grid-cols-2 gap-2 sm:gap-3 h-full"
                            >
                              <button 
                                onClick={() => setBattleMenuTab('MOVES')}
                                className="group relative bg-red-500 text-white p-2 sm:p-3 font-black italic text-base sm:text-xl skew-x-[-10deg] hover:bg-red-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Sword className="w-4 h-4 sm:w-5 sm:h-5" /> 战斗</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setPrevGameState('BATTLE');
                                  setGameState('BAG');
                                }}
                                className="group relative bg-yellow-500 text-white p-2 sm:p-3 font-black italic text-base sm:text-xl skew-x-[-10deg] hover:bg-yellow-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Package className="w-4 h-4 sm:w-5 sm:h-5" /> {t('bag')}</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setPrevGameState('BATTLE');
                                  setGameState('POKEMON_INFO');
                                  setInfoPokemonIdx(null);
                                }}
                                className="group relative bg-emerald-500 text-white p-2 sm:p-3 font-black italic text-base sm:text-xl skew-x-[-10deg] hover:bg-emerald-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><Dna className="w-4 h-4 sm:w-5 sm:h-5" /> {t('pokemon')}</span>
                              </button>
                              <button 
                                onClick={() => setGameState('GAMEOVER')}
                                className="group relative bg-slate-500 text-white p-2 sm:p-3 font-black italic text-base sm:text-xl skew-x-[-10deg] hover:bg-slate-600 transition-all overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <span className="relative z-10 skew-x-[10deg] flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> 逃跑</span>
                              </button>
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
                                <h3 className="font-black italic flex items-center gap-2 text-sm"><Zap className="w-4 h-4" /> {t('selectMove')}</h3>
                                <button onClick={() => setBattleMenuTab('MAIN')} className="text-[10px] font-black italic text-slate-400 hover:text-slate-900 flex items-center gap-1">
                                  <ArrowLeft className="w-3 h-3" /> {t('back')}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0">
                                {playerTeam[0].selectedMoves.map((move, idx) => (
                                  <button
                                    key={idx}
                                    disabled={move.currentPP === 0}
                                    onClick={() => handleAttack(move)}
                                    className="relative p-2 bg-slate-900 text-white hover:bg-blue-600 transition-all text-left overflow-hidden group flex flex-col justify-center disabled:opacity-50 disabled:hover:bg-slate-900"
                                  >
                                    <div className="absolute top-0 right-0 w-12 h-full opacity-10 skew-x-[-20deg] bg-white translate-x-6 group-hover:translate-x-3 transition-transform"></div>
                                    <div className="relative z-10 w-full">
                                      <div className="font-black text-sm italic tracking-tighter uppercase truncate">{getLocalized(move)}</div>
                                      <div className="flex justify-between items-center mt-0.5">
                                        <TypeBadge type={move.type} size="xs" />
                                        <div className="flex flex-col items-end">
                                          <span className="text-[8px] font-black opacity-60">{t('power')}: {move.power || '--'}</span>
                                          <span className="text-[8px] font-black opacity-60">PP: {move.currentPP}/{move.maxPP}</span>
                                        </div>
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
                              <div className="relative mb-2 group-hover:scale-110 transition-transform">
                                <img 
                                  src={reward.data.sprites.front_default} 
                                  alt={reward.data.name}
                                  className="w-20 h-20 object-contain mx-auto relative z-10 drop-shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
                                <h4 className="text-base font-black italic uppercase leading-tight text-center">{getLocalized(reward.data)}</h4>
                                <div className="flex justify-center gap-1">
                                  {reward.data.types.map((t: any) => (
                                    <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                                  ))}
                                </div>
                              </div>
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
                          {playerTeam.map((p, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-8 shadow-xl hover:shadow-2xl transition-all border-b-4 border-slate-100 hover:border-purple-500 group flex flex-col items-center"
                            >
                              <img src={p.sprites.front_default} className="w-32 h-32 mx-auto mb-4 group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                              <div className="font-black italic text-2xl uppercase">{getLocalized(p)}</div>
                              <button
                                onClick={() => startEvolution(p, idx)}
                                className="w-full mt-6 py-3 bg-purple-500 text-white font-black italic text-base hover:bg-purple-600 transition-colors skew-x-[-10deg]"
                              >
                                <span className="skew-x-[10deg] inline-block">{t('evolve')}</span>
                              </button>
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
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-4">
                          {evolutionChoices.map((choice) => (
                            <motion.button
                              key={choice.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setEvolutionConfirmChoice(choice)}
                              className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border-2 md:border-4 border-purple-100 hover:border-purple-500 transition-all flex items-center md:flex-col gap-6 md:gap-0 group relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-purple-500 skew-x-[45deg] translate-x-8 md:translate-x-12 -translate-y-8 md:-translate-y-12 group-hover:translate-x-6 md:group-hover:translate-x-8 group-hover:-translate-y-6 md:group-hover:-translate-y-8 transition-transform" />
                              <img 
                                src={choice.sprites.front_default} 
                                className="w-24 h-24 md:w-48 md:h-48 group-hover:scale-110 transition-transform z-10" 
                                referrerPolicy="no-referrer" 
                              />
                              <div className="flex-1 md:flex-none text-left md:text-center z-10">
                                <div className="font-black italic text-xl md:text-3xl uppercase text-slate-900">{getLocalized(choice)}</div>
                                <div className="mt-2 md:mt-6 flex gap-1 md:gap-2">
                                  {choice.types.map(t => (
                                    <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
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
                    className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <div className="bg-white max-w-2xl w-full p-8 skew-x-[-2deg] shadow-2xl relative">
                      <div className="skew-x-[2deg]">
                        <h2 className="text-3xl font-black italic mb-2 tracking-tighter">{t('teamFull')}</h2>
                        <p className="text-slate-500 mb-8 font-bold italic">{t('replacePartner')}：<span className="text-blue-600 uppercase">{getLocalized(showReplaceUI)}</span></p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {playerTeam.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => replacePokemon(idx)}
                              className="p-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 transition-all text-left flex items-center gap-4 group"
                            >
                              <img src={p.sprites.front_default} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-black text-lg uppercase group-hover:text-blue-600">{getLocalized(p)}</div>
                                <div className="text-xs font-bold text-slate-400">Lv.{p.level}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={() => setShowReplaceUI(null)}
                          className="mt-8 w-full py-4 bg-slate-200 text-slate-600 font-black italic hover:bg-slate-300 transition-all"
                        >
                          {t('cancelReplace')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === 'BAG' && (
            <motion.div 
              key="bag-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-md p-4 md:p-8 flex flex-col"
            >
              <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-900">
                <div className="p-4 md:p-6 bg-slate-900 text-white flex justify-between items-center">
                  <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" /> {t('bag')}
                  </h2>
                  <button 
                    onClick={() => setGameState(prevGameState || 'BATTLE')}
                    className="p-2 bg-white/10 text-white hover:bg-white/20 transition-all rounded-full"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {inventory.length > 0 ? inventory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => useItem(item, idx)}
                        className="p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl transition-all text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-full bg-yellow-400/10 skew-x-[-20deg] translate-x-6 group-hover:translate-x-3 transition-transform"></div>
                        <div className="relative z-10">
                          <div className="font-black text-lg group-hover:text-blue-600 italic uppercase tracking-tighter">{getLocalized(item)}</div>
                          <div className="text-xs text-slate-500 mt-1 font-bold leading-relaxed">{getLocalizedDesc(item)}</div>
                        </div>
                      </button>
                    )) : (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                        <Package className="w-16 h-16 text-slate-200" />
                        <div className="text-slate-300 font-black italic text-2xl uppercase tracking-widest">背包空空如也</div>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col overflow-hidden relative"
            >
              {(() => {
                const infoSource = prevGameState === 'STARTER_SELECT' ? starterOptions : playerTeam;
                const p = infoPokemonIdx !== null ? infoSource[infoPokemonIdx] : null;
                const ability = p?.abilities?.[0]?.ability;

                return (
                  <div className="absolute inset-0 z-[150] bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden">
                    {/* Background Stripes */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 rotate-12 scale-150 flex flex-col gap-4">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="h-12 bg-slate-900 w-full" />
                        ))}
                      </div>
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 flex-none relative z-10">
                      <div className="bg-blue-600 px-6 py-2 skew-x-[-12deg] shadow-xl">
                        <h2 className="text-xl md:text-2xl font-black italic tracking-tighter skew-x-[12deg] text-white flex items-center gap-2">
                          <Dna className="w-5 h-5" /> {prevGameState === 'STARTER_SELECT' ? t('chooseStarter') : t('myTeam')}
                        </h2>
                      </div>
                      {!isFaintedReplacement && (
                        <button 
                          onClick={() => {
                            if (infoPokemonIdx !== null) {
                              if (prevGameState === 'STARTER_SELECT') {
                                setGameState('STARTER_SELECT');
                                setInfoPokemonIdx(null);
                              } else {
                                setInfoPokemonIdx(null);
                              }
                            } else {
                              setGameState(prevGameState || 'MENU');
                            }
                          }}
                          className="p-2 bg-slate-900/10 text-slate-900 hover:bg-slate-900/20 transition-all rounded-full"
                        >
                          <ArrowLeft className="w-6 h-6" />
                        </button>
                      )}
                    </div>

                    {infoPokemonIdx === null ? (
                      /* Level 1: Team List */
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                          {playerTeam.map((tp, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInfoPokemonIdx(idx)}
                              className="bg-white p-4 shadow-xl hover:shadow-2xl transition-all border-b-4 border-slate-100 hover:border-blue-500 group flex items-center gap-4 text-left"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-blue-50 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                                <img 
                                  src={tp.sprites.front_default} 
                                  className="w-16 h-16 relative z-10 group-hover:scale-110 transition-transform" 
                                  referrerPolicy="no-referrer" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <div className="font-black italic text-base uppercase truncate text-slate-900">{getLocalized(tp)}</div>
                                  <div className="flex gap-1">
                                    {tp.types.map(t => (
                                      <TypeBadge key={t.type.name} type={t.type.name} size="xs" />
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 transition-all" 
                                      style={{ width: `${(tp.currentHp / tp.maxHp) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black italic text-slate-400">Lv.{tp.level}</span>
                                </div>
                                {prevGameState === 'BATTLE' && (
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      disabled={tp.currentHp <= 0 || idx === 0 || isMessageProcessing}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        switchPokemon(idx);
                                      }}
                                      className="flex-1 py-1.5 bg-blue-500 text-white text-[10px] font-black italic uppercase skew-x-[-10deg] hover:bg-blue-600 disabled:opacity-50 transition-all"
                                    >
                                      <span className="skew-x-[10deg] inline-block">{t('switch')}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : p ? (
                      /* Level 2: Pokemon Details */
                      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl shadow-2xl relative z-10">
                        {/* Background Stripes for Detail */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 rotate-12 scale-150 flex flex-col gap-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i} className="h-8 bg-slate-900 w-full" />
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative z-10">
                          {/* Top Section: Image, Name, Stats Chart */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Left: Basic Info */}
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                              <div className="relative mb-4">
                                <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl opacity-50" />
                                <img 
                                  src={p.sprites.front_default} 
                                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl relative z-10" 
                                  referrerPolicy="no-referrer" 
                                />
                              </div>
                              <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 mb-2 flex items-center gap-3">
                                {getLocalized(p)}
                                {p.gender === 'male' && <Mars className="w-6 h-6 text-blue-500" />}
                                {p.gender === 'female' && <Venus className="w-6 h-6 text-pink-500" />}
                              </h3>
                              <div className="flex gap-2 mb-4">
                                {p.types.map(t => (
                                  <TypeBadge key={t.type.name} type={t.type.name} size="md" />
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-xs">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black italic text-slate-400 uppercase">{t('nature')}</span>
                                  <span className="font-black italic text-slate-700">{getLocalizedNature(p.nature)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black italic text-slate-400 uppercase">Lv.</span>
                                  <span className="font-black italic text-slate-700">{p.level}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Radar Chart & Detailed Stats */}
                            <div className="flex flex-col gap-6">
                              <div className="flex items-center justify-center bg-slate-50/50 rounded-3xl p-4">
                                <RadarChart stats={p.baseStats} t={t} calculatedStats={p.calculatedStats} />
                              </div>
                              
                              {/* Detailed Stats Table */}
                              <div className="bg-slate-50 rounded-2xl p-4 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="py-2 text-[10px] font-black italic text-slate-400 uppercase">{t('stats')}</th>
                                      <th className="py-2 text-[10px] font-black italic text-slate-400 uppercase text-center">{t('base')}</th>
                                      <th className="py-2 text-[10px] font-black italic text-slate-400 uppercase text-center">{t('iv')}</th>
                                      <th className="py-2 text-[10px] font-black italic text-slate-400 uppercase text-right">{t('actualStats')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'].map((key) => {
                                      const isPlus = p.nature.plus === key;
                                      const isMinus = p.nature.minus === key;
                                      return (
                                        <tr key={key} className="border-b border-slate-100 last:border-0">
                                          <td className="py-2 text-xs font-black italic text-slate-600 uppercase flex items-center gap-1">
                                            {t(key)}
                                            {isPlus && <span className="text-[10px] text-red-500 font-bold">↑</span>}
                                            {isMinus && <span className="text-[10px] text-blue-500 font-bold">↓</span>}
                                          </td>
                                          <td className="py-2 text-xs font-bold text-slate-500 text-center">{p.baseStats[key as keyof Stats]}</td>
                                          <td className="py-2 text-xs font-bold text-slate-500 text-center">{p.ivs[key as keyof Stats]}</td>
                                          <td className="py-2 text-sm font-black italic text-slate-900 text-right">{p.calculatedStats[key as keyof Stats]}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Middle Section: Moves */}
                          <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                              <Zap className="w-5 h-5 text-yellow-500" />
                              <h4 className="text-lg font-black italic uppercase text-slate-900">{t('currentMoves')}</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {p.selectedMoves.map((move, i) => (
                                <div key={i} className="bg-slate-50 p-4 border-l-4 border-blue-500 flex justify-between items-center">
                                  <div>
                                    <div className="font-black italic uppercase text-slate-900">{getLocalized(move)}</div>
                                    <div className="flex gap-2 mt-1">
                                      <TypeBadge type={move.type} size="xs" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {move.damage_class === 'special' ? t('special') : move.damage_class === 'physical' ? t('physical') : t('status')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-black italic text-slate-400 uppercase">{t('power')}</div>
                                    <div className="font-black italic text-slate-900">{move.power || '--'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom Section: Ability */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="w-5 h-5 text-purple-500" />
                              <h4 className="text-lg font-black italic uppercase text-slate-900">{t('ability')}</h4>
                            </div>
                            <div className="bg-purple-50 p-5 border-l-4 border-purple-500">
                              <div className="font-black italic text-purple-900 uppercase mb-1">
                                {getLocalized(ability)}
                              </div>
                              <p className="text-xs font-bold text-purple-700/70 italic leading-relaxed">
                                {getLocalizedDesc(ability)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Back Button for Detail View */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex-none">
                          <button 
                            onClick={() => {
                              if (prevGameState === 'STARTER_SELECT') {
                                setGameState('STARTER_SELECT');
                                setInfoPokemonIdx(null);
                              } else {
                                setInfoPokemonIdx(null);
                              }
                            }}
                            className="w-full py-3 bg-slate-900 text-white font-black italic skew-x-[-10deg] hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                          >
                            <span className="skew-x-[10deg] inline-block uppercase flex items-center gap-2">
                              <ArrowLeft className="w-4 h-4" /> {t('back')}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : null}
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
              className="flex-1 flex flex-col items-center justify-center overflow-hidden relative"
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
