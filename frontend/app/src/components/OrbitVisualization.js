import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

const AU = 149597870.7;
const SCALE = 100;

function getOrbitalPosition(a, e, i, omega, Omega, nu) {
  const iRad = (i * Math.PI) / 180;
  const omegaRad = (omega * Math.PI) / 180;
  const OmegaRad = (Omega * Math.PI) / 180;
  const nuRad = (nu * Math.PI) / 180;

  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nuRad));

  const xOrb = r * Math.cos(nuRad);
  const yOrb = r * Math.sin(nuRad);

  const x =
    xOrb * (Math.cos(omegaRad) * Math.cos(OmegaRad) - Math.sin(omegaRad) * Math.sin(OmegaRad) * Math.cos(iRad)) -
    yOrb * (Math.sin(omegaRad) * Math.cos(OmegaRad) + Math.cos(omegaRad) * Math.sin(OmegaRad) * Math.cos(iRad));

  const y =
    xOrb * (Math.cos(omegaRad) * Math.sin(OmegaRad) + Math.sin(omegaRad) * Math.cos(OmegaRad) * Math.cos(iRad)) +
    yOrb * (Math.cos(omegaRad) * Math.cos(OmegaRad) * Math.cos(iRad) - Math.sin(omegaRad) * Math.sin(OmegaRad));

  const z = xOrb * Math.sin(omegaRad) * Math.sin(iRad) + yOrb * Math.cos(omegaRad) * Math.sin(iRad);

  return [x, y, z];
}

function generateOrbitPoints(a, e, i, omega, Omega, numPoints = 200) {
  const points = [];
  for (let j = 0; j <= numPoints; j++) {
    const nu = (j / numPoints) * 360;
    const pos = getOrbitalPosition(a, e, i, omega, Omega, nu);
    points.push(new THREE.Vector3(pos[0] * SCALE, pos[2] * SCALE, -pos[1] * SCALE));
  }
  return points;
}

function Orbit({ a, e, i, omega, Omega, color, label }) {
  const points = useMemo(() => generateOrbitPoints(a, e, i, omega, Omega), [a, e, i, omega, Omega]);

  return (
    <>
      <Line points={points} color={color} lineWidth={2} />
      <Text position={[points[0].x, points[0].y + 20, points[0].z]} fontSize={8} color={color}>
        {label}
      </Text>
    </>
  );
}

function Sun() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[10, 32, 32]} />
      <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={2} />
      <pointLight intensity={1} distance={1000} />
    </mesh>
  );
}

export default function OrbitVisualization({ cometParams }) {
  const earthOrbitParams = {
    a: 1.0,
    e: 0.0167,
    i: 0,
    omega: 102.94,
    Omega: 0,
  };

  return (
    <div style={{ width: '100%', height: '50hv', background: '#000' }}>
      <Canvas camera={{ position: [300, 200, 300], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        
        <Sun />

        <Orbit
          a={earthOrbitParams.a}
          e={earthOrbitParams.e}
          i={earthOrbitParams.i}
          omega={earthOrbitParams.omega}
          Omega={earthOrbitParams.Omega}
          color="#2196F3"
          label="Earth Orbit"
        />

        <Orbit
          a={cometParams.a}
          e={cometParams.e}
          i={cometParams.i}
          omega={cometParams.omega}
          Omega={cometParams.Omega}
          color="#FF5722"
          label="Comet Orbit"
        />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
