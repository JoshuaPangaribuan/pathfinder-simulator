package simulation

import (
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

type solverFunc func(maze.Grid, maze.Point, maze.Point) (*algorithm.Result, error)

// Run executes the requested algorithm and returns its result along with timing information.
func Run(algo string, grid maze.Grid, start, goal maze.Point) (*algorithm.Result, time.Duration, error) {
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
