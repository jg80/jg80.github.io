import {
  useEffect,
  useRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface OrbitControlsLike {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

type IntroPhase = "intro" | "done";

interface IntroCameraControllerProps {
  duration?: number;
  skipIntro?: boolean;
}

export default function IntroCameraController({
  duration = 3.5,
  skipIntro = false,
}: IntroCameraControllerProps) {
  const { camera, controls } = useThree((state) => ({
    camera: state.camera,
    controls: state.controls as OrbitControlsLike | null,
  }));

  const phaseRef = useRef<IntroPhase>(skipIntro ? "done" : "intro");
  const elapsedRef = useRef(0);
  const userInterruptedRef = useRef(false);
  const startPositionRef = useRef(camera.position.clone());
  const targetPositionRef = useRef(camera.position.clone());

  useEffect(() => {
    if (skipIntro) {
      phaseRef.current = "done";
      return;
    }

    startPositionRef.current.set(0, 12, 28);
    camera.position.copy(startPositionRef.current);
    targetPositionRef.current.set(0, 6, 16);

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();

      const handleStart = () => {
        userInterruptedRef.current = true;
        phaseRef.current = "done";
      };

      controls.addEventListener("start", handleStart);

      return () => {
        controls.removeEventListener("start", handleStart);
      };
    }
  }, [camera, controls, skipIntro]);

  useFrame((_, delta) => {
    if (phaseRef.current === "done" || userInterruptedRef.current || skipIntro) return;

    elapsedRef.current += delta;
    const t = Math.min(elapsedRef.current / duration, 1);
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    camera.position.lerpVectors(startPositionRef.current, targetPositionRef.current, easedT);
    camera.lookAt(0, 0, 0);

    if (controls) {
      controls.update();
    }

    if (t >= 1) {
      phaseRef.current = "done";
    }
  });

  return null;
}
