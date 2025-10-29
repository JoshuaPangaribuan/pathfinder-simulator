package httptransport

import "github.com/gin-gonic/gin"

// UseStandardMiddleware wires logging, recovery, and optional CORS support.
func UseStandardMiddleware(r *gin.Engine, enableCORS bool) {
	r.Use(gin.Logger(), gin.Recovery())
	if enableCORS {
		r.Use(corsMiddleware())
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
