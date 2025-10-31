import { useEffect, useMemo, useRef, useState } from "react";

import { useCanvasEventHandlers } from "@/hooks/useCanvasEventHandlers";
import { useCanvasRenderer } from "@/hooks/useCanvasRenderer";
import type { Grid, Point } from "@/types";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, resizeVersion]);

  const { canvasRef, contextRef, cellGeometryRef, dprRef, prevVisitedCountRef, drawVisitedRange, drawPathOverlay, drawMarkers, drawHoverEffect, redrawAll } = useCanvasRenderer({
    grid,
    dimensions,
    visitedOrder,
    visitedCount,
    path,
    showPath,
    start,
    goal,
    hoveredCell,
  });

  const { handleCanvasClick, handleCanvasMouseMove, handleCanvasMouseLeave } = useCanvasEventHandlers({
    grid,
    onSelectCell,
    setHoveredCell,
    cellGeometryRef,
    dprRef,
    canvasRef,
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

