package handlers

import (
	"Astro/internal/calculationCometService"
	"net/http"

	"github.com/labstack/echo/v4"
)

type CalculationCometHandler struct {
	service calculationCometService.CalculationCometService
}

func NewCalculationCometHandler(service calculationCometService.CalculationCometService) *CalculationCometHandler {
	return &CalculationCometHandler{service: service}
}

func (hand *CalculationCometHandler) PostCometObservation(context echo.Context) error {
	var requestCometInfo calculationCometService.CometObservationsRequest

	if err := context.Bind(&requestCometInfo); err != nil {
		return context.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if len(requestCometInfo.Observations) < 5 {
		return context.JSON(http.StatusBadRequest, map[string]string{"error": "Count obseravtions must be > 4"})
	}

	cometAllInfo, err := hand.service.CreateCometCalculation(requestCometInfo)

	if err != nil {
		return context.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	return context.JSON(http.StatusOK, cometAllInfo.Charestic)
}

func (hand *CalculationCometHandler) GetCometObseravtion(context echo.Context) error {
	cometsInfo, err := hand.service.GetAllCometsCalculation()

	if err != nil {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not get comets info"})
	}

	return context.JSON(http.StatusOK, cometsInfo)
}

func (hand *CalculationCometHandler) DeleteCometObservation(context echo.Context) error {
	id := context.Param("id")

	if err := hand.service.DeleteCometObservation(id); err != nil {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not delete comet info"})
	}

	return context.NoContent(http.StatusNoContent)
}
