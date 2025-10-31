import { useCallback, useRef } from "react";

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

interface Dimensions {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  containerWidth: number;
  containerHeight: number;
}

interface UseCanvasRendererProps {
  grid: Grid | null;
  dimensions: Dimensions;
  visitedOrder: Point[];
  visitedCount: number;
  path: Point[];
  showPath: boolean;
  start: Point | null;
  goal: Point | null;
  hoveredCell: Point | null;
}

export const useCanvasRenderer = ({
  grid,
  dimensions,
  visitedOrder,
  visitedCount,
  path,
  showPath,
  start,
  goal,
  hoveredCell,
}: UseCanvasRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cellGeometryRef = useRef({
    width: 1,
    height: 1,
    containerWidth: 1,
    containerHeight: 1,
  });
  const dprRef = useRef<number>(1);
  const prevVisitedCountRef = useRef<number>(0);

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

  return {
    canvasRef,
    contextRef,
    cellGeometryRef,
    dprRef,
    prevVisitedCountRef,
    resetCanvas,
    drawVisitedRange,
    drawPathOverlay,
    drawMarkers,
    drawHoverEffect,
    redrawAll,
  };
};