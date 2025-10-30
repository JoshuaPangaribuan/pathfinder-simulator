import { type ChangeEvent } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Algorithm } from "@/types";

const algorithmLabel: Record<Algorithm, string> = {
  bfs: "Breadth-First Search",
  dfs: "Depth-First Search",
  astar: "A* Search",
};

interface AlgorithmSelectorProps {
  className?: string;
}

export const AlgorithmSelector = ({ className = "" }: AlgorithmSelectorProps) => {
  const algorithm = useAppStore((state) => state.algorithm);
  const animationSpeed = useAppStore((state) => state.animationSpeed);
  const setAlgorithm = useAppStore((state) => state.setAlgorithm);
  const setAnimationSpeed = useAppStore((state) => state.setAnimationSpeed);

  const handleAlgorithmChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Algorithm;
    setAlgorithm(value);
  };

  const handleAnimationSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAnimationSpeed(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-100">Algorithm Settings</h3>
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Algorithm
        <select
          value={algorithm}
          onChange={handleAlgorithmChange}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
        >
          {Object.entries(algorithmLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2">
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
    </div>
  );
};

