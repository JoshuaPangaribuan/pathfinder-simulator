package mocks

import (
	"context"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/service"
	"github.com/stretchr/testify/mock"
)

// MockMazeService is a mock implementation of service.MazeServiceInterface
type MockMazeService struct {
	mock.Mock
}

func (m *MockMazeService) GenerateMaze(ctx context.Context, req service.GenerateMazeRequest) (maze.GenerateResult, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(maze.GenerateResult), args.Error(1)
}

// MockSimulationService is a mock implementation of service.SimulationServiceInterface
type MockSimulationService struct {
	mock.Mock
}

func (m *MockSimulationService) RunSimulation(ctx context.Context, req service.RunSimulationRequest) (service.RunSimulationResult, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(service.RunSimulationResult), args.Error(1)
}

