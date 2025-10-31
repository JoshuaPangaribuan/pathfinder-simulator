package algorithm

import "github.com/JoshuaPangaribuan/pathfinder/internal/maze"

// Result captures the output of a pathfinding algorithm run.
// It includes whether a path was found, the path itself, the order nodes were visited,
// the number of expanded nodes, and the path length.
type Result struct {
	Found         bool         `json:"found"`
	Path          []maze.Point `json:"path"`
	VisitedOrder  []maze.Point `json:"visitedOrder"`
	ExpandedNodes int          `json:"expandedNodes"`
	PathLength    int          `json:"pathLength"`
}
