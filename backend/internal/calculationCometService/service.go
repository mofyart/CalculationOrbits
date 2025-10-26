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

func (service *calculationCometService) PostMainCalculatePython(requestCometInfo *CometObservationsRequest) (OrbitalCharestic, error) {
	pythonServiceURL := "http://backend-astra:8000/get_orbit"

	loadObservations := CometObservationsRequest{Observations: requestCometInfo.Observations}
	observationsJSON, marshallErr := json.Marshal(loadObservations)

	if marshallErr != nil {
		return OrbitalCharestic{}, marshallErr
	}

	requestToCalculate, postErr := http.Post(pythonServiceURL, "application/json", bytes.NewBuffer(observationsJSON))

	if postErr != nil {
		return OrbitalCharestic{}, postErr
	}

	defer requestToCalculate.Body.Close()

	if requestToCalculate.StatusCode != http.StatusOK {
		io.Copy(io.Discard, requestToCalculate.Body)
		err := errors.New("python calculation is failed")

		return OrbitalCharestic{}, err
	}

	var orbCharacter OrbitalCharestic

	bodyBytes, _ := io.ReadAll(requestToCalculate.Body)

	if err := json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&orbCharacter); err != nil {
		return OrbitalCharestic{}, err
	}

	return orbCharacter, nil
}

func (service *calculationCometService) CreateCometCalculation(requestCometInfo CometObservationsRequest) (CometAllCharestic, error) {
	cometInfo := CometAllCharestic{
		ID:           uuid.NewString(),
		CharesticID:  uuid.NewString(),
		Observations: requestCometInfo.Observations,
	}

	for id, _ := range cometInfo.Observations {
		cometInfo.Observations[id].ID = uuid.NewString()
		cometInfo.Observations[id].CometID = cometInfo.ID
	}

	orbCharacter, err := service.PostMainCalculatePython(&requestCometInfo)

	if err != nil {
		return CometAllCharestic{}, err
	}

	orbCharacter.ID = cometInfo.ID
	cometInfo.Charestic = orbCharacter
	cometInfo.NameComet = requestCometInfo.NameComet

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
