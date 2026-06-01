import { useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SimBody } from "./physics";

interface GravityBodiesProps {
  bodiesRef: React.RefObject<SimBody[]>;
  version: number; // triggers re-render when bodies are added or removed
}

type Line2Like = THREE.Object3D & {
  geometry: THREE.BufferGeometry;
};

export default function GravityBodies({ bodiesRef, version }: GravityBodiesProps) {
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const lineRefs = useRef<Map<number, Line2Like>>(new Map());

  useFrame(() => {
    const bodies = bodiesRef.current;
    if (!bodies) return;

    const activeIds = new Set(bodies.map((body) => body.id));

    for (const id of meshRefs.current.keys()) {
      if (!activeIds.has(id)) meshRefs.current.delete(id);
    }
    for (const id of lineRefs.current.keys()) {
      if (!activeIds.has(id)) lineRefs.current.delete(id);
    }

    for (const body of bodies) {
      const mesh = meshRefs.current.get(body.id);
      if (mesh) {
        mesh.position.copy(body.position);
      }

      const line = lineRefs.current.get(body.id);
      if (!line || body.trail.length < 2) continue;

      const positions = new Float32Array(body.trail.length * 3);
      body.trail.forEach((point, index) => {
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      });

      const positionAttribute = new THREE.BufferAttribute(positions, 3);
      line.geometry.setAttribute("position", positionAttribute);
      line.geometry.setDrawRange(0, body.trail.length);
      line.geometry.computeBoundingSphere();
    }
  });

  const bodies = version >= 0 ? (bodiesRef.current ?? []) : [];

  return (
    <>
      {bodies.map((body) => (
        <group key={body.id}>
          <Line
            ref={(node) => {
              if (node) lineRefs.current.set(body.id, node as Line2Like);
              else lineRefs.current.delete(body.id);
            }}
            points={body.trail.map((p) => [p.x, p.y, p.z] as [number, number, number])}
            color={body.color}
            transparent
            opacity={body.fixed ? 0 : 0.35}
            lineWidth={1}
            visible={!body.fixed}
          />
          <mesh
            ref={(node) => {
              if (node) meshRefs.current.set(body.id, node);
              else meshRefs.current.delete(body.id);
            }}
          >
            <sphereGeometry args={[body.radius, 24, 24]} />
            <meshStandardMaterial
              color={body.color}
              emissive={body.fixed ? body.color : "#000000"}
              emissiveIntensity={body.fixed ? 2.5 : 0}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
