import React, { useRef, useEffect } from 'react';
import { useMindmapStore } from '@/stores/mindmapStore';
import { getNodeColor } from '@/types/mindmap';

const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mindmap } = useMindmapStore();
  const { nodes, rootId, viewport } = mindmap;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const width = 160;
    const height = 100;
    const dpr = window.devicePixelRatio;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear
    ctx.fillStyle = 'hsl(225, 25%, 10%)';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(nodes).forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    
    const padding = 20;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const scale = Math.min(width / contentWidth, height / contentHeight) * 0.8;
    
    const offsetX = (width - contentWidth * scale) / 2 - minX * scale + padding * scale;
    const offsetY = (height - contentHeight * scale) / 2 - minY * scale + padding * scale;
    
    // Draw connections
    const drawConnections = (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.collapsed) return;
      
      node.children.forEach(childId => {
        const child = nodes[childId];
        if (!child) return;
        
        ctx.beginPath();
        ctx.moveTo(node.position.x * scale + offsetX, node.position.y * scale + offsetY);
        ctx.lineTo(child.position.x * scale + offsetX, child.position.y * scale + offsetY);
        ctx.strokeStyle = 'hsl(225, 15%, 30%)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        drawConnections(childId);
      });
    };
    
    drawConnections(rootId);
    
    // Draw nodes
    Object.values(nodes).forEach(node => {
      const x = node.position.x * scale + offsetX;
      const y = node.position.y * scale + offsetY;
      const size = node.id === rootId ? 6 : 4;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(node.level);
      ctx.fill();
    });
    
    // Draw viewport indicator
    ctx.strokeStyle = 'hsl(220, 90%, 60%)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      (-viewport.x / viewport.zoom) * scale + offsetX - 20,
      (-viewport.y / viewport.zoom) * scale + offsetY - 15,
      (width / viewport.zoom) * scale,
      (height / viewport.zoom) * scale
    );
    
  }, [nodes, rootId, viewport]);
  
  return (
    <div className="floating-panel absolute bottom-4 left-4 z-50 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
      />
    </div>
  );
};

export default MiniMap;
