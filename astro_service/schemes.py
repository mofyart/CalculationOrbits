from typing import List, Annotated

from datetime import datetime

from astropy.time import Time

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    PlainSerializer,
    Field,
)


def validate_astropy_time(val: str):
    try:
        return Time(
            datetime.strptime(val, "%Y-%m-%dT%H:%M:%S"),
            scale="utc"
        )
    except Exception as e:
        raise ValueError(f"Неправильный формат времени, правильно %Y-%m-%dT%H:%M:%S: {e}")


def serialize_astropy_time(time_obj: Time) -> str:
    return time_obj.to_value(format="datetime").strftime("%Y-%m-%dT%H:%M:%S")


AstropyDatetime = Annotated[
    Time,
    BeforeValidator(validate_astropy_time),
    PlainSerializer(serialize_astropy_time, return_type=str, when_used="json")
]


class Observation(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    directAscension: float
    celestialDeclination: float
    date: AstropyDatetime


class ObservationsList(BaseModel):
    observations: List[Observation]


class OrbitData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    largeSemiAxis: float = Field(alias="largeSemiAxis")
    eccentricity: float = Field(alias="eccentricity")
    inclination: float = Field(alias="inclination")
    longitude: float = Field(alias="longitude")
    pericenter: float = Field(alias="pericenter")
    trueAnomaly: float = Field(alias="trueAnomaly")
    minDistance: float = Field(alias="minDistance")
    minApproximationDate: AstropyDatetime = Field(alias="minApproximationDate")


if __name__ == "__main__":
    data = {
        "observations": [
            {
                "directAscension": "0.0",
                "celestialDeclination": 0.0,
                "date": "1111-11-11T10:10:10"
            }
        ]
    }

    observation = ObservationsList(**data)
    print(observation.model_dump_json())
