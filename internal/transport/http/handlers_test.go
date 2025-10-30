package httptransport

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/lib/log"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/service"
	"github.com/JoshuaPangaribuan/pathfinder/internal/transport/http/mocks"
)

func setupTestRouter(handler *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler.Register(router)
	return router
}

func TestHandler_GenerateMaze_Success(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	ctx := context.Background()
	expectedResult := maze.GenerateResult{
		Width:  21,
		Height: 21,
		Grid:   make(maze.Grid, 21),
		Seed:   nil,
	}
	for i := range expectedResult.Grid {
		expectedResult.Grid[i] = make([]int, 21)
	}

	mockMazeService.On("GenerateMaze", ctx, service.GenerateMazeRequest{
		Width:  10,
		Height: 10,
		Seed:   nil,
	}).Return(expectedResult, nil)

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"width":  10,
		"height": 10,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/maze/generate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockMazeService.AssertExpectations(t)
}

func TestHandler_GenerateMaze_ValidationError(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"width":  1, // Too small
		"height": 10,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/maze/generate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockMazeService.AssertNotCalled(t, "GenerateMaze")
}

func TestHandler_GenerateMaze_InvalidDimensions(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	// Note: Validation happens before calling the generator,
	// so invalid dimensions (< 2) are caught by validation
	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"width":  1,
		"height": 1,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/maze/generate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	// Generator should not be called due to validation
	mockMazeService.AssertNotCalled(t, "GenerateMaze")
}

func TestHandler_Simulate_Success(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	ctx := context.Background()
	grid := createTestGrid(5, 5, nil)
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 4, Y: 4}

	expectedResult := &algorithm.Result{
		Found:         true,
		Path:          []maze.Point{{X: 0, Y: 0}, {X: 4, Y: 4}},
		VisitedOrder:  []maze.Point{{X: 0, Y: 0}},
		ExpandedNodes: 1,
		PathLength:    1,
	}

	mockSimService.On("RunSimulation", ctx, service.RunSimulationRequest{
		Algorithm: "bfs",
		Grid:      grid,
		Start:     start,
		Goal:      goal,
	}).Return(service.RunSimulationResult{
		Result:  expectedResult,
		Elapsed: time.Millisecond * 10,
	}, nil)

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "bfs",
		"grid":      grid,
		"start":     start,
		"goal":      goal,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockSimService.AssertExpectations(t)
}

func TestHandler_Simulate_NoPath(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	ctx := context.Background()
	grid := createTestGrid(3, 3, nil)
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 2, Y: 2}

	expectedResult := &algorithm.Result{
		Found:         false,
		Path:          []maze.Point{},
		VisitedOrder:  []maze.Point{},
		ExpandedNodes: 5,
		PathLength:    0,
	}

	mockSimService.On("RunSimulation", ctx, service.RunSimulationRequest{
		Algorithm: "bfs",
		Grid:      grid,
		Start:     start,
		Goal:      goal,
	}).Return(service.RunSimulationResult{
		Result:  expectedResult,
		Elapsed: time.Millisecond * 10,
	}, nil)

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "bfs",
		"grid":      grid,
		"start":     start,
		"goal":      goal,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
	mockSimService.AssertExpectations(t)
}

func TestHandler_Simulate_ValidationError(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "invalid",
		"grid":      maze.Grid{},
		"start":     maze.Point{X: 0, Y: 0},
		"goal":      maze.Point{X: 0, Y: 0},
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockSimService.AssertNotCalled(t, "RunSimulation")
}

func TestHandler_Simulate_UnknownAlgorithm(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	// Note: Handler calls service, and service validates algorithm name
	ctx := context.Background()
	grid := createTestGrid(5, 5, nil)
	mockSimService.On("RunSimulation", ctx, service.RunSimulationRequest{
		Algorithm: "invalid",
		Grid:      grid,
		Start:     maze.Point{X: 0, Y: 0},
		Goal:      maze.Point{X: 4, Y: 4},
	}).Return(service.RunSimulationResult{}, errors.New("algorithm must be one of: bfs, dfs, astar, a*"))

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "invalid",
		"grid":      grid,
		"start":     maze.Point{X: 0, Y: 0},
		"goal":      maze.Point{X: 4, Y: 4},
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockSimService.AssertExpectations(t)
}

func TestHandler_Simulate_OutOfBounds(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	ctx := context.Background()
	grid := createTestGrid(5, 5, nil)
	start := maze.Point{X: -1, Y: 0}
	goal := maze.Point{X: 0, Y: 0}

	mockSimService.On("RunSimulation", ctx, service.RunSimulationRequest{
		Algorithm: "bfs",
		Grid:      grid,
		Start:     start,
		Goal:      goal,
	}).Return(service.RunSimulationResult{}, errors.New("start or goal out of bounds"))

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "bfs",
		"grid":      grid,
		"start":     start,
		"goal":      goal,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockSimService.AssertExpectations(t)
}

func TestHandler_Simulate_Blocked(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	ctx := context.Background()
	grid := createTestGrid(5, 5, nil)
	start := maze.Point{X: 0, Y: 0}
	goal := maze.Point{X: 0, Y: 0}

	mockSimService.On("RunSimulation", ctx, service.RunSimulationRequest{
		Algorithm: "bfs",
		Grid:      grid,
		Start:     start,
		Goal:      goal,
	}).Return(service.RunSimulationResult{}, errors.New("start or goal blocked"))

	router := setupTestRouter(handler)

	reqBody := map[string]interface{}{
		"algorithm": "bfs",
		"grid":      grid,
		"start":     start,
		"goal":      goal,
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/simulate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockSimService.AssertExpectations(t)
}

func TestHandler_Health(t *testing.T) {
	mockMazeService := new(mocks.MockMazeService)
	mockSimService := new(mocks.MockSimulationService)
	logger := log.NewNoOpLogger()
	handler := NewHandler(mockMazeService, mockSimService, logger)

	router := setupTestRouter(handler)

	req := httptest.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Helper function to create test grid
func createTestGrid(width, height int, walls []maze.Point) maze.Grid {
	grid := make(maze.Grid, height)
	for y := range grid {
		row := make([]int, width)
		for x := range row {
			row[x] = 0 // All walkable by default
		}
		grid[y] = row
	}
	// Add walls
	for _, wall := range walls {
		if wall.Y >= 0 && wall.Y < height && wall.X >= 0 && wall.X < width {
			grid[wall.Y][wall.X] = 1
		}
	}
	return grid
}
