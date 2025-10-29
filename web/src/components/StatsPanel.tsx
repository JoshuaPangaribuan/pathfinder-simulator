import { useMemo } from "react";

import { useAppStore, type StoredSimulation } from "@/store/useAppStore";
import type { Algorithm } from "@/types";

const LABELS = {
  bfs: "Breadth-First Search",
  dfs: "Depth-First Search",
  astar: "A* Search",
} as const;

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);
const formatMs = (value: number) => `${value.toFixed(2)} ms`;

export const StatsPanel = () => {
  const results = useAppStore((state) => state.resultsByAlgorithm);

  const entries = useMemo(() => {
    const order: Algorithm[] = ["bfs", "dfs", "astar"];
    return order
      .map((algorithm) => {
        const payload = results[algorithm];
        return payload ? ([algorithm, payload] as [Algorithm, StoredSimulation]) : null;
      })
      .filter((entry): entry is [Algorithm, StoredSimulation] => entry !== null);
  }, [results]);

  if (!entries.length) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
        Run an algorithm to see performance metrics.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Algorithm Statistics</h2>
      <div className="overflow-x-auto -mx-2">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Algorithm</th>
                <th className="px-4 py-3 text-right">Path Length</th>
                <th className="px-4 py-3 text-right">Expanded Nodes</th>
                <th className="px-4 py-3 text-right">Elapsed</th>
                <th className="px-4 py-3 text-left">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.map(([algorithm, payload]) => {
                if (!payload) {
                  return null;
                }
                const { result } = payload;
                const { stats } = result;
                const status = result.found ? "Path found" : "No path";

                return (
                  <tr key={algorithm}>
                    <td className="px-4 py-3 font-medium text-slate-100">{LABELS[algorithm]}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(stats.pathLength)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(stats.expandedNodes)}</td>
                    <td className="px-4 py-3 text-right">{formatMs(stats.elapsedMs)}</td>
                    <td className="px-4 py-3 text-left">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          result.found
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

