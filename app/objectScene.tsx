import React from "react";
import { OrbitControls, Stars } from "@react-three/drei";
import Star from "./star";
import Planet from "./planet";
import IntroCameraController from "./introCameraController";

const LINKS = {
  linkedin: "https://www.linkedin.com/in/johnagrasso/",
  github: "https://github.com/jg80",
  resume: "/resume.pdf",
};

interface ObjectSceneProps {
  paused: boolean;
  motionScale: number;
  skipIntro: boolean;
  onHoverPauseChange: (hovering: boolean) => void;
  setActivePlanet: (p: { label: string; blurb: string } | null) => void;
}

export default function ObjectScene({
  paused,
  motionScale,
  skipIntro,
  onHoverPauseChange,
  setActivePlanet,
}: ObjectSceneProps) {
  return (
    <>
      <IntroCameraController skipIntro={skipIntro} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={20.5} distance={100} />
      <Stars radius={100} depth={50} count={2000} factor={4} fade />

      <Star />

      <Planet
        color="#ffffff"
        label="LinkedIn"
        blurb="Professional profile and work history."
        distance={6}
        size={0.6}
        angularSpeed={0.5}
        paused={paused}
        motionScale={motionScale}
        onHoverPauseChange={onHoverPauseChange}
        setActivePlanet={setActivePlanet}
        onClick={() => window.open(LINKS.linkedin, "_blank", "noopener,noreferrer")}
      />

      <Planet
        color="#ffffff"
        label="GitHub"
        blurb="Code, projects, and open-source work."
        distance={9}
        size={0.7}
        angularSpeed={0.32}
        paused={paused}
        motionScale={motionScale}
        onHoverPauseChange={onHoverPauseChange}
        setActivePlanet={setActivePlanet}
        onClick={() => window.open(LINKS.github, "_blank", "noopener,noreferrer")}
      />

      <Planet
        color="#ffffff"
        label="Resume"
        blurb="Downloadable resume (August 2026)."
        distance={12}
        size={0.75}
        angularSpeed={0.24}
        paused={paused}
        motionScale={motionScale}
        onHoverPauseChange={onHoverPauseChange}
        setActivePlanet={setActivePlanet}
        onClick={() => {
          window.location.href = LINKS.resume;
        }}
      />

      <OrbitControls enablePan={false} minDistance={6} maxDistance={28} />
    </>
  );
}
