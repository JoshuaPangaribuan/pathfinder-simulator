import { useCallback, useState, useRef } from "react";
import { simulate as simulateAPI } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import type { SimulateRequest } from "@/types";

export interface UseSimulationServiceReturn {
  runSimulation: (request: SimulateRequest) => Promise<void>;
  isRunning: boolean;
  error: string | null;
  cancel: () => void;
}

export const useSimulationService = (): UseSimulationServiceReturn => {
  const setSimulationResult = useAppStore((state) => state.setSimulationResult);
  const algorithm = useAppStore((state) => state.algorithm);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const runSimulation = useCallback(
    async (request: SimulateRequest) => {
      // Cancel previous request if any
      cancel();

      setIsRunning(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await simulateAPI(request, {
          signal: abortControllerRef.current.signal,
        });
        setSimulationResult(algorithm, response);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't set error
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to run simulation";
        setError(message);
        throw err;
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [algorithm, setSimulationResult, cancel]
  );

  return { runSimulation, isRunning, error, cancel };
};

