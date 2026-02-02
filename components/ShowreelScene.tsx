
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ShowreelItem, HandData } from '../types';

const Group = 'group' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Color = 'color' as any;
const Fog = 'fog' as any;
const ImageImpl = Image as any;

interface ShowreelSceneProps {
  handDataRef: React.MutableRefObject<HandData>;
  items: ShowreelItem[];
}

const ImageSphere: React.FC<{ 
  handDataRef: React.MutableRefObject<HandData>, 
  items: ShowreelItem[] 
}> = ({ handDataRef, items }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const sphereItems = useMemo(() => {
    const count = items.length;
    return items.map((item, i) => {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      
      const radius = 7.0; // Balanced radius for compact yet viewable density
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      return {
        ...item,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [items]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const hand = handDataRef.current;

    const lerpFactor = 0.12; 

    if (hand.present) {
      // Zoom Logic: distance typically 0.05 to 0.4
      const normalizedDist = Math.min(Math.max((hand.distance - 0.04) / 0.36, 0), 1);
      
      // Much more zoomed out default (0.4) allowing the whole sphere to be seen.
      // Zoom in goes deeper (30.0) for detailed view.
      const targetScale = 0.4 + (normalizedDist * 29.6);
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, lerpFactor);
      groupRef.current.scale.set(s, s, s);

      // Wider rotation range (PI * 3.5) to look all around the sphere easily.
      const targetRotX = (hand.position.y - 0.5) * Math.PI * 3.5;
      const targetRotY = (hand.position.x - 0.5) * Math.PI * 3.5;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, lerpFactor);
    } else {
      // Gentle idle state
      groupRef.current.rotation.y += delta * 0.05;
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 0.8, 0.05);
      groupRef.current.scale.set(s, s, s);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.03);
    }
  });

  return (
    <Group ref={groupRef}>
      {sphereItems.map((item) => (
        <Group key={item.id} position={item.position}>
          <ImageItem item={item} />
        </Group>
      ))}
    </Group>
  );
};

const ImageItem: React.FC<{ item: ShowreelItem }> = ({ item }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <Group>
      <ImageImpl
        ref={meshRef}
        url={item.url}
        transparent
        opacity={1.0}
        scale={[1, 1.4, 1]}
        toneMapped={false}
        onError={() => console.warn(`Failed to load: ${item.url}`)}
      />
    </Group>
  );
};

export const ShowreelScene: React.FC<ShowreelSceneProps> = ({ handDataRef, items }) => {
  return (
    <div className="absolute inset-0 z-0 bg-white">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 38 }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Color attach="background" args={['#ffffff']} />
        <Fog attach="fog" args={['#ffffff', 25, 40]} />
        <AmbientLight intensity={2.0} />
        <PointLight position={[10, 20, 20]} intensity={2.5} color="#ffffff" />
        <ImageSphere handDataRef={handDataRef} items={items} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};
