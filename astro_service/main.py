from fastapi import FastAPI
from pydantic import BaseModel
from pydantic import BaseModel, BeforeValidator, PlainSerializer
from typing import List, Optional, Annotated
from datetime import datetime

import json

from astra.astra import CalculateOrbitFromObservations


app = FastAPI()


CustomDatetime = Annotated[
    datetime,
    BeforeValidator(lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%S') if x and x.strip() else None),
    PlainSerializer(lambda x: x.strftime('%Y-%m-%dT%H:%M:%S') if x else None)
]


class Observation(BaseModel):
    directАscension: float
    celestialDeclination: float
    date: CustomDatetime = None

class ObservationsData(BaseModel):
    observations: List[Observation]


@app.post("/get_orbit")
def calculate_observation(observations: ObservationsData):
    result = CalculateOrbitFromObservations(observations.observations)
    return result