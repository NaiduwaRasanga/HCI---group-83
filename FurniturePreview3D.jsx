import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';

const Model = ({ modelPath, scale, rotation, onError }) => {
  const group = useRef();
  const { scene } = useGLTF(modelPath, undefined, (error) => {
    if (onError) onError(error);
  });

  // Auto-rotate
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={group} scale={scale} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
};

const FurniturePreview3D = ({ modelPath, scale = [1,1,1], rotation = [0,0,0], fallbackImg }) => {
  const [error, setError] = useState(false);

  return (
    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#222' }}>
      {error ? (
        <img src={fallbackImg} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <Canvas camera={{ position: [0, 0.5, 2.2], fov: 35 }} dpr={[1, 2]} style={{ width: 48, height: 48 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 2]} intensity={0.7} />
          <Suspense fallback={null}>
            <Model modelPath={modelPath} scale={scale} rotation={rotation} onError={() => setError(true)} />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      )}
    </div>
  );
};

export default FurniturePreview3D; 