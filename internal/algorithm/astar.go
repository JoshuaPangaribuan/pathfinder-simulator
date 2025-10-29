package algorithm

import (
	"container/heap"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

// AStar performs A* search using Manhattan distance heuristic.
func AStar(grid maze.Grid, start, goal maze.Point) (*Result, error) {
	if !inBounds(grid, start) || !inBounds(grid, goal) {
		return nil, ErrOutOfBounds
	}
	if !isWalkable(grid, start) || !isWalkable(grid, goal) {
		return nil, ErrBlocked
	}

	openSet := newPriorityQueue()
	heap.Push(openSet, &node{point: start, priority: 0})

	gScore := map[maze.Point]float64{start: 0}
	parents := make(map[maze.Point]maze.Point)
	visitedOrder := make([]maze.Point, 0)
	closed := make(map[maze.Point]bool)

	var found bool

	for openSet.Len() > 0 {
		currentNode := heap.Pop(openSet).(*node)
		current := currentNode.point

		if closed[current] {
			continue
		}

		closed[current] = true
		visitedOrder = append(visitedOrder, current)

		if current == goal {
			found = true
			break
		}

		for _, dir := range directions {
			neighbor := maze.Point{X: current.X + dir.X, Y: current.Y + dir.Y}
			if !inBounds(grid, neighbor) || !isWalkable(grid, neighbor) {
				continue
			}
			if closed[neighbor] {
				continue
			}

			tentative := gScore[current] + 1
			if score, ok := gScore[neighbor]; ok && tentative >= score {
				continue
			}

			parents[neighbor] = current
			gScore[neighbor] = tentative
			fScore := tentative + heuristic(neighbor, goal)
			heap.Push(openSet, &node{point: neighbor, priority: fScore})
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

func heuristic(a, b maze.Point) float64 {
	dx := float64(abs(a.X - b.X))
	dy := float64(abs(a.Y - b.Y))
	return dx + dy
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
