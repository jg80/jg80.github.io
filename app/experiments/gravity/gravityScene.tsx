"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import Link from "next/link";
import GravityBodies from "./gravityBodies";
import {
  circularOrbitSpeed,
  createInitialSystem,
  createSpawnedBody,
  DEFAULT_GRAVITY,
  removeBodiesHittingStar,
  stepSimulation,
  type SimBody,
  type SpawnKind,
} from "./physics";

const FIXED_DT = 1 / 120;
const MAX_SUBSTEPS = 6;

function SimulationLoop({
  bodiesRef,
  paused,
  timeScale,
  gravityStrength,
  onBodiesChanged,
}: {
  bodiesRef: React.RefObject<SimBody[]>;
  paused: boolean;
  timeScale: number;
  gravityStrength: number;
  onBodiesChanged: () => void;
}) {
  const accumulatorRef = useRef(0);

  useFrame((_, delta) => {
    if (paused || !bodiesRef.current) return;

    accumulatorRef.current += delta * timeScale;
    let steps = 0;
    let countChanged = false;

    while (accumulatorRef.current >= FIXED_DT && steps < MAX_SUBSTEPS) {
      stepSimulation(bodiesRef.current, FIXED_DT, gravityStrength);

      const afterRemoval = removeBodiesHittingStar(bodiesRef.current);
      if (afterRemoval.length !== bodiesRef.current.length) {
        bodiesRef.current = afterRemoval;
        countChanged = true;
      }

      accumulatorRef.current -= FIXED_DT;
      steps += 1;
    }

    if (countChanged) {
      onBodiesChanged();
    }
  });

  return null;
}

