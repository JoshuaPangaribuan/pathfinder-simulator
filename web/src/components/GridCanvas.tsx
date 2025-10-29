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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellGeometryRef = useRef({
    width: 1,
    height: 1,
    containerWidth: 1,
    containerHeight: 1,
  });
  const dprRef = useRef<number>(1);
  const prevVisitedCountRef = useRef<number>(0);
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null);
  const [resizeVersion, setResizeVersion] = useState(0);

  const dimensions = useMemo(() => {
    if (!grid || grid.length === 0) {
      return {
        width: 0,
        height: 0,
        cellWidth: 1,
        cellHeight: 1,
        containerWidth: 0,
        containerHeight: 0,
      };
    }
    const height = grid.length;
    const width = grid[0].length;

    const container = containerRef.current;
    let containerWidth = 800;
    let containerHeight = 600;

    if (container) {
      const rect = container.getBoundingClientRect();
      containerWidth = Math.max(1, rect.width);
      containerHeight = Math.max(1, rect.height);
    }

    const cellWidth = containerWidth / width;
    const cellHeight = containerHeight / height;

    return {
      width,
      height,
      cellWidth,
      cellHeight,
      containerWidth,
      containerHeight,
    };
  }, [grid, resizeVersion]);

  const resetCanvas = useCallback(() => {
    if (!grid) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const { width, height, cellWidth, cellHeight, containerWidth, containerHeight } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    cellGeometryRef.current = {
      width: cellWidth,
      height: cellHeight,
      containerWidth,
      containerHeight,
    };

    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

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
    context.fillRect(0, 0, containerWidth, containerHeight);

    context.fillStyle = COLORS.space;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (grid[y][x] === 0) {
          context.fillRect(
            x * cellWidth,
            y * cellHeight,
            cellWidth,
            cellHeight,
          );
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
    const { width: cellWidth, height: cellHeight } = cellGeometryRef.current;
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
      context.fillRect(
        point.x * cellWidth,
        point.y * cellHeight,
        cellWidth,
        cellHeight,
      );
    }
    context.restore();
  }, [visitedOrder]);

  const drawPathOverlay = useCallback(() => {
    const context = contextRef.current;
    if (!context || !showPath || path.length === 0) {
      return;
    }
    const { width: cellWidth, height: cellHeight } = cellGeometryRef.current;
    const dpr = dprRef.current;
    const insetX = Math.max(1, cellWidth * 0.25);
    const insetY = Math.max(1, cellHeight * 0.25);
    const sizeX = Math.max(1, cellWidth - insetX * 2);
    const sizeY = Math.max(1, cellHeight - insetY * 2);

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = hexToRgba(COLORS.path, 0.9);
    path.forEach((point) => {
      context.fillRect(
        point.x * cellWidth + insetX,
        point.y * cellHeight + insetY,
        sizeX,
        sizeY,
      );
    });
    context.restore();
  }, [path, showPath]);

  const drawMarkers = useCallback(() => {
    const context = contextRef.current;
    if (!context) {
      return;
    }
    const { width: cellWidth, height: cellHeight } = cellGeometryRef.current;
    const dpr = dprRef.current;
    const radius = Math.min(cellWidth, cellHeight) * 0.35;

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineWidth = Math.max(1, Math.min(cellWidth, cellHeight) * 0.1);

    if (start) {
      context.fillStyle = COLORS.start;
      context.beginPath();
      context.arc(
        start.x * cellWidth + cellWidth / 2,
        start.y * cellHeight + cellHeight / 2,
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
        goal.x * cellWidth + cellWidth / 2,
        goal.y * cellHeight + cellHeight / 2,
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

    const { width: cellWidth, height: cellHeight } = cellGeometryRef.current;
    const dpr = dprRef.current;

    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw shadow/box effect
    const insetX = Math.max(1, cellWidth * 0.1);
    const insetY = Math.max(1, cellHeight * 0.1);
    const shadowSizeX = Math.max(1, cellWidth * 0.05);
    const shadowSizeY = Math.max(1, cellHeight * 0.05);

    // Draw outer shadow
    context.fillStyle = hexToRgba("#ffffff", 0.2);
    context.fillRect(
      hoveredCell.x * cellWidth - shadowSizeX,
      hoveredCell.y * cellHeight - shadowSizeY,
      cellWidth + shadowSizeX * 2,
      cellHeight + shadowSizeY * 2,
    );

    // Draw inner highlight
    context.fillStyle = hexToRgba("#ffffff", 0.1);
    context.fillRect(
      hoveredCell.x * cellWidth + insetX,
      hoveredCell.y * cellHeight + insetY,
      cellWidth - insetX * 2,
      cellHeight - insetY * 2,
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

  // Listen for container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger a re-render by updating the trigger state
      setResizeVersion(prev => prev + 1);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

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
    const { width: cellWidth, height: cellHeight, containerWidth, containerHeight } = cellGeometryRef.current;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current;

    const offsetX = (event.clientX - rect.left) * (scaleX / dpr);
    const offsetY = (event.clientY - rect.top) * (scaleY / dpr);

    if (offsetX < 0 || offsetY < 0 || offsetX >= containerWidth || offsetY >= containerHeight) {
      return;
    }

    const x = Math.floor(offsetX / cellWidth);
    const y = Math.floor(offsetY / cellHeight);

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
    const { width: cellWidth, height: cellHeight, containerWidth, containerHeight } = cellGeometryRef.current;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current;

    const offsetX = (event.clientX - rect.left) * (scaleX / dpr);
    const offsetY = (event.clientY - rect.top) * (scaleY / dpr);

    if (offsetX < 0 || offsetY < 0 || offsetX >= containerWidth || offsetY >= containerHeight) {
      return null;
    }

    const x = Math.floor(offsetX / cellWidth);
    const y = Math.floor(offsetY / cellHeight);

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

  const { containerWidth, containerHeight } = dimensions;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          width={containerWidth}
          height={containerHeight}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />
      </div>
    </div>
  );
};

