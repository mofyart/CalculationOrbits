package calculationCometService

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/google/uuid"
)

type CalculationCometService interface {
	CreateCometCalculation(requestCometInfo CometObservationsRequest) (CometAllCharestic, error)
	GetAllCometsCalculation() ([]CometAllCharestic, error)
	GetCometCalculation(id string) (CometAllCharestic, error)
	DeleteCometObservation(id string) error
}

type calculationCometService struct {
	repository CometCalculationRepository
}

func NewCalculationCometService(repo CometCalculationRepository) CalculationCometService {
	return &calculationCometService{repository: repo}
}

func (service *calculationCometService) CreateCometCalculation(requestCometInfo CometObservationsRequest) (CometAllCharestic, error) {
	cometInfo := CometAllCharestic{
		ID:           uuid.NewString(),
		Observations: requestCometInfo.Observations,
		Picture:      requestCometInfo.Picture,
	}

	pythonServiceURL := "http://someurl-host:8080/some_route"

	observationsJSON, marshallErr := json.Marshal(cometInfo.Observations)

	if marshallErr != nil {
		return CometAllCharestic{}, marshallErr
	}

	requestToCalculate, postErr := http.Post(pythonServiceURL, "application/json", bytes.NewBuffer(observationsJSON))

	if postErr != nil {
		return CometAllCharestic{}, postErr
	}

	defer requestToCalculate.Body.Close()

	if requestToCalculate.StatusCode != http.StatusOK {
		io.Copy(io.Discard, requestToCalculate.Body)
		err := errors.New("python calculation is failed")

		return CometAllCharestic{}, err
	}

	var orbCharacter OrbitalCharestic

	if err := json.NewDecoder(requestToCalculate.Body).Decode(&orbCharacter); err != nil {
		return CometAllCharestic{}, err
	}

	cometInfo.Charestic = orbCharacter

	var orbitalCharestic OrbitalCharestic

	cometInfo.Charestic = orbitalCharestic

	if err := service.repository.CreateCometCalculation(cometInfo); err != nil {
		return CometAllCharestic{}, err
	}

	return cometInfo, nil
}

func (service *calculationCometService) GetAllCometsCalculation() ([]CometAllCharestic, error) {
	return service.repository.GetAllCometsCalculation()
}

func (service *calculationCometService) GetCometCalculation(id string) (CometAllCharestic, error) {
	return service.repository.GetCometCalculation(id)
}

func (service *calculationCometService) DeleteCometObservation(id string) error {
	return service.repository.DeleteCometObservation(id)
}
