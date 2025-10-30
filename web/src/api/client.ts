import axios from "axios";

import type {
  Algorithm,
  GenerateMazeRequest,
  MazeResponse,
  SimulateRequest,
  SimulateResponse,
} from "@/types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  timeout: 15_000,
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const responseMessage = error.response?.data as { error?: string } | undefined;
      const message = responseMessage?.error ?? error.message ?? "An error occurred";
      
      return Promise.reject(new Error(message));
    }
    
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    
    return Promise.reject(new Error("Unexpected error"));
  }
);

export const generateMaze = async (
  payload: GenerateMazeRequest,
  options?: { signal?: AbortSignal }
): Promise<MazeResponse> => {
  const { data } = await apiClient.post<MazeResponse>(
    "/maze/generate",
    payload,
    { signal: options?.signal }
  );
  return data;
};

export const simulate = async (
  payload: SimulateRequest,
  options?: { signal?: AbortSignal }
): Promise<SimulateResponse> => {
  const { data } = await apiClient.post<SimulateResponse>(
    "/simulate",
    payload,
    { signal: options?.signal }
  );
  return data;
};

export const isAlgorithm = (value: string): value is Algorithm => {
  return value === "bfs" || value === "dfs" || value === "astar";
};

