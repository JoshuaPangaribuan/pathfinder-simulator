package algorithm

import (
	"testing"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBFS_ValidPath(t *testing.T) {
	grid := createTestGrid(4, 4, []maze.Point{
		{X: 2, Y: 0},
		{X: 2, Y: 2},
	})
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 3, Y: 3}

	result, err := BFS(grid, start, goal)
	require.NoError(t, err)
	assert.True(t, result.Found)
	assert.NotEmpty(t, result.Path)
	assert.Greater(t, result.ExpandedNodes, 0)
	assert.Greater(t, result.PathLength, 0)
	// Verify path starts and ends correctly
	assert.Equal(t, start, result.Path[0])
	assert.Equal(t, goal, result.Path[len(result.Path)-1])
}

func TestBFS_NoPath(t *testing.T) {
	// Create a grid with a wall blocking all paths
	grid := createTestGrid(3, 3, []maze.Point{
		{X: 1, Y: 0},
		{X: 1, Y: 1},
		{X: 1, Y: 2},
	})
	start := maze.Point{X: 0, Y: 1}
	goal := maze.Point{X: 2, Y: 1}

	result, err := BFS(grid, start, goal)
	require.NoError(t, err)
	assert.False(t, result.Found)
	assert.Empty(t, result.Path)
	assert.Greater(t, result.ExpandedNodes, 0)
}

func TestBFS_OutOfBounds(t *testing.T) {
	grid := createTestGrid(2, 2, nil)

	tests := []struct {
		name  string
		start maze.Point
		goal  maze.Point
	}{
		{"start out of bounds", maze.Point{X: -1, Y: 0}, maze.Point{X: 0, Y: 0}},
		{"goal out of bounds", maze.Point{X: 0, Y: 0}, maze.Point{X: -1, Y: 0}},
		{"start Y negative", maze.Point{X: 0, Y: -1}, maze.Point{X: 0, Y: 0}},
		{"goal X too large", maze.Point{X: 0, Y: 0}, maze.Point{X: 10, Y: 0}},
		{"goal Y too large", maze.Point{X: 0, Y: 0}, maze.Point{X: 0, Y: 10}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := BFS(grid, tt.start, tt.goal)
			assert.ErrorIs(t, err, ErrOutOfBounds)
		})
	}
}

func TestBFS_Blocked(t *testing.T) {
	grid := createTestGrid(3, 3, []maze.Point{
		{X: 1, Y: 1}, // Block the start
	})
	start := maze.Point{X: 1, Y: 1}
	goal := maze.Point{X: 2, Y: 2}

	_, err := BFS(grid, start, goal)
	assert.ErrorIs(t, err, ErrBlocked)

	// Test blocked goal
	grid2 := createTestGrid(3, 3, []maze.Point{
		{X: 2, Y: 2}, // Block the goal
	})
	start2 := maze.Point{X: 0, Y: 0}
	goal2 := maze.Point{X: 2, Y: 2}

	_, err = BFS(grid2, start2, goal2)
	assert.ErrorIs(t, err, ErrBlocked)
}

func TestBFS_SameStartAndGoal(t *testing.T) {
	grid := createTestGrid(3, 3, nil)
	start := maze.Point{X: 1, Y: 1}
	goal := maze.Point{X: 1, Y: 1}

	result, err := BFS(grid, start, goal)
	require.NoError(t, err)
	assert.True(t, result.Found)
	assert.Len(t, result.Path, 1)
	assert.Equal(t, start, result.Path[0])
	assert.Equal(t, 0, result.PathLength)
}

func TestBFS_LinearPath(t *testing.T) {
	// Create a simple linear path
	grid := createTestGrid(5, 1, nil)
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 0}

	result, err := BFS(grid, start, goal)
	require.NoError(t, err)
	assert.True(t, result.Found)
	assert.Len(t, result.Path, 5) // Should be exactly 5 steps
	assert.Equal(t, 4, result.PathLength)
}

func TestBFS_ExpandedNodes(t *testing.T) {
	grid := createTestGrid(10, 10, nil)
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 9, Y: 9}

	result, err := BFS(grid, start, goal)
	require.NoError(t, err)
	assert.True(t, result.Found)
	// BFS should expand nodes in order, so expanded nodes should be around path length
	assert.GreaterOrEqual(t, result.ExpandedNodes, result.PathLength)
}

