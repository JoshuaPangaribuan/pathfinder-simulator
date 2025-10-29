import axios from "axios";
import { useCallback, useMemo, useState, useEffect, type ChangeEvent } from "react";

import { generateMaze, simulate } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import type { Algorithm, GenerateMazeRequest } from "@/types";

type SelectionMode = "start" | "goal";

interface ControlsPanelProps {
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  onRunStart?: () => void;
  onRunComplete?: (success: boolean) => void;
}

const algorithmLabel: Record<Algorithm, string> = {
  bfs: "Breadth-First Search",
  dfs: "Depth-First Search",
  astar: "A* Search",
};

const defaultDimensions: GenerateMazeRequest = {
  width: 31,
  height: 21,
};

const MIN_DIMENSION = 5;

// Calculate maximum maze dimensions based on screen size
const getMaxDimensions = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Reserve space for UI elements (header ~80px, padding ~40px)
  const availableWidth = screenWidth - 120;
  const availableHeight = screenHeight - 120;
  
  // Calculate max cells based on minimum cell size (4px) for visibility
  const minCellSize = 4;
  const maxWidth = Math.floor(availableWidth / minCellSize);
  const maxHeight = Math.floor(availableHeight / minCellSize);
  
  // Set reasonable limits (not too small, not too large)
  return {
    width: Math.max(50, Math.min(1000, maxWidth)),
    height: Math.max(50, Math.min(1000, maxHeight))
  };
};

const extractError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data as { error?: string } | undefined;
    return responseMessage?.error ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
};

const validateDimension = (value: number, max: number): number => {
  if (isNaN(value) || value < MIN_DIMENSION) {
    return MIN_DIMENSION;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export const ControlsPanel = ({
  selectionMode,
  onSelectionModeChange,
  onRunStart,
  onRunComplete,
}: ControlsPanelProps) => {
  const maze = useAppStore((state) => state.maze);
  const start = useAppStore((state) => state.start);
  const goal = useAppStore((state) => state.goal);
  const algorithm = useAppStore((state) => state.algorithm);
  const animationSpeed = useAppStore((state) => state.animationSpeed);
  const setMaze = useAppStore((state) => state.setMaze);
  const setAlgorithm = useAppStore((state) => state.setAlgorithm);
  const setSimulationResult = useAppStore((state) => state.setSimulationResult);
  const setAnimationSpeed = useAppStore((state) => state.setAnimationSpeed);
  const resetSimulation = useAppStore((state) => state.resetSimulation);

  const [width, setWidth] = useState<number>(defaultDimensions.width);
  const [height, setHeight] = useState<number>(defaultDimensions.height);
  const [seed, setSeed] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [maxDimensions, setMaxDimensions] = useState(getMaxDimensions);

  // Update max dimensions when window resizes
  useEffect(() => {
    const handleResize = () => {
      setMaxDimensions(getMaxDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canRun = useMemo(() => {
    if (!maze || !start || !goal) {
      return false;
    }
    if (start.x === goal.x && start.y === goal.y) {
      return false;
    }
    return true;
  }, [maze, start, goal]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) {
      return;
    }
    setError(null);
    setSuccessMessage(null);

    const payload: GenerateMazeRequest = {
      width: Math.max(2, Math.floor(width)),
      height: Math.max(2, Math.floor(height)),
    };
    if (seed.trim() !== "") {
      const parsedSeed = Number(seed);
      if (!Number.isFinite(parsedSeed)) {
        setError("Seed must be a valid number");
        return;
      }
      payload.seed = parsedSeed;
    }

    try {
      setIsGenerating(true);
      const mazeResponse = await generateMaze(payload);
      setMaze(mazeResponse);
      setSuccessMessage("Maze generated successfully");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsGenerating(false);
    }
  }, [height, isGenerating, seed, setMaze, width]);

  const handleRun = useCallback(async () => {
    if (!maze || !start || !goal) {
      setError("Please select start and goal cells");
      return;
    }
    if (start.x === goal.x && start.y === goal.y) {
      setError("Start and goal must be different cells");
      return;
    }
    if (isRunning) {
      return;
    }

    resetSimulation();
    setError(null);
    setSuccessMessage(null);
    onRunStart?.();

    try {
      setIsRunning(true);
      const response = await simulate({
        algorithm,
        grid: maze,
        start,
        goal,
      });
      setSimulationResult(algorithm, response);
      setSuccessMessage(
        response.found ? "Pathfinding complete" : "No path found for the selected maze",
      );
      onRunComplete?.(response.found);
    } catch (err) {
      setError(extractError(err));
      onRunComplete?.(false);
    } finally {
      setIsRunning(false);
    }
  }, [algorithm, goal, isRunning, maze, onRunComplete, onRunStart, resetSimulation, setSimulationResult, start]);

  const handleAlgorithmChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Algorithm;
    setAlgorithm(value);
  };

  const handleAnimationSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAnimationSpeed(value);
  };

  const handleSelectionModeToggle = (mode: SelectionMode) => () => {
    onSelectionModeChange(mode);
  };

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Maze Controls</h2>
        <p className="text-sm text-slate-400">Generate a perfect maze and configure the simulation.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Width (cells)
          <input
            type="number"
            min={MIN_DIMENSION}
            max={maxDimensions.width}
            value={width}
            onChange={(event) => {
              const validatedValue = validateDimension(Number(event.target.value), maxDimensions.width);
              setWidth(validatedValue);
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
          />
          <span className="text-xs text-slate-500">Max: {maxDimensions.width}</span>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Height (cells)
          <input
            type="number"
            min={MIN_DIMENSION}
            max={maxDimensions.height}
            value={height}
            onChange={(event) => {
              const validatedValue = validateDimension(Number(event.target.value), maxDimensions.height);
              setHeight(validatedValue);
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
          />
          <span className="text-xs text-slate-500">Max: {maxDimensions.height}</span>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Seed (optional)
          <input
            type="text"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="Random each time"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Algorithm
          <select
            value={algorithm}
            onChange={handleAlgorithmChange}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
          >
            {Object.entries(algorithmLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-slate-300">Animation Speed ({animationSpeed} ms)</span>
        <input
          type="range"
          min={5}
          max={400}
          step={5}
          value={animationSpeed}
          onChange={handleAnimationSpeedChange}
          className="accent-sky-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSelectionModeToggle("start")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            selectionMode === "start"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
          }`}
        >
          Set Start
        </button>
        <button
          type="button"
          onClick={handleSelectionModeToggle("goal")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            selectionMode === "goal"
              ? "border-rose-500 bg-rose-500/10 text-rose-300"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
          }`}
        >
          Set Goal
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>
            Start: {start ? `(${start.x}, ${start.y})` : "--"}
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Goal: {goal ? `(${goal.x}, ${goal.y})` : "--"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isGenerating ? "Generating…" : "Generate Maze"}
        </button>
        <button
          type="button"
          onClick={handleRun}
          disabled={!canRun || isRunning}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isRunning ? "Running…" : "Run Pathfinding"}
        </button>
      </div>

      {(error || successMessage) && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            error
              ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error ?? successMessage}
        </div>
      )}
    </section>
  );
};

