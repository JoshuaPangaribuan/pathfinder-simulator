package maze

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDefaultGenerator_Generate(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()

	result, err := gen.Generate(ctx, 5, 5, nil)
	require.NoError(t, err)
	assert.Equal(t, 11, result.Width)  // 5*2+1
	assert.Equal(t, 11, result.Height) // 5*2+1
	assert.NotNil(t, result.Grid)
	assert.Equal(t, 11, len(result.Grid))
	for _, row := range result.Grid {
		assert.Equal(t, 11, len(row))
	}
}

func TestDefaultGenerator_GenerateInvalidDimensions(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()

	tests := []struct {
		name          string
		width, height int
	}{
		{"width too small", 1, 5},
		{"height too small", 5, 1},
		{"both too small", 1, 1},
		{"width zero", 0, 5},
		{"height zero", 5, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := gen.Generate(ctx, tt.width, tt.height, nil)
			assert.ErrorIs(t, err, ErrInvalidDimensions)
		})
	}
}

func TestDefaultGenerator_GenerateWithSeed(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()
	seed := int64(12345)

	result1, err := gen.Generate(ctx, 5, 5, &seed)
	require.NoError(t, err)

	result2, err := gen.Generate(ctx, 5, 5, &seed)
	require.NoError(t, err)

	// Same seed should produce same maze
	assert.Equal(t, result1.Grid, result2.Grid)
	assert.Equal(t, result1.Seed, result2.Seed)
}

func TestDefaultGenerator_GenerateDifferentSeeds(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()
	seed1 := int64(12345)
	seed2 := int64(67890)

	result1, err := gen.Generate(ctx, 5, 5, &seed1)
	require.NoError(t, err)

	result2, err := gen.Generate(ctx, 5, 5, &seed2)
	require.NoError(t, err)

	// Different seeds should produce different mazes
	assert.NotEqual(t, result1.Grid, result2.Grid)
}

func TestDefaultGenerator_GenerateNilSeed(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()

	result, err := gen.Generate(ctx, 5, 5, nil)
	require.NoError(t, err)
	assert.Nil(t, result.Seed)
}

func TestDefaultGenerator_GenerateVariousSizes(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()

	tests := []struct {
		name          string
		width, height int
		expectedW     int
		expectedH     int
	}{
		{"small", 2, 2, 5, 5},
		{"medium", 10, 10, 21, 21},
		{"large", 50, 50, 101, 101},
		{"rectangular", 5, 10, 11, 21},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := gen.Generate(ctx, tt.width, tt.height, nil)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedW, result.Width)
			assert.Equal(t, tt.expectedH, result.Height)
		})
	}
}

func TestDefaultGenerator_GenerateContextCancellation(t *testing.T) {
	gen := NewGenerator()
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	_, err := gen.Generate(ctx, 5, 5, nil)
	assert.Error(t, err)
	assert.Equal(t, context.Canceled, err)
}

func TestDefaultGenerator_GeneratePerfectMaze(t *testing.T) {
	gen := NewGenerator()
	ctx := context.Background()

	result, err := gen.Generate(ctx, 10, 10, nil)
	require.NoError(t, err)

	// Check that maze has walls (1) and passages (0)
	hasWalls := false
	hasPassages := false
	for _, row := range result.Grid {
		for _, cell := range row {
			if cell == 1 {
				hasWalls = true
			}
			if cell == 0 {
				hasPassages = true
			}
		}
	}
	assert.True(t, hasWalls, "maze should have walls")
	assert.True(t, hasPassages, "maze should have passages")
}

