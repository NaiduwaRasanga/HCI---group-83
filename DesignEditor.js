import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import DesignEditor2D from './DesignEditor2D';
import axios from '../utils/axios';
import FurnitureCatalog from './FurnitureCatalog';
import { useSpring, animated } from '@react-spring/three';
import { toast } from 'react-toastify';
import { furnitureModels } from '../models/furnitureModels';
import { Box3 } from 'three';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

// Enhanced InteractiveGLBModel with improved snapping
function InteractiveGLBModel({ url, position, rotation, scale, onUpdate, onSelect, itemId, isSelected, dragMode, shaded }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef();
  const { camera, gl } = useThree();
  const [modelHeight, setModelHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [meshes, setMeshes] = useState([]);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());

  useEffect(() => {
    if (scene) {
      scene.updateMatrixWorld(true);
      const box = new Box3().setFromObject(scene);
      setModelHeight(box.max.y - box.min.y);
      const cloned = clone(scene);
      const meshList = [];
      cloned.traverse((child) => {
        if (child.isMesh) {
          meshList.push(child);
        }
      });
      setMeshes(meshList);
    }
  }, [scene]);

  const yOffset = (modelHeight * scale[1]) / 2;

  const handlePointerDown = (e) => {
    if (!isSelected || !dragMode) return;
    e.stopPropagation();
    setDragging(true);
    document.body.style.cursor = 'grabbing';
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -position[1]);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.subVectors(new THREE.Vector3(...position), intersect);
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !isSelected || !dragMode) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersect);
    intersect.add(dragOffset.current);
    const newPosition = [
      intersect.x,
      position[1],
      intersect.z
    ];
    if (onUpdate) onUpdate(newPosition, rotation);
  }, [dragging, isSelected, dragMode, gl, camera, position, onUpdate, rotation]);

  const handlePointerUp = useCallback((e) => {
    if (!dragging) return;
    e.stopPropagation();
    setDragging(false);
    document.body.style.cursor = 'default';
  }, [dragging]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
      return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      };
  }, [dragging, isSelected, dragMode, position, rotation, onUpdate, handlePointerMove, handlePointerUp]);

    return (
    <group
        ref={meshRef}
      position={[position[0], yOffset, position[2]]}
        rotation={rotation}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
      {meshes.map((mesh, i) => (
        <mesh
          key={i}
          geometry={mesh.geometry}
          material={mesh.material}
          castShadow={mesh.castShadow}
          receiveShadow={mesh.receiveShadow}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(itemId);
          }}
          onPointerDown={handlePointerDown}
        />
      ))}
      {hovered && (
        <mesh position={[0, -yOffset, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="yellow" />
      </mesh>
      )}
      {/* Shade overlay for selected furniture */}
      {isSelected && shaded && meshes.map((mesh, i) => (
        <mesh
          key={`shade-${i}`}
          geometry={mesh.geometry}
          position={mesh.position}
          rotation={mesh.rotation}
          scale={mesh.scale}
        >
          <meshStandardMaterial color="black" opacity={0.18} transparent />
        </mesh>
      ))}
    </group>
  );
}

// Camera angle definitions
const CAMERA_ANGLES = (roomSpecs) => ({
  front:  { position: [0, 1.5, roomSpecs.length + 2], target: [0, 1.5, 0], hide: ['back'] },
  left:   { position: [-roomSpecs.width - 2, 1.5, 0], target: [0, 1.5, 0], hide: ['left'] },
  right:  { position: [roomSpecs.width + 2, 1.5, 0], target: [0, 1.5, 0], hide: ['right'] },
  top:    { position: [0, roomSpecs.height + 2, 0], target: [0, 0, 0], hide: ['ceiling'] },
  corner: { position: [roomSpecs.width + 2, 1.5, roomSpecs.length + 2], target: [0, 1.5, 0], hide: ['back', 'right'] }
});

