import { create } from "zustand";

import type {
  Algorithm,
  MazeResponse,
  Point,
  SimulationStats,
  SimulateResponse,
  Grid,
} from "@/types";

export interface StoredSimulation {
  algorithm: Algorithm;
  result: SimulateResponse;
}

interface AppState {
  maze: Grid | null;
  mazeWidth: number;
  mazeHeight: number;
  seed?: number;
  start: Point | null;
  goal: Point | null;
  algorithm: Algorithm;
  visitedOrder: Point[];
  path: Point[];
  stats: SimulationStats | null;
  isAnimating: boolean;
  animationSpeed: number;
  resultsByAlgorithm: Partial<Record<Algorithm, StoredSimulation>>;

  setMaze: (maze: MazeResponse) => void;
  setStart: (point: Point | null) => void;
  setGoal: (point: Point | null) => void;
  setAlgorithm: (algorithm: Algorithm) => void;
  setSimulationResult: (algorithm: Algorithm, result: SimulateResponse) => void;
  setIsAnimating: (value: boolean) => void;
  setAnimationSpeed: (ms: number) => void;
  resetSimulation: () => void;
}

const DEFAULT_ALGORITHM: Algorithm = "astar";
const DEFAULT_ANIMATION_SPEED = 35;

export const useAppStore = create<AppState>((set) => ({
  maze: null,
  mazeWidth: 0,
  mazeHeight: 0,
  seed: undefined,
  start: null,
  goal: null,
  algorithm: DEFAULT_ALGORITHM,
  visitedOrder: [],
  path: [],
  stats: null,
  isAnimating: false,
  animationSpeed: DEFAULT_ANIMATION_SPEED,
  resultsByAlgorithm: {},

  setMaze: (maze) =>
    set(() => ({
      maze: maze.grid,
      mazeWidth: maze.width,
      mazeHeight: maze.height,
      seed: maze.seed,
      start: null,
      goal: null,
      visitedOrder: [],
      path: [],
      stats: null,
      resultsByAlgorithm: {},
    })),

  setStart: (point) => set({ start: point }),

  setGoal: (point) => set({ goal: point }),

  setAlgorithm: (algorithm) => set({ algorithm }),

  setSimulationResult: (algorithm, result) =>
    set((state) => ({
      visitedOrder: result.visitedOrder,
      path: result.path,
      stats: result.stats,
      resultsByAlgorithm: {
        ...state.resultsByAlgorithm,
        [algorithm]: {
          algorithm,
          result,
        },
      },
    })),

  setIsAnimating: (value) => set({ isAnimating: value }),

  setAnimationSpeed: (ms) => set({ animationSpeed: Math.max(0, ms) }),

  resetSimulation: () =>
    set((state) => ({
      visitedOrder: [],
      path: [],
      stats: null,
      resultsByAlgorithm: state.resultsByAlgorithm,
    })),
}));

