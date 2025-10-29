# Algorithm Package

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)

The `algorithm` package provides implementations of classical pathfinding algorithms for grid-based mazes. It includes BFS (Breadth-First Search), DFS (Depth-First Search), and A* search algorithms, along with supporting data structures and utilities.

## Overview

This package is part of the Pathfinder project, providing the core pathfinding logic that powers the maze visualization application. All algorithms operate on 2D grid representations where:
- `0` represents walkable cells
- Non-zero values represent walls/obstacles
- Start and goal positions must be walkable cells

## Algorithms

### Breadth-First Search (BFS)

```go
result, err := algorithm.BFS(grid, start, goal)
```

BFS explores the grid level by level, guaranteeing the shortest path in terms of number of steps. It uses a FIFO queue and is optimal for unweighted grids.

**Time Complexity:** O(V + E) where V is vertices and E is edges  
**Space Complexity:** O(V)  
**Optimality:** Yes (finds shortest path)

### Depth-First Search (DFS)

```go
result, err := algorithm.DFS(grid, start, goal)
```

DFS explores as far as possible along each branch before backtracking. It uses a LIFO stack and does not guarantee the shortest path.

**Time Complexity:** O(V + E) where V is vertices and E is edges  
**Space Complexity:** O(V)  
**Optimality:** No (does not guarantee shortest path)

### A* Search

```go
result, err := algorithm.AStar(grid, start, goal)
```

A* is an informed search algorithm that uses a heuristic to guide the search towards the goal. This implementation uses Manhattan distance as the heuristic, making it optimal for grid-based pathfinding.

**Time Complexity:** O(b^d) where b is branching factor and d is depth (typically better than uninformed search)  
**Space Complexity:** O(V)  
**Optimality:** Yes (with admissible heuristic)

## Data Structures

### Result

The `Result` struct captures the complete output of any pathfinding algorithm:

```go
type Result struct {
    Found         bool         `json:"found"`         // Whether path was found
    Path          []maze.Point `json:"path"`          // Path from start to goal (if found)
    VisitedOrder  []maze.Point `json:"visitedOrder"`  // Order nodes were visited
    ExpandedNodes int          `json:"expandedNodes"` // Number of nodes explored
    PathLength    int          `json:"pathLength"`    // Length of path (steps)
}
```

### Priority Queue

A min-heap priority queue implementation used by the A* algorithm:

```go
type priorityQueue []*node

func newPriorityQueue() *priorityQueue
```

The priority queue manages nodes with associated priority values (f-scores in A*), ensuring the lowest priority node is always dequeued first.

## Error Handling

The package defines specific errors for common failure conditions:

```go
var (
    ErrOutOfBounds = errors.New("point outside grid bounds")  // Start/goal outside grid
    ErrBlocked     = errors.New("point is blocked")           // Start/goal on wall
)
```

All algorithms return these errors if the start or goal positions are invalid.

## Common Utilities

### Grid Validation

```go
func inBounds(grid maze.Grid, p maze.Point) bool    // Check if point is within grid bounds
func isWalkable(grid maze.Grid, p maze.Point) bool  // Check if cell is walkable (value 0)
```

### Path Construction

```go
func buildPath(parent map[maze.Point]maze.Point, start, goal maze.Point) []maze.Point
```

Reconstructs the path from start to goal using a parent map created during search.

## Usage Example

```go
package main

import (
    "fmt"
    "log"

    "github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
    "github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

func main() {
    // Create a simple 3x3 grid (0 = walkable, 1 = wall)
    grid := maze.Grid{
        {0, 0, 0},
        {0, 1, 0},
        {0, 0, 0},
    }

    start := maze.Point{X: 0, Y: 0}
    goal := maze.Point{X: 2, Y: 2}

    // Run BFS
    result, err := algorithm.BFS(grid, start, goal)
    if err != nil {
        log.Fatal(err)
    }

    if result.Found {
        fmt.Printf("Path found! Length: %d, Nodes expanded: %d\n",
            result.PathLength, result.ExpandedNodes)
        fmt.Printf("Path: %v\n", result.Path)
    } else {
        fmt.Println("No path found")
    }
}
```

## Performance Characteristics

| Algorithm | Time Complexity | Space Complexity | Optimal Path | Use Case |
|-----------|----------------|------------------|--------------|----------|
| BFS | O(V + E) | O(V) | Yes | Shortest path in unweighted grids |
| DFS | O(V + E) | O(V) | No | Memory-constrained scenarios |
| A* | O(b^d) | O(V) | Yes | Large grids, informed search |

## Implementation Notes

- **Movement Directions:** All algorithms use 4-way movement (up, down, left, right)
- **Visited Tracking:** Each algorithm maintains its own visited set to prevent cycles
- **Path Reconstruction:** Uses parent pointers to reconstruct paths after search completion
- **Heuristic:** A* uses Manhattan distance (L1 norm) for optimal grid pathfinding
- **Thread Safety:** Algorithms are not thread-safe; create separate instances for concurrent use

## Dependencies

- `container/heap` - Standard library heap operations for priority queue
- `github.com/JoshuaPangaribuan/pathfinder/internal/maze` - Grid and point definitions

## Files

- `types.go` - Core data structures (Result)
- `errors.go` - Error definitions
- `common.go` - Shared utilities and constants
- `priority_queue.go` - Heap implementation for A*
- `bfs.go` - Breadth-first search implementation
- `dfs.go` - Depth-first search implementation
- `astar.go` - A* search implementation

## Testing

Run the algorithm tests:

```bash
go test ./internal/algorithm/...
```

## Integration

This package integrates with the simulation layer (`internal/simulation`) which handles timing, orchestration, and streaming of algorithm results to the web frontend.
