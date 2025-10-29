package algorithm

import "github.com/JoshuaPangaribuan/pathfinder/internal/maze"

// DFS performs depth-first search using an explicit stack.
func DFS(grid maze.Grid, start, goal maze.Point) (*Result, error) {
	if !inBounds(grid, start) || !inBounds(grid, goal) {
		return nil, ErrOutOfBounds
	}
	if !isWalkable(grid, start) || !isWalkable(grid, goal) {
		return nil, ErrBlocked
	}

	stack := []maze.Point{start}
	visited := map[maze.Point]bool{start: true}
	parents := make(map[maze.Point]maze.Point)
	visitedOrder := make([]maze.Point, 0)

	var found bool

	for len(stack) > 0 {
		current := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

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
			stack = append(stack, next)
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
