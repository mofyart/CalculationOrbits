package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/google/uuid"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var database *gorm.DB

func InitDB() {
	dataSourceName := "host=localhost user=postgres password=art dbname=postgres port=5432 sslmode=disable"

	var err error

	database, err = gorm.Open(postgres.Open(dataSourceName), &gorm.Config{})

	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	if err := database.AutoMigrate(&CometObservations{}); err != nil {
		log.Fatalf("Could not migrate: %v", err)
	}
}

type OrbitalCharacteristic struct {
	LargeSemiAxis          string `json:"largeSemiAxis"`
	Eccentricity           string `json:"eccentricity"`
	Inclination            string `json:"inclination"`
	LongitudeAscendingNode string `json:"longitude"`
	Pericenter             string `json:"pericenter"`
	TrueAnomaly            string `json:"trueAnomaly"`
	Date                   string `json:"date"`
}

type Observation struct {
	directАscension      string `json:"directАscension"`
	celestialDeclination string `json:"celestialDeclination"`
	date                 string `json:"date"`
}

type CometObservations struct {
	ID           string           `gorm:"primaryKey" json:"id"`
	characteristic    OrbitalCharacteristic `json:"orbitalCharacteristic"`
	observations []Observation    `json:"observations"`
	picture      string           `json:"picture"`
}

type CometObservationsRequest struct {
	observations []Observation `json:"observations"`
	picture      string        `json:"picture"`
}

func postCometObservation(context echo.Context) error {
	var requestCometInfo CometObservationsRequest

	if err := context.Bind(&requestCometInfo); err != nil {
		return context.JSON(http.StatusBadRequest, map[string]string{"error": "Ivalid request"})
	}

	if len(requestCometInfo.observations) < 5 {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Count obseravtions must be > 4"})
	}

	cometInfo := CometObservations{
		ID:           uuid.NewString(),
		observations: requestCometInfo.observations,
		picture:      requestCometInfo.picture,
	}

	pythonServiceURL := "http://someurl-host:8080/astra/get_orbit"

	observationsJSON, marshallErr := json.Marshal(cometInfo.observations)
	if marshallErr != nil {
		return context.JSON(http.StatusBadRequest, echo.Map{"error": "serialization is failed"})
	}

	requestToCalculate, postErr := http.Post(pythonServiceURL, "application/json", bytes.NewBuffer(observationsJSON))
	if postErr != nil {
		return context.JSON(http.StatusServiceUnavailable, echo.Map{"error": "post to python is faied"})
	}

	defer requestToCalculate.Body.Close()

	if requestToCalculate.StatusCode != http.StatusOK {
		io.Copy(io.Discard, requestToCalculate.Body)
		return context.JSON(http.StatusServiceUnavailable, echo.Map{"error": "python calculation is failed"});
	}

	var orbCharacter OrbitalCharacteristic

	if err := json.NewDecoder(requestToCalculate.Body).Decode(&orbCharacter); err != nil {
		return context.JSON(http.StatusInternalServerError, echo.Map{"error": "decoding answer from python is failed"})
	}

	cometInfo.characteristic = orbCharacter

	if err := database.Create(&cometInfo).Error; err != nil {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Coud not create new InfoComet"})
	}

	return context.JSON(http.StatusOK, orbCharacter)
}


func getCometObseravtion(context echo.Context) error {
	var cometsInfo CometObservations

	if err := database.Find(&cometsInfo).Error; err != nil {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Coud not get comet"})
	}

	return context.JSON(http.StatusOK, cometsInfo)
}

func deleteCometObservation(context echo.Context) error {
	id := context.Param("id")

	if err := database.Delete(&CometObservations{}, "id = ?", id).Error; err != nil {
		return context.JSON(http.StatusInternalServerError, map[string]string{"error": "Coud not delete info comet"})
	}

	return context.NoContent(http.StatusNoContent)
}

// func pathCometObservation(context echo.Context) error {
//   id := context.Param("id")

//   var requestCometInfo CometObservationsRequest

//   err := context.Bind(&requestCometInfo)

//   if err != nil {
//     return context.JSON(http.StatusBadRequest, map[string]string{"error": "Ivalid request"})
//   }

//   var calculation Calculation

//   if err := database.First(&calculation, "id = ?", id); err != nil {
//     return c.JSON(http.StatusBadRequest, map[string]string{"error": "Could not to find calculation"})
//   }

//   calculation.Expression = request.Expression
//   calculation.Result = result
