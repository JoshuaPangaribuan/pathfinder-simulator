package httptransport

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/simulation"
)

// Handler wires HTTP endpoints to application logic.
type Handler struct{}

// NewHandler constructs a handler instance.
func NewHandler() *Handler {
	return &Handler{}
}

type generateRequest struct {
	Width  int    `json:"width"`  // required, >=2
	Height int    `json:"height"` // required, >=2
	Seed   *int64 `json:"seed"`
}

type simulateRequest struct {
	Algorithm string     `json:"algorithm"` // required
	Grid      maze.Grid  `json:"grid"`      // required
	Start     maze.Point `json:"start"`     // required
	Goal      maze.Point `json:"goal"`      // required
}

type simulateStats struct {
	ExpandedNodes int     `json:"expandedNodes"`
	PathLength    int     `json:"pathLength"`
	ElapsedMs     float64 `json:"elapsedMs"`
}

type simulateResponse struct {
	Found        bool          `json:"found"`
	Path         []maze.Point  `json:"path"`
	VisitedOrder []maze.Point  `json:"visitedOrder"`
	Stats        simulateStats `json:"stats"`
}

// Register attaches handlers to the provided router group.
func (h *Handler) Register(r *gin.Engine) {
	r.POST("/maze/generate", h.GenerateMaze)
	r.POST("/simulate", h.Simulate)
	r.GET("/healthz", h.Health)
}

// GenerateMaze handles POST /maze/generate.
func (h *Handler) GenerateMaze(c *gin.Context) {
	var req generateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := maze.Generate(req.Width, req.Height, req.Seed)
	if err != nil {
		switch err {
		case maze.ErrInvalidDimensions:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate maze"})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

// Simulate handles POST /simulate.
func (h *Handler) Simulate(c *gin.Context) {
	var req simulateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Grid) == 0 || len(req.Grid[0]) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "grid must be non-empty"})
		return
	}

	result, elapsed, err := simulation.Run(req.Algorithm, req.Grid, req.Start, req.Goal)
	if err != nil {
		switch err {
		case simulation.ErrUnknownAlgorithm:
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported algorithm"})
			return
		case algorithm.ErrOutOfBounds:
			c.JSON(http.StatusBadRequest, gin.H{"error": "start or goal out of bounds"})
			return
		case algorithm.ErrBlocked:
			c.JSON(http.StatusBadRequest, gin.H{"error": "start or goal blocked"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "simulation failed"})
			return
		}
	}

	if result == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "simulation returned no result"})
		return
	}

	stats := simulateStats{
		ExpandedNodes: result.ExpandedNodes,
		PathLength:    result.PathLength,
		ElapsedMs:     float64(elapsed) / float64(time.Millisecond),
	}

	resp := simulateResponse{
		Found:        result.Found,
		Path:         result.Path,
		VisitedOrder: result.VisitedOrder,
		Stats:        stats,
	}

	status := http.StatusOK
	if !result.Found {
		status = http.StatusUnprocessableEntity
	}

	c.JSON(status, resp)
}

// Health responds with application status.
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
