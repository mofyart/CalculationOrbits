package calculationCometService

import (
	"gorm.io/gorm"
)

type CometCalculationRepository interface {
	CreateCometCalculation(comet CometAllCharestic) error
	GetAllCometsCalculation() ([]CometAllCharestic, error)
	GetCometCalculation(id string) (CometAllCharestic, error)
	DeleteCometObservation(id string) error
}

type cometRepository struct {
	database *gorm.DB
}

func NewCometRepository(db *gorm.DB) CometCalculationRepository {
	return &cometRepository{database: db}
}

func (repository *cometRepository) CreateCometCalculation(comet CometAllCharestic) error {
	return repository.database.Create(&comet).Error
}

func (repository *cometRepository) GetAllCometsCalculation() ([]CometAllCharestic, error) {
	var cometsInfo []CometAllCharestic

	err := repository.database.
		Preload("Observations").
		Preload("Charestic").
		Where("id IS NOT NULL").
		Find(&cometsInfo).Error

	return cometsInfo, err
}

func (repository *cometRepository) GetCometCalculation(id string) (CometAllCharestic, error) {
	var comet CometAllCharestic

	err := repository.database.
		Preload("Observations").
		Preload("Charestic").
		First(&comet, "id = ?", id).Error

	return comet, err

}

func (repository *cometRepository) DeleteCometObservation(id string) error {
	var comet CometAllCharestic
	err := repository.database.Preload("Observations").Preload("Charestic").First(&comet, "id = ?", id).Error
	if err != nil {
		return err
	}
	return repository.database.Delete(&comet).Error
}
