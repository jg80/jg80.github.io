import React, {
  useRef,
  useState,
  useCallback,
} from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber"
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useCursor } from "./utils"
import OrbitRing from "./orbitRing";


interface PlanetProps {
  color: string;
  label: string;
  blurb: string;
  distance: number;
  size: number;
  angularSpeed: number;
  onClick: () => void;
  paused: boolean;
  motionScale: number;
  onHoverPauseChange: (hovering: boolean) => void;
  setActivePlanet: (planet: { label: string; blurb: string } | null) => void;
}

export default function Planet({
  color,
  label,
  blurb,
  distance,
  size,
  angularSpeed,
  onClick,
  paused,
  motionScale,
  onHoverPauseChange,
  setActivePlanet,
}: PlanetProps) {
  const texture = useTexture(
    label === "LinkedIn"
      ? "/textures/linkedin.png"
      : label === "GitHub"
      ? "/textures/github.png"
      : "/textures/resume.jpg"
  );
  const ref = useRef<THREE.Mesh>(null!);
  const angleRef = useRef<number>(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);


  useFrame((_, delta) => {
    if (paused) return;
    angleRef.current += angularSpeed * motionScale * delta;
    const x = Math.cos(angleRef.current) * distance;
    const z = Math.sin(angleRef.current) * distance;
    if (ref.current) {
      ref.current.position.set(x, 0, z);
      ref.current.rotation.y += delta * 0.5 * motionScale;
    }
  });

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHoverPauseChange(true);
    setActivePlanet({ label, blurb });
  }, [onHoverPauseChange, setActivePlanet, label, blurb]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    onHoverPauseChange(false);
    setActivePlanet(null);
  }, [onHoverPauseChange, setActivePlanet]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <group>
      <OrbitRing radius={distance} highlighted={hovered} />
      <mesh
        ref={ref}
        scale={hovered ? 1.08 : 1}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} map={texture} />
        {hovered && (
          <Html center distanceFactor={8} occlude>
            <div className="px-3 py-1 rounded-xl bg-black/70 text-white text-xs whitespace-nowrap select-none">
              {label}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}
