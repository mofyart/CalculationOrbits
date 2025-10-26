import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, Text, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- Константы и Хелперы ---

// 1 Астрономическая Единица (АЕ) = 100 единиц в сцене
const SCALE = 100;

/**
 * Вычисляет 3D-положение в гелиоцентрических координатах
 * на основе кеплеровских элементов орбиты.
 */
function getOrbitalPosition(largeSemiAxis, eccentricity, inclination, pericenter, longitude, trueAnomaly) {
  // Перевод градусов в радианы
  const iRad = (inclination * Math.PI) / 180;
  const omegaRad = (pericenter * Math.PI) / 180;
  const OmegaRad = (longitude * Math.PI) / 180;
  const nuRad = (trueAnomaly * Math.PI) / 180;

  // Расстояние от Солнца
  const r = (largeSemiAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(nuRad));

  // Положение в плоскости орбиты
  const xOrb = r * Math.cos(nuRad);
  const yOrb = r * Math.sin(nuRad);

  // Трансформация в гелиоцентрические эклиптические координаты
  const x =
    xOrb * (Math.cos(omegaRad) * Math.cos(OmegaRad) - Math.sin(omegaRad) * Math.sin(OmegaRad) * Math.cos(iRad)) -
    yOrb * (Math.sin(omegaRad) * Math.cos(OmegaRad) + Math.cos(omegaRad) * Math.sin(OmegaRad) * Math.cos(iRad));

  const y =
    xOrb * (Math.cos(omegaRad) * Math.sin(OmegaRad) + Math.sin(omegaRad) * Math.cos(OmegaRad) * Math.cos(iRad)) +
    yOrb * (Math.cos(omegaRad) * Math.cos(OmegaRad) * Math.cos(iRad) - Math.sin(omegaRad) * Math.sin(OmegaRad));

  const z = xOrb * Math.sin(omegaRad) * Math.sin(iRad) + yOrb * Math.cos(omegaRad) * Math.sin(iRad);

  // [x, y, z] в АЕ
  return [x, y, z];
}

/**
 * Генерирует массив точек THREE.Vector3 для отрисовки орбиты.
 */
function generateOrbitPoints(largeSemiAxis, eccentricity, inclination, pericenter, longitude, numPoints = 200) {
  const points = [];
  for (let j = 0; j <= numPoints; j++) {
    const trueAnomaly = (j / numPoints) * 360; // Истинная аномалия от 0 до 360
    const pos = getOrbitalPosition(largeSemiAxis, eccentricity, inclination, pericenter, longitude, trueAnomaly);
    
    // Преобразуем [x, y, z] (АЕ) в координаты сцены [x, z, -y]
    points.push(new THREE.Vector3(pos[0] * SCALE, pos[2] * SCALE, -pos[1] * SCALE));
  }
  return points;
}

// --- Компоненты Сцены ---

/**
 * Отрисовывает три желтые оси координат (X, Y, Z).
 */
function YellowAxes() {
  const axisLength = 10 * SCALE; // Длина осей 10 АЕ
  const yellow = "#FFFF00";
  const lineWidth = 1;

  return (
    <group>
      {/* Ось X */}
      <Line points={[[-axisLength, 0, 0], [axisLength, 0, 0]]} color={yellow} lineWidth={lineWidth} />
      {/* Ось Y (Вверх в сцене) */}
      <Line points={[[0, -axisLength, 0], [0, axisLength, 0]]} color={yellow} lineWidth={lineWidth} />
      {/* Ось Z */}
      <Line points={[[0, 0, -axisLength], [0, 0, axisLength]]} color={yellow} lineWidth={lineWidth} />
    </group>
  );
}

/**
 * Отрисовывает линию орбиты.
 */
function Orbit({ largeSemiAxis, eccentricity, inclination, pericenter, longitude, color }) {
  // Генерируем точки орбиты
  const points = useMemo(() => generateOrbitPoints(largeSemiAxis, eccentricity, inclination, pericenter, longitude), [largeSemiAxis, eccentricity, inclination, pericenter, longitude]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
    />
  );
}

/**
 * Отрисовывает небесное тело (планету, комету).
 */
function CelestialBody({ largeSemiAxis, eccentricity, inclination, pericenter, longitude, trueAnomaly, color, size = 5, label }) {
  // Получаем текущую позицию
  const pos = getOrbitalPosition(largeSemiAxis, eccentricity, inclination, pericenter, longitude, trueAnomaly);
  
  // Преобразуем в координаты сцены
  const position = [pos[0] * SCALE, pos[2] * SCALE, -pos[1] * SCALE];

  return (
    <>
      {/* Сфера */}
      <mesh position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Метка */}
      {label && (
        <Text position={[position[0], position[1] + size * 2, position[2]]} fontSize={6} color={color} anchorY="bottom">
          {label}
        </Text>
      )}
    </>
  );
}

