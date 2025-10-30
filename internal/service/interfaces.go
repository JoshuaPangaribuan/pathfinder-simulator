package service

import (
	"context"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

// MazeServiceInterface defines the interface for maze service operations
type MazeServiceInterface interface {
	GenerateMaze(ctx context.Context, req GenerateMazeRequest) (maze.GenerateResult, error)
}

// SimulationServiceInterface defines the interface for simulation service operations
type SimulationServiceInterface interface {
	RunSimulation(ctx context.Context, req RunSimulationRequest) (RunSimulationResult, error)
}

