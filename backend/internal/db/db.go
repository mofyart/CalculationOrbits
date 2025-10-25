package db

import (
	"Astro/internal/calculationCometService"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var database *gorm.DB

func InitDB() (*gorm.DB, error) {
	dataSourceName := "host=localhost user=postgres password=art dbname=postgres port=5432 sslmode=disable"

	var err error

	database, err = gorm.Open(postgres.Open(dataSourceName), &gorm.Config{})

	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	if err := database.AutoMigrate(&calculationCometService.CometAllCharestic{}); err != nil {
		log.Fatalf("Could not migrate: %v", err)
	}

	return database, nil
}
