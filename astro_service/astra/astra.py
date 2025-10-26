import numpy as np

from typing import List, Dict

from dataclasses import dataclass

from astropy.coordinates import SkyCoord, get_body, BarycentricMeanEcliptic
from astropy import units as u
from astropy.time import Time

from poliastro.twobody import Orbit
from poliastro.bodies import Sun

from scipy.optimize import least_squares

@dataclass
class AstraObservation:
    date: Time
    directAscension: float
    celestialDeclination: float

def GetEarthPosition(observationTime: Time) -> np.ndarray:
    earthBody = get_body('earth', observationTime)
    return earthBody.cartesian.xyz.to(u.au).value

def ConvertCartesianToRadec(cartesianCoords: np.ndarray) -> tuple:
    skyPosition = SkyCoord(
        x=cartesianCoords[0] * u.au,
        y=cartesianCoords[1] * u.au,
        z=cartesianCoords[2] * u.au,
        representation_type='cartesian'
    )
    skyPosition.representation_type = 'spherical'
    return skyPosition.ra.deg, skyPosition.dec.deg

def ConvertOrbitToEcliptic(orbit: Orbit) -> dict:
    rIcrs = orbit.r.to(u.au).value
    vIcrs = orbit.v.to(u.au / u.day).value

    posIcrs = SkyCoord(
        x=rIcrs[0] * u.au,
        y=rIcrs[1] * u.au,
        z=rIcrs[2] * u.au,
        frame='icrs',
        representation_type='cartesian'
    )
    posEcliptic = posIcrs.transform_to(BarycentricMeanEcliptic())
    rEcl = np.array([
        posEcliptic.cartesian.x.to(u.au).value,
        posEcliptic.cartesian.y.to(u.au).value,
        posEcliptic.cartesian.z.to(u.au).value
    ])

    velIcrs = SkyCoord(
        x=(rIcrs[0] + vIcrs[0]) * u.au,
        y=(rIcrs[1] + vIcrs[1]) * u.au,
        z=(rIcrs[2] + vIcrs[2]) * u.au,
        frame='icrs',
        representation_type='cartesian'
    )
    velEcliptic = velIcrs.transform_to(BarycentricMeanEcliptic())
    vEcl = np.array([
        velEcliptic.cartesian.x.to(u.au).value - rEcl[0],
        velEcliptic.cartesian.y.to(u.au).value - rEcl[1],
        velEcliptic.cartesian.z.to(u.au).value - rEcl[2]
    ])

    orbitEcl = Orbit.from_vectors(
        attractor=Sun,
        r=rEcl * u.au,
        v=vEcl * u.au / u.day,
        epoch=orbit.epoch
    )

    return orbitEcl

def DetermineOrbit(observations: List[AstraObservation]) -> Orbit:
    observations.sort(key=lambda obs: obs.date.jd)
    epochIndex = len(observations) // 2
    epoch = observations[epochIndex].date

    def CalculateResiduals(elementsArray: np.ndarray) -> np.ndarray:
        semiMajorAxis, eccentricity, inclination, raan, argOfPericenter, trueAnomaly = elementsArray

        orbit = Orbit.from_classical(
            attractor=Sun,
            a=semiMajorAxis * u.au,
            ecc=eccentricity * u.one,
            inc=inclination * u.deg,
            raan=raan * u.deg,
            argp=argOfPericenter * u.deg,
            nu=trueAnomaly * u.deg,
            epoch=epoch
        )

        residualsList = []

        for observation in observations:
            timeDelta = (observation.date.jd - epoch.jd) * u.day
            propagatedOrbit = orbit.propagate(timeDelta)
            cometHeliocentric = propagatedOrbit.r.to(u.au).value
            earthHeliocentric = GetEarthPosition(observation.date)
            cometGeocentric = cometHeliocentric - earthHeliocentric
            predictedRa, predictedDec = ConvertCartesianToRadec(cometGeocentric)

            raResidual = predictedRa - observation.directAscension
            if raResidual > 180:
                raResidual -= 360
            if raResidual < -180:
                raResidual += 360

            decResidual = predictedDec - observation.celestialDeclination
            residualsList.extend([raResidual, decResidual])

        return np.array(residualsList)

    initialGuess = [3.0, 0.5, 10.0, 20.0, 30.0, 40.0]
    lowerBounds = [0.1, 0.0, 0.0, 0.0, 0.0, 0.0]
    upperBounds = [1000.0, 1.5, 180.0, 360.0, 360.0, 360.0]

    optimizationResult = least_squares(
        CalculateResiduals,
        initialGuess,
        bounds=(lowerBounds, upperBounds),
        ftol=1e-9,
        xtol=1e-9,
        gtol=1e-9,
        verbose=0
    )

    finalA, finalE, finalI, finalOmega, finalOmegaSmall, finalNu = optimizationResult.x

    orbit = Orbit.from_classical(
        attractor=Sun,
        a=finalA * u.au,
        ecc=finalE * u.one,
        inc=finalI * u.deg,
        raan=finalOmega * u.deg,
        argp=finalOmegaSmall * u.deg,
        nu=finalNu * u.deg,
        epoch=epoch
    )

    return orbit

def CalculateOrbitFromObservations(observationData: List[Dict]) -> Dict:
    observations = [
        AstraObservation(
            date=Time(obs.date, scale='utc'),
            directAscension=obs.directAscension,
            celestialDeclination=obs.celestialDeclination,
        ) for obs in observationData
    ]

    orbit_icrs = DetermineOrbit(observations)
    orbit_ecliptic = ConvertOrbitToEcliptic(orbit_icrs)

    result = {
        'a': orbit_ecliptic.a.to(u.AU).value,
        'e': orbit_ecliptic.ecc.value,
        'i': orbit_ecliptic.inc.to(u.deg).value,
        'Omega': orbit_ecliptic.raan.to(u.deg).value,
        'omega': orbit_ecliptic.argp.to(u.deg).value,
        'nu': orbit_ecliptic.nu.to(u.deg).value,
        'epoch': orbit_ecliptic.epoch.iso
    }

    return result
