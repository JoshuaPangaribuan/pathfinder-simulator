export type Point = {
  x: number;
  y: number;
};

export type Grid = number[][];

export type Algorithm = "bfs" | "dfs" | "astar";

export interface GenerateMazeRequest {
  width: number;
  height: number;
  seed?: number;
}

export interface MazeResponse {
  width: number;
  height: number;
  grid: Grid;
  seed?: number;
}

export interface SimulateRequest {
  algorithm: Algorithm;
  grid: Grid;
  start: Point;
  goal: Point;
}

export interface SimulateResponse {
  found: boolean;
  path: Point[];
  visitedOrder: Point[];
  stats: SimulationStats;
}

export interface SimulationStats {
  expandedNodes: number;
  pathLength: number;
  elapsedMs: number;
}

