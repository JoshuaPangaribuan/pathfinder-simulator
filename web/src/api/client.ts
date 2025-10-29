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

export const generateMaze = async (
  payload: GenerateMazeRequest,
): Promise<MazeResponse> => {
  const { data } = await apiClient.post<MazeResponse>("/maze/generate", payload);
  return data;
};

export const simulate = async (
  payload: SimulateRequest,
): Promise<SimulateResponse> => {
  const { data } = await apiClient.post<SimulateResponse>("/simulate", payload);
  return data;
};

export const isAlgorithm = (value: string): value is Algorithm => {
  return value === "bfs" || value === "dfs" || value === "astar";
};

