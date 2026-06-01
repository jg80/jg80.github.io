import React, {
  useMemo,
} from "react";
import { Line } from "@react-three/drei";


export default function OrbitRing({
  radius = 5,
  segments = 128,
  highlighted = false,
}: {
  radius?: number;
  segments?: number;
  highlighted?: boolean;
}) {
  const points = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(t) * radius, 0, Math.sin(t) * radius]);
    }
    return pts;
  }, [radius, segments]);

  return (
    <Line
      points={points}
      lineWidth={highlighted ? 2 : 1}
      transparent
      opacity={highlighted ? 0.75 : 0.35}
      color={highlighted ? "#ffffff" : undefined}
    />
  );
}
