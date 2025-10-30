package httptransport

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/service"
)

// Handler wires HTTP endpoints to application logic.
type Handler struct {
	mazeService    service.MazeServiceInterface
	simService     service.SimulationServiceInterface
}

// NewHandler constructs a handler instance with dependencies.
func NewHandler(mazeService service.MazeServiceInterface, simService service.SimulationServiceInterface) *Handler {
	return &Handler{
		mazeService: mazeService,
		simService:  simService,
	}
}

type generateRequest struct {
	Width  int    `json:"width" binding:"required,min=2,max=100"`
	Height int    `json:"height" binding:"required,min=2,max=100"`
	Seed   *int64 `json:"seed"`
}

type simulateRequest struct {
	Algorithm string     `json:"algorithm" binding:"required"`
	Grid      maze.Grid  `json:"grid" binding:"required,min=1"`
	Start     maze.Point `json:"start" binding:"required"`
	Goal      maze.Point `json:"goal" binding:"required"`
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
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "validation failed",
				"details": formatValidationErrors(validationErrors),
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	result, err := h.mazeService.GenerateMaze(ctx, service.GenerateMazeRequest{
		Width:  req.Width,
		Height: req.Height,
		Seed:   req.Seed,
	})
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// Simulate handles POST /simulate.
func (h *Handler) Simulate(c *gin.Context) {
	var req simulateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "validation failed",
				"details": formatValidationErrors(validationErrors),
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	simResult, err := h.simService.RunSimulation(ctx, service.RunSimulationRequest{
		Algorithm: req.Algorithm,
		Grid:      req.Grid,
		Start:     req.Start,
		Goal:      req.Goal,
	})
	if err != nil {
		h.handleError(c, err)
		return
	}

	result := simResult.Result
	if result == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "simulation returned no result"})
		return
	}

	stats := simulateStats{
		ExpandedNodes: result.ExpandedNodes,
		PathLength:    result.PathLength,
		ElapsedMs:     float64(simResult.Elapsed) / float64(time.Millisecond),
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

// formatValidationErrors formats validator errors into a readable map
func formatValidationErrors(errs validator.ValidationErrors) map[string]string {
	errors := make(map[string]string)
	for _, err := range errs {
		field := err.Field()
		tag := err.Tag()
		var message string
		switch tag {
		case "required":
			message = fmt.Sprintf("%s is required", field)
		case "min":
			message = fmt.Sprintf("%s must be at least %s", field, err.Param())
		case "max":
			message = fmt.Sprintf("%s must be at most %s", field, err.Param())
		case "oneof":
			message = fmt.Sprintf("%s must be one of: %s", field, err.Param())
		default:
			message = fmt.Sprintf("%s is invalid", field)
		}
		errors[field] = message
	}
	return errors
}

// Health responds with application status.
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
