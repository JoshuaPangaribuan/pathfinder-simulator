import { useCallback, useState } from "react";
import { generateMaze as generateMazeAPI } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import type { GenerateMazeRequest } from "@/types";

export interface UseMazeServiceReturn {
  generateMaze: (payload: GenerateMazeRequest) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

export const useMazeService = (): UseMazeServiceReturn => {
  const setMaze = useAppStore((state) => state.setMaze);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMaze = useCallback(async (payload: GenerateMazeRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateMazeAPI(payload);
      setMaze(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate maze";
      setError(message);
      throw err; // Re-throw for component handling
    } finally {
      setIsGenerating(false);
    }
  }, [setMaze]);

  return { generateMaze, isGenerating, error };
};

