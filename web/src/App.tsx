import { useEffect, useState } from "react";

import { ControlsPanel, GridCanvas, StatsPanel } from "@/components";
import { useSimulationAnimation } from "@/hooks";
import { useAppStore } from "@/store/useAppStore";
import type { Point } from "@/types";

type SelectionMode = "start" | "goal";

const App = () => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("start");
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);

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

      <main className="flex h-[calc(100vh-80px)] flex-col">
        {/* Floating Control Panel */}
        {isControlPanelVisible && (
          <div className="absolute top-20 left-4 z-10 w-80 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">Controls</h3>
                <button
                  type="button"
                  onClick={() => setIsControlPanelVisible(false)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  title="Hide controls"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
        )}

        {/* Show Controls Button (when panel is hidden) */}
        {!isControlPanelVisible && (
          <button
            type="button"
            onClick={() => setIsControlPanelVisible(true)}
            className="absolute top-20 left-4 z-10 rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm p-3 shadow-lg hover:bg-slate-900/90"
            title="Show controls"
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Full-screen Maze */}
        <div className="flex-1 overflow-hidden">
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
      </main>
    </div>
  );
};

export default App;
