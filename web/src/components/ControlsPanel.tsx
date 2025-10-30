import { useCallback, useMemo, useState, useEffect } from "react";

import { MazeGenerator, AlgorithmSelector, CellSelector } from "@/components/controls";
import { useMazeService, useSimulationService } from "@/hooks";
import { useAppStore } from "@/store/useAppStore";
import type { GenerateMazeRequest } from "@/types";

type SelectionMode = "start" | "goal";

interface ControlsPanelProps {
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  onRunStart?: () => void;
  onRunComplete?: (success: boolean) => void;
}

const defaultDimensions: GenerateMazeRequest = {
  width: 31,
  height: 21,
};

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
  const resetSimulation = useAppStore((state) => state.resetSimulation);

  const { generateMaze, isGenerating, error: mazeError } = useMazeService();
  const { runSimulation, isRunning, error: simError } = useSimulationService();

  const [width, setWidth] = useState<number>(defaultDimensions.width);
  const [height, setHeight] = useState<number>(defaultDimensions.height);
  const [seed, setSeed] = useState<string>("");
  const [maxDimensions, setMaxDimensions] = useState(getMaxDimensions);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update max dimensions when window resizes
  useEffect(() => {
    const handleResize = () => {
      setMaxDimensions(getMaxDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      await generateMaze(payload);
      setSuccessMessage("Maze generated successfully");
    } catch (err) {
      // Error already handled in service hook
      setError(mazeError);
    }
  }, [height, isGenerating, seed, width, generateMaze, mazeError]);

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
      await runSimulation({
        algorithm,
        grid: maze,
        start,
        goal,
      });
      // Access the result from store after simulation completes
      const result = useAppStore.getState().resultsByAlgorithm[algorithm];
      if (result) {
        setSuccessMessage(
          result.result.found ? "Pathfinding complete" : "No path found for the selected maze",
        );
        onRunComplete?.(result.result.found);
      }
    } catch (err) {
      // Error already handled in service hook
      setError(simError);
      onRunComplete?.(false);
    }
  }, [algorithm, goal, isRunning, maze, onRunComplete, onRunStart, resetSimulation, runSimulation, simError, start]);

  return (
    <section className="flex flex-col gap-4">
      {/* Mobile: Collapsible sections */}
      <div className="block lg:hidden space-y-2">
        <details className="group rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800/50 transition-colors list-none">
            <div className="flex items-center justify-between">
              <span>Maze Generation</span>
              <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="px-4 pb-4">
            <MazeGenerator
              width={width}
              height={height}
              seed={seed}
              maxWidth={maxDimensions.width}
              maxHeight={maxDimensions.height}
              onWidthChange={setWidth}
              onHeightChange={setHeight}
              onSeedChange={setSeed}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>
        </details>

        <details className="group rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800/50 transition-colors list-none">
            <div className="flex items-center justify-between">
              <span>Algorithm Settings</span>
              <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="px-4 pb-4">
            <AlgorithmSelector />
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun || isRunning}
              className="mt-4 w-full rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isRunning ? "Running…" : "Run Pathfinding"}
            </button>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800/50 transition-colors list-none">
            <div className="flex items-center justify-between">
              <span>Cell Selection</span>
              <svg className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="px-4 pb-4">
            <CellSelector
              selectionMode={selectionMode}
              onSelectionModeChange={onSelectionModeChange}
            />
          </div>
        </details>
      </div>

      {/* Desktop: Expanded layout */}
      <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Maze Controls</h2>
          <p className="text-sm text-slate-400">Generate a perfect maze and configure the simulation.</p>
        </div>

        <div className="mt-6 space-y-6">
          <MazeGenerator
            width={width}
            height={height}
            seed={seed}
            maxWidth={maxDimensions.width}
            maxHeight={maxDimensions.height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            onSeedChange={setSeed}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          <AlgorithmSelector />

          <CellSelector
            selectionMode={selectionMode}
            onSelectionModeChange={onSelectionModeChange}
          />

          <div className="w-full">
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun || isRunning}
              className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
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
        </div>
      </div>

      {/* Status messages for mobile */}
      {(error || successMessage) && (
        <div className="lg:hidden rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg">
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              error
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {error ?? successMessage}
          </div>
        </div>
      )}
    </section>
  );
};
