package httptransport

import "github.com/gin-gonic/gin"

// NewRouter builds a Gin engine with handlers registered.
func NewRouter(handler *Handler, enableCORS bool) *gin.Engine {
	r := gin.New()
	UseStandardMiddleware(r, enableCORS)
	handler.Register(r)
	return r
}
