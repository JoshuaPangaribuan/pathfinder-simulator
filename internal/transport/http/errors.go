package httptransport

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	apierrors "github.com/JoshuaPangaribuan/pathfinder/internal/errors"
	"github.com/JoshuaPangaribuan/pathfinder/internal/algorithm"
	"github.com/JoshuaPangaribuan/pathfinder/internal/maze"
	"github.com/JoshuaPangaribuan/pathfinder/internal/simulation"
)

// handleError handles errors and maps them to appropriate HTTP responses
func (h *Handler) handleError(c *gin.Context, err error) {
	var apiErr *apierrors.APIError
	if errors.As(err, &apiErr) {
		status := mapErrorToStatusCode(apiErr.Code)
		c.JSON(status, apiErr)
		return
	}

	// Handle domain errors
	if err == maze.ErrInvalidDimensions {
		apiErr := apierrors.NewInvalidDimensionsError(err.Error())
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if err == simulation.ErrUnknownAlgorithm {
		apiErr := apierrors.NewUnknownAlgorithmError(err.Error())
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if err == algorithm.ErrOutOfBounds {
		apiErr := apierrors.NewOutOfBoundsError(err.Error())
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if err == algorithm.ErrBlocked {
		apiErr := apierrors.NewBlockedError(err.Error())
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}

	// Handle wrapped errors
	errStr := err.Error()
	if strings.Contains(errStr, "dimensions must be") {
		apiErr := apierrors.NewInvalidDimensionsError(errStr)
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if strings.Contains(errStr, "algorithm must be") {
		apiErr := apierrors.NewUnknownAlgorithmError(errStr)
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if strings.Contains(errStr, "grid must be") {
		apiErr := apierrors.NewValidationError(errStr)
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if strings.Contains(errStr, "out of bounds") || strings.Contains(errStr, "outside grid bounds") {
		apiErr := apierrors.NewOutOfBoundsError(errStr)
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}
	if strings.Contains(errStr, "blocked") {
		apiErr := apierrors.NewBlockedError(errStr)
		c.JSON(http.StatusBadRequest, apiErr)
		return
	}

	// Default to internal error
	apiErr = apierrors.NewInternalError("an internal error occurred")
	c.JSON(http.StatusInternalServerError, apiErr)
}

// mapErrorToStatusCode maps error codes to HTTP status codes
func mapErrorToStatusCode(code apierrors.ErrorCode) int {
	switch code {
	case apierrors.ErrCodeValidation:
		return http.StatusBadRequest
	case apierrors.ErrCodeInvalidDimensions:
		return http.StatusBadRequest
	case apierrors.ErrCodeUnknownAlgorithm:
		return http.StatusBadRequest
	case apierrors.ErrCodeOutOfBounds:
		return http.StatusBadRequest
	case apierrors.ErrCodeBlocked:
		return http.StatusBadRequest
	case apierrors.ErrCodeNotFound:
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}

