package calculationCometService

type CometAllCharestic struct {
	ID           string           `gorm:"primaryKey" json:"id"`
	CharesticID  string           `gorm:"uniqueIndex" json:"charesticId"`
	Charestic    OrbitalCharestic `gorm:"foreignKey:CharesticID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"orbitalCharestic"`
	Observations []Observation    `gorm:"foreignKey:CometID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"observations"`
}

// Для связи one-to-one OrbitalCharestic имеет поле ID
type OrbitalCharestic struct {
	ID                     string `json:"id"`
	LargeSemiAxis          string `json:"largeSemiAxis"`
	Eccentricity           string `json:"eccentricity"`
	Inclination            string `json:"inclination"`
	LongitudeAscendingNode string `json:"longitude"`
	Pericenter             string `json:"pericenter"`
	TrueAnomaly            string `json:"trueAnomaly"`
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
