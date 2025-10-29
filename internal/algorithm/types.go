package algorithm

import "github.com/JoshuaPangaribuan/pathfinder/internal/maze"

// Result captures the output of a pathfinding algorithm run.
type Result struct {
	Found         bool         `json:"found"`
	Path          []maze.Point `json:"path"`
	VisitedOrder  []maze.Point `json:"visitedOrder"`
	ExpandedNodes int          `json:"expandedNodes"`
	PathLength    int          `json:"pathLength"`
}
