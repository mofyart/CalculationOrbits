package main

import (
	"Astro/internal/calculationCometService"
	"Astro/internal/db"
	"Astro/internal/handlers"
	"log"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

	astroEcho.Use(middleware.CORS())
	astroEcho.Use(middleware.Logger())

	astroEcho.GET("/cometCalculation", astroHandlers.GetCometObseravtion)
	astroEcho.POST("/cometCalculation", astroHandlers.PostCometObservation)
	// astroEcho.PATCH("/cometCalculation/:id", patchCalculations)
	astroEcho.DELETE("/cometCalculation/:id", astroHandlers.DeleteCometObservation)

	astroEcho.Start("localhost:9090")
}
