import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useMindmapStore } from '@/stores/mindmapStore';
import { getNodeColor, MindNode, Position, CanvasElement, ToolType } from '@/types/mindmap';
import { getEmbedUrl } from '@/lib/utils';
import InputDialog from './InputDialog';
import InlineAIInput from './InlineAIInput';

const MindmapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    mindmap,
    dragState,
    selectionState,
    canvasState,
    editingNodeId,
    selectNode,
    clearSelection,
    setHoveredNode,
    setEditingNode,
    startDrag,
    updateDrag,
    endDrag,
    startPan,
    updatePan,
    endPan,
    addNode,
    updateNodeText,
    deleteNode,
    toggleCollapse,
    zoomIn,
    zoomOut,
    currentTool,
    setCurrentTool,
    addElement,
    updateElement,
    deleteElement,
    layoutConfig,
    setLayoutConfig,
    selectElement,
    selectConnection,
    setHoveredElement,
    setHoveredConnection,
    addConnection,
    deleteConnection,
    generateSubNodes,
    aiConfig,
    isAIProcessing,
    aiProgressMessage,
    editingElementId,
    setEditingElement,
    setCanvasSize,
    focusNode,
    organizeMindmap,
  } = useMindmapStore();
  
  const { theme } = useTheme();
  
  const [renderTrigger, setRenderTrigger] = useState(0);
  const forceRender = useCallback(() => setRenderTrigger(prev => prev + 1), []);

  // Handle canvas resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, [setCanvasSize]);

  // Resolve theme colors for canvas drawing
  const colors = useMemo(() => {
    // We need to re-run this when theme changes
    // renderTrigger is also a dependency to ensure we have latest colors if they change
    const getVar = (name: string) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val ? `hsl(${val})` : '';
    };

    return {
      background: getVar('--background'),
      foreground: getVar('--foreground'),
      primary: getVar('--primary'),
      accent: getVar('--accent'),
      nodeBg: getVar('--node-bg'),
      nodeBorder: getVar('--node-border'),
      nodeHover: getVar('--node-hover'),
      connectionLine: getVar('--connection-line'),
      connectionActive: getVar('--connection-active'),
      mutedForeground: getVar('--muted-foreground'),
      nodeRoot: getVar('--node-root'),
      nodeLevel1: getVar('--node-level-1'),
      nodeLevel2: getVar('--node-level-2'),
      nodeLevel3: getVar('--node-level-3'),
      nodeLevel4: getVar('--node-level-4'),
      selection: getVar('--node-selected'),
      grid: getVar('--canvas-grid'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, renderTrigger]);
   
   const { nodes, elements, viewport, rootId, connections } = mindmap;
  
   // Helper to get theme-aware level color
   const getThemeLevelColor = useCallback((level: number) => {
     if (level === 0) return colors.nodeRoot || getNodeColor(0);
     if (level === 1) return colors.nodeLevel1 || getNodeColor(1);
     if (level === 2) return colors.nodeLevel2 || getNodeColor(2);
     if (level === 3) return colors.nodeLevel3 || getNodeColor(3);
     if (level === 4) return colors.nodeLevel4 || getNodeColor(4);
     return getNodeColor(level);
   }, [colors]);

  const [drawingId, setDrawingId] = React.useState<string | null>(null);
   const [startPos, setStartPos] = React.useState<Position | null>(null);
   const imageCache = useRef<Record<string, HTMLImageElement>>({});
   const videoCache = useRef<Record<string, HTMLVideoElement>>({});
   
   const [inputDialog, setInputDialog] = useState<{
     isOpen: boolean;
     elementId: string | null;
     type: 'text' | 'image' | 'video' | null;
     defaultValue: string;
   }>({
     isOpen: false,
     elementId: null,
     type: null,
     defaultValue: '',
   });

   const [aiInputState, setAiInputState] = useState<{
    isOpen: boolean;
    nodeId: string | null;
  }>({
    isOpen: false,
    nodeId: null,
  });

  // Track activated third-party videos
  const [activatedVideos, setActivatedVideos] = useState<Record<string, boolean>>({});

  // Reset activated videos when selection changes
  useEffect(() => {
    setActivatedVideos(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(id => {
        if (!selectionState.selectedElementIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [selectionState.selectedElementIds]);

  const lastSubmittedElementId = useRef<string | null>(null);
  
  // Video playback loop
  useEffect(() => {
    let animationId: number;
    
    const checkVideoPlayback = () => {
      const anyVideoPlaying = Object.values(videoCache.current).some(v => !v.paused && !v.ended);
      if (anyVideoPlaying) {
        forceRender();
      }
      animationId = requestAnimationFrame(checkVideoPlayback);
    };
    
    animationId = requestAnimationFrame(checkVideoPlayback);
    return () => cancelAnimationFrame(animationId);
  }, [forceRender]);

  // Transform client coordinates to canvas coordinates
  const clientToCanvas = useCallback((clientX: number, clientY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Get node at position
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): MindNode | null => {
    const pos = clientToCanvas(clientX, clientY);
    
    // At low zoom, we want to be more "magnetic" and find the closest node
    // instead of just checking if the click is inside a box.
    const isLowZoom = viewport.zoom < 0.6;
    const screenSpacePadding = isLowZoom ? 80 : 40; // Increased significantly for low zoom
    const padding = screenSpacePadding / viewport.zoom;
    
    let closestNode: MindNode | null = null;
    let minDistance = Infinity;

    for (const node of Object.values(nodes)) {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width;
      const nodeHeight = node.height;
      
      // Calculate distance from click to node center
      const dist = Math.hypot(pos.x - nodeX, pos.y - nodeY);
      
      // Check if within bounds + padding
      const inBounds = (
        pos.x >= nodeX - nodeWidth / 2 - padding &&
        pos.x <= nodeX + nodeWidth / 2 + padding &&
        pos.y >= nodeY - nodeHeight / 2 - padding &&
        pos.y <= nodeY + nodeHeight / 2 + padding
      );

      if (inBounds) {
        // If multiple nodes overlap, prioritize the one whose center is closest to the click
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }
    }
    
    return closestNode;
  }, [nodes, clientToCanvas, viewport.zoom]);
  
  const getHoveredConnection = useCallback((clientX: number, clientY: number): string | null => {
    const pos = clientToCanvas(clientX, clientY);
    // Increased threshold for easier selection, especially at different zoom levels
    const threshold = 12 / viewport.zoom;

    const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const l2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
      if (l2 < 0.01) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    };

    const checkConnection = (sX: number, sY: number, tX: number, tY: number, style: string): boolean => {
      if (style === 'curve') {
        const cp1x = sX + (tX - sX) / 2, cp1y = sY, cp2x = sX + (tX - sX) / 2, cp2y = tY;
        let prevX = sX, prevY = sY;
        for (let t = 0.05; t <= 1.001; t += 0.05) {
          const x = Math.pow(1 - t, 3) * sX + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * tX;
          const y = Math.pow(1 - t, 3) * sY + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * tY;
          if (distToSegment(pos.x, pos.y, prevX, prevY, x, y) < threshold) return true;
          prevX = x;
          prevY = y;
        }
      } else if (style === 'polyline') {
        const midX = sX + (tX - sX) / 2;
        if (distToSegment(pos.x, pos.y, sX, sY, midX, sY) < threshold) return true;
        if (distToSegment(pos.x, pos.y, midX, sY, midX, tY) < threshold) return true;
        if (distToSegment(pos.x, pos.y, midX, tY, tX, tY) < threshold) return true;
      } else {
        if (distToSegment(pos.x, pos.y, sX, sY, tX, tY) < threshold) return true;
      }
      return false;
    };

    // Check free connections
    for (const conn of Object.values(connections)) {
      const source = nodes[conn.sourceId] || elements[conn.sourceId];
      const target = nodes[conn.targetId] || elements[conn.targetId];
      if (!source || !target) continue;

      let sX, sY, tX, tY;

      // Source point calculation
      if ('level' in source) {
        const handle = conn.sourceHandle || (source.side === 'left' ? 'left' : 'right');
        if (handle === 'top') { sX = source.position.x; sY = source.position.y - source.height / 2; }
        else if (handle === 'bottom') { sX = source.position.x; sY = source.position.y + source.height / 2; }
        else if (handle === 'left') { sX = source.position.x - source.width / 2; sY = source.position.y; }
        else { sX = source.position.x + source.width / 2; sY = source.position.y; }
      } else {
        const x = source.position.x, y = source.position.y, w = source.width || 0, h = source.height || 0;
        const realX = w < 0 ? x + w : x, realY = h < 0 ? y + h : y, realW = Math.abs(w), realH = Math.abs(h);
        const handle = conn.sourceHandle || 'right';
        if (source.type === 'text') {
          const fontSize = source.style.fontSize || 16;
          const width = (source.text || '').length * fontSize * 0.6;
          if (handle === 'top') { sX = x + width / 2; sY = y - fontSize; }
          else if (handle === 'bottom') { sX = x + width / 2; sY = y; }
          else if (handle === 'left') { sX = x; sY = y - fontSize / 2; }
          else { sX = x + width; sY = y - fontSize / 2; }
        } else {
          if (handle === 'top') { sX = realX + realW / 2; sY = realY; }
          else if (handle === 'bottom') { sX = realX + realW / 2; sY = realY + realH; }
          else if (handle === 'left') { sX = realX; sY = realY + realH / 2; }
          else { sX = realX + realW; sY = realY + realH / 2; }
        }
      }

      // Target point calculation
      if ('level' in target) {
        const handle = conn.targetHandle || 'top';
        if (handle === 'top') { tX = target.position.x; tY = target.position.y - target.height / 2; }
        else if (handle === 'bottom') { tX = target.position.x; tY = target.position.y + target.height / 2; }
        else if (handle === 'left') { tX = target.position.x - target.width / 2; tY = target.position.y; }
        else { tX = target.position.x + target.width / 2; tY = target.position.y; }
      } else {
        const x = target.position.x, y = target.position.y, w = target.width || 0, h = target.height || 0;
        const realX = w < 0 ? x + w : x, realY = h < 0 ? y + h : y, realW = Math.abs(w), realH = Math.abs(h);
        const handle = conn.targetHandle || 'top';
        if (target.type === 'text') {
          const fontSize = target.style.fontSize || 16;
          const width = (target.text || '').length * fontSize * 0.6;
          if (handle === 'top') { tX = x + width / 2; tY = y - fontSize; }
          else if (handle === 'bottom') { tX = x + width / 2; tY = y; }
          else if (handle === 'left') { tX = x; tY = y - fontSize / 2; }
          else { tX = x + width; tY = y - fontSize / 2; }
        } else {
          if (handle === 'top') { tX = realX + realW / 2; tY = realY; }
          else if (handle === 'bottom') { tX = realX + realW / 2; tY = realY + realH; }
          else if (handle === 'left') { tX = realX; tY = realY + realH / 2; }
          else { tX = realX + realW; tY = realY + realH / 2; }
        }
      }

      if (checkConnection(sX, sY, tX, tY, layoutConfig.connectionStyle)) return conn.id;
    }

    // Check parent-child connections
    for (const node of Object.values(nodes)) {
      if (node.collapsed || !node.children) continue;
      for (const childId of node.children) {
        const child = nodes[childId];
        if (!child) continue;

        const side = child.side || 'right';
        const sX = node.position.x + (side === 'left' ? -node.width / 2 : node.width / 2);
        const sY = node.position.y;
        const tX = child.position.x + (side === 'left' ? child.width / 2 : -child.width / 2);
        const tY = child.position.y;

        if (checkConnection(sX, sY, tX, tY, layoutConfig.connectionStyle)) {
          return `node-conn-${childId}`;
        }
      }
    }

    return null;
  }, [clientToCanvas, connections, nodes, elements, layoutConfig.connectionStyle, viewport.zoom]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === 'v') setCurrentTool('select');
      if (key === 't') setCurrentTool('text');
      if (key === 'i') setCurrentTool('image');
      if (key === 'c') {
        setCurrentTool('curve');
        setLayoutConfig({ connectionStyle: 'curve' });
      }
      if (key === 'p') {
        setCurrentTool('polyline');
        setLayoutConfig({ connectionStyle: 'polyline' });
      }
      if (key === 'r') setCurrentTool('rect');
      if (key === 'o') setCurrentTool('circle');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, setCurrentTool, setLayoutConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    switch (currentTool) {
      case 'select': canvas.style.cursor = 'default'; break;
      case 'text': canvas.style.cursor = 'text'; break;
      case 'image': 
      case 'video':
      case 'curve':
      case 'polyline':
      case 'rect':
      case 'circle':
        canvas.style.cursor = 'crosshair';
        break;
      default: canvas.style.cursor = 'default';
    }
  }, [currentTool]);

  // Mouse handlers
  // Get element at position
  const getElementAtPosition = useCallback((clientX: number, clientY: number): string | null => {
    const pos = clientToCanvas(clientX, clientY);
    const elementList = Object.values(elements).reverse(); // Check top-most elements first
    
    // Create a temporary context for text measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    for (const el of elementList) {
      // Use the same screen-space padding logic as nodes for consistent clickability at low zoom
      const screenSpacePadding = 25; 
      const padding = Math.max(10, screenSpacePadding / viewport.zoom);
      
      if (el.type === 'rect' || el.type === 'image' || el.type === 'video') {
        const x = el.position.x;
        const y = el.position.y;
        const w = el.width || 0;
        const h = el.height || 0;
        const minX = w < 0 ? x + w : x;
        const maxX = w < 0 ? x : x + w;
        const minY = h < 0 ? y + h : y;
        const maxY = h < 0 ? y : y + h;
        
        if (
          pos.x >= minX - padding &&
          pos.x <= maxX + padding &&
          pos.y >= minY - padding &&
          pos.y <= maxY + padding
        ) {
          return el.id;
        }
      } else if (el.type === 'circle') {
        const rx = Math.abs(el.width || 0) / 2;
        const ry = Math.abs(el.height || 0) / 2;
        const cx = el.position.x + (el.width || 0) / 2;
        const cy = el.position.y + (el.height || 0) / 2;
        const dx = (pos.x - cx) / (rx + padding);
        const dy = (pos.y - cy) / (ry + padding);
        if (dx * dx + dy * dy <= 1) {
          return el.id;
        }
      } else if (el.type === 'text') {
        // More accurate hit box for text
        const fontSize = el.style.fontSize || 16;
        const fontWeight = el.style.fontWeight === 'semibold' ? 600 : el.style.fontWeight === 'medium' ? 500 : el.style.fontWeight || 'normal';
        let textWidth = (el.text || '').length * fontSize * 0.6; // fallback
        
        if (ctx) {
          ctx.font = `${fontWeight} ${fontSize}px ${el.style.fontFamily || 'Inter'}`;
          textWidth = ctx.measureText(el.text || '').width;
        }

        if (
          pos.x >= el.position.x - padding &&
          pos.x <= el.position.x + textWidth + padding &&
          pos.y >= el.position.y - fontSize - padding &&
          pos.y <= el.position.y + padding
        ) {
          return el.id;
        }
      }
    }
    return null;
  }, [elements, clientToCanvas]);

  // Check if over a resize handle
  const getResizeHandleAtPosition = useCallback((clientX: number, clientY: number): { id: string, handle: string } | null => {
    const pos = clientToCanvas(clientX, clientY);
    const selectedIds = selectionState.selectedElementIds;

    for (const id of selectedIds) {
      const el = elements[id];
      if (!el || el.type === 'text' || el.type === 'curve' || el.type === 'polyline') continue;

      const x = el.position.x;
      const y = el.position.y;
      const w = el.width || 0;
      const h = el.height || 0;
      const handleSize = 8 / viewport.zoom;

      const handles = [
        { name: 'nw', x: x, y: y },
        { name: 'n', x: x + w / 2, y: y },
        { name: 'ne', x: x + w, y: y },
        { name: 'w', x: x, y: y + h / 2 },
        { name: 'e', x: x + w, y: y + h / 2 },
        { name: 'sw', x: x, y: y + h },
        { name: 's', x: x + w / 2, y: y + h },
        { name: 'se', x: x + w, y: y + h },
      ];

      for (const handle of handles) {
        if (
          pos.x >= handle.x - handleSize &&
          pos.x <= handle.x + handleSize &&
          pos.y >= handle.y - handleSize &&
          pos.y <= handle.y + handleSize
        ) {
          return { id, handle: handle.name };
        }
      }
    }
    return null;
  }, [elements, selectionState.selectedElementIds, clientToCanvas, viewport.zoom]);

  // Check if over a connection handle
  const getConnectionHandleAtPosition = useCallback((clientX: number, clientY: number): { id: string, type: 'node' | 'element', handle: string } | null => {
    const pos = clientToCanvas(clientX, clientY);
    const handleSize = 12 / viewport.zoom;

    // Check nodes (all nodes, not just selected)
    for (const id of Object.keys(nodes)) {
      const node = nodes[id];
      if (!node) continue;
      
      const x = node.position.x;
      const y = node.position.y;
      const w = node.width;
      const h = node.height;

      const handles = [
        { name: 'top', x: x, y: y - h / 2 },
        { name: 'bottom', x: x, y: y + h / 2 },
        { name: 'left', x: x - w / 2, y: y },
        { name: 'right', x: x + w / 2, y: y },
      ];

      for (const handle of handles) {
        if (Math.hypot(pos.x - handle.x, pos.y - handle.y) < handleSize) {
          return { id, type: 'node', handle: handle.name };
        }
      }
    }

    // Check elements (all elements, not just selected)
    for (const id of Object.keys(elements)) {
      const el = elements[id];
      if (!el) continue;
      
      const x = el.position.x;
      const y = el.position.y;
      const w = el.width || 0;
      const h = el.height || 0;
      
      // Normalize coordinates
      const realX = w < 0 ? x + w : x;
      const realY = h < 0 ? y + h : y;
      const realW = Math.abs(w);
      const realH = Math.abs(h);

      let handles = [];
      if (el.type === 'text') {
        const fontSize = el.style.fontSize || 16;
        const width = (el.text || '').length * fontSize * 0.6;
        handles = [
          { name: 'top', x: x + width / 2, y: y - fontSize },
          { name: 'bottom', x: x + width / 2, y: y },
          { name: 'left', x: x, y: y - fontSize / 2 },
          { name: 'right', x: x + width, y: y - fontSize / 2 },
        ];
      } else {
        handles = [
          { name: 'top', x: realX + realW / 2, y: realY },
          { name: 'bottom', x: realX + realW / 2, y: realY + realH },
          { name: 'left', x: realX, y: realY + realH / 2 },
          { name: 'right', x: realX + realW, y: realY + realH / 2 },
        ];
      }

      for (const handle of handles) {
        if (Math.hypot(pos.x - handle.x, pos.y - handle.y) < handleSize) {
          return { id, type: 'element', handle: handle.name };
        }
      }
    }
    return null;
  }, [nodes, elements, clientToCanvas, viewport.zoom]);

  const getClosestHandle = useCallback((pos: Position, id: string, type: 'node' | 'element'): string => {
    const item = type === 'node' ? nodes[id] : elements[id];
    if (!item) return 'right';

    let handles: { name: string, x: number, y: number }[] = [];
    const x = item.position.x;
    const y = item.position.y;
    const w = item.width || 0;
    const h = item.height || 0;

    if (type === 'node') {
      const n = item as MindNode;
      handles = [
        { name: 'top', x, y: y - n.height / 2 },
        { name: 'bottom', x, y: y + n.height / 2 },
        { name: 'left', x: x - n.width / 2, y },
        { name: 'right', x: x + n.width / 2, y },
      ];
    } else {
      const el = item as CanvasElement;
      
      // Normalize coordinates
      const realX = w < 0 ? x + w : x;
      const realY = h < 0 ? y + h : y;
      const realW = Math.abs(w);
      const realH = Math.abs(h);

      if (el.type === 'text') {
        const fontSize = el.style.fontSize || 16;
        const width = (el.text || '').length * fontSize * 0.6;
        handles = [
          { name: 'top', x: x + width / 2, y: y - fontSize },
          { name: 'bottom', x: x + width / 2, y: y },
          { name: 'left', x, y: y - fontSize / 2 },
          { name: 'right', x: x + width, y: y - fontSize / 2 },
        ];
      } else {
        handles = [
          { name: 'top', x: realX + realW / 2, y: realY },
          { name: 'bottom', x: realX + realW / 2, y: realY + realH },
          { name: 'left', x: realX, y: realY + realH / 2 },
          { name: 'right', x: realX + realW, y: realY + realH / 2 },
        ];
      }
    }

    let closest = handles[0];
    let minDist = Math.hypot(pos.x - handles[0].x, pos.y - handles[0].y);
    for (let i = 1; i < handles.length; i++) {
      const dist = Math.hypot(pos.x - handles[i].x, pos.y - handles[i].y);
      if (dist < minDist) {
        minDist = dist;
        closest = handles[i];
      }
    }
    return closest.name;
  }, [nodes, elements]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Check if we clicked an input (the editor)
    if (target.tagName === 'INPUT' || target.closest('.node-text-editor') || target.closest('.element-text-editor')) {
      e.stopPropagation();
      return;
    }
    
    const pos = clientToCanvas(e.clientX, e.clientY);
    const node = getNodeAtPosition(e.clientX, e.clientY);
    const elementId = getElementAtPosition(e.clientX, e.clientY);

    // If we clicked nothing and we're editing, close the editor
    if (!node && !elementId) {
      if (e.detail === 2) {
        // Double click on canvas - organize and center
        if (containerRef.current) {
          organizeMindmap(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
        return;
      }

      if (editingNodeId || editingElementId) {
        setEditingNode(null);
        setEditingElement(null);
        return; 
      }
      
      if (inputDialog.isOpen) {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
        return;
      }
    }

    // At low zoom, prioritize node selection over handles to make it feel more sensitive
    const isLowZoom = viewport.zoom < 0.6;
    if (isLowZoom && node) {
      selectNode(node.id, e.shiftKey);
      startDrag(node.id, pos, 'node');
      if (containerRef.current) {
        focusNode(node.id, containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
      setCurrentTool('select');
      return;
    }

    // Check for AI handle first (to prioritize over connection handles)
    if (aiConfig.enabled) {
      const handleSize = 15 / viewport.zoom;
      for (const id of selectionState.selectedNodeIds) {
        const n = nodes[id];
        if (!n) continue;
        const aiX = n.position.x + n.width / 2;
        const aiY = n.position.y - n.height / 2 - 15 / viewport.zoom;
        if (Math.hypot(pos.x - aiX, pos.y - aiY) < handleSize) {
          setAiInputState({
            isOpen: true,
            nodeId: id,
          });
          return;
        }
      }
    }

    // Check for connection handle
    const connectionHandle = getConnectionHandleAtPosition(e.clientX, e.clientY);
    if (connectionHandle) {
      startDrag(connectionHandle.id, pos, 'connection', connectionHandle.handle);
      return;
    }
    
    // If a node is clicked, always prioritize selection/dragging regardless of tool
    if (node) {
      if (e.detail === 2) {
        // Double click - edit
        setEditingNode(node.id);
      } else {
        selectNode(node.id, e.shiftKey);
        startDrag(node.id, pos, 'node');
        
        // Auto-zoom and center the node when clicked.
        // We trigger this if the zoom is low (below 1.1) or if there are many nodes.
        // This ensures a smooth focus experience across common zoom levels (70%, 75%, 100%, etc.)
        if ((viewport.zoom < 1.1 || Object.keys(nodes).length > 10) && containerRef.current) {
          focusNode(node.id, containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      }
      // If we were about to draw something, cancel it since we clicked a node
      setCurrentTool('select');
      return;
    }

    // Check for resize handle
    const resizeHandle = getResizeHandleAtPosition(e.clientX, e.clientY);
    if (resizeHandle) {
      startDrag(resizeHandle.id, pos, 'resize', resizeHandle.handle);
      return;
    }

    // Check for element selection
    if (elementId) {
      if (e.detail === 2) {
        // Double click element
        const el = elements[elementId];
        if (el) {
          if (el.type === 'text') {
            console.log('Double clicked text element, opening inline editor', elementId);
            setEditingElement(elementId);
            return;
          } else if (el.type === 'video' && el.url) {
            const video = videoCache.current[el.url];
            if (video) {
              if (video.paused) {
                video.play().catch(console.error);
              } else {
                video.pause();
              }
              forceRender();
              return;
            }
          }
        }
      } else {
        selectElement(elementId, e.shiftKey);
        startDrag(elementId, pos, 'element');
      }
      return;
    }

    // Check for connection selection
    const connId = getHoveredConnection(e.clientX, e.clientY);
    if (connId) {
      selectConnection(connId, e.shiftKey);
      return;
    }

    // If no node is clicked and we have a drawing tool active
    if (currentTool !== 'select') {
      if (currentTool === 'image' || currentTool === 'video') {
        // For images and videos, don't draw a box. Just add and open dialog immediately.
        const newId = addElement({
          type: currentTool,
          position: pos,
          style: {
            stroke: colors.primary || 'hsl(220, 90%, 56%)',
            strokeWidth: 2,
          },
          width: 0,
          height: 0,
        });
        
        setInputDialog({
          isOpen: true,
          elementId: newId,
          type: currentTool,
          defaultValue: '',
        });
        
        setCurrentTool('select');
        return;
      }

      setStartPos(pos);
      const newId = addElement({
        type: currentTool as Exclude<ToolType, 'select'>,
        position: pos,
        style: {
          stroke: colors.primary || 'hsl(220, 90%, 56%)',
          fill: currentTool === 'rect' || currentTool === 'circle' ? 'transparent' : undefined,
          strokeWidth: 2,
          fontSize: 16,
        },
        points: currentTool === 'curve' || currentTool === 'polyline' ? [pos] : undefined,
        width: 0,
        height: 0,
        text: currentTool === 'text' ? '点击输入文字' : undefined,
      });
      setDrawingId(newId);
      return;
    }

    // Default behavior: clear selection and start panning
    clearSelection();
    startPan({ x: e.clientX, y: e.clientY });
  }, [currentTool, addElement, getNodeAtPosition, getElementAtPosition, getResizeHandleAtPosition, selectNode, selectElement, selectConnection, clearSelection, startDrag, startPan, clientToCanvas, setEditingNode, setCurrentTool, colors, aiConfig.enabled, editingElementId, editingNodeId, elements, getConnectionHandleAtPosition, getHoveredConnection, inputDialog.isOpen, nodes, selectionState.selectedNodeIds, setEditingElement, viewport.zoom, focusNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = clientToCanvas(e.clientX, e.clientY);
    
    if (drawingId && startPos) {
      const element = elements[drawingId];
      if (!element) return;
      
      if (element.type === 'curve' || element.type === 'polyline') {
        updateElement(drawingId, {
          points: [...(element.points || []), pos],
        });
      } else {
        let width = pos.x - startPos.x;
        let height = pos.y - startPos.y;

        // Handle shift key for proportional drawing
        if (e.shiftKey && (element.type === 'rect' || element.type === 'image' || element.type === 'circle')) {
          const absW = Math.abs(width);
          const absH = Math.abs(height);
          const size = Math.max(absW, absH);
          width = size * (width < 0 ? -1 : 1);
          height = size * (height < 0 ? -1 : 1);
        }

        updateElement(drawingId, {
          width,
          height,
        });
      }
      return;
    }

    if (dragState.isDragging) {
      updateDrag(pos, { shiftKey: e.shiftKey });
    } else if (canvasState.isPanning) {
      updatePan({ x: e.clientX, y: e.clientY });
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      setHoveredNode(node ? node.id : null);

      const elId = getElementAtPosition(e.clientX, e.clientY);
      setHoveredElement(elId);

      const connId = getHoveredConnection(e.clientX, e.clientY);
      setHoveredConnection(connId);

      // Update cursor for resize handle
      const canvas = canvasRef.current;
      if (canvas) {
        const resizeHandle = getResizeHandleAtPosition(e.clientX, e.clientY);
        
        // AI handle cursor check
        let isOverAIHandle = false;
        if (aiConfig.enabled) {
          const handleSize = 15 / viewport.zoom;
          for (const id of selectionState.selectedNodeIds) {
            const node = nodes[id];
            if (!node) continue;
            const aiX = node.position.x;
            const aiY = node.position.y - node.height / 2 - 15 / viewport.zoom;
            if (Math.hypot(pos.x - aiX, pos.y - aiY) < handleSize) {
              isOverAIHandle = true;
              break;
            }
          }
        }

        if (resizeHandle) {
          const { handle } = resizeHandle;
          if (handle === 'nw' || handle === 'se') canvas.style.cursor = 'nwse-resize';
          else if (handle === 'ne' || handle === 'sw') canvas.style.cursor = 'nesw-resize';
          else if (handle === 'n' || handle === 's') canvas.style.cursor = 'ns-resize';
          else if (handle === 'w' || handle === 'e') canvas.style.cursor = 'ew-resize';
        } else if (isOverAIHandle) {
          canvas.style.cursor = 'pointer';
        } else if (elId) {
          canvas.style.cursor = 'move';
        } else if (connId) {
          canvas.style.cursor = 'pointer';
        } else {
          // Reset based on tool
          switch (currentTool) {
            case 'select': canvas.style.cursor = 'default'; break;
            case 'text': canvas.style.cursor = 'text'; break;
            default: canvas.style.cursor = 'crosshair';
          }
        }
      }
    }
  }, [drawingId, startPos, elements, clientToCanvas, updateElement, dragState.isDragging, updateDrag, canvasState.isPanning, updatePan, getNodeAtPosition, setHoveredNode, getElementAtPosition, setHoveredElement, getHoveredConnection, setHoveredConnection, getResizeHandleAtPosition, currentTool, aiConfig.enabled, viewport.zoom, selectionState.selectedNodeIds, nodes]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (drawingId) {
      const element = elements[drawingId];
      
      // Normalize dimensions if they are negative
      if (element && (element.type === 'rect' || element.type === 'circle' || element.type === 'image')) {
        const w = element.width || 0;
        const h = element.height || 0;
        if (w < 0 || h < 0) {
          updateElement(drawingId, {
            position: {
              x: w < 0 ? element.position.x + w : element.position.x,
              y: h < 0 ? element.position.y + h : element.position.y,
            },
            width: Math.abs(w),
            height: Math.abs(h),
          });
        }
      }

      setDrawingId(null);
      setStartPos(null);
      
      // Reset tool to select after drawing finishes
      setCurrentTool('select');

      // If it's a text or image tool, trigger the editor/dialog
      if (element?.type === 'text') {
        setEditingElement(drawingId);
      } else if (element?.type === 'image') {
        setInputDialog({
          isOpen: true,
          elementId: drawingId,
          type: 'image',
          defaultValue: element.url || '',
        });
      }
      return;
    }

    if (dragState.isDragging) {
      if (dragState.type === 'connection' && dragState.id) {
        // Find target
        const targetNode = getNodeAtPosition(e.clientX, e.clientY);
        const targetElementId = getElementAtPosition(e.clientX, e.clientY);
        
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const pos = {
            x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
            y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
          };

          if (targetNode && targetNode.id !== dragState.id) {
            addConnection({
              sourceId: dragState.id,
              sourceType: nodes[dragState.id] ? 'node' : 'element',
              sourceHandle: dragState.handle,
              targetId: targetNode.id,
              targetType: 'node',
              targetHandle: getClosestHandle(pos, targetNode.id, 'node'),
              style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
            });
          } else if (targetElementId && targetElementId !== dragState.id) {
            addConnection({
              sourceId: dragState.id,
              sourceType: nodes[dragState.id] ? 'node' : 'element',
              sourceHandle: dragState.handle,
              targetId: targetElementId,
              targetType: 'element',
              targetHandle: getClosestHandle(pos, targetElementId, 'element'),
              style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
            });
          }
        }
      }
      endDrag();
    } else if (canvasState.isPanning) {
      endPan();
    }
  }, [drawingId, elements, dragState, endDrag, canvasState.isPanning, endPan, setCurrentTool, updateElement, addConnection, getNodeAtPosition, getElementAtPosition, nodes, colors, setEditingElement, getClosestHandle]);

  const handleInputDialogSubmit = (value: string) => {
    if (!inputDialog.elementId) return;

    lastSubmittedElementId.current = inputDialog.elementId;

    if (inputDialog.type === 'text') {
      updateElement(inputDialog.elementId, { text: value });
    } else if (inputDialog.type === 'image' || inputDialog.type === 'video') {
      if (value) {
        const updates: Partial<CanvasElement> = { url: value };
        
        // If it's a video, set a default size if it's too small
        if (inputDialog.type === 'video') {
          const element = elements[inputDialog.elementId];
          if (!element?.width || !element?.height || Math.abs(element.width) < 10 || Math.abs(element.height) < 10) {
            updates.width = 400;
            updates.height = 225; // 16:9
          }
        }
        
        updateElement(inputDialog.elementId, updates);
      } else {
        deleteElement(inputDialog.elementId);
      }
    }
    
    setInputDialog({
      isOpen: false,
      elementId: null,
      type: null,
      defaultValue: '',
    });
  };

  const handleInputDialogClose = () => {
    if (inputDialog.elementId && lastSubmittedElementId.current !== inputDialog.elementId) {
      const element = elements[inputDialog.elementId];
      // If it's a new text element and no text was entered, delete it
      if (element?.type === 'text' && (!element.text || element.text === '点击输入文字')) {
        deleteElement(inputDialog.elementId);
      } else if ((element?.type === 'image' || element?.type === 'video') && !element.url) {
        deleteElement(inputDialog.elementId);
      }
    }
    
    // Reset the ref after handling close
    if (inputDialog.elementId === lastSubmittedElementId.current) {
      lastSubmittedElementId.current = null;
    }

    setInputDialog({
      isOpen: false,
      elementId: null,
      type: null,
      defaultValue: '',
    });
  };
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId || editingElementId) return;
      
      const selectedNodeId = selectionState.selectedNodeIds[0];
      const selectedElementId = selectionState.selectedElementIds[0];
      const selectedConnectionId = selectionState.selectedConnectionIds[0];

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (selectedNodeId) {
            const newId = addNode(selectedNodeId);
            selectNode(newId);
            setTimeout(() => setEditingNode(newId), 50);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedNodeId) {
            const node = nodes[selectedNodeId];
            if (node?.parentId) {
              // If node side is missing, infer it from position relative to root
              let side = node.side;
              if (!side) {
                const root = nodes[rootId];
                if (root) {
                  side = node.position.x < root.position.x ? 'left' : 'right';
                }
              }
              const newId = addNode(node.parentId, '新节点', side);
              selectNode(newId);
              setTimeout(() => setEditingNode(newId), 50);
            }
          }
          break;
        case 'Delete':
        case 'Backspace':
          // Handle multiple selections
          if (selectionState.selectedNodeIds.length > 0) {
            selectionState.selectedNodeIds.forEach(id => {
              if (id !== rootId) deleteNode(id);
            });
            clearSelection();
          } else if (selectionState.selectedElementIds.length > 0) {
            selectionState.selectedElementIds.forEach(id => {
              deleteElement(id);
            });
            clearSelection();
          } else if (selectionState.selectedConnectionIds.length > 0) {
            selectionState.selectedConnectionIds.forEach(id => {
              deleteConnection(id);
            });
            clearSelection();
          }
          break;
        case 'F2':
          if (selectedNodeId) {
            setEditingNode(selectedNodeId);
          } else if (selectedElementId) {
            const el = elements[selectedElementId];
            if (el && el.type === 'text') {
              setEditingElement(selectedElementId);
            }
          }
          break;
        case ' ':
          e.preventDefault();
          if (selectedNodeId) {
            toggleCollapse(selectedNodeId);
          }
          break;
        case 'Escape':
          clearSelection();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionState, editingNodeId, editingElementId, nodes, elements, rootId, addNode, deleteNode, deleteElement, deleteConnection, toggleCollapse, selectNode, clearSelection, setEditingNode, setEditingElement]);
  
  // Global mouse handlers for dragging/panning
  useEffect(() => {
    if (!dragState.isDragging && !canvasState.isPanning) return;

    const onMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const pos = {
        x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      };

      if (dragState.isDragging) {
        updateDrag(pos, { shiftKey: e.shiftKey });
      } else if (canvasState.isPanning) {
        updatePan({ x: e.clientX, y: e.clientY });
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (dragState.isDragging) {
        if (dragState.type === 'connection' && dragState.id) {
          const targetNode = getNodeAtPosition(e.clientX, e.clientY);
          const targetElementId = getElementAtPosition(e.clientX, e.clientY);
          
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const pos = {
              x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
              y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
            };

            if (targetNode && targetNode.id !== dragState.id) {
              addConnection({
                sourceId: dragState.id,
                sourceType: nodes[dragState.id] ? 'node' : 'element',
                sourceHandle: dragState.handle,
                targetId: targetNode.id,
                targetType: 'node',
                targetHandle: getClosestHandle(pos, targetNode.id, 'node'),
                style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
              });
            } else if (targetElementId && targetElementId !== dragState.id) {
              addConnection({
                sourceId: dragState.id,
                sourceType: nodes[dragState.id] ? 'node' : 'element',
                sourceHandle: dragState.handle,
                targetId: targetElementId,
                targetType: 'element',
                targetHandle: getClosestHandle(pos, targetElementId, 'element'),
                style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
              });
            }
          }
        }
        endDrag();
      } else if (canvasState.isPanning) {
        endPan();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState.isDragging, dragState.type, dragState.id, canvasState.isPanning, viewport, updateDrag, updatePan, endDrag, endPan, getNodeAtPosition, getElementAtPosition, addConnection, nodes, colors.primary, getClosestHandle]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    
    // Draw connections
    const drawConnections = (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.collapsed) return;
      
      for (const childId of node.children) {
        const child = nodes[childId];
        if (!child) continue;
        
        const isRoot = node.parentId === null;
        const side = child.side || 'right';
        
        const startX = node.position.x + (side === 'left' ? -node.width / 2 : node.width / 2);
        const endX = child.position.x + (side === 'left' ? child.width / 2 : -child.width / 2);
        const startY = node.position.y;
        const endY = child.position.y;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const connStyle = layoutConfig.connectionStyle;

        if (connStyle === 'curve') {
          const controlX1 = startX + (endX - startX) * 0.5;
          const controlY1 = startY;
          const controlX2 = startX + (endX - startX) * 0.5;
          const controlY2 = endY;
          ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
        } else if (connStyle === 'polyline') {
          const midX = startX + (endX - startX) * 0.5;
          ctx.lineTo(midX, startY);
          ctx.lineTo(midX, endY);
          ctx.lineTo(endX, endY);
        } else {
          // straight
          ctx.lineTo(endX, endY);
        }
        
        const connId = `node-conn-${childId}`;
        const isSelected = selectionState.selectedConnectionIds.includes(connId);
        const isHovered = selectionState.hoveredConnectionId === connId;
        const isNodeSelected = selectionState.selectedNodeIds.includes(childId) || 
                          selectionState.selectedNodeIds.includes(nodeId);
        
        ctx.strokeStyle = isSelected || isHovered
          ? (colors.selection || colors.primary || '#3b82f6')
          : (isNodeSelected ? (colors.selection || colors.primary || '#3b82f6') : (colors.connectionLine || 'hsl(225, 15%, 35%)'));
        ctx.lineWidth = (isSelected || isHovered) ? 4 : (isNodeSelected ? 3 : 2);
        ctx.stroke();
        
        drawConnections(childId);
      }
    };
    
    // Draw free connections
    Object.values(connections).forEach((conn) => {
      const source = nodes[conn.sourceId] || elements[conn.sourceId];
      const target = nodes[conn.targetId] || elements[conn.targetId];
      if (!source || !target) return;

      let sX, sY, tX, tY;

      // Source point
      if ('level' in source) { // Node
        const x = source.position.x;
        const y = source.position.y;
        const w = source.width;
        const h = source.height;
        const handle = conn.sourceHandle || (source.side === 'left' ? 'left' : 'right');

        if (handle === 'top') { sX = x; sY = y - h / 2; }
        else if (handle === 'bottom') { sX = x; sY = y + h / 2; }
        else if (handle === 'left') { sX = x - w / 2; sY = y; }
        else { sX = x + w / 2; sY = y; }
      } else { // Element
        const x = source.position.x;
        const y = source.position.y;
        const w = source.width || 0;
        const h = source.height || 0;
        const handle = conn.sourceHandle || 'right';

        // Normalize coordinates
        const realX = w < 0 ? x + w : x;
        const realY = h < 0 ? y + h : y;
        const realW = Math.abs(w);
        const realH = Math.abs(h);

        if (source.type === 'text') {
          const fontSize = source.style.fontSize || 16;
          const width = (source.text || '').length * fontSize * 0.6;
          if (handle === 'top') { sX = x + width / 2; sY = y - fontSize; }
          else if (handle === 'bottom') { sX = x + width / 2; sY = y; }
          else if (handle === 'left') { sX = x; sY = y - fontSize / 2; }
          else { sX = x + width; sY = y - fontSize / 2; }
        } else {
          if (handle === 'top') { sX = realX + realW / 2; sY = realY; }
          else if (handle === 'bottom') { sX = realX + realW / 2; sY = realY + realH; }
          else if (handle === 'left') { sX = realX; sY = realY + realH / 2; }
          else { sX = realX + realW; sY = realY + realH / 2; }
        }
      }

      // Target point
      if ('level' in target) { // Node
        const x = target.position.x;
        const y = target.position.y;
        const w = target.width;
        const h = target.height;
        const handle = conn.targetHandle || 'top';

        if (handle === 'top') { tX = x; tY = y - h / 2; }
        else if (handle === 'bottom') { tX = x; tY = y + h / 2; }
        else if (handle === 'left') { tX = x - w / 2; tY = y; }
        else { tX = x + w / 2; tY = y; }
      } else { // Element
        const x = target.position.x;
        const y = target.position.y;
        const w = target.width || 0;
        const h = target.height || 0;
        const handle = conn.targetHandle || 'top';

        // Normalize coordinates
        const realX = w < 0 ? x + w : x;
        const realY = h < 0 ? y + h : y;
        const realW = Math.abs(w);
        const realH = Math.abs(h);

        if (target.type === 'text') {
          const fontSize = target.style.fontSize || 16;
          const width = (target.text || '').length * fontSize * 0.6;
          if (handle === 'top') { tX = x + width / 2; tY = y - fontSize; }
          else if (handle === 'bottom') { tX = x + width / 2; tY = y; }
          else if (handle === 'left') { tX = x; tY = y - fontSize / 2; }
          else { tX = x + width; tY = y - fontSize / 2; }
        } else {
          if (handle === 'top') { tX = realX + realW / 2; tY = realY; }
          else if (handle === 'bottom') { tX = realX + realW / 2; tY = realY + realH; }
          else if (handle === 'left') { tX = realX; tY = realY + realH / 2; }
          else { tX = realX + realW; tY = realY + realH / 2; }
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      
      const connStyle = layoutConfig.connectionStyle;
      const isSelected = selectionState.selectedConnectionIds.includes(conn.id);
      const isHovered = selectionState.hoveredConnectionId === conn.id;

      if (connStyle === 'curve') {
        const cp1x = sX + (tX - sX) / 2;
        const cp1y = sY;
        const cp2x = sX + (tX - sX) / 2;
        const cp2y = tY;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tX, tY);
      } else if (connStyle === 'polyline') {
        const midX = sX + (tX - sX) / 2;
        ctx.lineTo(midX, sY);
        ctx.lineTo(midX, tY);
        ctx.lineTo(tX, tY);
      } else {
        ctx.lineTo(tX, tY);
      }

      ctx.strokeStyle = isSelected 
        ? (colors.selection || '#3b82f6')
        : isHovered 
          ? (colors.accent || '#10b981')
          : (conn.style.stroke || colors.connectionLine || 'hsl(220, 20%, 70%)');
      
      // Much thicker when selected or hovered for better visibility
      ctx.lineWidth = isSelected 
        ? (conn.style.strokeWidth || 2) + 3 
        : isHovered 
          ? (conn.style.strokeWidth || 2) + 2 
          : (conn.style.strokeWidth || 2);
      if (conn.style.dash) ctx.setLineDash(conn.style.dash);
      ctx.stroke();
      ctx.restore();
    });

    drawConnections(rootId);
    
    // Draw connection points for selected nodes
    selectionState.selectedNodeIds.forEach(id => {
      const node = nodes[id];
      if (node) {
        ctx.save();
        const handleSize = 6 / viewport.zoom;
        const x = node.position.x;
        const y = node.position.y;
        const w = node.width;
        const h = node.height;

        const handles = [
          { x, y: y - h / 2 },
          { x, y: y + h / 2 },
          { x: x - w / 2, y },
          { x: x + w / 2, y },
        ];
        
        handles.forEach(h => {
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
          ctx.fillStyle = colors.accent || '#10b981'; // Emerald-500
          ctx.fill();
          ctx.strokeStyle = colors.background || '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // AI Extension indicator for selected node
        if (aiConfig.enabled) {
          const aiX = node.position.x + node.width / 2;
          const aiY = node.position.y - node.height / 2 - 15 / viewport.zoom;
          
          ctx.beginPath();
          ctx.arc(aiX, aiY, 10 / viewport.zoom, 0, Math.PI * 2);
          ctx.fillStyle = colors.primary || '#8b5cf6'; // violet-500
          ctx.fill();
          ctx.strokeStyle = colors.background || '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = colors.background || 'white';
          ctx.font = `bold ${10 / viewport.zoom}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('AI', aiX, aiY);
        }

        ctx.restore();
      }
    });

    // Draw nodes
    const drawNode = (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node) return;
      
      const x = node.position.x - node.width / 2;
      const y = node.position.y - node.height / 2;
      const isSelected = selectionState.selectedNodeIds.includes(nodeId);
      const isHovered = selectionState.hoveredNodeId === nodeId;
      const isRoot = nodeId === rootId;
      const style = node.style || {};
      
      // Node background
      ctx.beginPath();
      const radius = isRoot ? 12 : 8;
      ctx.roundRect(x, y, node.width, node.height, radius);
      
      const defaultColor = getThemeLevelColor(node.level);
      const bgColor = style.backgroundColor || (isRoot ? defaultColor : (colors.nodeBg || (theme === 'dark' ? 'hsl(225, 25%, 14%)' : 'hsl(0, 0%, 100%)')));
      
      ctx.fillStyle = bgColor;
      ctx.fill();
      
      // Border
      ctx.strokeStyle = isSelected 
        ? (style.backgroundColor || defaultColor)
        : isHovered 
          ? (colors.nodeHover || (theme === 'dark' ? 'hsl(225, 20%, 35%)' : 'hsl(220, 90%, 60%)'))
          : (colors.nodeBorder || (theme === 'dark' ? 'hsl(225, 20%, 22%)' : 'hsl(220, 15%, 85%)'));
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.stroke();
      
      // Left color indicator (for non-root nodes without custom bg)
      if (!isRoot && !style.backgroundColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, 4, node.height, [8, 0, 0, 8]);
        ctx.fillStyle = defaultColor;
        ctx.fill();
      }
      
      // Icon offset
      const hasIcon = !!style.icon;
      const iconOffset = hasIcon ? 10 : 0;
      
      // Text
      const textColor = style.textColor || (isRoot || style.backgroundColor ? 'white' : (colors.foreground || (theme === 'dark' ? 'hsl(210, 20%, 95%)' : 'hsl(220, 25%, 10%)')));
      const fontSize = style.fontSize || (isRoot ? 16 : 14);
      const fontWeight = style.fontWeight === 'bold' ? '700' 
        : style.fontWeight === 'semibold' ? '600' 
        : style.fontWeight === 'medium' ? '500' 
        : isRoot ? '600' : '500';
      
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.text, node.position.x + iconOffset / 2, node.position.y);
      
      // Draw icon indicator (simplified - just a circle with first letter)
      if (hasIcon) {
        const iconX = x + 16;
        const iconY = node.position.y;
        
        ctx.fillStyle = textColor;
        ctx.font = `600 ${fontSize - 2}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Draw a simple indicator since we can't render actual Lucide icons in canvas
        ctx.fillText('●', iconX, iconY);
      }
      
      // Collapse indicator
      if (node.children.length > 0) {
        const indicatorX = x + node.width - 8;
        const indicatorY = node.position.y;
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
        ctx.fillStyle = colors.nodeBg || (theme === 'dark' ? 'hsl(225, 20%, 20%)' : 'hsl(0, 0%, 98%)');
        ctx.fill();
        ctx.strokeStyle = colors.nodeBorder || (theme === 'dark' ? 'hsl(225, 20%, 30%)' : 'hsl(220, 15%, 80%)');
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = colors.foreground || (theme === 'dark' ? 'hsl(210, 20%, 80%)' : 'hsl(220, 25%, 20%)');
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.collapsed ? '+' : '−', indicatorX, indicatorY);
      }
      
      // Draw children
      if (!node.collapsed) {
        for (const childId of node.children) {
          drawNode(childId);
        }
      }
    };
    
    drawNode(rootId);
    
    // Draw elements
    Object.values(elements).forEach((el) => {
      ctx.save();
      const isSelected = selectionState.selectedElementIds.includes(el.id);
      const isHovered = selectionState.hoveredElementId === el.id;

      ctx.strokeStyle = el.style.stroke || colors.foreground || '#ffffff';
      ctx.fillStyle = el.style.fill || 'transparent';
      ctx.lineWidth = el.style.strokeWidth || 2;
      
      // Draw the element itself
      switch (el.type) {
        case 'rect':
          if (el.width && el.height) {
            ctx.strokeRect(el.position.x, el.position.y, el.width, el.height);
            if (el.style.fill) ctx.fillRect(el.position.x, el.position.y, el.width, el.height);
          }
          break;
        case 'circle':
          if (el.width && el.height) {
            const rx = el.width / 2;
            const ry = el.height / 2;
            ctx.beginPath();
            ctx.ellipse(el.position.x + rx, el.position.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
            ctx.stroke();
            if (el.style.fill) ctx.fill();
          }
          break;
        case 'text': {
          const fontWeightValue = el.style.fontWeight === 'semibold' ? 600 : el.style.fontWeight === 'medium' ? 500 : el.style.fontWeight || 'normal';
          ctx.font = `${fontWeightValue} ${el.style.fontSize || 16}px ${el.style.fontFamily || 'Inter'}`;
          ctx.fillStyle = el.style.stroke || colors.foreground || '#ffffff';
          ctx.fillText(el.text || 'Text', el.position.x, el.position.y);
          break;
        }
        case 'polyline':
        case 'curve':
          if (el.points && el.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            if (el.type === 'polyline') {
              for (let i = 1; i < el.points.length; i++) {
                ctx.lineTo(el.points[i].x, el.points[i].y);
              }
            } else {
              for (let i = 1; i < el.points.length - 2; i++) {
                const xc = (el.points[i].x + el.points[i + 1].x) / 2;
                const yc = (el.points[i].y + el.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
              }
              if (el.points.length > 2) {
                const i = el.points.length - 2;
                ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, el.points[i+1].x, el.points[i+1].y);
              }
            }
            ctx.stroke();
          }
          break;
        case 'image': {
          const storedWidth = el.width;
          const storedHeight = el.height;
          const imgWidth = storedWidth || 100;
          const imgHeight = storedHeight || 100;
          
          // Normalize dimensions for drawing
          const drawX = imgWidth < 0 ? el.position.x + imgWidth : el.position.x;
          const drawY = imgHeight < 0 ? el.position.y + imgHeight : el.position.y;
          const drawW = Math.abs(imgWidth);
          const drawH = Math.abs(imgHeight);
          
          if (el.url) {
            const cachedImage = imageCache.current[el.url];
            if (cachedImage) {
              if (cachedImage.complete && cachedImage.naturalWidth > 0) {
                ctx.drawImage(cachedImage, drawX, drawY, drawW, drawH);
              } else {
                // Image is still loading
                ctx.strokeStyle = el.style.stroke || colors.primary || '#3b82f6';
                ctx.strokeRect(drawX, drawY, drawW, drawH);
                ctx.fillStyle = el.style.stroke || colors.primary || '#3b82f6';
                ctx.font = '12px Inter';
                ctx.fillText('加载中...', drawX + 5, drawY + 15);
              }
            } else {
              // Start loading image
              const img = new Image();
              img.src = el.url;
              img.onload = () => {
                imageCache.current[el.url!] = img;
                // If it's a new image and width/height are very small or 0, set them to natural size
                // Use storedWidth/storedHeight to check if they were actually set by user dragging
                if (!storedWidth || !storedHeight || Math.abs(storedWidth) < 2 || Math.abs(storedHeight) < 2) {
                  const maxWidth = 400; // Increased default max width
                  const ratio = img.naturalHeight / img.naturalWidth;
                  const width = Math.min(maxWidth, img.naturalWidth);
                  const height = width * ratio;
                  updateElement(el.id, { width, height });
                }
                forceRender();
              };
              img.onerror = () => {
                ctx.strokeStyle = '#ef4444';
                ctx.strokeRect(drawX, drawY, drawW, drawH);
                ctx.fillStyle = '#ef4444';
                ctx.fillText('图片加载失败', drawX + 5, drawY + 15);
              };
              imageCache.current[el.url] = img;
            }
          } else {
            ctx.strokeStyle = el.style.stroke || colors.primary || '#3b82f6';
            ctx.strokeRect(drawX, drawY, drawW, drawH);
            ctx.fillStyle = el.style.stroke || colors.primary || '#3b82f6';
            ctx.font = '12px Inter';
            ctx.fillText('点击设置图片', drawX + 5, drawY + 15);
          }
          break;
        }
        case 'video': {
          const storedWidth = el.width;
          const storedHeight = el.height;
          const vidWidth = storedWidth || 160;
          const vidHeight = storedHeight || 90;
          
          const drawX = vidWidth < 0 ? el.position.x + vidWidth : el.position.x;
          const drawY = vidHeight < 0 ? el.position.y + vidHeight : el.position.y;
          const drawW = Math.abs(vidWidth);
          const drawH = Math.abs(vidHeight);
          
          if (el.url) {
            const { type: videoType } = getEmbedUrl(el.url);
            if (videoType === 'embed') {
              // Draw placeholder for embedded videos on canvas
              ctx.fillStyle = theme === 'dark' ? '#1f2937' : '#f3f4f6';
              ctx.fillRect(drawX, drawY, drawW, drawH);
              ctx.strokeStyle = theme === 'dark' ? '#374151' : '#e5e7eb';
              ctx.strokeRect(drawX, drawY, drawW, drawH);
              
              ctx.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280';
              ctx.font = `${14 / viewport.zoom}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText('第三方播放器', drawX + drawW / 2, drawY + drawH / 2);
              ctx.textAlign = 'left'; // Reset
              break;
            }

            let video = videoCache.current[el.url];
            if (!video) {
              video = document.createElement('video');
              video.src = el.url;
              video.muted = true;
              video.loop = true;
              video.playsInline = true;
              video.crossOrigin = 'anonymous';
              video.preload = 'auto';
              
              video.onloadeddata = () => {
                videoCache.current[el.url!] = video!;
                if (!storedWidth || !storedHeight || Math.abs(storedWidth) < 2 || Math.abs(storedHeight) < 2) {
                  const maxWidth = 400;
                  const ratio = video!.videoHeight / video!.videoWidth;
                  const width = Math.min(maxWidth, video!.videoWidth);
                  const height = width * ratio;
                  updateElement(el.id, { width, height });
                }
                forceRender();
              };
              
              video.onerror = () => {
                ctx.strokeStyle = '#ef4444';
                ctx.strokeRect(drawX, drawY, drawW, drawH);
                ctx.fillStyle = '#ef4444';
                ctx.fillText('视频加载失败', drawX + 5, drawY + 15);
              };
              
              videoCache.current[el.url] = video;
              video.load();
            }

            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
               ctx.drawImage(video, drawX, drawY, drawW, drawH);
               
               // Draw play/pause button overlay if not playing or if hovered
               if (video.paused || isHovered || isSelected) {
                 ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                 ctx.fillRect(drawX, drawY, drawW, drawH);
                 
                 const centerX = drawX + drawW / 2;
                 const centerY = drawY + drawH / 2;
                 const radius = Math.min(drawW, drawH) * 0.2;
                 
                 ctx.beginPath();
                 ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                 ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                 ctx.fill();
                 
                 if (video.paused) {
                   // Draw Play triangle
                   ctx.beginPath();
                   const triSize = radius * 0.5;
                   ctx.moveTo(centerX - triSize * 0.4, centerY - triSize);
                   ctx.lineTo(centerX + triSize * 0.8, centerY);
                   ctx.lineTo(centerX - triSize * 0.4, centerY + triSize);
                   ctx.closePath();
                   ctx.fillStyle = '#000000';
                   ctx.fill();
                 } else {
                   // Draw Pause bars
                   const barW = radius * 0.2;
                   const barH = radius * 0.8;
                   ctx.fillStyle = '#000000';
                   ctx.fillRect(centerX - barW * 1.5, centerY - barH / 2, barW, barH);
                   ctx.fillRect(centerX + barW * 0.5, centerY - barH / 2, barW, barH);
                 }
               }
             } else {
              ctx.strokeStyle = el.style.stroke || colors.primary || '#3b82f6';
              ctx.strokeRect(drawX, drawY, drawW, drawH);
              ctx.fillStyle = el.style.stroke || colors.primary || '#3b82f6';
              ctx.font = '12px Inter';
              ctx.fillText('正在加载视频...', drawX + 5, drawY + 15);
            }
          } else {
            ctx.strokeStyle = el.style.stroke || colors.primary || '#3b82f6';
            ctx.strokeRect(drawX, drawY, drawW, drawH);
            ctx.fillStyle = el.style.stroke || colors.primary || '#3b82f6';
            ctx.font = '12px Inter';
            ctx.fillText('点击设置视频', drawX + 5, drawY + 15);
          }
          break;
        }
      }
  
      // Draw selection box and handles
      if (isSelected || isHovered) {
        ctx.strokeStyle = colors.primary || '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const x = el.position.x;
        const y = el.position.y;
        const w = el.width || 0;
        const h = el.height || 0;
        
        // Normalize coordinates for selection box
        const realX = w < 0 ? x + w : x;
        const realY = h < 0 ? y + h : y;
        const realW = Math.abs(w);
        const realH = Math.abs(h);
  
        if (el.type === 'rect' || el.type === 'circle' || el.type === 'image' || el.type === 'video') {
          ctx.strokeRect(realX - 2, realY - 2, realW + 4, realH + 4);
          
          // Draw resize handles only when selected
          if (isSelected) {
            ctx.setLineDash([]);
            ctx.fillStyle = colors.background || '#ffffff';
            ctx.strokeStyle = colors.primary || '#3b82f6';
            ctx.lineWidth = 2;
            const handleSize = 6 / viewport.zoom;

            const handles = [
              { x: realX, y: realY },
              { x: realX + realW / 2, y: realY },
              { x: realX + realW, y: realY },
              { x: realX, y: realY + realH / 2 },
              { x: realX + realW, y: realY + realH / 2 },
              { x: realX, y: realY + realH },
              { x: realX + realW / 2, y: realY + realH },
              { x: realX + realW, y: realY + realH },
            ];

            handles.forEach(h => {
              ctx.beginPath();
              ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          }
        }

        // Draw connection handles for element (visible on selection or hover)
        ctx.save();
        const handleSize = 6 / viewport.zoom;
        let handles = [];

        if (el.type === 'text') {
          const fontSize = el.style.fontSize || 16;
          const width = (el.text || '').length * fontSize * 0.6;
          const x = el.position.x;
          const y = el.position.y;
          handles = [
            { x: x + width / 2, y: y - fontSize },
            { x: x + width / 2, y: y },
            { x, y: y - fontSize / 2 },
            { x: x + width, y: y - fontSize / 2 },
          ];
        } else {
          handles = [
            { x: realX + realW / 2, y: realY },
            { x: realX + realW / 2, y: realY + realH },
            { x: realX, y: realY + realH / 2 },
            { x: realX + realW, y: realY + realH / 2 },
          ];
        }
        
        handles.forEach(h => {
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
          ctx.fillStyle = colors.accent || '#10b981';
          ctx.fill();
          ctx.strokeStyle = colors.background || '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        ctx.restore();
      } else if (isHovered) {
        ctx.strokeStyle = colors.primary ? `${colors.primary}80` : 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        const x = el.position.x;
        const y = el.position.y;
        const w = el.width || 0;
        const h = el.height || 0;
        if (el.type === 'rect' || el.type === 'circle' || el.type === 'image' || el.type === 'video') {
          ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        }
      }
      
      ctx.restore();
    });
    
    // Draw dragging connection line
    if (dragState.isDragging && dragState.type === 'connection' && dragState.id && dragState.connectionTarget) {
      const source = nodes[dragState.id] || elements[dragState.id];
      if (source) {
        let sX, sY;
        const handle = dragState.handle || 'right';

        if ('level' in source) { // Node
          const x = source.position.x;
          const y = source.position.y;
          const w = source.width;
          const h = source.height;

          if (handle === 'top') { sX = x; sY = y - h / 2; }
          else if (handle === 'bottom') { sX = x; sY = y + h / 2; }
          else if (handle === 'left') { sX = x - w / 2; sY = y; }
          else { sX = x + w / 2; sY = y; }
        } else { // Element
          const x = source.position.x;
          const y = source.position.y;
          const w = source.width || 0;
          const h = source.height || 0;
          
          // Normalize coordinates
          const realX = w < 0 ? x + w : x;
          const realY = h < 0 ? y + h : y;
          const realW = Math.abs(w);
          const realH = Math.abs(h);

          if (source.type === 'text') {
            const fontSize = source.style.fontSize || 16;
            const width = (source.text || '').length * fontSize * 0.6;
            if (handle === 'top') { sX = x + width / 2; sY = y - fontSize; }
            else if (handle === 'bottom') { sX = x + width / 2; sY = y; }
            else if (handle === 'left') { sX = x; sY = y - fontSize / 2; }
            else { sX = x + width; sY = y - fontSize / 2; }
          } else {
            if (handle === 'top') { sX = realX + realW / 2; sY = realY; }
            else if (handle === 'bottom') { sX = realX + realW / 2; sY = realY + realH; }
            else if (handle === 'left') { sX = realX; sY = realY + realH / 2; }
            else { sX = realX + realW; sY = realY + realH / 2; }
          }
        }

        const tX = dragState.connectionTarget.x;
        const tY = dragState.connectionTarget.y;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sX, sY);
        
        const connStyle = layoutConfig.connectionStyle;
        if (connStyle === 'curve') {
          const cp1x = sX + (tX - sX) / 2;
          const cp1y = sY;
          const cp2x = sX + (tX - sX) / 2;
          const cp2y = tY;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tX, tY);
        } else if (connStyle === 'polyline') {
          const midX = sX + (tX - sX) / 2;
          ctx.lineTo(midX, sY);
          ctx.lineTo(midX, tY);
          ctx.lineTo(tX, tY);
        } else {
          ctx.lineTo(tX, tY);
        }
  
        ctx.strokeStyle = colors.accent || '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }, [nodes, viewport, selectionState, rootId, elements, connections, renderTrigger, dragState, aiConfig.enabled, colors, forceRender, getThemeLevelColor, layoutConfig.connectionStyle, theme, updateElement]);
  
  // Handle custom render event for image loading
  useEffect(() => {
    // Component re-renders when renderTrigger changes
  }, [renderTrigger]);
  
  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);
  
  return (
    <div ref={containerRef} className="canvas-container w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ cursor: canvasState.isPanning ? 'grabbing' : dragState.isDragging ? 'move' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Inline Text Editor */}
      {editingNodeId && nodes[editingNodeId] && (
        <div className="fixed inset-0 z-[999] pointer-events-none node-text-editor">
          <NodeTextEditor
            node={nodes[editingNodeId]}
            viewport={viewport}
            onSave={(text) => {
              updateNodeText(editingNodeId, text);
              setEditingNode(null);
            }}
            onCancel={() => setEditingNode(null)}
          />
        </div>
      )}

      {/* Inline Element Text Editor */}
      {editingElementId && elements[editingElementId] && elements[editingElementId].type === 'text' && (
        <div className="fixed inset-0 z-[999] pointer-events-none element-text-editor">
          <ElementTextEditor
            element={elements[editingElementId]}
            viewport={viewport}
            onSave={(text) => {
              if (!text || text.trim() === '' || text === '点击输入文字') {
                deleteElement(editingElementId);
              } else {
                updateElement(editingElementId, { text });
              }
              setEditingElement(null);
            }}
            onCancel={() => {
              const el = elements[editingElementId];
              if (el && (!el.text || el.text === '点击输入文字')) {
                deleteElement(editingElementId);
              }
              setEditingElement(null);
            }}
          />
        </div>
      )}

      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={handleInputDialogClose}
        onSubmit={handleInputDialogSubmit}
        title={
          inputDialog.type === 'text' 
            ? '编辑文字' 
            : inputDialog.type === 'video' 
              ? '添加视频' 
              : '添加图片'
        }
        type={inputDialog.type || 'text'}
        defaultValue={inputDialog.defaultValue}
        placeholder={
          inputDialog.type === 'text' 
            ? '请输入文字内容' 
            : inputDialog.type === 'video'
              ? 'https://example.com/video.mp4'
              : 'https://example.com/image.png'
        }
      />

      {aiInputState.isOpen && aiInputState.nodeId && nodes[aiInputState.nodeId] && (
        <InlineAIInput
          nodePosition={nodes[aiInputState.nodeId].position}
          nodeHeight={nodes[aiInputState.nodeId].height}
          viewport={viewport}
          onConfirm={(prompt) => {
            if (aiInputState.nodeId) {
              generateSubNodes(aiInputState.nodeId, prompt);
            }
            setAiInputState({ isOpen: false, nodeId: null });
          }}
          onCancel={() => setAiInputState({ isOpen: false, nodeId: null })}
          isProcessing={isAIProcessing}
        />
      )}

      {/* AI Processing Status */}
      {isAIProcessing && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm font-medium">{aiProgressMessage}</span>
        </div>
      )}

      {/* Third-party Video Overlays */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 100 }}
      >
        {Object.values(elements).map(el => {
          if (el.type !== 'video' || !el.url) return null;
          const { url: embedUrl, type: videoType } = getEmbedUrl(el.url);
          if (videoType !== 'embed') return null;

          const x = (el.position.x * viewport.zoom) + viewport.x;
          const y = (el.position.y * viewport.zoom) + viewport.y;
          let w = (el.width || 0) * viewport.zoom;
          let h = (el.height || 0) * viewport.zoom;

          // If size is too small or zero, provide a default display size for the overlay
          // but don't update the actual element size here
          if (Math.abs(w) < 10 || Math.abs(h) < 10) {
            w = 400 * viewport.zoom;
            h = 225 * viewport.zoom;
          }

          // Check if it's within viewport (rough check)
          const margin = 500;
          const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
          const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
          if (x + w < -margin || x > containerWidth + margin || y + h < -margin || y > containerHeight + margin) {
            return null;
          }

          const isSelected = selectionState.selectedElementIds.includes(el.id);
          const isDragging = dragState.isDragging && dragState.id === el.id && dragState.type === 'element';
          const isResizing = dragState.isDragging && dragState.id === el.id && dragState.type === 'resize';
          const isActivated = activatedVideos[el.id];

          return (
            <div
              key={el.id}
              className="absolute bg-black group"
              style={{
                left: x,
                top: y,
                width: Math.abs(w),
                height: Math.abs(h),
                transform: `scaleX(${w < 0 ? -1 : 1}) scaleY(${h < 0 ? -1 : 1})`,
                boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
                opacity: (isDragging || isResizing) ? 0.5 : 1,
                // The container itself should allow clicks to pass through to canvas IF not activated
                // BUT its children (like handles) should still be clickable
                pointerEvents: 'none',
                zIndex: isActivated ? 20 : 10,
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-none"
                  style={{ pointerEvents: isActivated ? 'auto' : 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Activation Overlay */}
                {!isActivated && (
                  <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setActivatedVideos(prev => ({ ...prev, [el.id]: true }));
                      } else {
                        selectElement(el.id);
                      }
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-black border-b-[10px] border-b-transparent ml-1" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {isSelected ? '点击开始播放' : '点击选中'}
                    </div>
                  </div>
                )}
              </div>

              {/* Drag Handle - Top Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-8 bg-black/20 hover:bg-black/40 cursor-move pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const pos = clientToCanvas(e.clientX, e.clientY);
                  selectElement(el.id, e.shiftKey);
                  startDrag(el.id, pos, 'element');
                }}
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/60" />)}
                </div>
              </div>

              {/* Connection Ports - Visible when selected or hovered */}
              {(isSelected || !isActivated) && (
                <>
                  {/* Top Port */}
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white cursor-crosshair pointer-events-auto shadow-sm z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const pos = clientToCanvas(e.clientX, e.clientY);
                      startDrag(el.id, pos, 'connection', 'top');
                    }}
                  />
                  {/* Bottom Port */}
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white cursor-crosshair pointer-events-auto shadow-sm z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const pos = clientToCanvas(e.clientX, e.clientY);
                      startDrag(el.id, pos, 'connection', 'bottom');
                    }}
                  />
                  {/* Left Port */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white cursor-crosshair pointer-events-auto shadow-sm z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const pos = clientToCanvas(e.clientX, e.clientY);
                      startDrag(el.id, pos, 'connection', 'left');
                    }}
                  />
                  {/* Right Port */}
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white cursor-crosshair pointer-events-auto shadow-sm z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const pos = clientToCanvas(e.clientX, e.clientY);
                      startDrag(el.id, pos, 'connection', 'right');
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface NodeTextEditorProps {
  node: MindNode;
  viewport: { x: number; y: number; zoom: number };
  onSave: (text: string) => void;
  onCancel: () => void;
}

const NodeTextEditor: React.FC<NodeTextEditorProps> = ({ node, viewport, onSave, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(node.text);
  
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  const x = (node.position.x - node.width / 2) * viewport.zoom + viewport.x;
  const y = (node.position.y - node.height / 2) * viewport.zoom + viewport.y;
  
  // Calculate width based on current typing text
  const level = node.level;
  const baseWidth = level === 0 ? 40 : 32;
  const charWidth = level === 0 ? 16 : 14;
  const currentWidth = Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(text)}
      className="absolute bg-card border-2 border-primary rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xl pointer-events-auto"
      style={{
        left: x - (currentWidth - node.width) * viewport.zoom / 2,
        top: y,
        width: currentWidth * viewport.zoom,
        height: node.height * viewport.zoom,
        transform: 'none',
        zIndex: 100,
        textAlign: 'center',
      }}
    />
  );
};

interface ElementTextEditorProps {
  element: CanvasElement;
  viewport: { x: number; y: number; zoom: number };
  onSave: (text: string) => void;
  onCancel: () => void;
}

const ElementTextEditor: React.FC<ElementTextEditorProps> = ({ element, viewport, onSave, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(element.text || '');
  
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  const x = element.position.x * viewport.zoom + viewport.x;
  const y = element.position.y * viewport.zoom + viewport.y;
  
  const fontSize = (element.style.fontSize || 16) * viewport.zoom;
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(text)}
      className="absolute bg-card border-2 border-primary rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xl pointer-events-auto"
      style={{
        left: x,
        top: y - fontSize,
        minWidth: '100px',
        fontSize: `${fontSize}px`,
        color: element.style.stroke || 'currentColor',
        fontWeight: element.style.fontWeight === 'semibold' ? 600 : element.style.fontWeight === 'medium' ? 500 : element.style.fontWeight,
        transform: 'none',
        zIndex: 1000,
      }}
    />
  );
};

export default MindmapCanvas;
