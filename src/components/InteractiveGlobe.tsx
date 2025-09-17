'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Studio {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  image_url?: string;
}

interface StudioMarkerProps {
  studio: Studio;
  position: [number, number, number];
  onClick: (studio: Studio) => void;
}

const StudioMarker: React.FC<StudioMarkerProps> = ({ studio, position, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.3 : 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(studio)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : '#000000'} />
      </mesh>
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black text-white p-2 rounded border border-white/20">
            <div className="text-sm font-medium">{studio.name}</div>
            <div className="text-xs text-gray-300">Rating: {studio.rating}/5</div>
          </div>
        </Html>
      )}
    </group>
  );
};

interface GlobeProps {
  studios: Studio[];
  onStudioClick: (studio: Studio) => void;
}

const Globe: React.FC<GlobeProps> = ({ studios, onStudioClick }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  useEffect(() => {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
    };
  }, [scene]);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  // Convert lat/lng to 3D coordinates
  const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return [x, y, z] as [number, number, number];
  };

  return (
    <>
      {/* Globe */}
      <Sphere ref={globeRef} args={[1, 32, 32]}>
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.9}
          wireframe={false}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[1.005, 16, 16]}>
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.1}
        />
      </Sphere>

      {/* Studio markers */}
      {studios.map((studio) => {
        const position = latLngToVector3(studio.latitude, studio.longitude, 1.05);
        return (
          <StudioMarker
            key={studio.id}
            studio={studio}
            position={position}
            onClick={onStudioClick}
          />
        );
      })}
    </>
  );
};

interface InteractiveGlobeProps {
  className?: string;
  studios?: Studio[];
  onStudioClick?: (studio: Studio) => void;
}

const InteractiveGlobe: React.FC<InteractiveGlobeProps> = ({
  className = '',
  studios = [],
  onStudioClick = () => {},
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          minDistance={2}
          maxDistance={5}
        />
        <Globe studios={studios} onStudioClick={onStudioClick} />
      </Canvas>
    </div>
  );
};

export default InteractiveGlobe;
export type { Studio };