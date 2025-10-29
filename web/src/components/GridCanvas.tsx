import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import type { Grid, Point } from "@/types";

const COLORS = {
  wall: "#0f172a",
  space: "#1e293b",
  visited: "#38bdf8",
  path: "#fbbf24",
  start: "#22c55e",
  goal: "#ef4444",
} as const;

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MAX_CANVAS_SIZE = 680;
const MIN_CELL_SIZE = 4;
const MAX_CELL_SIZE = 30;

const computeCellSize = (width: number, height: number) => {
  if (width === 0 || height === 0) {
    return MIN_CELL_SIZE;
  }
  const ideal = Math.floor(MAX_CANVAS_SIZE / Math.max(width, height));
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, ideal));
};

interface GridCanvasProps {
  grid: Grid | null;
  visitedOrder: Point[];
  visitedCount: number;
  path: Point[];
  showPath: boolean;
  start: Point | null;
  goal: Point | null;
  onSelectCell?: (point: Point) => void;
}

export const GridCanvas = ({
  grid,
  visitedOrder,
  visitedCount,
  path,
  showPath,
  start,
  goal,
  onSelectCell,
}: GridCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellSizeRef = useRef<number>(MIN_CELL_SIZE);
  const dprRef = useRef<number>(1);
  const prevVisitedCountRef = useRef<number>(0);
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null);

  const dimensions = useMemo(() => {
    if (!grid || grid.length === 0) {
      return { width: 0, height: 0, cellSize: MIN_CELL_SIZE };
    }
    const height = grid.length;
    const width = grid[0].length;
    const cellSize = computeCellSize(width, height);
    return { width, height, cellSize };
  }, [grid]);

  const resetCanvas = useCallback(() => {
    if (!grid) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const { width, height, cellSize } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    cellSizeRef.current = cellSize;

    canvas.width = width * cellSize * dpr;
    canvas.height = height * cellSize * dpr;
    canvas.style.width = `${width * cellSize}px`;
    canvas.style.height = `${height * cellSize}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    contextRef.current = context;
    prevVisitedCountRef.current = 0;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = COLORS.wall;
    context.fillRect(0, 0, width * cellSize, height * cellSize);

    context.fillStyle = COLORS.space;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (grid[y][x] === 0) {
          context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    context.restore();
  }, [dimensions, grid]);

  const drawVisitedRange = useCallback((from: number, to: number) => {
    const context = contextRef.current;
    if (!context) {
      return;
    }
    const total = visitedOrder.length || 1;
    const cellSize = cellSizeRef.current;
    const dpr = dprRef.current;

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let index = from; index < to; index += 1) {
      const point = visitedOrder[index];
      if (!point) {
        continue;
      }
      const intensity = 0.15 + (index / total) * 0.65;
      context.fillStyle = hexToRgba(COLORS.visited, Math.min(0.85, intensity));
      context.fillRect(point.x * cellSize, point.y * cellSize, cellSize, cellSize);
    }
    context.restore();
  }, [visitedOrder]);

  const drawPathOverlay = useCallback(() => {
    const context = contextRef.current;
    if (!context || !showPath || path.length === 0) {
      return;
    }
    const cellSize = cellSizeRef.current;
    const dpr = dprRef.current;
    const inset = Math.max(1, Math.floor(cellSize * 0.25));
    const size = Math.max(1, cellSize - inset * 2);

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = hexToRgba(COLORS.path, 0.9);
    path.forEach((point) => {
      context.fillRect(
        point.x * cellSize + inset,
        point.y * cellSize + inset,
        size,
        size,
      );
    });
    context.restore();
  }, [path, showPath]);

  const drawMarkers = useCallback(() => {
    const context = contextRef.current;
    if (!context) {
      return;
    }
    const cellSize = cellSizeRef.current;
    const dpr = dprRef.current;
    const radius = cellSize * 0.35;

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineWidth = Math.max(1, cellSize * 0.1);

    if (start) {
      context.fillStyle = COLORS.start;
      context.beginPath();
      context.arc(
        start.x * cellSize + cellSize / 2,
        start.y * cellSize + cellSize / 2,
        radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    if (goal) {
      context.fillStyle = COLORS.goal;
      context.beginPath();
      context.arc(
        goal.x * cellSize + cellSize / 2,
        goal.y * cellSize + cellSize / 2,
        radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    context.restore();
  }, [goal, start]);

  const drawHoverEffect = useCallback(() => {
    const context = contextRef.current;
    if (!context || !hoveredCell || !grid) {
      return;
    }

    // Only show hover effect on valid cells (open spaces)
    if (grid[hoveredCell.y][hoveredCell.x] !== 0) {
      return;
    }

    const cellSize = cellSizeRef.current;
    const dpr = dprRef.current;

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw shadow/box effect
    const inset = Math.max(1, Math.floor(cellSize * 0.1));
    const shadowSize = Math.max(1, Math.floor(cellSize * 0.05));

    // Draw outer shadow
    context.fillStyle = hexToRgba("#ffffff", 0.2);
    context.fillRect(
      hoveredCell.x * cellSize - shadowSize,
      hoveredCell.y * cellSize - shadowSize,
      cellSize + shadowSize * 2,
      cellSize + shadowSize * 2,
    );

    // Draw inner highlight
    context.fillStyle = hexToRgba("#ffffff", 0.1);
    context.fillRect(
      hoveredCell.x * cellSize + inset,
      hoveredCell.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2,
    );

    context.restore();
  }, [hoveredCell, grid]);

  const redrawAll = useCallback(() => {
    if (!grid) {
      return;
    }
    resetCanvas();
    const target = Math.min(visitedCount, visitedOrder.length);
    if (target > 0) {
      drawVisitedRange(0, target);
    }
    if (showPath) {
      drawPathOverlay();
    }
    drawMarkers();
    drawHoverEffect();
    prevVisitedCountRef.current = target;
  }, [drawMarkers, drawPathOverlay, drawVisitedRange, drawHoverEffect, grid, resetCanvas, showPath, visitedCount, visitedOrder]);

  useEffect(() => {
    if (!grid) {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    redrawAll();
  }, [grid, redrawAll]);

  useEffect(() => {
    if (!grid) {
      return;
    }
    const target = Math.min(visitedCount, visitedOrder.length);
    const previous = prevVisitedCountRef.current;
    if (target < previous) {
      redrawAll();
      return;
    }
    if (target > previous) {
      drawVisitedRange(previous, target);
      drawMarkers();
      prevVisitedCountRef.current = target;
    }
  }, [drawMarkers, drawVisitedRange, grid, redrawAll, visitedCount, visitedOrder]);

  useEffect(() => {
    if (!grid) {
      return;
    }
    redrawAll();
  }, [drawMarkers, drawPathOverlay, grid, redrawAll, showPath]);

  useEffect(() => {
    if (!grid) {
      return;
    }
    drawHoverEffect();
  }, [drawHoverEffect, grid, hoveredCell]);

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!grid || !onSelectCell) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const cellSize = cellSizeRef.current;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current;

    const offsetX = (event.clientX - rect.left) * (scaleX / dpr);
    const offsetY = (event.clientY - rect.top) * (scaleY / dpr);

    const x = Math.floor(offsetX / cellSize);
    const y = Math.floor(offsetY / cellSize);

    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
      return;
    }
    if (grid[y][x] !== 0) {
      return;
    }

    onSelectCell({ x, y });
  };

  const getCellFromMouseEvent = (event: MouseEvent<HTMLCanvasElement>): Point | null => {
    if (!grid) {
      return null;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const cellSize = cellSizeRef.current;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current;

    const offsetX = (event.clientX - rect.left) * (scaleX / dpr);
    const offsetY = (event.clientY - rect.top) * (scaleY / dpr);

    const x = Math.floor(offsetX / cellSize);
    const y = Math.floor(offsetY / cellSize);

    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
      return null;
    }

    return { x, y };
  };

  const handleCanvasMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouseEvent(event);
    setHoveredCell(cell);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredCell(null);
  };

  const renderFallback = () => (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900/80">
      <p className="text-sm text-slate-400">Generate a maze to begin.</p>
    </div>
  );

  if (!grid || grid.length === 0 || grid[0].length === 0) {
    return renderFallback();
  }

  const { width, height, cellSize } = dimensions;
  const styleWidth = width * cellSize;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        width={width * cellSize}
        height={height * cellSize}
        style={{ width: `${styleWidth}px`, height: `${height * cellSize}px` }}
        className="rounded-lg border border-slate-700 bg-slate-900 shadow-lg"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
    </div>
  );
};

