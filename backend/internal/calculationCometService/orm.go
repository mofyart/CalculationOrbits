package calculationCometService

type CometAllCharestic struct {
	ID           string           `gorm:"primaryKey" json:"id"`
	Charestic    OrbitalCharestic `json:"orbitalCharestic"`
	Observations []Observation    `json:"observations"`
	Picture      string           `json:"picture"`
}

type OrbitalCharestic struct {
	LargeSemiAxis          string `json:"largeSemiAxis"`
	Eccentricity           string `json:"eccentricity"`
	Inclination            string `json:"inclination"`
	LongitudeAscendingNode string `json:"longitude"`
	Pericenter             string `json:"pericenter"`
	TrueAnomaly            string `json:"trueAnomaly"`
	Date                   string `json:"date"`
}

type Observation struct {
	DirectAscension      string `json:"directAscension"`
	CelestialDeclination string `json:"celestialDeclination"`
	Date                 string `json:"date"`
}

type CometObservationsRequest struct {
	Observations []Observation `json:"observations"`
	Picture      string        `json:"picture"`
}
