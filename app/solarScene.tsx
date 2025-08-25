"use client";

import { Canvas } from "@react-three/fiber";
import ObjectScene from "./objectScene"
import { useState } from "react";

export default function SolarScene() {
  const [activePlanet, setActivePlanet] = useState<{ label: string; blurb: string } | null>(null);
  return (
    <div className="w-full h-screen bg-black text-white">
      <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-xl md:text-2xl font-semibold">Welcome</h1>
        <p className="text-xs md:text-sm opacity-80">
          Hover a planet to pause & see its label. Click and drag to move the camera. Click to visit.
        </p>
      </div>
      {activePlanet && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/80 text-white p-4 rounded-xl shadow-lg max-w-xs text-center">
            <h2 className="text-lg font-semibold mb-1">{activePlanet.label}</h2>
            <p className="text-sm opacity-80">{activePlanet.blurb}</p>
          </div>
        </div>
      )}
      <Canvas
        className="w-full h-full"
        shadows
        camera={{ position: [0, 6, 16], fov: 50 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <ObjectScene setActivePlanet={setActivePlanet}/>
      </Canvas>

      <div className="absolute bottom-3 w-full text-center text-xs opacity-60">
        © {new Date().getFullYear()} John Grasso
      </div>
    </div>
  );
}
