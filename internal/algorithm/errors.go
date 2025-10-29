package algorithm

import "errors"

var (
	// ErrOutOfBounds indicates a coordinate lays outside the grid.
	ErrOutOfBounds = errors.New("point outside grid bounds")
	// ErrBlocked indicates the coordinate is not walkable.
	ErrBlocked = errors.New("point is blocked")
)
