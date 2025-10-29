import { useEffect, useState } from "react";

import { ControlsPanel, GridCanvas, StatsPanel } from "@/components";
import { useSimulationAnimation } from "@/hooks";
import { useAppStore } from "@/store/useAppStore";
import type { Point } from "@/types";

type SelectionMode = "start" | "goal";

const App = () => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("start");

  const maze = useAppStore((state) => state.maze);
  const visitedOrder = useAppStore((state) => state.visitedOrder);
  const path = useAppStore((state) => state.path);
  const start = useAppStore((state) => state.start);
  const goal = useAppStore((state) => state.goal);
  const setStart = useAppStore((state) => state.setStart);
  const setGoal = useAppStore((state) => state.setGoal);

  const { visitedCount, showPath, isAnimating, skip } = useSimulationAnimation();

  useEffect(() => {
    if (!start) {
      setSelectionMode("start");
    } else if (!goal) {
      setSelectionMode("goal");
    }
  }, [start, goal]);

  const handleSelectCell = (point: Point) => {
    if (selectionMode === "start") {
      setStart(point);
      if (!goal) {
        setSelectionMode("goal");
      }
    } else {
      setGoal(point);
    }
  };

  const handleSelectionModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-900/60 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-sky-300">
              Pathfinder & Maze Visualizer
            </h1>
            <p className="text-sm text-slate-400">
              Generate perfect mazes and compare BFS, DFS, and A* exploration.
            </p>
          </div>
          {isAnimating && (
            <button
              type="button"
              onClick={skip}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500"
            >
              Skip Animation
            </button>
          )}
        </div>
      </header>

      <main className="h-[calc(100vh-80px)] overflow-hidden">
        {/* Mobile: Stacked Layout (30% control, 70% maze), Desktop: Side-by-Side */}
        <div className="grid h-full grid-cols-1 gap-0 md:grid-cols-[30%_1fr]">
          {/* Control Panel - 30% width on desktop, 30% height on mobile */}
          <div className="order-2 flex flex-col gap-3 overflow-y-auto md:order-1 h-[30%] md:h-full md:gap-4 md:overflow-x-hidden md:p-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm p-4 shadow-lg">
              <ControlsPanel
                selectionMode={selectionMode}
                onSelectionModeChange={handleSelectionModeChange}
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm p-4 shadow-lg">
              <StatsPanel />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm p-4 shadow-lg">
              <h3 className="mb-3 text-sm font-medium text-slate-200">Instructions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
                <li>Select the start and goal cells by clicking the maze.</li>
                <li>Use the control panel to generate new mazes and run algorithms.</li>
                <li>Adjust animation speed to inspect frontier expansion in detail.</li>
              </ul>
            </div>
          </div>

          {/* Maze Panel - 70% width on desktop, 70% height on mobile */}
          <div className="order-1 h-[70%] flex min-h-0 items-center justify-center md:order-2 md:h-full md:p-4">
            <GridCanvas
              grid={maze}
              visitedOrder={visitedOrder}
              visitedCount={visitedCount}
              path={path}
              showPath={showPath}
              start={start}
              goal={goal}
              onSelectCell={handleSelectCell}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
