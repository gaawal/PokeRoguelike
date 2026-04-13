import { useState } from 'react';
import { GamePokemon, Pokemon, Move } from '../types';

export const usePokemonManager = () => {
  const [playerTeam, setPlayerTeam] = useState<GamePokemon[]>([]);
  const [showReplaceUI, setShowReplaceUI] = useState<GamePokemon | null>(null);
  const [learningPokemonIdx, setLearningPokemonIdx] = useState<number | null>(null);
  const [potentialMoves, setPotentialMoves] = useState<Move[]>([]);
  const [selectedNewMove, setSelectedNewMove] = useState<Move | null>(null);
  const [evolutionTarget, setEvolutionTarget] = useState<GamePokemon | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolvedPokemon, setEvolvedPokemon] = useState<GamePokemon | null>(null);
  const [evolutionChoices, setEvolutionChoices] = useState<Pokemon[]>([]);
  const [selectedPokemonForEvolution, setSelectedPokemonForEvolution] = useState<{pokemon: GamePokemon, index: number} | null>(null);
  const [canEvolveMap, setCanEvolveMap] = useState<Record<number, boolean>>({});
  const [isCheckingEvolution, setIsCheckingEvolution] = useState(false);
  const [isEvolutionAnimating, setIsEvolutionAnimating] = useState(false);
  const [evolutionConfirmChoice, setEvolutionConfirmChoice] = useState<Pokemon | null>(null);

  return {
    playerTeam,
    setPlayerTeam,
    showReplaceUI,
    setShowReplaceUI,
    learningPokemonIdx,
    setLearningPokemonIdx,
    potentialMoves,
    setPotentialMoves,
    selectedNewMove,
    setSelectedNewMove,
    evolutionTarget,
    setEvolutionTarget,
    isEvolving,
    setIsEvolving,
    evolvedPokemon,
    setEvolvedPokemon,
    evolutionChoices,
    setEvolutionChoices,
    selectedPokemonForEvolution,
    setSelectedPokemonForEvolution,
    canEvolveMap,
    setCanEvolveMap,
    isCheckingEvolution,
    setIsCheckingEvolution,
    isEvolutionAnimating,
    setIsEvolutionAnimating,
    evolutionConfirmChoice,
    setEvolutionConfirmChoice,
  };
};