const DesignEditor = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [viewMode, setViewMode] = useState('3D');
  const [roomSpecs, setRoomSpecs] = useState({
    width: 5,
    length: 5,
    height: 3,
    shape: 'rectangular',
    wallColor: '#ffffff',
    floorColor: '#808080',
    wallTexture: 'smooth',
    floorTexture: 'wood'
  });
  const [furniture, setFurniture] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraAngle, setCameraAngle] = useState('front');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFurnitureIndex, setSelectedFurnitureIndex] = useState(null);
  const [dragMode, setDragMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [designName, setDesignName] = useState('');
  const [showDesignList, setShowDesignList] = useState(false);
  const [userDesigns, setUserDesigns] = useState([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [roomShade, setRoomShade] = useState(false);

  const isNewDesign = location.pathname === '/design/new';

  // Animate camera position and target
  const spring = useSpring({
    position: CAMERA_ANGLES(roomSpecs)[cameraAngle].position,
    target: CAMERA_ANGLES(roomSpecs)[cameraAngle].target,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // Update the load functionality in useEffect
  useEffect(() => {
    if (isNewDesign) {
      setDesign({ name: 'New Design' });
      setRoomSpecs({
        width: 5,
        length: 5,
        height: 3,
        shape: 'rectangular',
        wallColor: '#ffffff',
        floorColor: '#808080',
        wallTexture: 'smooth',
        floorTexture: 'wood'
      });
      setFurniture([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!id) {
      setError('Invalid design ID');
      setIsLoading(false);
      return;
    }

    const fetchDesign = async () => {
      try {
        const res = await axios.get(`/api/designs/${id}`);
        setDesign(res.data);
        setRoomSpecs(res.data.roomSpecs);
        
        // Clamp Y to 0 if below floor when loading/adding furniture
        const clampY = y => Math.max(0, y);
        
        // Ensure each furniture item has a unique ID
        const normalizedFurniture = res.data.furniture.map(item => ({
          ...item,
          id: item.id || `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: item.position?.x || 0,
            y: clampY(item.position?.y || 0),
            z: item.position?.z || 0
          },
          rotation: {
            x: item.rotation?.x || 0,
            y: item.rotation?.y || 0,
            z: item.rotation?.z || 0
          },
          scale: {
            x: item.scale?.x || 1,
            y: item.scale?.y || 1,
            z: item.scale?.z || 1
          }
        }));
        
        setFurniture(normalizedFurniture);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Error loading design');
        toast.error('Failed to load design. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesign();
  }, [id, isNewDesign]);

  // Load user's designs
  const loadUserDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const response = await axios.get('/api/designs');
      setUserDesigns(response.data);
    } catch (error) {
      toast.error('Failed to load designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  // Enhanced save functionality with dialog
  const saveDesign = useCallback(async (name) => {
    setIsSaving(true);
    setError(null);
    try {
      const designData = {
        name: name || design?.name || 'New Design',
        roomSpecs,
        furniture: furniture.map(item => ({
          ...item,
          modelId: item.modelId || item.type,
          id: item.id
        })),
        lastModified: new Date().toISOString()
      };

      if (isNewDesign) {
        const response = await axios.post('/api/designs', designData);
        toast.success('Design saved successfully!');
        navigate(`/design/${response.data._id}`);
      } else {
        await axios.put(`/api/designs/${id}`, designData);
        toast.success('Design updated successfully!');
      }
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving design:', error);
      setError(error.response?.data?.message || 'Error saving design');
      toast.error('Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [design, isNewDesign, roomSpecs, furniture, id, navigate]);

  const handleSave = useCallback(async () => {
    if (!design?.name || isNewDesign) {
      setShowSaveDialog(true);
      return;
    }
    await saveDesign(design.name);
  }, [design, isNewDesign, saveDesign, setShowSaveDialog]);

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    
    try {
      await axios.delete(`/api/designs/${designId}`);
      toast.success('Design deleted successfully');
      if (designId === id) {
        navigate('/dashboard');
      } else {
        loadUserDesigns();
      }
    } catch (error) {
      toast.error('Failed to delete design');
      console.error('Error deleting design:', error);
    }
  };

  // Load designs when opening the list
  useEffect(() => {
    if (showDesignList) {
      loadUserDesigns();
    }
  }, [showDesignList]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'd' && selectedFurnitureIndex !== null) {
        setDragMode(prev => !prev);
      }
      if (e.key === 'Delete' && selectedFurnitureIndex !== null) {
        setFurniture(prev => {
          const updated = prev.filter((_, i) => i !== selectedFurnitureIndex);
          setSelectedFurnitureIndex(null);
          setDragMode(false);
          return updated;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'g') {
        setShowGrid(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedFurnitureIndex, handleSave]);

  // Add loading state for furniture operations
  const [isFurnitureLoading, setIsFurnitureLoading] = useState(false);

  // Enhanced handleFurnitureSelect with loading state
  const handleFurnitureSelect = async (item) => {
    setIsFurnitureLoading(true);
    try {
      const uniqueId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
    const newFurniture = {
      type: item.id,
      modelId: item.id,
        position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#8B4513',
        material: 'wood',
        id: uniqueId
    };

    setFurniture(prev => {
      const updated = [...prev, newFurniture];
      setSelectedFurnitureIndex(updated.length - 1);
      setDragMode(true);
      return updated;
    });

    toast.success(`${item.id} added to the room`);
    } catch (error) {
      toast.error('Failed to add furniture');
    } finally {
      setIsFurnitureLoading(false);
    }
  };

  // Handler to update position/rotation of interactive furniture
  const handleInteractiveUpdate = (itemId, pos, rot) => {
    if (dragMode && selectedFurnitureIndex !== null && furniture[selectedFurnitureIndex]?.id === itemId) {
      setFurniture((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex(f => f.id === itemId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
          position: { x: pos[0], y: pos[1], z: pos[2] },
          rotation: { x: rot[0], y: rot[1], z: rot[2] },
        };
        }
        return updated;
      });
    }
  };

  // Add a useEffect to reset selection if furniture array changes and index is invalid
  useEffect(() => {
    if (
      selectedFurnitureIndex !== null &&
      (selectedFurnitureIndex < 0 || selectedFurnitureIndex >= furniture.length)
    ) {
      setSelectedFurnitureIndex(null);
      setDragMode(false);
    }
  }, [furniture, selectedFurnitureIndex]);

  // Add drag mode indicator
  useEffect(() => {
    if (dragMode) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'default';
    }
  }, [dragMode]);

  // Add tooltips to buttons
  const tooltips = {
    save: 'Save Design (Ctrl/Cmd + S)',
    grid: 'Toggle Grid (G)',
    drag: 'Toggle Drag Mode (D)',
    delete: 'Delete Selected (Delete)',
    rotate: 'Rotate Selected (R)',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--cursor-accent)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--cursor-bg)]">
      {/* Add loading overlay */}
      {isFurnitureLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--cursor-accent)]"></div>
      </div>
      )}

      {/* Selected Item Sidebar */}
          {selectedFurnitureIndex !== null && furniture[selectedFurnitureIndex] && (
        <div className="fixed right-0 top-0 h-full w-80 z-40 flex flex-col items-center justify-center bg-[var(--cursor-bg)]/95 glass-effect border-l border-[var(--cursor-border)] shadow-2xl p-6 transition-transform duration-300">
          <button
            className="absolute top-4 right-4 text-2xl text-[var(--cursor-accent)] hover:text-red-500 focus:outline-none transition-colors"
            onClick={() => { setSelectedFurnitureIndex(null); setDragMode(false); }}
            title="Close"
          >
            ×
          </button>
          <div className="w-full flex flex-col items-center gap-4">
            <h2 className="text-2xl font-extrabold gradient-text mb-2 tracking-tight">Selected Item</h2>
              <div className="w-full h-px bg-gradient-to-r from-[var(--cursor-accent)]/60 to-transparent mb-2" />

              {/* Scale Section */}
            <div className="w-full flex flex-col items-center gap-1">
                <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 mb-1">Scale</label>
                <div className="flex items-center w-full gap-2">
                  <span className="text-xs text-[var(--cursor-text)]/60">0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.01"
                    value={furniture[selectedFurnitureIndex]?.scale?.x || 1}
                    onChange={e => {
                      const newScale = parseFloat(e.target.value);
                      setFurniture(prev => {
                        const updated = [...prev];
                        updated[selectedFurnitureIndex] = {
                          ...updated[selectedFurnitureIndex],
                          scale: { x: newScale, y: newScale, z: newScale }
                        };
                        return updated;
                      });
                    }}
                    className="w-full accent-[var(--cursor-accent)]"
                  />
                  <span className="text-xs text-[var(--cursor-text)]/60">3.0</span>
                </div>
              <div className="text-lg font-mono font-bold text-[var(--cursor-accent)]">
                {furniture[selectedFurnitureIndex]?.scale?.x?.toFixed(2) || 1}
              </div>
              </div>

              {/* Rotate Buttons */}
            <div className="flex justify-center gap-4 w-full">
                <button
                className="btn-secondary flex-1 flex flex-col items-center py-2 hover:bg-[var(--cursor-accent)]/80 transition-colors"
                title="Rotate Left (Q)"
                  onClick={() => {
                    setFurniture((prev) => {
                      const updated = [...prev];
                      const rot = updated[selectedFurnitureIndex].rotation;
                      updated[selectedFurnitureIndex] = {
                        ...updated[selectedFurnitureIndex],
                        rotation: { ...rot, y: rot.y - Math.PI / 8 },
                      };
                      return updated;
                    });
                  }}
                >
                  <span className="text-xl">⟲</span>
                </button>
                <button
                className="btn-secondary flex-1 flex flex-col items-center py-2 hover:bg-[var(--cursor-accent)]/80 transition-colors"
                title="Rotate Right (E)"
                  onClick={() => {
                    setFurniture((prev) => {
                      const updated = [...prev];
                      const rot = updated[selectedFurnitureIndex].rotation;
                      updated[selectedFurnitureIndex] = {
                        ...updated[selectedFurnitureIndex],
                        rotation: { ...rot, y: rot.y + Math.PI / 8 },
                      };
                      return updated;
                    });
                  }}
                >
                  <span className="text-xl">⟳</span>
                </button>
              </div>

              {/* Height Control */}
            <div className="w-full flex flex-col items-center gap-1 mt-2">
                <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 mb-1">Height</label>
                <div className="flex items-center w-full gap-2">
                  <span className="text-xs text-[var(--cursor-text)]/60">0m</span>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={furniture[selectedFurnitureIndex]?.position?.y || 0}
                    onChange={e => {
                      const newHeight = parseFloat(e.target.value);
                      setFurniture(prev => {
                        const updated = [...prev];
                        updated[selectedFurnitureIndex] = {
                          ...updated[selectedFurnitureIndex],
                          position: {
                            ...updated[selectedFurnitureIndex].position,
                            y: newHeight
                          }
                        };
                        return updated;
                      });
                    }}
                    className="w-full accent-[var(--cursor-accent)]"
                  />
                  <span className="text-xs text-[var(--cursor-text)]/60">3m</span>
                </div>
                <div className="text-lg font-mono font-bold text-[var(--cursor-accent)]">
                  {(furniture[selectedFurnitureIndex]?.position?.y || 0).toFixed(1)}m
                </div>
              </div>

            {/* Floor Color */}
            <div>
              <label className="block text-sm font-medium text-[var(--cursor-text)] opacity-75">Floor Color</label>
              <input
                type="color"
                value={roomSpecs.floorColor}
                onChange={e => setRoomSpecs({ ...roomSpecs, floorColor: e.target.value })}
                className="mt-1 block w-12 h-8 rounded border-none p-0 bg-transparent"
              />
            </div>

            {/* Wall Color */}
            <div>
              <label className="block text-sm font-medium text-[var(--cursor-text)] opacity-75">Wall Color</label>
              <input
                type="color"
                value={roomSpecs.wallColor}
                onChange={e => setRoomSpecs({ ...roomSpecs, wallColor: e.target.value })}
                className="mt-1 block w-12 h-8 rounded border-none p-0 bg-transparent"
              />
            </div>

            {/* Shade Room */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="roomShade"
                checked={roomShade}
                onChange={() => setRoomShade((s) => !s)}
                className="accent-[var(--cursor-accent)]"
              />
              <label htmlFor="roomShade" className="text-sm font-medium text-[var(--cursor-text)]">Shade Room</label>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 mt-4">
              <button
                className={`w-full py-2 rounded-full font-bold transition-all ${
                  dragMode 
                    ? 'bg-[var(--cursor-accent)] text-white shadow-lg' 
                    : 'bg-[var(--cursor-border)] text-[var(--cursor-text)] hover:bg-[var(--cursor-accent)]/80'
                }`}
                onClick={() => setDragMode(prev => !prev)}
                title={tooltips.drag}
              >
                {dragMode ? 'Dragging Enabled' : 'Enable Drag'}
              </button>
              <button
                className="w-full py-2 rounded-full font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                onClick={() => {
                  setFurniture(prev => {
                    const updated = prev.filter((_, i) => i !== selectedFurnitureIndex);
                      setSelectedFurnitureIndex(null);
                    setDragMode(false);
                    return updated;
                  });
                }}
                title={tooltips.delete}
              >
                Remove Item
              </button>
              <button
                className="w-full py-2 rounded-full font-bold bg-[var(--cursor-border)] text-[var(--cursor-text)] hover:bg-[var(--cursor-accent)]/80 hover:text-white transition-all"
                onClick={() => {
                  setSelectedFurnitureIndex(null);
                  setDragMode(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`w-full py-2 rounded-full font-bold ${furniture[selectedFurnitureIndex]?.shaded ? 'bg-gray-800 text-white' : 'bg-[var(--cursor-border)] text-[var(--cursor-text)]'}`}
                onClick={() => {
                  setFurniture(prev => {
                    const updated = [...prev];
                    updated[selectedFurnitureIndex] = {
                      ...updated[selectedFurnitureIndex],
                      shaded: !updated[selectedFurnitureIndex]?.shaded
                    };
                    return updated;
                  });
                }}
              >
                {furniture[selectedFurnitureIndex]?.shaded ? 'Remove Shade' : 'Add Shade'}
              </button>
            </div>
          </div>
            </div>
          )}
      {/* Main Content (Canvas and Catalog) */}
      <div className="flex-1 flex flex-col">
        {/* Camera Angle Toolbar - move to left, vertically centered */}
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 bg-[var(--cursor-bg)]/80 glass-effect p-2 rounded-lg shadow-lg border border-[var(--cursor-border)] w-fit">
          {['front', 'left', 'right', 'top', 'corner'].map((angle) => (
            <button
              key={angle}
              className={`px-3 py-2 rounded font-semibold transition-all duration-200 ${cameraAngle === angle ? 'bg-[var(--cursor-accent)] text-white' : 'bg-[var(--cursor-border)] text-[var(--cursor-text)] hover:bg-[var(--cursor-accent)]/80 hover:text-white'}`}
              onClick={() => setCameraAngle(angle)}
            >
              {angle.charAt(0).toUpperCase() + angle.slice(1)}
            </button>
          ))}
        </div>
        {/* Top Toolbar */}
        <div className="bg-[var(--cursor-border)] p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              title="Return to Dashboard"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold gradient-text">
              {design?.name || 'New Design'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDesignList(!showDesignList)}
              className="btn-secondary"
              title="View your saved designs"
            >
              {showDesignList ? 'Hide Designs' : 'My Designs'}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="btn-secondary"
              title={tooltips.grid}
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
              title={tooltips.save}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Design'}
            </button>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-12 gap-4 p-4">
          {/* Room Specifications Panel */}
          <div className="col-span-3 glass-effect rounded-2xl p-6 shadow-xl border border-[var(--cursor-border)] bg-[var(--cursor-bg)]/80">
            <h2 className="text-2xl font-extrabold mb-6 gradient-text tracking-tight">Room Specifications</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 mb-1">Width (m)</label>
                  <input
                    type="number"
                    value={roomSpecs.width}
                    onChange={(e) => setRoomSpecs({ ...roomSpecs, width: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-lg bg-[var(--cursor-border)] border border-[var(--cursor-border)] text-[var(--cursor-text)] focus:border-[var(--cursor-accent)] focus:ring-2 focus:ring-[var(--cursor-accent)] px-3 py-2 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 mb-1">Length (m)</label>
                  <input
                    type="number"
                    value={roomSpecs.length}
                    onChange={(e) => setRoomSpecs({ ...roomSpecs, length: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-lg bg-[var(--cursor-border)] border border-[var(--cursor-border)] text-[var(--cursor-text)] focus:border-[var(--cursor-accent)] focus:ring-2 focus:ring-[var(--cursor-accent)] px-3 py-2 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 mb-1">Height (m)</label>
                <input
                  type="number"
                  value={roomSpecs.height}
                  onChange={(e) => setRoomSpecs({ ...roomSpecs, height: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg bg-[var(--cursor-border)] border border-[var(--cursor-border)] text-[var(--cursor-text)] focus:border-[var(--cursor-accent)] focus:ring-2 focus:ring-[var(--cursor-accent)] px-3 py-2 transition-all"
                />
              </div>
              <div className="border-t border-[var(--cursor-border)] my-2" />
              <div className="flex items-center gap-4">
                <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 flex items-center gap-2">
                  <span className="inline-block w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-[var(--cursor-accent)]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m8-8h2M2 12H4m15.364-7.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414" /></svg>
                  </span>
                  Floor Color
                </label>
                <input
                  type="color"
                  value={roomSpecs.floorColor}
                  onChange={e => setRoomSpecs({ ...roomSpecs, floorColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-[var(--cursor-border)] hover:border-[var(--cursor-accent)] focus:border-[var(--cursor-accent)] transition-all cursor-pointer"
                  style={{ background: 'none' }}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="block text-sm font-semibold text-[var(--cursor-text)] opacity-80 flex items-center gap-2">
                  <span className="inline-block w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-[var(--cursor-accent)]"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" className="text-[var(--cursor-accent)]" /></svg>
                  </span>
                  Wall Color
                </label>
                <input
                  type="color"
                  value={roomSpecs.wallColor}
                  onChange={e => setRoomSpecs({ ...roomSpecs, wallColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-[var(--cursor-border)] hover:border-[var(--cursor-accent)] focus:border-[var(--cursor-accent)] transition-all cursor-pointer"
                  style={{ background: 'none' }}
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="roomShade"
                  checked={roomShade}
                  onChange={() => setRoomShade((s) => !s)}
                  className="accent-[var(--cursor-accent)] scale-125"
                />
                <label htmlFor="roomShade" className="text-sm font-semibold text-[var(--cursor-text)]">Shade Room</label>
              </div>
            </div>
          </div>
        {/* 3D/2D View and Furniture Items */}
        <div className="col-span-6 glass-effect rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">Design View</h2>
            <div className="space-x-2">
              <button
                onClick={() => setViewMode('2D')}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === '2D' 
                    ? 'bg-[var(--cursor-accent)] text-white' 
                    : 'bg-[var(--cursor-border)] text-[var(--cursor-text)] hover:bg-[var(--cursor-accent)]'
                }`}
              >
                2D View
              </button>
              <button
                onClick={() => setViewMode('3D')}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === '3D' 
                    ? 'bg-[var(--cursor-accent)] text-white' 
                    : 'bg-[var(--cursor-border)] text-[var(--cursor-text)] hover:bg-[var(--cursor-accent)]'
                }`}
              >
                3D View
              </button>
            </div>
          </div>

          <div className="h-[600px] w-full relative rounded-lg overflow-hidden">
            {viewMode === '2D' ? (
              <div className="absolute inset-0">
                <DesignEditor2D roomSpecs={roomSpecs} furniture={furniture} cameraAngle={cameraAngle} selectedFurnitureIndex={selectedFurnitureIndex} />
              </div>
            ) : (
              <Canvas shadows>
                <Suspense fallback={null}>
                  {/* Animated camera for smooth transitions */}
                  <animated.perspectiveCamera
                    makeDefault
                    position={spring.position}
                    fov={50}
                    onUpdate={self => {
                      const t = spring.target.get ? spring.target.get() : spring.target;
                      if (Array.isArray(t)) self.lookAt(...t);
                    }}
                  />
                  {/* Enhanced Lighting System */}
                  <ambientLight intensity={0.4} />
                  {/* Main directional light (sun) */}
                  <directionalLight
                    position={[5, 10, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-far={50}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                  />
                  {/* Fill light for better shadows */}
                  <directionalLight
                    position={[-5, 5, -5]}
                    intensity={0.3}
                    castShadow
                  />
                  {/* Accent light for depth */}
                  <pointLight
                    position={[0, 3, 0]}
                    intensity={0.2}
                    distance={10}
                  />
                  {showGrid && (
                      <Grid
                        args={[roomSpecs.width, roomSpecs.length]}
                        cellSize={0.5}
                        cellThickness={0.5}
                        cellColor="#6f6f6f"
                        sectionSize={1}
                        sectionThickness={1}
                        sectionColor="#9d4b4b"
                        fadeDistance={30}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid={true}
                      />
                  )}
                  {roomShade && (
                    <mesh position={[0, roomSpecs.height / 2, 0]} renderOrder={100}>
                      <boxGeometry args={[roomSpecs.width * 1.01, roomSpecs.height, roomSpecs.length * 1.01]} />
                      <meshStandardMaterial color="black" opacity={0.18} transparent />
                    </mesh>
                  )}
                  {/* Room walls with fade-out animation */}
                  {/* Front wall (z = -length/2) */}
                  <mesh
                    position={[0, roomSpecs.height / 2, -roomSpecs.length / 2]}
                    castShadow
                    receiveShadow
                    visible={!CAMERA_ANGLES(roomSpecs)[cameraAngle].hide.includes('front')}
                  >
                    <boxGeometry args={[roomSpecs.width, roomSpecs.height, 0.1]} />
                    <meshStandardMaterial color={roomSpecs.wallColor} opacity={1} transparent />
                  </mesh>
                  {/* Back wall (z = +length/2) */}
                  <mesh
                    position={[0, roomSpecs.height / 2, roomSpecs.length / 2]}
                    castShadow
                    receiveShadow
                    visible={!CAMERA_ANGLES(roomSpecs)[cameraAngle].hide.includes('back')}
                  >
                    <boxGeometry args={[roomSpecs.width, roomSpecs.height, 0.1]} />
                    <meshStandardMaterial color={roomSpecs.wallColor} opacity={1} transparent />
                  </mesh>
                  {/* Left wall (x = -width/2) */}
                  <mesh
                    position={[-roomSpecs.width / 2, roomSpecs.height / 2, 0]}
                    castShadow
                    receiveShadow
                    visible={!CAMERA_ANGLES(roomSpecs)[cameraAngle].hide.includes('left')}
                  >
                    <boxGeometry args={[0.1, roomSpecs.height, roomSpecs.length]} />
                    <meshStandardMaterial color={roomSpecs.wallColor} opacity={1} transparent />
                  </mesh>
                  {/* Right wall (x = +width/2) */}
                  <mesh
                    position={[roomSpecs.width / 2, roomSpecs.height / 2, 0]}
                    castShadow
                    receiveShadow
                    visible={!CAMERA_ANGLES(roomSpecs)[cameraAngle].hide.includes('right')}
                  >
                    <boxGeometry args={[0.1, roomSpecs.height, roomSpecs.length]} />
                    <meshStandardMaterial color={roomSpecs.wallColor} opacity={1} transparent />
                  </mesh>
                  {/* Floor */}
                  <mesh
                    position={[0, 0, 0]}
                    receiveShadow
                  >
                    <boxGeometry args={[roomSpecs.width, 0.1, roomSpecs.length]} />
                    <meshStandardMaterial color={roomSpecs.floorColor} />
                  </mesh>
                  {/* Furniture */}
                  {furniture.map((item, index) => {
                    const modelDef = furnitureModels[item.type];
                      const isSelected = selectedFurnitureIndex !== null && furniture[selectedFurnitureIndex]?.id === item.id;
                    
                    // Ensure item has all required properties with defaults
                    const itemPosition = {
                      x: item.position?.x || 0,
                      y: item.position?.y || 0,
                      z: item.position?.z || 0
                    };
                    const itemRotation = {
                      x: item.rotation?.x || 0,
                      y: item.rotation?.y || 0,
                      z: item.rotation?.z || 0
                    };
                    const itemScale = {
                      x: item.scale?.x || 1,
                      y: item.scale?.y || 1,
                      z: item.scale?.z || 1
                    };

                    if (modelDef && modelDef.modelPath) {
                      return (
                          <group
                            position={[itemPosition.x, itemPosition.y, itemPosition.z]}
                            key={item.id}
                          >
                          <InteractiveGLBModel
                            url={modelDef.modelPath}
                            position={[itemPosition.x, itemPosition.y, itemPosition.z]}
                            rotation={[itemRotation.x, itemRotation.y, itemRotation.z]}
                            scale={[itemScale.x, itemScale.y, itemScale.z]}
                              onUpdate={(pos, rot) => handleInteractiveUpdate(item.id, pos, rot)}
                              onSelect={(id) => {
                                const idx = furniture.findIndex(f => f.id === id);
                                if (idx !== -1) {
                                  setSelectedFurnitureIndex(idx);
                                  setDragMode(false);
                                }
                              }}
                              itemId={item.id}
                              isSelected={isSelected}
                              dragMode={dragMode}
                              shaded={item.shaded}
                          />
                          {isSelected && (
                            <mesh position={[0, 1.2, 0]}>
                              <sphereGeometry args={[0.15, 16, 16]} />
                              <meshStandardMaterial color="#8b5cf6" opacity={0.5} transparent />
                            </mesh>
                          )}
                        </group>
                      );
                    } else {
                      console.warn(`Model definition not found for type: ${item.type}`);
                      return (
                        <mesh
                            key={item.id}
                          position={[itemPosition.x, itemPosition.y, itemPosition.z]}
                          rotation={[itemRotation.x, itemRotation.y, itemRotation.z]}
                          scale={[itemScale.x, itemScale.y, itemScale.z]}
                          castShadow
                          receiveShadow
                            onClick={() => {
                              setSelectedFurnitureIndex(index);
                              setDragMode(false);
                            }}
                            onPointerDown={isSelected && dragMode ? (e => {
                              e.stopPropagation();
                              // Drag logic for box placeholder (optional)
                            }) : undefined}
                        >
                          <boxGeometry args={[1, 1, 1]} />
                          <meshStandardMaterial color={item.color || '#808080'} />
                          {isSelected && (
                            <mesh position={[0, 0.7, 0]}>
                              <sphereGeometry args={[0.15, 16, 16]} />
                              <meshStandardMaterial color="#8b5cf6" opacity={0.5} transparent />
                            </mesh>
                          )}
                        </mesh>
                      );
                    }
                  })}
                  <OrbitControls 
                    enabled={!dragMode}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={3}
                    maxDistance={20}
                  />
                  <Environment preset="sunset" />
                </Suspense>
              </Canvas>
            )}
          </div>
        </div>
          {/* Furniture Catalog */}
        <div className="col-span-3 glass-effect rounded-lg p-4 min-w-[320px] max-w-[400px]">
          <h2 className="text-xl font-bold mb-4 gradient-text">Furniture Catalog</h2>
          <FurnitureCatalog onSelect={handleFurnitureSelect} />
        </div>
      </div>
      </div>
      {/* Design List Sidebar */}
      {showDesignList && (
        <div className="fixed right-0 top-0 h-full w-80 bg-[var(--cursor-bg)] border-l border-[var(--cursor-border)] p-4 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">My Designs</h2>
            <button onClick={() => setShowDesignList(false)} className="btn-secondary">×</button>
          </div>
          {isLoadingDesigns ? (
            <div className="text-center py-4">Loading designs...</div>
          ) : (
            <div className="space-y-2">
              {userDesigns.map((design) => (
                <div
                  key={design._id}
                  className="glass-effect rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{design.name}</h3>
                    <p className="text-sm opacity-75">
                      {new Date(design.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        navigate(`/design/${design._id}`);
                        setShowDesignList(false);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteDesign(design._id)}
                      className="btn-secondary text-sm text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Save Design</h2>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter design name"
              className="w-full p-2 mb-4 rounded bg-[var(--cursor-bg)] border border-[var(--cursor-border)]"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => saveDesign(designName)}
                disabled={!designName.trim() || isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignEditor; 