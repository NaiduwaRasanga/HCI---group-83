import React, { useState, useEffect } from 'react';
import Scene from './three/Scene';
import FurnitureManager from './three/FurnitureManager';
import axios from 'axios';

const DesignEditor = () => {
  const [furnitureItems, setFurnitureItems] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const response = await axios.get('/api/furniture');
        setFurnitureItems(response.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchFurniture();
  }, []);

  const handleFurnitureSelect = (furnitureId) => {
    setSelectedFurniture(furnitureId);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4">
        <Scene>
          <FurnitureManager
            furnitureItems={furnitureItems}
            onFurnitureSelect={handleFurnitureSelect}
          />
        </Scene>
      </div>
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4">Design Tools</h2>
        {selectedFurniture && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Selected Furniture</h3>
            <p>ID: {selectedFurniture}</p>
            {/* Add more furniture controls here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignEditor; 