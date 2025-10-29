import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/store/useAppStore";
import type { Point } from "@/types";

interface AnimationControls {
  visitedCount: number;
  showPath: boolean;
  isAnimating: boolean;
  skip: () => void;
}

export const useSimulationAnimation = (): AnimationControls => {
  const visitedOrder = useAppStore((state) => state.visitedOrder);
  const path = useAppStore((state) => state.path);
  const animationSpeed = useAppStore((state) => state.animationSpeed);
  const isAnimating = useAppStore((state) => state.isAnimating);
  const setIsAnimating = useAppStore((state) => state.setIsAnimating);

  const [visitedCount, setVisitedCount] = useState(0);
  const [showPath, setShowPath] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const orderRef = useRef<Point[]>([]);
  const speedRef = useRef(animationSpeed);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (completed: boolean) => {
      clearTimer();
      setIsAnimating(false);
      setShowPath(completed);
      if (completed) {
        setVisitedCount(orderRef.current.length);
      }
    },
    [clearTimer, setIsAnimating],
  );

  const tick = useCallback(() => {
    const order = orderRef.current;
    if (!order.length) {
      finish(false);
      return;
    }

    const nextIndex = indexRef.current + 1;
    indexRef.current = nextIndex;
    setVisitedCount(Math.min(nextIndex, order.length));

    if (nextIndex >= order.length) {
      finish(true);
      return;
    }

    clearTimer();
    timeoutRef.current = window.setTimeout(tick, speedRef.current);
  }, [clearTimer, finish]);

  const skip = useCallback(() => {
    clearTimer();
    const order = orderRef.current;
    setVisitedCount(order.length);
    setShowPath(true);
    setIsAnimating(false);
  }, [clearTimer, setIsAnimating]);

  useEffect(() => {
    speedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    orderRef.current = visitedOrder;
    indexRef.current = 0;
    clearTimer();

    if (!visitedOrder.length) {
      setVisitedCount(0);
      setShowPath(false);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setVisitedCount(0);
    setShowPath(false);

    timeoutRef.current = window.setTimeout(tick, speedRef.current);

    return () => {
      clearTimer();
    };
  }, [visitedOrder, clearTimer, setIsAnimating, tick]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    visitedCount,
    showPath: showPath && path.length > 0,
    isAnimating,
    skip,
  };
};

