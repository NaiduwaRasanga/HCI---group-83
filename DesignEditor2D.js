import React, { useRef, useEffect } from 'react';

function DesignEditor2D({ roomSpecs, furniture, selectedFurnitureId, onSelect, cameraAngle, shadedFurniture }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (cameraAngle && cameraAngle !== 'top') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scale = 50;
    canvas.width = roomSpecs.width * scale + 100;
    canvas.height = roomSpecs.length * scale + 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, roomSpecs.floorColor);
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#4446';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += scale/4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += scale/4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#888b';
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= canvas.width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${roomSpecs.width} m`, canvas.width/2, 6);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${roomSpecs.width} m`, canvas.width/2, canvas.height-6);
    ctx.save();
    ctx.translate(0, canvas.height/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${roomSpecs.length} m`, 0, 6);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${roomSpecs.length} m`, 0, canvas.width-6);
    ctx.restore();
    ctx.restore();

    furniture.forEach((item, idx) => {
      const x = (item.position.x + roomSpecs.width/2) * scale;
      const z = (item.position.z + roomSpecs.length/2) * scale;
      let width = 1;
      let depth = 1;
      switch (item.type) {
        case 'chair': width = 0.5; depth = 0.5; break;
        case 'dining-table': width = 1.5; depth = 0.8; break;
        case 'side-table': width = 0.4; depth = 0.4; break;
        case 'coffee-table': width = 1; depth = 0.6; break;
        case 'sofa': width = 2; depth = 0.8; break;
        case 'rug': width = 2; depth = 1.5; break;
        case 'lamp': width = 0.3; depth = 0.3; break;
        default: break;
      }
      if (selectedFurnitureId !== null && selectedFurnitureId === idx) {
        ctx.save();
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 4;
        ctx.strokeRect(
          x - (width * scale)/2 - 4,
          z - (depth * scale)/2 - 4,
          width * scale + 8,
          depth * scale + 8
        );
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = '#0008';
      ctx.shadowBlur = 8;
      ctx.fillStyle = item.color || '#8B4513';
      ctx.fillRect(
        x - (width * scale)/2,
        z - (depth * scale)/2,
        width * scale,
        depth * scale
      );
      ctx.restore();
      if (item.shaded) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        ctx.fillRect(
          x - (width * scale)/2,
          z - (depth * scale)/2,
          width * scale,
          depth * scale
        );
        ctx.restore();
      }
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x - (width * scale)/2,
        z - (depth * scale)/2,
        width * scale,
        depth * scale
      );
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, z);
      ctx.lineTo(
        x + Math.sin(item.rotation.y) * (width * scale)/2,
        z + Math.cos(item.rotation.y) * (depth * scale)/2
      );
      ctx.stroke();
    });
  }, [roomSpecs, furniture, selectedFurnitureId, cameraAngle, shadedFurniture]);

  if (cameraAngle && cameraAngle !== 'top') {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--cursor-text)]/60 text-sm">
        2D view is only available in Top angle.
      </div>
    );
  }

  return (
    <div className="w-full h-full border border-gray-300 rounded-lg overflow-auto">
      <canvas
        ref={canvasRef}
        className="bg-white"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default DesignEditor2D; 