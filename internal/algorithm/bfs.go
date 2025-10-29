package algorithm

import "github.com/JoshuaPangaribuan/pathfinder/internal/maze"

// BFS performs breadth-first search on the given grid.
func BFS(grid maze.Grid, start, goal maze.Point) (*Result, error) {
	if !inBounds(grid, start) || !inBounds(grid, goal) {
		return nil, ErrOutOfBounds
	}
	if !isWalkable(grid, start) || !isWalkable(grid, goal) {
		return nil, ErrBlocked
	}

	queue := []maze.Point{start}
	visited := map[maze.Point]bool{start: true}
	parents := make(map[maze.Point]maze.Point)
	visitedOrder := make([]maze.Point, 0)

	var found bool

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		visitedOrder = append(visitedOrder, current)

		if current == goal {
			found = true
			break
		}

		for _, dir := range directions {
			next := maze.Point{X: current.X + dir.X, Y: current.Y + dir.Y}
			if !inBounds(grid, next) {
				continue
			}
			if !isWalkable(grid, next) {
				continue
			}
			if visited[next] {
				continue
			}

			visited[next] = true
			parents[next] = current
			queue = append(queue, next)
		}
	}

	result := &Result{
		Found:         found,
		VisitedOrder:  visitedOrder,
		ExpandedNodes: len(visitedOrder),
	}

	if found {
		path := buildPath(parents, start, goal)
		result.Path = path
		if len(path) > 0 {
			result.PathLength = len(path) - 1
		}
	}

	return result, nil
}