/**
 * Отрисовывает Солнце (в центре).
 */
function Sun() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[10, 32, 32]} />
      {/* Яркий, излучающий материал для Солнца */}
      <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={2} />
      {/* Источник света внутри Солнца */}
      <pointLight intensity={1.5} distance={1000} />
    </mesh>
  );
}

// --- Главный Компонент Визуализации ---

function OrbitVisualization({ cometParams }) {
  // Параметры орбиты Земли (приблизительные)
  const earthOrbitParams = {
    largeSemiAxis: 1.0,      // 1 АЕ
    eccentricity: 0.0167,
    inclination: 0,
    pericenter: 102.94,
    longitude: 0,
  };

  // Вычисляем текущее положение кометы для настройки камеры и цели
  const cometPosRaw = getOrbitalPosition(
    cometParams.largeSemiAxis,
    cometParams.eccentricity,
    cometParams.inclination,
    cometParams.pericenter,
    cometParams.longitude,
    cometParams.trueAnomaly
  );
  
  // Преобразуем в координаты сцены
  const cometPosVec = [
    cometPosRaw[0] * SCALE,
    cometPosRaw[2] * SCALE,
    -cometPosRaw[1] * SCALE
  ];

  // Установим стартовую позицию камеры ОТНОСИТЕЛЬНО кометы
  const initialCameraPos = [
    cometPosVec[0] + 3 * SCALE, // 3 АЕ в стороне от кометы
    cometPosVec[1] + 2 * SCALE, // 2 АЕ "выше" кометы
    cometPosVec[2] + 3 * SCALE  // 3 АЕ "позади" кометы
  ];

  return (
    // Используем 100vh для заполнения всего экрана
    <div style={{ width: '100%', height: '70vh', background: '#000' }}>
      {/* ДОБАВЛЕНО 'far: 50000' - Увеличивает дальность прорисовки 
        (решает проблему "далеко rander")
      */}
      <Canvas camera={{ position: initialCameraPos, fov: 60, far: 50000 }}>
        {/* Окружающий свет */}
        <ambientLight intensity={0.2} />
        
        {/* Солнце (включает свой собственный pointLight) */}
        <Sun />

        {/* Желтые оси координат */}
        <YellowAxes />
        
        {/* Координатная сетка на плоскости эклиптики (XZ)
          Цвета уже белые, как вы и просили ("линии белыми")
        */}
        {/* <Grid
          args={[40 * SCALE, 40]}   // Сетка 40x40 АЕ
          cellSize={SCALE}          // Размер ячейки = 1 АЕ (100 единиц)
          cellColor="#FFFFFF"      // Цвет линий ячеек (БЕЛЫЙ)
          sectionColor="#FFFFFF"   // Цвет главных линий (БЕЛЫЙ)
          cellThickness={0.5}
          sectionThickness={1}
          fadeDistance={150 * SCALE} // Сетка исчезает на расстоянии
          fadeStrength={1}
          infiniteGrid={true}       // Бесконечная сетка
        /> */}

        {/* Орбита Земли */}
        <Orbit
          largeSemiAxis={earthOrbitParams.largeSemiAxis}
          eccentricity={earthOrbitParams.eccentricity}
          inclination={earthOrbitParams.inclination}
          pericenter={earthOrbitParams.pericenter}
          longitude={earthOrbitParams.longitude}
          color="#2196F3"
        />

        {/* Орбита Кометы */}
        <Orbit
          largeSemiAxis={cometParams.largeSemiAxis}
          eccentricity={cometParams.eccentricity}
          inclination={cometParams.inclination}
          pericenter={cometParams.pericenter}
          longitude={cometParams.longitude}
          color="#FF5722"
        />

        {/* Тело Земли */}
        <CelestialBody
          largeSemiAxis={earthOrbitParams.largeSemiAxis}
          eccentricity={earthOrbitParams.eccentricity}
          inclination={earthOrbitParams.inclination}
          pericenter={earthOrbitParams.pericenter}
          longitude={earthOrbitParams.longitude}
          trueAnomaly={0} // Примерная аномалия для Земли
          color="#2196F3"
          size={4}
          label="Earth"
        />

        {/* Тело Кометы */}
        <CelestialBody
          largeSemiAxis={cometParams.largeSemiAxis}
          eccentricity={cometParams.eccentricity}
          inclination={cometParams.inclination}
          pericenter={cometParams.pericenter}
          longitude={cometParams.longitude}
          trueAnomaly={cometParams.trueAnomaly} // Аномалия из параметров
          color="#FF5722"
          size={5}
          label="Comet"
        />
        
        {/* ДОБАВЛЕНО 'target={cometPosVec}'
          Камера теперь вращается ВОКРУГ кометы, а не вокруг Солнца.
        */}
        <OrbitControls target={cometPosVec} />
        
      </Canvas>
    </div>
  );
}

export default OrbitVisualization;