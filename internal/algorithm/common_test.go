package algorithm

import (
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

// createTestGrid creates a simple test grid for testing algorithms
func createTestGrid(width, height int, walls []maze.Point) maze.Grid {
	grid := make(maze.Grid, height)
	for y := range grid {
		row := make([]int, width)
		for x := range row {
			row[x] = 0 // All walkable by default
		}
		grid[y] = row
	}
	// Add walls
	for _, wall := range walls {
		if wall.Y >= 0 && wall.Y < height && wall.X >= 0 && wall.X < width {
			grid[wall.Y][wall.X] = 1
		}
	}
	return grid
}

