package errors

import "fmt"

// ErrorCode represents a type-safe error code for API errors
type ErrorCode string

const (
	// ErrCodeValidation indicates a validation error
	ErrCodeValidation ErrorCode = "VALIDATION_ERROR"
	// ErrCodeNotFound indicates a resource not found error
	ErrCodeNotFound ErrorCode = "NOT_FOUND"
	// ErrCodeInternal indicates an internal server error
	ErrCodeInternal ErrorCode = "INTERNAL_ERROR"
	// ErrCodeOutOfBounds indicates a point is out of bounds
	ErrCodeOutOfBounds ErrorCode = "OUT_OF_BOUNDS"
	// ErrCodeBlocked indicates a point is blocked
	ErrCodeBlocked ErrorCode = "BLOCKED"
	// ErrCodeInvalidDimensions indicates invalid dimensions
	ErrCodeInvalidDimensions ErrorCode = "INVALID_DIMENSIONS"
	// ErrCodeUnknownAlgorithm indicates an unknown algorithm
	ErrCodeUnknownAlgorithm ErrorCode = "UNKNOWN_ALGORITHM"
)

// APIError represents a structured API error
type APIError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Details string    `json:"details,omitempty"`
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s (%s)", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// NewValidationError creates a new validation error
func NewValidationError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeValidation,
		Message: message,
	}
}

// NewValidationErrorWithDetails creates a new validation error with details
func NewValidationErrorWithDetails(message, details string) *APIError {
	return &APIError{
		Code:    ErrCodeValidation,
		Message: message,
		Details: details,
	}
}

// NewAPIError creates a new API error with the specified code and message
func NewAPIError(code ErrorCode, message string) *APIError {
	return &APIError{
		Code:    code,
		Message: message,
	}
}

// NewAPIErrorWithDetails creates a new API error with code, message, and details
func NewAPIErrorWithDetails(code ErrorCode, message, details string) *APIError {
	return &APIError{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// NewNotFoundError creates a new not found error
func NewNotFoundError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeNotFound,
		Message: message,
	}
}

// NewInternalError creates a new internal error
func NewInternalError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeInternal,
		Message: message,
	}
}

// NewOutOfBoundsError creates a new out of bounds error
func NewOutOfBoundsError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeOutOfBounds,
		Message: message,
	}
}

// NewBlockedError creates a new blocked error
func NewBlockedError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeBlocked,
		Message: message,
	}
}

// NewInvalidDimensionsError creates a new invalid dimensions error
func NewInvalidDimensionsError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeInvalidDimensions,
		Message: message,
	}
}

// NewUnknownAlgorithmError creates a new unknown algorithm error
func NewUnknownAlgorithmError(message string) *APIError {
	return &APIError{
		Code:    ErrCodeUnknownAlgorithm,
		Message: message,
	}
}

