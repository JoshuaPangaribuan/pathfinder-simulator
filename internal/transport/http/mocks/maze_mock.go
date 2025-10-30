package mocks

import (
	"context"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/stretchr/testify/mock"
)

// MockGenerator is a mock implementation of maze.Generator
type MockGenerator struct {
	mock.Mock
}

func (m *MockGenerator) Generate(ctx context.Context, width, height int, seed *int64) (maze.GenerateResult, error) {
	args := m.Called(ctx, width, height, seed)
	return args.Get(0).(maze.GenerateResult), args.Error(1)
}

