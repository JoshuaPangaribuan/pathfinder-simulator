package main

import (
	"flag"
	"io/fs"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	httptransport "github.com/JoshuaPangaribuan/pathfinder/internal/transport/http"
	"github.com/JoshuaPangaribuan/pathfinder/web"
)

func main() {
	addr := flag.String("addr", ":8080", "server listen address")
	dev := flag.Bool("dev", false, "run in development mode (no embedded assets)")
	flag.Parse()

	handler := httptransport.NewHandler()
	router := httptransport.NewRouter(handler, *dev)

	if *dev {
		router.NoRoute(func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		})
	} else {
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

	fileServer := http.FS(dist)
	router.StaticFS("/", fileServer)
	router.NoRoute(func(c *gin.Context) {
		data, err := fs.ReadFile(dist, "index.html")
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})
	return nil
}
