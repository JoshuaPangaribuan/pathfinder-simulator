package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/lib/log"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/simulation"
)

// SimulationService handles simulation business logic
type SimulationService struct {
	runner simulation.Runner
	logger log.Logger
}

// NewSimulationService creates a new simulation service
func NewSimulationService(runner simulation.Runner, logger log.Logger) *SimulationService {
	return &SimulationService{
		runner: runner,
		logger: logger,
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
	gridHeight := len(req.Grid)
	gridWidth := 0
	if gridHeight > 0 {
		gridWidth = len(req.Grid[0])
	}

	s.logger.Info(ctx, "simulation requested",
		log.String("algorithm", req.Algorithm),
		log.Int("grid_width", gridWidth),
		log.Int("grid_height", gridHeight),
		log.Int("start_x", req.Start.X),
		log.Int("start_y", req.Start.Y),
		log.Int("goal_x", req.Goal.X),
		log.Int("goal_y", req.Goal.Y),
	)

	// Service-level validation
	if err := s.validateRequest(req); err != nil {
		s.logger.Warn(ctx, "simulation validation failed",
			log.Error(err),
			log.String("algorithm", req.Algorithm),
		)
		return RunSimulationResult{}, err
	}

	// Business logic, logging, metrics can go here
	result, elapsed, err := s.runner.Run(ctx, req.Algorithm, req.Grid, req.Start, req.Goal)
	if err != nil {
		s.logger.Error(ctx, "simulation failed", err,
			log.String("algorithm", req.Algorithm),
			log.Int("grid_width", gridWidth),
			log.Int("grid_height", gridHeight),
		)
		// Service-level error handling
		return RunSimulationResult{}, fmt.Errorf("simulation failed: %w", err)
	}

	s.logger.Info(ctx, "simulation completed",
		log.String("algorithm", req.Algorithm),
		log.Int("expanded_nodes", result.ExpandedNodes),
		log.Int("path_length", result.PathLength),
		log.Int64("elapsed_ms", elapsed.Milliseconds()),
		log.Bool("found", result.Found),
	)

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

