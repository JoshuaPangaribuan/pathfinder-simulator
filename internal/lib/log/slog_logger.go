//go:build !zap && !zerolog

package log

import (
	"context"
	"log/slog"
	"os"
)

// SlogLogger implements Logger using the standard library slog package
type SlogLogger struct {
	logger *slog.Logger
}

// NewSlogLogger creates a new logger using slog (default)
func NewSlogLogger() Logger {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	return &SlogLogger{logger: logger}
}

// NewSlogLoggerWithLevel creates a new logger with a specific level
func NewSlogLoggerWithLevel(level Level) Logger {
	var slogLevel slog.Level
	switch level {
	case LevelDebug:
		slogLevel = slog.LevelDebug
	case LevelInfo:
		slogLevel = slog.LevelInfo
	case LevelWarn:
		slogLevel = slog.LevelWarn
	case LevelError:
		slogLevel = slog.LevelError
	default:
		slogLevel = slog.LevelInfo
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slogLevel,
	}))
	return &SlogLogger{logger: logger}
}

func (l *SlogLogger) Debug(ctx context.Context, msg string, fields ...Field) {
	l.log(ctx, slog.LevelDebug, msg, nil, fields...)
}

func (l *SlogLogger) Info(ctx context.Context, msg string, fields ...Field) {
	l.log(ctx, slog.LevelInfo, msg, nil, fields...)
}

func (l *SlogLogger) Warn(ctx context.Context, msg string, fields ...Field) {
	l.log(ctx, slog.LevelWarn, msg, nil, fields...)
}

func (l *SlogLogger) Error(ctx context.Context, msg string, err error, fields ...Field) {
	l.log(ctx, slog.LevelError, msg, err, fields...)
}

func (l *SlogLogger) log(ctx context.Context, level slog.Level, msg string, err error, fields ...Field) {
	attrs := make([]any, 0, len(fields)*2+2)

	// Extract request ID from context if available
	if reqID := ctx.Value("request_id"); reqID != nil {
		if id, ok := reqID.(string); ok {
			attrs = append(attrs, "request_id", id)
		}
	}

	// Add error if present
	if err != nil {
		attrs = append(attrs, "error", err.Error())
	}

	// Add fields
	for _, f := range fields {
		attrs = append(attrs, f.Key, f.Value)
	}

	l.logger.Log(ctx, level, msg, attrs...)
}

// NewLogger creates a new logger instance (defaults to slog)
func NewLogger() Logger {
	return NewSlogLogger()
}

// NewLoggerWithLevel creates a new logger with a specific level (defaults to slog)
func NewLoggerWithLevel(level Level) Logger {
	return NewSlogLoggerWithLevel(level)
}

