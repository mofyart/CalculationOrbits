package calculationCometService

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
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
		CharesticID:  uuid.NewString(),
		Observations: requestCometInfo.Observations,
	}

	pythonServiceURL := "http://backend-astra:8000/get_orbit"

	loadObservations := CometObservationsRequest{Observations: cometInfo.Observations}
	observationsJSON, marshallErr := json.Marshal(loadObservations)

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

	bodyBytes, _ := io.ReadAll(requestToCalculate.Body)

	if err := json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&orbCharacter); err != nil {
		return CometAllCharestic{}, err
	}

	fmt.Println("Response from Decoder service:", orbCharacter)

	orbCharacter.ID = cometInfo.ID

	cometInfo.Charestic = orbCharacter

	fmt.Println("Response from Decoder service:", cometInfo)

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
