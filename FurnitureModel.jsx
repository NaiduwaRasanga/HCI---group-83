import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const FurnitureModel = ({ 
  modelUrl, 
  position = { x: 0, y: 0, z: 0 }, 
  rotation = { x: 0, y: 0, z: 0 },
  scale = 1,
  color,
  onLoad
}) => {
  const modelRef = useRef(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let model;

    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene;
        modelRef.current = model;

        // Apply position, rotation, and scale
        model.position.set(position.x, position.y, position.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.scale.set(scale, scale, scale);

        // Apply color if provided
        if (color) {
          model.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                roughness: 0.7,
                metalness: 0.2,
              });
            }
          });
        }

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        if (onLoad) {
          onLoad(model);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    return () => {
      if (model) {
        model.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [modelUrl, position, rotation, scale, color, onLoad]);

  return null;
};

export default FurnitureModel; 