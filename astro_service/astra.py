import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass

from astropy.coordinates import SkyCoord, get_body, BarycentricMeanEcliptic, ICRS
from astropy import units as u
from astropy.time import Time
from poliastro.twobody import Orbit
from poliastro.bodies import Sun
from scipy.optimize import least_squares

from schemes import ObservationsList


@dataclass
class AstraObservation:
    date: Time
    directAscension: float
    celestialDeclination: float

def GetEarthPosition(observationTime: Time) -> np.ndarray:
    earthBody = get_body('earth', observationTime)
    return earthBody.cartesian.xyz.to(u.au).value

def ConvertCartesianToRadecFast(x: float, y: float, z: float) -> Tuple[float, float]:
    r = np.sqrt(x*x + y*y + z*z)
    dec_rad = np.arcsin(z / r)
    ra_rad = np.arctan2(y, x)
    
    ra_deg = np.degrees(ra_rad)
    if ra_deg < 0:
        ra_deg += 360.0
    dec_deg = np.degrees(dec_rad)
    
    return ra_deg, dec_deg

def ConvertOrbitToEcliptic(orbit: Orbit) -> Orbit:
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
    
    from astropy.coordinates import CartesianDifferential, CartesianRepresentation
    
    pos_with_vel = CartesianRepresentation(
        x=rIcrs[0] * u.au,
        y=rIcrs[1] * u.au,
        z=rIcrs[2] * u.au,
        differentials=CartesianDifferential(
            d_x=vIcrs[0] * u.au / u.day,
            d_y=vIcrs[1] * u.au / u.day,
            d_z=vIcrs[2] * u.au / u.day
        )
    )
    
    coord_with_vel = SkyCoord(pos_with_vel, frame='icrs')
    coord_ecl = coord_with_vel.transform_to(BarycentricMeanEcliptic())
    
    vEcl = np.array([
        coord_ecl.cartesian.differentials['s'].d_x.to(u.au / u.day).value,
        coord_ecl.cartesian.differentials['s'].d_y.to(u.au / u.day).value,
        coord_ecl.cartesian.differentials['s'].d_z.to(u.au / u.day).value
    ])
    
    orbitEcl = Orbit.from_vectors(
        attractor=Sun,
        r=rEcl * u.au,
        v=vEcl * u.au / u.day,
        epoch=orbit.epoch
    )
    
    return orbitEcl

def ComputeInitialGuess(observations: List[AstraObservation]) -> np.ndarray:
    obs1 = observations[0]
    obs2 = observations[-1]

    deltaTime = (obs2.date.jd - obs1.date.jd)
    
    dRa = abs(obs2.directAscension - obs1.directAscension)
    dDec = abs(obs2.celestialDeclination - obs1.celestialDeclination)
    angularSeparation = np.sqrt(dRa**2 + dDec**2)
    
    if angularSeparation > 10 and deltaTime < 30:
        estimatedA = 2.5
        estimatedE = 0.7
    elif angularSeparation < 1 and deltaTime > 100:
        estimatedA = 20.0
        estimatedE = 0.85
    else:
        estimatedA = 5.0
        estimatedE = 0.65
    
    avgDec = np.mean([obs.celestialDeclination for obs in observations])
    estimatedInc = abs(avgDec) * 1.5
    estimatedInc = np.clip(estimatedInc, 5.0, 175.0)
    
    avgRa = np.mean([obs.directAscension for obs in observations])
    estimatedRaan = avgRa % 360.0
    
    estimatedArgp = 45.0
    estimatedNu = 90.0
    
    return np.array([
        estimatedA,
        estimatedE,
        estimatedInc,
        estimatedRaan,
        estimatedArgp,
        estimatedNu
    ])

def DetermineOrbit(observations: List[AstraObservation]) -> Orbit:
    observations.sort(key=lambda obs: obs.date.jd)
    
    epochIndex = len(observations) // 2
    epoch = observations[epochIndex].date
    
    earthPositions = {}
    for obs in observations:
        earthPositions[obs.date.jd] = GetEarthPosition(obs.date)
    
    timeDeltasJd = np.array([obs.date.jd - epoch.jd for obs in observations])
    
    callCounter = [0]
    
    def CalculateResiduals(elementsArray: np.ndarray) -> np.ndarray:
        callCounter[0] += 1
        
        semiMajorAxis, eccentricity, inclination, raan, argOfPericenter, trueAnomaly = elementsArray
        
        if eccentricity >= 0.999:
            return np.full(len(observations) * 2, 1e6)
        
        try:
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
        except Exception:
            return np.full(len(observations) * 2, 1e6)
        
        residuals = np.empty(len(observations) * 2, dtype=np.float64)
        
        for idx, obs in enumerate(observations):
            timeDelta = timeDeltasJd[idx] * u.day
            
            try:
                propagatedOrbit = orbit.propagate(timeDelta)
                cometHeliocentric = propagatedOrbit.r.to(u.au).value
            except Exception:
                residuals[2*idx] = 1e6
                residuals[2*idx + 1] = 1e6
                continue

            earthHeliocentric = earthPositions[obs.date.jd]
            

            cometGeocentric = cometHeliocentric - earthHeliocentric
            
            predictedRa, predictedDec = ConvertCartesianToRadecFast(
                cometGeocentric[0],
                cometGeocentric[1],
                cometGeocentric[2]
            )
            
            raResidual = predictedRa - obs.directAscension
            while raResidual > 180:
                raResidual -= 360
            while raResidual < -180:
                raResidual += 360
            
            decResidual = predictedDec - obs.celestialDeclination
            
            residuals[2*idx] = raResidual
            residuals[2*idx + 1] = decResidual
        
        return residuals
    
    initialGuess = ComputeInitialGuess(observations)
    lowerBounds = [0.5, 0.0, 0.0, 0.0, 0.0, 0.0]
    upperBounds = [100.0, 0.99, 180.0, 360.0, 360.0, 360.0]
    
    optimizationResult = least_squares(
        CalculateResiduals,
        initialGuess,
        bounds=(lowerBounds, upperBounds),
        ftol=1e-6,
        xtol=1e-6,
        gtol=1e-6,
        max_nfev=200,
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

def CalculateOrbitFromObservations(observationsList: ObservationsList) -> Dict:
    observations = [
        AstraObservation(
            date=observation.date,
            directAscension=observation.directAscension,
            celestialDeclination=observation.celestialDeclination,
        ) for observation in observationsList.observations
    ]
    
    orbit_icrs = DetermineOrbit(observations)
    orbit_ecliptic = ConvertOrbitToEcliptic(orbit_icrs)
    
    result = {
        'largeSemiAxis': orbit_ecliptic.a.to(u.AU).value,
        'eccentricity': orbit_ecliptic.ecc.value,
        'inclination': orbit_ecliptic.inc.to(u.deg).value,
        'longitude': orbit_ecliptic.raan.to(u.deg).value,
        'pericenter': orbit_ecliptic.argp.to(u.deg).value,
        'trueAnomaly': orbit_ecliptic.nu.to(u.deg).value,
        'minDistance': 0.0,
        'minApproximationDate': '1111-11-11T11:11:11',
        'epoch': orbit_ecliptic.epoch.iso
    }
    
    return result