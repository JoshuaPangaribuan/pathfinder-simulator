import { useAppStore } from "@/store/useAppStore";
import type { Point } from "@/types";

type SelectionMode = "start" | "goal";

interface CellSelectorProps {
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  className?: string;
}

export const CellSelector = ({
  selectionMode,
  onSelectionModeChange,
  className = "",
}: CellSelectorProps) => {
  const start = useAppStore((state) => state.start);
  const goal = useAppStore((state) => state.goal);

  const handleSelectionModeToggle = (mode: SelectionMode) => () => {
    onSelectionModeChange(mode);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-100">Cell Selection</h3>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectionModeToggle("start")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
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
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              selectionMode === "goal"
                ? "border-rose-500 bg-rose-500/10 text-rose-300"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            Set Goal
          </button>
        </div>
        <div className="text-center text-sm text-slate-400">
          Start: {start ? `(${start.x}, ${start.y})` : "--"} | Goal: {goal ? `(${goal.x}, ${goal.y})` : "--"}
        </div>
      </div>
    </div>
  );
};

