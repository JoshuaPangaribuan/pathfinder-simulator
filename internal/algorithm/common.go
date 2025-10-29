package algorithm

import "github.com/JoshuaPangaribuan/pathfinder/internal/maze"

var directions = []maze.Point{
	{X: 0, Y: -1},
	{X: 1, Y: 0},
	{X: 0, Y: 1},
	{X: -1, Y: 0},
}

func inBounds(grid maze.Grid, p maze.Point) bool {
	if p.Y < 0 || p.Y >= len(grid) {
		return false
	}
	if p.X < 0 || p.X >= len(grid[p.Y]) {
		return false
	}
	return true
}

func isWalkable(grid maze.Grid, p maze.Point) bool {
	return grid[p.Y][p.X] == 0
}

func buildPath(parent map[maze.Point]maze.Point, start, goal maze.Point) []maze.Point {
	path := []maze.Point{}
	current := goal
	for {
		path = append(path, current)
		if current == start {
			break
		}
		next, ok := parent[current]
		if !ok {
			break
		}
		current = next
	}

	// reverse path in-place
	for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
		path[i], path[j] = path[j], path[i]
	}
	return path
}
