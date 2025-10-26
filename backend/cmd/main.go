package main

import (
	"Astro/internal/calculationCometService"
	"Astro/internal/db"
	"Astro/internal/handlers"
	"log"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
)

func main() {
	database, err := db.InitDB()

	if err != nil {
		log.Fatalf("Could not to conect to DB: %v", err)
	}

	astroEcho := echo.New()

	astroRepository := calculationCometService.NewCometRepository(database)
	astroService := calculationCometService.NewCalculationCometService(astroRepository)
	astroHandlers := handlers.NewCalculationCometHandler(astroService)

	astroEcho.Use(middleware.CORSWithConfig(middleware.CORSConfig{AllowOrigins: []string{"https://localhost:9090"}, AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodDelete}, AllowCredentials: true, MaxAge: 300}))
	astroEcho.Use(middleware.Logger())

	astroEcho.GET("/api/cometCalculation", astroHandlers.GetCometObseravtion)
	astroEcho.POST("/api/cometCalculation", astroHandlers.PostCometObservation)
	astroEcho.DELETE("/api/cometCalculation/:id", astroHandlers.DeleteCometObservation)

	astroEcho.Start(":9090")
}
