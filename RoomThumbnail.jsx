import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

const RoomThumbnail = ({ roomSpecs, furniture }) => {
  return (
    <div className="w-full h-48 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true }}
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Room */}
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[roomSpecs.width, 0.1, roomSpecs.length]} />
            <meshStandardMaterial color={roomSpecs.floorColor} />
          </mesh>
          
          {/* Walls */}
          <mesh position={[0, roomSpecs.height / 2, -roomSpecs.length / 2]} castShadow>
            <boxGeometry args={[roomSpecs.width, roomSpecs.height, 0.1]} />
            <meshStandardMaterial color={roomSpecs.wallColor} />
          </mesh>
          <mesh position={[0, roomSpecs.height / 2, roomSpecs.length / 2]} castShadow>
            <boxGeometry args={[roomSpecs.width, roomSpecs.height, 0.1]} />
            <meshStandardMaterial color={roomSpecs.wallColor} />
          </mesh>
          <mesh position={[-roomSpecs.width / 2, roomSpecs.height / 2, 0]} castShadow>
            <boxGeometry args={[0.1, roomSpecs.height, roomSpecs.length]} />
            <meshStandardMaterial color={roomSpecs.wallColor} />
          </mesh>
          <mesh position={[roomSpecs.width / 2, roomSpecs.height / 2, 0]} castShadow>
            <boxGeometry args={[0.1, roomSpecs.height, roomSpecs.length]} />
            <meshStandardMaterial color={roomSpecs.wallColor} />
          </mesh>

          {/* Furniture */}
          {furniture.map((item, index) => {
            const position = item.position || { x: 0, y: 0, z: 0 };
            const rotation = item.rotation || { x: 0, y: 0, z: 0 };
            const scale = item.scale || { x: 1, y: 1, z: 1 };
            
            return (
              <mesh
                key={index}
                position={[position.x, position.y, position.z]}
                rotation={[rotation.x, rotation.y, rotation.z]}
                scale={[scale.x, scale.y, scale.z]}
                castShadow
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={item.color || '#808080'} />
              </mesh>
            );
          })}

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={1}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RoomThumbnail; 