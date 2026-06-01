"use client";

import { Canvas } from "@react-three/fiber";
import ObjectScene from "./objectScene"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "./useReducedMotion";

export default function SolarScene() {
  const reducedMotion = useReducedMotion();
  const [activePlanet, setActivePlanet] = useState<{ label: string; blurb: string } | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const paused = userPaused || hoverPaused;
  const motionScale = reducedMotion ? 0.35 : 1;

  useEffect(() => {
    if (reducedMotion) {
      setUserPaused(true);
    }
  }, [reducedMotion]);

  return (
    <div className="w-full h-screen bg-black text-white">
      <div className="pointer-events-none absolute top-4 left-1/2 z-10 max-w-xl -translate-x-1/2 px-4 text-center">
        <h1 className="text-xl font-semibold md:text-2xl">John Grasso</h1>
        <p className="text-xs opacity-80 md:text-sm">
          Hover a planet to pause and preview it, click to visit. Drag to orbit the camera and scroll to zoom.
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setUserPaused((prev) => !prev)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs transition-colors hover:bg-white/20 md:text-sm"
          aria-label={userPaused ? "Play motion" : "Pause motion"}
        >
          {userPaused ? "Play motion" : "Pause motion"}
        </button>
        <Link
          href="/experiments/gravity"
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs transition-colors hover:bg-white/20 md:text-sm"
        >
          Gravity sandbox
        </Link>
      </div>

      {activePlanet && (
        <div className="absolute bottom-20 left-1/2 z-20 w-[min(92vw,24rem)] -translate-x-1/2 px-3 md:bottom-24">
          <div className="rounded-xl bg-black/85 p-4 text-center text-white shadow-lg">
            <h2 className="mb-1 text-lg font-semibold">{activePlanet.label}</h2>
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
        <ObjectScene
          paused={paused}
          motionScale={motionScale}
          skipIntro={reducedMotion}
          onHoverPauseChange={setHoverPaused}
          setActivePlanet={setActivePlanet}
        />
      </Canvas>

      <div className="absolute bottom-3 w-full text-center text-xs opacity-60">
        © {new Date().getFullYear()} John Grasso
      </div>
    </div>
  );
}
