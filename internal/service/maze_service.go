package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
)

// MazeService handles maze generation business logic
type MazeService struct {
	generator maze.Generator
}

// NewMazeService creates a new maze service
func NewMazeService(gen maze.Generator) *MazeService {
	return &MazeService{
		generator: gen,
	}
}

// GenerateMazeRequest represents a request to generate a maze
type GenerateMazeRequest struct {
	Width  int
	Height int
	Seed   *int64
}

// GenerateMaze generates a maze with service-level validation and error handling
func (s *MazeService) GenerateMaze(ctx context.Context, req GenerateMazeRequest) (maze.GenerateResult, error) {
	// Service-level validation
	if err := s.validateRequest(req); err != nil {
		return maze.GenerateResult{}, err
	}

	// Business logic, logging, metrics can go here
	result, err := s.generator.Generate(ctx, req.Width, req.Height, req.Seed)
	if err != nil {
		// Service-level error handling
		return maze.GenerateResult{}, fmt.Errorf("maze generation failed: %w", err)
	}

	return result, nil
}

// validateRequest performs service-level validation
func (s *MazeService) validateRequest(req GenerateMazeRequest) error {
	if req.Width < 2 || req.Height < 2 {
		return errors.New("dimensions must be at least 2x2")
	}
	if req.Width > 100 || req.Height > 100 {
		return errors.New("dimensions must be at most 100x100")
	}
	return nil
}

