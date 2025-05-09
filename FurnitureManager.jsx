import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import FurnitureModel from './FurnitureModel';

const FurnitureManager = ({ furnitureItems, onFurnitureSelect }) => {
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [furnitureModels, setFurnitureModels] = useState([]);

  const handleModelLoad = (model, furnitureId) => {
    setFurnitureModels((prev) => [...prev, { id: furnitureId, model }]);
  };

  const handleFurnitureClick = (furnitureId) => {
    setSelectedFurniture(furnitureId);
    if (onFurnitureSelect) {
      onFurnitureSelect(furnitureId);
    }
  };

  // Add click event listeners to furniture models
  useEffect(() => {
    furnitureModels.forEach(({ id, model }) => {
      model.traverse((child) => {
        if (child.isMesh) {
          child.userData.furnitureId = id;
          child.addEventListener('click', () => handleFurnitureClick(id));
        }
      });
    });

    return () => {
      furnitureModels.forEach(({ model }) => {
        model.traverse((child) => {
          if (child.isMesh) {
            child.removeEventListener('click', handleFurnitureClick);
          }
        });
      });
    };
  }, [furnitureModels]);

  return (
    <>
      {furnitureItems.map((furniture) => (
        <FurnitureModel
          key={furniture._id}
          modelUrl={furniture.modelUrl}
          position={furniture.position}
          rotation={furniture.rotation}
          scale={furniture.scale}
          color={furniture.color}
          onLoad={(model) => handleModelLoad(model, furniture._id)}
        />
      ))}
    </>
  );
};

export default FurnitureManager; 