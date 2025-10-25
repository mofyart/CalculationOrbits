package db

import (
	"Astro/internal/calculationCometService"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var database *gorm.DB

func InitDB() (*gorm.DB, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default values")
	}

	host := getEnv("DB_HOST", "localhost")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "art")
	dbname := getEnv("DB_NAME", "postgres")
	port := getEnv("DB_PORT", "5432")
	sslmode := getEnv("DB_SSLMODE", "disable")

	dataSourceName := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host, user, password, dbname, port, sslmode,
	)

	var err error

	database, err = gorm.Open(postgres.Open(dataSourceName), &gorm.Config{})

	if err != nil {
		return nil, fmt.Errorf("could not connect to database: %w", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("could not get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("could not ping database: %w", err)
	}

	log.Println("Successfully connected to database!")

	if err := database.AutoMigrate(&calculationCometService.CometAllCharestic{}); err != nil {
		return nil, fmt.Errorf("could not migrate: %w", err)
	}

	return database, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
