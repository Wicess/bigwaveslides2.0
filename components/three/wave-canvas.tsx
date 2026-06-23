"use client";

import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";

function LiquidBlob() {
  return (
    <Float speed={1.6} rotationIntensity={0.8} floatIntensity={1.4}>
      <mesh scale={2.3}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color="#0099FF"
          distort={0.42}
          speed={1.8}
          roughness={0.12}
          metalness={0.35}
        />
      </mesh>
    </Float>
  );
}

/** Self-contained 3D liquid blob — no external HDR/asset fetches (offline-safe). */
export default function WaveCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <pointLight position={[-4, -2, -3]} intensity={2} color="#00D4FF" />
      <LiquidBlob />
    </Canvas>
  );
}
