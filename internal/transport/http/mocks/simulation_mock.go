package mocks

import (
	"context"
	"time"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/stretchr/testify/mock"
)

// MockRunner is a mock implementation of simulation.Runner
type MockRunner struct {
	mock.Mock
}

func (m *MockRunner) Run(ctx context.Context, algo string, grid maze.Grid, start, goal maze.Point) (*algorithm.Result, time.Duration, error) {
	args := m.Called(ctx, algo, grid, start, goal)
	if args.Get(0) == nil {
		return nil, args.Get(1).(time.Duration), args.Error(2)
	}
	return args.Get(0).(*algorithm.Result), args.Get(1).(time.Duration), args.Error(2)
}

