package main

import (
	"flag"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	httptransport "github.com/JoshuaPangaribuan/pathfinder/internal/transport/http"
	"github.com/JoshuaPangaribuan/pathfinder/web"
)

func main() {
	addr := flag.String("addr", ":8080", "server listen address")
	dev := flag.Bool("dev", false, "run in development mode (no embedded assets)")
	flag.Parse()

	router := gin.New()
	httptransport.UseStandardMiddleware(router, *dev)

	if *dev {
		// Development mode: register API routes only
		handler := httptransport.NewHandler()
		handler.Register(router)
		router.NoRoute(func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		})
	} else {
		// Production mode: register API routes first, then static files
		handler := httptransport.NewHandler()
		handler.Register(router)

		if err := attachEmbeddedFrontend(router); err != nil {
			log.Printf("failed to load embedded frontend: %v", err)
			router.NoRoute(func(c *gin.Context) {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			})
		}
	}

	log.Printf("listening on %s", *addr)
	if err := router.Run(*addr); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}

func attachEmbeddedFrontend(router *gin.Engine) error {
	dist, err := fs.Sub(web.Dist, "dist")
	if err != nil {
		return err
	}

	// Use NoRoute to serve static files - this avoids conflicts with API routes
	router.NoRoute(func(c *gin.Context) {
		// Determine the file path to serve
		path := c.Request.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Remove leading slash for fs operations
		filePath := path[1:]

		// Try to read the file
		data, err := fs.ReadFile(dist, filePath)
		if err != nil {
			// File not found, serve index.html for client-side routing
			data, err = fs.ReadFile(dist, "index.html")
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
		}

		// Determine content type based on file extension
		contentType := "text/html; charset=utf-8"
		if strings.HasSuffix(path, ".js") {
			contentType = "application/javascript"
		} else if strings.HasSuffix(path, ".css") {
			contentType = "text/css"
		} else if strings.HasSuffix(path, ".svg") {
			contentType = "image/svg+xml"
		}

		c.Data(http.StatusOK, contentType, data)
	})
	return nil
}
