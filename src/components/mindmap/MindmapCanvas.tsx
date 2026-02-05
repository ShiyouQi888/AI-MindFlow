import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useMindmapStore } from '@/stores/mindmapStore';
import { getNodeColor, MindNode, Position, CanvasElement } from '@/types/mindmap';
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
    setHoveredElement,
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

  // Get node at position
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): MindNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - viewport.y) / viewport.zoom;
    
    for (const node of Object.values(nodes)) {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width;
      const nodeHeight = node.height;
      const padding = 10;
      
      if (
        x >= nodeX - nodeWidth / 2 - padding &&
        x <= nodeX + nodeWidth / 2 + padding &&
        y >= nodeY - nodeHeight / 2 - padding &&
        y <= nodeY + nodeHeight / 2 + padding
      ) {
        return node;
      }
    }
    
    return null;
  }, [nodes, viewport]);
  
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
      if (el.type === 'rect' || el.type === 'image' || el.type === 'video') {
        if (
          pos.x >= el.position.x &&
          pos.x <= el.position.x + (el.width || 0) &&
          pos.y >= el.position.y &&
          pos.y <= el.position.y + (el.height || 0)
        ) {
          return el.id;
        }
      } else if (el.type === 'circle') {
        const rx = (el.width || 0) / 2;
        const ry = (el.height || 0) / 2;
        const cx = el.position.x + rx;
        const cy = el.position.y + ry;
        const dx = (pos.x - cx) / rx;
        const dy = (pos.y - cy) / ry;
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
          pos.x >= el.position.x - 10 &&
          pos.x <= el.position.x + textWidth + 10 &&
          pos.y >= el.position.y - fontSize - 5 &&
          pos.y <= el.position.y + (fontSize * 0.4) // More padding at bottom
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
  const getConnectionHandleAtPosition = useCallback((clientX: number, clientY: number): { id: string, type: 'node' | 'element' } | null => {
    const pos = clientToCanvas(clientX, clientY);
    const handleSize = 12 / viewport.zoom;

    // Check selected nodes
    for (const id of selectionState.selectedNodeIds) {
      const node = nodes[id];
      if (!node) continue;
      // Position handle based on node side
      const side = node.side || 'right';
      const hX = node.position.x + (side === 'left' ? -node.width / 2 - 10 / viewport.zoom : node.width / 2 + 10 / viewport.zoom);
      const hY = node.position.y;
      if (Math.hypot(pos.x - hX, pos.y - hY) < handleSize) {
        return { id, type: 'node' };
      }
    }

    // Check selected elements
    for (const id of selectionState.selectedElementIds) {
      const el = elements[id];
      if (!el) continue;
      
      let hX, hY;
      if (el.type === 'text') {
        const fontSize = el.style.fontSize || 16;
        const width = (el.text || '').length * fontSize * 0.6;
        hX = el.position.x + width + 10 / viewport.zoom;
        hY = el.position.y - fontSize / 2;
      } else {
        hX = el.position.x + (el.width || 0) + 10 / viewport.zoom;
        hY = el.position.y + (el.height || 0) / 2;
      }

      if (Math.hypot(pos.x - hX, pos.y - hY) < handleSize) {
        return { id, type: 'element' };
      }
    }
    return null;
  }, [nodes, elements, selectionState, clientToCanvas, viewport.zoom]);

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

    // Check for connection handle first
    const connectionHandle = getConnectionHandleAtPosition(e.clientX, e.clientY);
    if (connectionHandle) {
      startDrag(connectionHandle.id, pos, 'connection');
      return;
    }

    // Check for AI handle
    if (aiConfig.enabled) {
      const handleSize = 15 / viewport.zoom;
      for (const id of selectionState.selectedNodeIds) {
        const n = nodes[id];
        if (!n) continue;
        const aiX = n.position.x;
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
    
    // If a node is clicked, always prioritize selection/dragging regardless of tool
    if (node) {
      if (e.detail === 2) {
        // Double click - edit
        setEditingNode(node.id);
      } else {
        selectNode(node.id, e.shiftKey);
        startDrag(node.id, pos, 'node');
        
        // Auto-zoom if there are many nodes (e.g., more than 10)
        // This helps focus on the clicked node in a crowded map
        if (Object.keys(nodes).length > 10 && containerRef.current) {
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
  }, [currentTool, addElement, getNodeAtPosition, getElementAtPosition, getResizeHandleAtPosition, selectNode, selectElement, clearSelection, startDrag, startPan, clientToCanvas, setEditingNode, setCurrentTool, colors, aiConfig.enabled, editingElementId, editingNodeId, elements, getConnectionHandleAtPosition, inputDialog.isOpen, nodes, selectionState.selectedNodeIds, setEditingElement, viewport.zoom, focusNode]);

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
  }, [drawingId, startPos, elements, clientToCanvas, updateElement, dragState.isDragging, updateDrag, canvasState.isPanning, updatePan, getNodeAtPosition, setHoveredNode, getElementAtPosition, setHoveredElement, getResizeHandleAtPosition, currentTool, aiConfig.enabled, viewport.zoom, selectionState.selectedNodeIds, nodes]);

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
        
        if (targetNode && targetNode.id !== dragState.id) {
          addConnection({
            sourceId: dragState.id,
            sourceType: dragState.id in nodes ? 'node' : 'element',
            targetId: targetNode.id,
            targetType: 'node',
            style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
          });
        } else if (targetElementId && targetElementId !== dragState.id) {
          addConnection({
            sourceId: dragState.id,
            sourceType: dragState.id in nodes ? 'node' : 'element',
            targetId: targetElementId,
            targetType: 'element',
            style: { stroke: colors.primary || 'hsl(220, 90%, 56%)', strokeWidth: 2 }
          });
        }
      }
      endDrag();
    } else if (canvasState.isPanning) {
      endPan();
    }
  }, [drawingId, elements, dragState, endDrag, canvasState.isPanning, endPan, setCurrentTool, updateElement, addConnection, getNodeAtPosition, getElementAtPosition, nodes, colors, setEditingElement]);

  const handleInputDialogSubmit = (value: string) => {
    if (!inputDialog.elementId) return;

    lastSubmittedElementId.current = inputDialog.elementId;

    if (inputDialog.type === 'text') {
      updateElement(inputDialog.elementId, { text: value });
    } else if (inputDialog.type === 'image' || inputDialog.type === 'video') {
      if (value) {
        updateElement(inputDialog.elementId, { url: value });
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
              const newId = addNode(node.parentId, '新节点', node.side);
              selectNode(newId);
              setTimeout(() => setEditingNode(newId), 50);
            }
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedNodeId && selectedNodeId !== rootId) {
            deleteNode(selectedNodeId);
          } else if (selectedElementId) {
            deleteElement(selectedElementId);
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
  }, [selectionState, editingNodeId, editingElementId, nodes, elements, rootId, addNode, deleteNode, deleteElement, toggleCollapse, selectNode, clearSelection, setEditingNode, setEditingElement]);
  
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
        
        const isSelected = selectionState.selectedNodeIds.includes(childId) || 
                          selectionState.selectedNodeIds.includes(nodeId);
        
        ctx.strokeStyle = isSelected 
          ? (colors.selection || colors.primary || '#3b82f6')
          : (colors.connectionLine || 'hsl(225, 15%, 35%)');
        ctx.lineWidth = isSelected ? 3 : 2;
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
        const side = source.side || 'right';
        sX = source.position.x + (side === 'left' ? -source.width / 2 - 10 / viewport.zoom : source.width / 2 + 10 / viewport.zoom);
        sY = source.position.y;
      } else { // Element
        if (source.type === 'text') {
          const fontSize = source.style.fontSize || 16;
          const width = (source.text || '').length * fontSize * 0.6;
          sX = source.position.x + width + 10 / viewport.zoom;
          sY = source.position.y - fontSize / 2;
        } else {
          sX = source.position.x + (source.width || 0) + 10 / viewport.zoom;
          sY = source.position.y + (source.height || 0) / 2;
        }
      }

      // Target point
      if ('level' in target) { // Node
        tX = target.position.x;
        tY = target.position.y;
      } else { // Element
        if (target.type === 'text') {
          const fontSize = target.style.fontSize || 16;
          const width = (target.text || '').length * fontSize * 0.6;
          tX = target.position.x + width / 2;
          tY = target.position.y - fontSize / 2;
        } else {
          tX = target.position.x + (target.width || 0) / 2;
          tY = target.position.y + (target.height || 0) / 2;
        }
      }

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

      ctx.strokeStyle = conn.style.stroke || colors.primary || '#3b82f6';
      ctx.lineWidth = conn.style.strokeWidth || 2;
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
        const side = node.side || 'right';
        const hX = node.position.x + (side === 'left' ? -node.width / 2 - 10 / viewport.zoom : node.width / 2 + 10 / viewport.zoom);
        const hY = node.position.y;
        
        ctx.beginPath();
        ctx.arc(hX, hY, handleSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.accent || '#10b981'; // Emerald-500
        ctx.fill();
        ctx.strokeStyle = colors.background || '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // AI Extension indicator for selected node
        if (aiConfig.enabled) {
          const aiX = node.position.x;
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
      if (isSelected) {
        ctx.strokeStyle = colors.primary || '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const x = el.position.x;
        const y = el.position.y;
        const w = el.width || 0;
        const h = el.height || 0;
  
        if (el.type === 'rect' || el.type === 'circle' || el.type === 'image' || el.type === 'video') {
          ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
          
          // Draw handles
          ctx.setLineDash([]);
          ctx.fillStyle = colors.background || '#ffffff';
          ctx.strokeStyle = colors.primary || '#3b82f6';
          ctx.lineWidth = 2;
          const handleSize = 6 / viewport.zoom;

          const handles = [
            { x: x, y: y },
            { x: x + w / 2, y: y },
            { x: x + w, y: y },
            { x: x, y: y + h / 2 },
            { x: x + w, y: y + h / 2 },
            { x: x, y: y + h },
            { x: x + w / 2, y: y + h },
            { x: x + w, y: y + h },
          ];

          handles.forEach(h => {
            ctx.beginPath();
            ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        }

        // Draw connection handle for element
        ctx.save();
        const handleSize = 6 / viewport.zoom;
        let hX, hY;
        if (el.type === 'text') {
          const fontSize = el.style.fontSize || 16;
          const width = (el.text || '').length * fontSize * 0.6;
          hX = el.position.x + width + 10 / viewport.zoom;
          hY = el.position.y - fontSize / 2;
        } else {
          hX = el.position.x + (el.width || 0) + 10 / viewport.zoom;
          hY = el.position.y + (el.height || 0) / 2;
        }
        
        ctx.beginPath();
        ctx.arc(hX, hY, handleSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.accent || '#10b981';
        ctx.fill();
        ctx.strokeStyle = colors.background || '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
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
        if ('level' in source) {
          const side = source.side || 'right';
          sX = source.position.x + (side === 'left' ? -source.width / 2 - 10 / viewport.zoom : source.width / 2 + 10 / viewport.zoom);
          sY = source.position.y;
        } else if (source.type === 'text') {
          const fontSize = source.style.fontSize || 16;
          const width = (source.text || '').length * fontSize * 0.6;
          sX = source.position.x + width + 10 / viewport.zoom;
          sY = source.position.y - fontSize / 2;
        } else {
          sX = source.position.x + (source.width || 0) + 10 / viewport.zoom;
          sY = source.position.y + (source.height || 0) / 2;
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
