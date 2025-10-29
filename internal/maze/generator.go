package maze

import (
	"errors"
	"math/rand"
	"time"
)

var (
	// ErrInvalidDimensions indicates the requested maze size is too small.
	ErrInvalidDimensions = errors.New("maze dimensions must be at least 2x2")
)

type cell struct {
	x int
	y int
}

// Generate constructs a perfect maze using the Recursive Backtracker algorithm.
// The resulting grid has dimensions (height*2+1) x (width*2+1) to encode walls
// and passages explicitly. If seed is nil, the generator uses the current time.
func Generate(width, height int, seed *int64) (GenerateResult, error) {
	if width < 2 || height < 2 {
		return GenerateResult{}, ErrInvalidDimensions
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	if seed != nil {
		rng = rand.New(rand.NewSource(*seed))
	}

	gridWidth := width*2 + 1
	gridHeight := height*2 + 1

	grid := make(Grid, gridHeight)
	for y := range grid {
		row := make([]int, gridWidth)
		for x := range row {
			row[x] = 1
		}
		grid[y] = row
	}

	visited := make([][]bool, height)
	for i := range visited {
		visited[i] = make([]bool, width)
	}

	stack := []cell{{x: 0, y: 0}}
	visited[0][0] = true
	carveCell(grid, 0, 0)

	for len(stack) > 0 {
		current := stack[len(stack)-1]
		neighbors := availableNeighbors(current, visited, width, height)

		if len(neighbors) == 0 {
			stack = stack[:len(stack)-1]
			continue
		}

		nextCell := neighbors[rng.Intn(len(neighbors))]

		carvePassage(grid, current, nextCell)
		visited[nextCell.y][nextCell.x] = true
		stack = append(stack, nextCell)
	}

	var seedCopy *int64
	if seed != nil {
		v := *seed
		seedCopy = &v
	}

	result := GenerateResult{
		Width:  gridWidth,
		Height: gridHeight,
		Grid:   grid,
		Seed:   seedCopy,
	}

	return result, nil
}

func availableNeighbors(c cell, visited [][]bool, width, height int) []cell {
	candidates := make([]cell, 0, 4)
	if c.y > 0 && !visited[c.y-1][c.x] {
		candidates = append(candidates, cell{x: c.x, y: c.y - 1})
	}
	if c.x+1 < width && !visited[c.y][c.x+1] {
		candidates = append(candidates, cell{x: c.x + 1, y: c.y})
	}
	if c.y+1 < height && !visited[c.y+1][c.x] {
		candidates = append(candidates, cell{x: c.x, y: c.y + 1})
	}
	if c.x > 0 && !visited[c.y][c.x-1] {
		candidates = append(candidates, cell{x: c.x - 1, y: c.y})
	}
	return candidates
}

func carveCell(grid Grid, cellX, cellY int) {
	gridY := cellY*2 + 1
	gridX := cellX*2 + 1
	grid[gridY][gridX] = 0
}

func carvePassage(grid Grid, from, to cell) {
	fromGridX := from.x*2 + 1
	fromGridY := from.y*2 + 1
	toGridX := to.x*2 + 1
	toGridY := to.y*2 + 1

	wallX := (fromGridX + toGridX) / 2
	wallY := (fromGridY + toGridY) / 2

	grid[toGridY][toGridX] = 0
	grid[wallY][wallX] = 0
}
