package web

import "embed"

// Dist contains the compiled frontend assets.
//
//go:embed dist/*
var Dist embed.FS
