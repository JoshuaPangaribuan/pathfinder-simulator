package log

import (
	"context"
)

// Level represents a log level
type Level string

const (
	// LevelDebug is for debug-level messages
	LevelDebug Level = "DEBUG"
	// LevelInfo is for info-level messages
	LevelInfo Level = "INFO"
	// LevelWarn is for warning-level messages
	LevelWarn Level = "WARN"
	// LevelError is for error-level messages
	LevelError Level = "ERROR"
)

// Field represents a log field
type Field struct {
	Key   string
	Value interface{}
}

// String creates a string field
func String(key, value string) Field {
	return Field{Key: key, Value: value}
}

// Int creates an int field
func Int(key string, value int) Field {
	return Field{Key: key, Value: value}
}

// Int64 creates an int64 field
func Int64(key string, value int64) Field {
	return Field{Key: key, Value: value}
}

// Bool creates a bool field
func Bool(key string, value bool) Field {
	return Field{Key: key, Value: value}
}

// Error creates an error field
func Error(err error) Field {
	return Field{Key: "error", Value: err.Error()}
}

// Logger defines the interface for logging
type Logger interface {
	Debug(ctx context.Context, msg string, fields ...Field)
	Info(ctx context.Context, msg string, fields ...Field)
	Warn(ctx context.Context, msg string, fields ...Field)
	Error(ctx context.Context, msg string, err error, fields ...Field)
}

// NoOpLogger is a no-op logger implementation
type NoOpLogger struct{}

func (n *NoOpLogger) Debug(ctx context.Context, msg string, fields ...Field) {}
func (n *NoOpLogger) Info(ctx context.Context, msg string, fields ...Field)  {}
func (n *NoOpLogger) Warn(ctx context.Context, msg string, fields ...Field)  {}
func (n *NoOpLogger) Error(ctx context.Context, msg string, err error, fields ...Field) {}

// NewNoOpLogger creates a no-op logger
func NewNoOpLogger() Logger {
	return &NoOpLogger{}
}

