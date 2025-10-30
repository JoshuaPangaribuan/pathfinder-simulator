package simulation

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

var (
	// ErrUnknownAlgorithm is returned when a solver key is unsupported.
	ErrUnknownAlgorithm = errors.New("unknown algorithm")
)

// Runner defines the interface for pathfinding simulation services
type Runner interface {
	Run(ctx context.Context, algorithm string, grid maze.Grid, start, goal maze.Point) (*algorithm.Result, time.Duration, error)
}

// DefaultRunner implements Runner
type DefaultRunner struct {
	// Future: can add logger, metrics, algorithm registry, etc.
}

// NewRunner creates a new default simulation runner
func NewRunner() Runner {
	return &DefaultRunner{}
}

type solverFunc func(maze.Grid, maze.Point, maze.Point) (*algorithm.Result, error)

// Run executes the requested algorithm and returns its result along with timing information.
func (r *DefaultRunner) Run(ctx context.Context, algo string, grid maze.Grid, start, goal maze.Point) (*algorithm.Result, time.Duration, error) {
	// Check context cancellation
	if err := ctx.Err(); err != nil {
		return nil, 0, err
	}

	solver, err := selectSolver(algo)
	if err != nil {
		return nil, 0, err
	}

	began := time.Now()
	result, err := solver(grid, start, goal)
	elapsed := time.Since(began)

	return result, elapsed, err
}

func selectSolver(algo string) (solverFunc, error) {
	switch strings.ToLower(algo) {
	case "bfs":
		return algorithm.BFS, nil
	case "dfs":
		return algorithm.DFS, nil
	case "astar", "a*":
		return algorithm.AStar, nil
	default:
		return nil, ErrUnknownAlgorithm
	}
}
