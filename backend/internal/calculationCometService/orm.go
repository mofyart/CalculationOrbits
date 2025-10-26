package calculationCometService

type CometAllCharestic struct {
	ID           string           `gorm:"primaryKey" json:"id"`
	CharesticID  string           `gorm:"uniqueIndex" json:"charesticId"`
	Charestic    OrbitalCharestic `gorm:"foreignKey:CharesticID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"orbitalCharestic"`
	Observations []Observation    `gorm:"foreignKey:CometID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"observations"`
}

type OrbitalCharestic struct {
	ID                     string  `json:"id"`
	LargeSemiAxis          float64 `json:"largeSemiAxis"`
	Eccentricity           float64 `json:"eccentricity"`
	Inclination            float64 `json:"inclination"`
	LongitudeAscendingNode float64 `json:"longitude"`
	Pericenter             float64 `json:"pericenter"`
	TrueAnomaly            float64 `json:"trueAnomaly"`
	MinDistance            float64 `json:"minDistance"`
	MinApproximationDate   string  `json:"minApproximationDate"`
}

type Observation struct {
	ID                   string `gorm:"primaryKey" json:"id,omitempty"`
	CometID              string `gorm:"index" json:"cometId,omitempty"`
	DirectAscension      string `json:"directAscension"`
	CelestialDeclination string `json:"celestialDeclination"`
	Date                 string `json:"date"`
}

type CometObservationsRequest struct {
	Observations []Observation `json:"observations"`
}
