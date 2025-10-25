import numpy as np

from typing import List, Dict

from dataclasses import dataclass
from dataclasses import asdict

from astropy.coordinates import SkyCoord, get_body, BarycentricMeanEcliptic, ICRS
from astropy import units as u
from astropy.time import Time

from poliastro.twobody import Orbit
from poliastro.bodies import Mars
from poliastro.bodies import Sun

from scipy.optimize import least_squares


@dataclass
class Observation:
    date: Time
    directAscension: float
    celestialDeclination: float


@dataclass
class OrbitalElements:
    a: float
    e: float
    i: float
    Omega: float
    omega: float
    nu: float
    epoch: Time


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


def ConvertIcrsToEcliptic(icrsVector: np.ndarray) -> np.ndarray:
    icrsCoord = SkyCoord(
        x=icrsVector[0] * u.au,
        y=icrsVector[1] * u.au,
        z=icrsVector[2] * u.au,
        frame='icrs',
        representation_type='cartesian'
    )
    eclipticCoord = icrsCoord.transform_to(BarycentricMeanEcliptic())
    return np.array([
        eclipticCoord.cartesian.x.to(u.au).value,
        eclipticCoord.cartesian.y.to(u.au).value,
        eclipticCoord.cartesian.z.to(u.au).value
    ])


def DetermineOrbit(observations: List[Observation]) -> OrbitalElements:
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
    
    return OrbitalElements(
        a=finalA,
        e=finalE,
        i=finalI,
        Omega=finalOmega,
        omega=finalOmegaSmall,
        nu=finalNu,
        epoch=epoch
    )


def CalculateOrbitFromObservations(observationData: List[Dict]) -> Dict:
    observations = [
        Observation(
            date=Time(obs['time'], scale='utc'),
            directAscension=float(obs['ra_deg']),
            celestialDeclination=float(obs['dec_deg'])
        ) for obs in observationData
    ]
    
    orbitalElements = DetermineOrbit(observations)
    
    result = asdict(orbitalElements)
    result['epoch'] = orbitalElements.epoch.iso
    
    return result


def ConvertOrbitToEcliptic(orbit: Orbit) -> dict:
    """Преобразование орбитальных элементов из ICRS в эклиптическую систему J2000"""
    
    # Получаем позицию и скорость в ICRS
    r_icrs = orbit.r.to(u.au).value
    v_icrs = orbit.v.to(u.au / u.day).value
    
    # Преобразуем позицию в эклиптическую систему
    pos_icrs = SkyCoord(
        x=r_icrs[0] * u.au,
        y=r_icrs[1] * u.au,
        z=r_icrs[2] * u.au,
        frame='icrs',
        representation_type='cartesian'
    )
    pos_ecliptic = pos_icrs.transform_to(BarycentricMeanEcliptic())
    r_ecl = np.array([
        pos_ecliptic.cartesian.x.to(u.au).value,
        pos_ecliptic.cartesian.y.to(u.au).value,
        pos_ecliptic.cartesian.z.to(u.au).value
    ])
    
    # Преобразуем скорость в эклиптическую систему
    # Создаем вектор скорости относительно позиции
    vel_icrs = SkyCoord(
        x=(r_icrs[0] + v_icrs[0]) * u.au,
        y=(r_icrs[1] + v_icrs[1]) * u.au,
        z=(r_icrs[2] + v_icrs[2]) * u.au,
        frame='icrs',
        representation_type='cartesian'
    )
    vel_ecliptic = vel_icrs.transform_to(BarycentricMeanEcliptic())
    v_ecl = np.array([
        vel_ecliptic.cartesian.x.to(u.au).value - r_ecl[0],
        vel_ecliptic.cartesian.y.to(u.au).value - r_ecl[1],
        vel_ecliptic.cartesian.z.to(u.au).value - r_ecl[2]
    ])
    
    # Создаем новую орбиту в эклиптической системе
    orbit_ecl = Orbit.from_vectors(
        attractor=Sun,
        r=r_ecl * u.au,
        v=v_ecl * u.au / u.day,
        epoch=orbit.epoch
    )
    
    return {
        'a': orbit_ecl.a.to(u.AU).value,
        'e': orbit_ecl.ecc.value,
        'i': orbit_ecl.inc.to(u.deg).value,
        'Omega': orbit_ecl.raan.to(u.deg).value,
        'omega': orbit_ecl.argp.to(u.deg).value,
        'nu': orbit_ecl.nu.to(u.deg).value,
        'epoch': orbit_ecl.epoch.iso
    }


if __name__ == "__main__":
    # Получаем орбиту Марса на точную эпоху
    epoch = Time("2025-10-25 00:00:00", scale='utc')
    marsOrbit = Orbit.from_body_ephem(Mars, epoch=epoch)

    # Получаем элементы орбиты в ICRS
    marsElements_ICRS = {
        "a": marsOrbit.a.to("AU").value,
        "e": marsOrbit.ecc.value,
        "i": marsOrbit.inc.to("deg").value,
        "Omega": marsOrbit.raan.to("deg").value,
        "omega": marsOrbit.argp.to("deg").value,
        "nu": marsOrbit.nu.to("deg").value,
        "epoch": marsOrbit.epoch.iso,
    }

    print("=== Орбитальные элементы Марса (ICRS) ===")
    print(f"  a (большая полуось)              : {marsElements_ICRS['a']:.6f} AU")
    print(f"  e (эксцентриситет)               : {marsElements_ICRS['e']:.6f}")
    print(f"  i (наклонение)                   : {marsElements_ICRS['i']:.4f}°")
    print(f"  Omega (долгота восх. узла)       : {marsElements_ICRS['Omega']:.4f}°")
    print(f"  omega (аргумент перицентра)      : {marsElements_ICRS['omega']:.4f}°")
    print(f"  nu (истинная аномалия)           : {marsElements_ICRS['nu']:.4f}°")
    print(f"  epoch (эпоха)                    : {marsElements_ICRS['epoch']}")
    
    # Преобразуем в эклиптическую систему
    marsElements_Ecliptic = ConvertOrbitToEcliptic(marsOrbit)
    
    print("\n=== Орбитальные элементы Марса (Эклиптика J2000) ===")
    print(f"  a (большая полуось)              : {marsElements_Ecliptic['a']:.6f} AU")
    print(f"  e (эксцентриситет)               : {marsElements_Ecliptic['e']:.6f}")
    print(f"  i (наклонение)                   : {marsElements_Ecliptic['i']:.4f}°")
    print(f"  Omega (долгота восх. узла)       : {marsElements_Ecliptic['Omega']:.4f}°")
    print(f"  omega (аргумент перицентра)      : {marsElements_Ecliptic['omega']:.4f}°")
    print(f"  nu (истинная аномалия)           : {marsElements_Ecliptic['nu']:.4f}°")
    print(f"  epoch (эпоха)                    : {marsElements_Ecliptic['epoch']}")
    
    print("\n=== Дополнительная информация ===")
    print(f"  Период обращения                 : {marsOrbit.period.to(u.day).value:.2f} дней")
    print(f"  Период обращения                 : {marsOrbit.period.to(u.year).value:.4f} лет")
    
    # Вычисляем перигелий и афелий
    perihelion = marsOrbit.a.to(u.AU).value * (1 - marsOrbit.ecc.value)
    aphelion = marsOrbit.a.to(u.AU).value * (1 + marsOrbit.ecc.value)
    print(f"  Перигелий                        : {perihelion:.6f} AU")
    print(f"  Афелий                           : {aphelion:.6f} AU")
