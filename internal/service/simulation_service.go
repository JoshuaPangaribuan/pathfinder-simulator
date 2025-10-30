package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/simulation"
)

// SimulationService handles simulation business logic
type SimulationService struct {
	runner simulation.Runner
}

// NewSimulationService creates a new simulation service
func NewSimulationService(runner simulation.Runner) *SimulationService {
	return &SimulationService{
		runner: runner,
	}
}

// RunSimulationRequest represents a request to run a simulation
type RunSimulationRequest struct {
	Algorithm string
	Grid      maze.Grid
	Start     maze.Point
	Goal      maze.Point
}

// RunSimulationResult contains the result of a simulation
type RunSimulationResult struct {
	Result  *algorithm.Result
	Elapsed time.Duration
}

// RunSimulation runs a pathfinding simulation with service-level validation and error handling
func (s *SimulationService) RunSimulation(ctx context.Context, req RunSimulationRequest) (RunSimulationResult, error) {
	// Service-level validation
	if err := s.validateRequest(req); err != nil {
		return RunSimulationResult{}, err
	}

	// Business logic, logging, metrics can go here
	result, elapsed, err := s.runner.Run(ctx, req.Algorithm, req.Grid, req.Start, req.Goal)
	if err != nil {
		// Service-level error handling
		return RunSimulationResult{}, fmt.Errorf("simulation failed: %w", err)
	}

	return RunSimulationResult{
		Result:  result,
		Elapsed: elapsed,
	}, nil
}

// validateRequest performs service-level validation
func (s *SimulationService) validateRequest(req RunSimulationRequest) error {
	if req.Algorithm == "" {
		return errors.New("algorithm is required")
	}

	// Validate algorithm name
	algoLower := strings.ToLower(req.Algorithm)
	if algoLower != "bfs" && algoLower != "dfs" && algoLower != "astar" && algoLower != "a*" {
		return errors.New("algorithm must be one of: bfs, dfs, astar, a*")
	}

	// Validate grid structure
	if len(req.Grid) == 0 {
		return errors.New("grid must be non-empty")
	}
	if len(req.Grid[0]) == 0 {
		return errors.New("grid rows must be non-empty")
	}

	// Validate grid dimensions consistency
	width := len(req.Grid[0])
	for i, row := range req.Grid {
		if len(row) != width {
			return fmt.Errorf("grid has inconsistent dimensions: row %d has width %d, expected %d", i, len(row), width)
		}
	}

	return nil
}

