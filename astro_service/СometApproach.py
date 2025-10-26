import numpy as np

from dataclasses import dataclass

from astropy import units as u
from astropy.time import Time
from astropy.coordinates import get_body

from datetime import datetime, timedelta

from poliastro.twobody import Orbit

from scipy.optimize import minimize_scalar

@dataclass
class CometApproachEvent:
    dateOfClosestApproach: Time
    minimumDistance: float

def GetEarthPosition(observationTime: Time) -> np.ndarray:
    earthBody = get_body('earth', observationTime)
    return earthBody.cartesian.xyz.to(u.au).value

def CalculateGeocentricDistance(cometHeliocentric: np.ndarray,
                                 earthHeliocentric: np.ndarray) -> float:
    relativePosition = cometHeliocentric - earthHeliocentric
    distance = np.sqrt(np.sum(relativePosition * relativePosition))
    return distance

def FindClosestApproach(orbit: Orbit,
                         searchStartTime: Time,
                         searchEndTime: Time) -> CometApproachEvent:
    epochTime = orbit.epoch
    searchStartJD = searchStartTime.jd
    searchEndJD = searchEndTime.jd
    epochJD = epochTime.jd
    
    earthCache = {}
    
    def DistanceObjective(timeJD: float) -> float:
        if timeJD in earthCache:
            earthHeliocentric = earthCache[timeJD]
        else:
            currentTime = Time(timeJD, format='jd', scale='utc')
            earthHeliocentric = GetEarthPosition(currentTime)
            earthCache[timeJD] = earthHeliocentric
        
        timeDelta = (timeJD - epochJD) * u.day
        
        try:
            propagatedOrbit = orbit.propagate(timeDelta)
        except Exception:
            return 1e10
        
        cometHeliocentric = propagatedOrbit.r.to(u.au).value
        distance = CalculateGeocentricDistance(cometHeliocentric, earthHeliocentric)
        
        return distance
    
    try:
        optimizationResult = minimize_scalar(
            DistanceObjective,
            bounds=(searchStartJD, searchEndJD),
            method='bounded',
            options={'xatol': 1e-8}
        )
    except Exception:
        optimizationResult = minimize_scalar(
            DistanceObjective,
            bounds=(searchStartJD, searchEndJD),
            method='golden'
        )
    
    optimalJD = optimizationResult.x
    optimalTime = Time(optimalJD, format='jd', scale='utc')
    minimumDistance = optimizationResult.fun
    
    approachEvent = CometApproachEvent(
        dateOfClosestApproach=optimalTime,
        minimumDistance=minimumDistance
    )
    
    return approachEvent

def CalculateCometApproachData(orbit: Orbit,
                                searchStartTime: Time = None,
                                searchEndTime: Time = None) -> dict:
    if searchStartTime is None:
        searchStartTime = Time(datetime.utcnow(), scale='utc')
    
    if searchEndTime is None:
        endDate = datetime.utcnow() + timedelta(days=300*365.25)
        searchEndTime = Time(endDate, scale='utc')
    
    closestApproach = FindClosestApproach(
        orbit=orbit,
        searchStartTime=searchStartTime,
        searchEndTime=searchEndTime
    )
    
    result = {
        'dateOfClosestApproach': closestApproach.dateOfClosestApproach.iso,
        'minimumDistanceAU': closestApproach.minimumDistance,
    }
    
    return result