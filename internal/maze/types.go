package maze

// Point represents a 2D coordinate in the grid space where X increases to the right
// and Y increases downward.
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Grid models a maze grid where 0 indicates a walkable cell and 1 indicates a wall.
type Grid [][]int

// GenerateResult captures the payload returned to clients after maze generation.
type GenerateResult struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Grid   Grid   `json:"grid"`
	Seed   *int64 `json:"seed,omitempty"`
}
