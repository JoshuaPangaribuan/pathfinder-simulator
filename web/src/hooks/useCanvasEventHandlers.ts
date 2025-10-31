import { useCallback, type MouseEvent } from "react";

import type { Grid, Point } from "@/types";

interface UseCanvasEventHandlersProps {
  grid: Grid | null;
  onSelectCell?: (point: Point) => void;
  setHoveredCell: (cell: Point | null) => void;
  cellGeometryRef: React.RefObject<{ width: number; height: number; containerWidth: number; containerHeight: number }>;
  dprRef: React.RefObject<number>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useCanvasEventHandlers = ({
  grid,
  onSelectCell,
  setHoveredCell,
  cellGeometryRef,
  dprRef,
  canvasRef,
}: UseCanvasEventHandlersProps) => {
  const getCellFromMouseEvent = useCallback((event: MouseEvent<HTMLCanvasElement>): Point | null => {
    if (!grid) {
      return null;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const { width: cellWidth, height: cellHeight, containerWidth, containerHeight } = cellGeometryRef.current!;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current!;

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
  }, [grid, canvasRef, cellGeometryRef, dprRef]);

  const handleCanvasClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (!grid || !onSelectCell) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const { width: cellWidth, height: cellHeight, containerWidth, containerHeight } = cellGeometryRef.current!;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const dpr = dprRef.current!;

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
  }, [grid, onSelectCell, canvasRef, cellGeometryRef, dprRef]);

  const handleCanvasMouseMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouseEvent(event);
    setHoveredCell(cell);
  }, [getCellFromMouseEvent, setHoveredCell]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  return {
    handleCanvasClick,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  };
};