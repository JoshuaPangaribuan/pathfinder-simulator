import { useCallback } from "react";
import { DimensionInput, SeedInput } from "@/components/forms";
import type { GenerateMazeRequest } from "@/types";

interface MazeGeneratorProps {
  width: number;
  height: number;
  seed: string;
  maxWidth: number;
  maxHeight: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onSeedChange: (seed: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const MIN_DIMENSION = 5;

export const MazeGenerator = ({
  width,
  height,
  seed,
  maxWidth,
  maxHeight,
  onWidthChange,
  onHeightChange,
  onSeedChange,
  onGenerate,
  isGenerating,
}: MazeGeneratorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">Maze Generation</h3>
      <div className="grid grid-cols-2 gap-4">
        <DimensionInput
          label="Width (cells)"
          value={width}
          onChange={onWidthChange}
          min={MIN_DIMENSION}
          max={maxWidth}
        />
        <DimensionInput
          label="Height (cells)"
          value={height}
          onChange={onHeightChange}
          min={MIN_DIMENSION}
          max={maxHeight}
        />
      </div>
      <SeedInput value={seed} onChange={onSeedChange} />
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isGenerating ? "Generating…" : "Generate Maze"}
      </button>
    </div>
  );
};

