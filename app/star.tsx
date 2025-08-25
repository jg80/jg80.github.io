import React, {
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";


export default function Star({ size = 2.2 }: { size?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.1;
  });

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial
        emissive={"#ffcc66"}
        emissiveIntensity={3.2}
        color={"#ffcd68"}
        roughness={0.5}
      />
    </mesh>
  );
}