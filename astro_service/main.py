from fastapi import FastAPI

from schemes import ObservationsList, OrbitData

from astra.astra import CalculateOrbitFromObservations


app = FastAPI()


@app.post("/get_orbit", response_model=OrbitData)
def calculate_observation(observations: ObservationsList):
    return CalculateOrbitFromObservations(observations)
