package simulation

import (
	"context"
	"testing"
	"time"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestGrid() maze.Grid {
	grid := make(maze.Grid, 5)
	for y := range grid {
		row := make([]int, 5)
		for x := range row {
			row[x] = 0 // All walkable
		}
		grid[y] = row
	}
	return grid
}

func TestDefaultRunner_Run_BFS(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.Found)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
}

func TestDefaultRunner_Run_DFS(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "dfs", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.Found)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
}

func TestDefaultRunner_Run_AStar(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "astar", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.Found)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
}

func TestDefaultRunner_Run_AStarAlt(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "a*", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.Found)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
}

func TestDefaultRunner_Run_UnknownAlgorithm(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "unknown", grid, start, goal)
	assert.ErrorIs(t, err, ErrUnknownAlgorithm)
	assert.Nil(t, result)
	assert.Equal(t, time.Duration(0), elapsed)
}

func TestDefaultRunner_Run_CaseInsensitive(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	tests := []string{"BFS", "Dfs", "ASTAR", "A*"}

	for _, algo := range tests {
		t.Run(algo, func(t *testing.T) {
			result, _, err := runner.Run(ctx, algo, grid, start, goal)
			require.NoError(t, err)
			assert.NotNil(t, result)
		})
	}
}

func TestDefaultRunner_Run_OutOfBounds(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: -1, Y: 0}
	goal := maze.Point{X: 0, Y: 0}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	assert.ErrorIs(t, err, algorithm.ErrOutOfBounds)
	assert.Nil(t, result)
	assert.Equal(t, time.Duration(0), elapsed)
}

func TestDefaultRunner_Run_Blocked(t *testing.T) {
	grid := createTestGrid()
	grid[0][0] = 1 // Block start
	runner := NewRunner()
	ctx := context.Background()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	assert.ErrorIs(t, err, algorithm.ErrBlocked)
	assert.Nil(t, result)
	assert.Equal(t, time.Duration(0), elapsed)
}

func TestDefaultRunner_Run_NoPath(t *testing.T) {
	// Create grid with no path
	grid := make(maze.Grid, 3)
	for y := range grid {
		row := make([]int, 3)
		for x := range row {
			if x == 1 { // Middle column blocked
				row[x] = 1
			} else {
				row[x] = 0
			}
		}
		grid[y] = row
	}

	runner := NewRunner()
	ctx := context.Background()
	start := maze.Point{X: 0, Y: 1}
	goal := maze.Point{X: 2, Y: 1}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, result.Found)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
}

func TestDefaultRunner_Run_ContextCancellation(t *testing.T) {
	runner := NewRunner()
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	assert.Error(t, err)
	assert.Equal(t, context.Canceled, err)
	assert.Nil(t, result)
	assert.Equal(t, time.Duration(0), elapsed)
}

func TestDefaultRunner_Run_Timing(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	result, elapsed, err := runner.Run(ctx, "bfs", grid, start, goal)
	require.NoError(t, err)
	assert.NotNil(t, result)
	// Elapsed time should be reasonable (less than 1 second for small grid)
	assert.GreaterOrEqual(t, elapsed, time.Duration(0))
	assert.Less(t, elapsed, time.Second)
}

func TestDefaultRunner_Run_AllAlgorithms(t *testing.T) {
	runner := NewRunner()
	ctx := context.Background()
	grid := createTestGrid()
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	algorithms := []string{"bfs", "dfs", "astar", "a*"}

	for _, algo := range algorithms {
		t.Run(algo, func(t *testing.T) {
			result, elapsed, err := runner.Run(ctx, algo, grid, start, goal)
			require.NoError(t, err)
			assert.NotNil(t, result)
			assert.True(t, result.Found)
			assert.GreaterOrEqual(t, elapsed, time.Duration(0))
		})
	}
}