function SpawnPlane({
  onSpawn,
}: {
  onSpawn: (point: THREE.Vector3) => void;
}) {
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSpawn(event.point.clone());
    },
    [onSpawn]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick} visible={false}>
      <planeGeometry args={[80, 80]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function GravityCanvas({
  paused,
  timeScale,
  gravityStrength,
  spawnKind,
  spawnSpeed,
  bodiesRef,
  nextIdRef,
  version,
  onVersionChange,
}: {
  paused: boolean;
  timeScale: number;
  gravityStrength: number;
  spawnKind: SpawnKind;
  spawnSpeed: number;
  bodiesRef: React.RefObject<SimBody[]>;
  nextIdRef: React.MutableRefObject<number>;
  version: number;
  onVersionChange: () => void;
}) {
  const lastSpawnPointRef = useRef<THREE.Vector3 | null>(null);

  const spawnAtPoint = useCallback(
    (point: THREE.Vector3) => {
      if (!bodiesRef.current) return;

      const speed =
        spawnSpeed > 0
          ? spawnSpeed
          : circularOrbitSpeed(point, gravityStrength);

      const body = createSpawnedBody(
        nextIdRef.current++,
        point,
        spawnKind,
        speed,
        gravityStrength
      );

      bodiesRef.current.push(body);
      lastSpawnPointRef.current = point.clone();
      onVersionChange();
    },
    [bodiesRef, spawnKind, spawnSpeed, gravityStrength, nextIdRef, onVersionChange]
  );

  const handleSpawn = useCallback(
    (point: THREE.Vector3) => {
      spawnAtPoint(point);
    },
    [spawnAtPoint]
  );

  return (
    <Canvas camera={{ position: [0, 14, 22], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={18} distance={80} />
      <Stars radius={100} depth={50} count={1500} factor={4} fade />
      <SimulationLoop
        bodiesRef={bodiesRef}
        paused={paused}
        timeScale={timeScale}
        gravityStrength={gravityStrength}
        onBodiesChanged={onVersionChange}
      />
      <GravityBodies bodiesRef={bodiesRef} version={version} />
      <SpawnPlane onSpawn={handleSpawn} />
      <OrbitControls enablePan={false} minDistance={8} maxDistance={40} />
    </Canvas>
  );
}

export default function GravityScene() {
  const initialBodies = useMemo(() => createInitialSystem(DEFAULT_GRAVITY), []);
  const bodiesRef = useRef<SimBody[]>(initialBodies);
  const nextIdRef = useRef(3);
  const [version, setVersion] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [gravityStrength, setGravityStrength] = useState(DEFAULT_GRAVITY);
  const [spawnKind, setSpawnKind] = useState<SpawnKind>("asteroid");
  const [spawnSpeed, setSpawnSpeed] = useState(0);
  const [useOrbitalSpeed, setUseOrbitalSpeed] = useState(true);

  const bumpVersion = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  const resetSimulation = () => {
    bodiesRef.current = createInitialSystem(gravityStrength);
    nextIdRef.current = 3;
    bumpVersion();
  };

  const clearAsteroids = () => {
    bodiesRef.current = bodiesRef.current.filter((body) => body.id < 3);
    nextIdRef.current = 3;
    bumpVersion();
  };

  const effectiveSpawnSpeed = useOrbitalSpeed ? 0 : spawnSpeed;

  return (
    <div className="relative h-screen w-full bg-black text-white">
      <div className="pointer-events-none absolute top-4 left-4 z-10 max-w-md space-y-2 px-2">
        <h1 className="text-xl font-semibold md:text-2xl">Gravity sandbox</h1>
        <p className="text-xs opacity-80 md:text-sm">
          N-body gravity with collisions. Click the scene to spawn bodies. Use orbital speed to avoid
          falling straight into the sun.
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex max-h-[calc(100vh-2rem)] flex-col gap-2 overflow-y-auto rounded-xl border border-white/20 bg-black/70 p-3 text-xs md:text-sm">
        <Link href="/" className="text-sky-300 hover:underline">
          Back to solar system
        </Link>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          {paused ? "Play simulation" : "Pause simulation"}
        </button>
        <button
          type="button"
          onClick={resetSimulation}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          Reset system
        </button>
        <button
          type="button"
          onClick={clearAsteroids}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          Clear spawned bodies
        </button>

        <label className="flex flex-col gap-1">
          <span>Spawn type</span>
          <select
            value={spawnKind}
            onChange={(event) => setSpawnKind(event.target.value as SpawnKind)}
            className="pointer-events-auto rounded border border-white/20 bg-black/60 px-2 py-1"
          >
            <option value="asteroid">Asteroid (small)</option>
            <option value="planet">Planet (medium)</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useOrbitalSpeed}
            onChange={(event) => setUseOrbitalSpeed(event.target.checked)}
            className="pointer-events-auto"
          />
          <span>Use circular orbit speed at spawn point</span>
        </label>

        {!useOrbitalSpeed && (
          <label className="flex flex-col gap-1">
            <span>Spawn tangential speed: {spawnSpeed.toFixed(2)}</span>
            <input
              type="range"
              min={0.2}
              max={4}
              step={0.05}
              value={spawnSpeed}
              onChange={(event) => setSpawnSpeed(Number(event.target.value))}
              className="pointer-events-auto"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span>Time scale: {timeScale.toFixed(1)}x</span>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.1}
            value={timeScale}
            onChange={(event) => setTimeScale(Number(event.target.value))}
            className="pointer-events-auto"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Gravity: {gravityStrength.toFixed(1)}</span>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={gravityStrength}
            onChange={(event) => setGravityStrength(Number(event.target.value))}
            className="pointer-events-auto"
          />
        </label>
      </div>

      <GravityCanvas
        paused={paused}
        timeScale={timeScale}
        gravityStrength={gravityStrength}
        spawnKind={spawnKind}
        spawnSpeed={effectiveSpawnSpeed}
        bodiesRef={bodiesRef}
        nextIdRef={nextIdRef}
        version={version}
        onVersionChange={bumpVersion}
      />
    </div>
  );
}
