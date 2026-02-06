import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import { 
  MindNode, 
  MindMap, 
  Viewport, 
  Position, 
  DragState, 
  SelectionState,
  CanvasState,
  LayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
  NodeStyle,
  ToolType,
  FreeConnection,
  AIConfig,
  CanvasElement,
} from '@/types/mindmap';

export interface ColorPalette {
  name: string;
  root: string;
  levels: string[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
  enabled: false,
};

interface MindmapStore {
  // Data
  mindmap: MindMap;
  savedMindmaps: MindMap[];
  aiConfig: AIConfig;
  
  // UI State
  dragState: DragState;
  selectionState: SelectionState;
  canvasState: CanvasState;
  layoutConfig: LayoutConfig;
  editingNodeId: string | null;
  editingElementId: string | null;
  currentTool: ToolType;
  isPreviewMode: boolean;
  
  // Actions
  setAIConfig: (config: Partial<AIConfig>) => void;
  setMindmap: (mindmap: MindMap) => void;
  setPreviewMode: (isPreview: boolean) => void;
  loadMindmap: (id: string) => void;
  deleteMindmap: (id: string) => void;
  fetchUserMindmaps: () => Promise<void>;
  setCurrentTool: (tool: ToolType) => void;
  addNode: (parentId: string, text?: string, side?: 'left' | 'right') => string;
  updateNodeText: (nodeId: string, text: string) => void;
  updateMindmapName: (name: string) => void;
  createNewMindmap: () => void;
  updateNodeStyle: (nodeId: string, style: Partial<NodeStyle>) => void;
  deleteNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  
  // Selection
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectElement: (elementId: string, addToSelection?: boolean) => void;
  selectConnection: (connectionId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  setHoveredConnection: (connectionId: string | null) => void;
  
  // Editing
  setEditingNode: (nodeId: string | null) => void;
  setEditingElement: (elementId: string | null) => void;
  
  // Drag
  startDrag: (id: string, position: Position, type: 'node' | 'element' | 'resize' | 'connection', handle?: string) => void;
  updateDrag: (position: Position, options?: { shiftKey?: boolean }) => void;
  endDrag: () => void;
  
  // Canvas
  startPan: (position: Position) => void;
  updatePan: (position: Position) => void;
  endPan: () => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusNode: (nodeId: string, canvasWidth: number, canvasHeight: number) => void;
  organizeMindmap: (canvasWidth?: number, canvasHeight?: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  resetAll: () => void;
  canvasSize: { width: number; height: number };
  
  // Layout
  setLayoutConfig: (config: Partial<LayoutConfig>) => void;
  applyLayout: () => void;
  
  // Theme
  applyColorPalette: (palette: ColorPalette) => void;
  
  // Elements
  addElement: (element: Omit<CanvasElement, 'id'>) => string;
  updateElement: (id: string, element: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  
  // Connections
  addConnection: (connection: Omit<FreeConnection, 'id'>) => string;
  deleteConnection: (id: string) => void;
  
  // Node Position
  updateNodePosition: (nodeId: string, position: Position) => void;
  
  // AI Actions
  generateSubNodes: (nodeId: string, prompt?: string) => Promise<void>;
  isAIProcessing: boolean;
  aiProgressMessage: string;
  aiProcessingNodeId: string | null;
}

const createInitialMindmap = (): MindMap => {
  const rootId = generateId();
  const child1Id = generateId();
  const child2Id = generateId();
  const child3Id = generateId();
  const grandchild1Id = generateId();
  const grandchild2Id = generateId();
  
  const calculateNodeWidth = (text: string, level: number) => {
    const baseWidth = level === 0 ? 40 : 32;
    const charWidth = level === 0 ? 16 : 14;
    return Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);
  };

  return {
    id: generateId(),
    name: 'My Mind Map',
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        text: '中心主题',
        position: { x: 400, y: 300 },
        collapsed: false,
        children: [child1Id, child2Id, child3Id],
        level: 0,
        width: calculateNodeWidth('中心主题', 0),
        height: 36,
      },
      [child1Id]: {
        id: child1Id,
        parentId: rootId,
        text: '分支一',
        position: { x: 600, y: 150 },
        collapsed: false,
        children: [grandchild1Id, grandchild2Id],
        level: 1,
        width: calculateNodeWidth('分支一', 1),
        height: 36,
        side: 'right',
      },
      [child2Id]: {
        id: child2Id,
        parentId: rootId,
        text: '分支二',
        position: { x: 600, y: 300 },
        collapsed: false,
        children: [],
        level: 1,
        width: calculateNodeWidth('分支二', 1),
        height: 36,
        side: 'right',
      },
      [child3Id]: {
        id: child3Id,
        parentId: rootId,
        text: '分支三',
        position: { x: 600, y: 450 },
        collapsed: false,
        children: [],
        level: 1,
        width: calculateNodeWidth('分支三', 1),
        height: 36,
        side: 'right',
      },
      [grandchild1Id]: {
        id: grandchild1Id,
        parentId: child1Id,
        text: '子节点 A',
        position: { x: 800, y: 100 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('子节点 A', 2),
        height: 36,
        side: 'right',
      },
      [grandchild2Id]: {
        id: grandchild2Id,
        parentId: child1Id,
        text: '子节点 B',
        position: { x: 800, y: 200 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('子节点 B', 2),
        height: 36,
        side: 'right',
      },
    },
    elements: {},
    connections: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

import { toast } from "sonner";

export const useMindmapStore = create<MindmapStore>((set, get) => {
  // Load initial state from localStorage with error handling
  const getInitialState = () => {
    let currentMindmap: MindMap | null = null;
    let savedMindmaps: MindMap[] = [];

    try {
      const savedList = localStorage.getItem('aimindflow_saved_mindmaps');
      if (savedList) {
        savedMindmaps = JSON.parse(savedList);
      }

      const savedCurrent = localStorage.getItem('aimindflow_current_mindmap');
      if (savedCurrent) {
        currentMindmap = JSON.parse(savedCurrent);
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }

    if (!currentMindmap) {
      currentMindmap = createInitialMindmap();
    }

    // Ensure current is in saved list
    if (savedMindmaps.length === 0 || !savedMindmaps.find(m => m.id === currentMindmap?.id)) {
      savedMindmaps = [currentMindmap, ...savedMindmaps];
    }

    return { currentMindmap, savedMindmaps };
  };

  const { currentMindmap, savedMindmaps } = getInitialState();

  const updateSavedList = (mindmap: MindMap, list: MindMap[]) => {
    const newList = [mindmap, ...list.filter(m => m.id !== mindmap.id)];
    localStorage.setItem('aimindflow_saved_mindmaps', JSON.stringify(newList));
    return newList;
  };

  const persistMindmap = async (mindmap: MindMap) => {
    // Always save to localStorage for offline support/quick load
    localStorage.setItem('aimindflow_current_mindmap', JSON.stringify(mindmap));
    
    // Save to Supabase if logged in and configured
    const user = useAuthStore.getState().user;
    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('mindmaps')
          .upsert({
            id: mindmap.id,
            user_id: user.id,
            name: mindmap.name,
            data: mindmap,
            updated_at: new Date().toISOString(),
          });
        
        if (error) console.error('Failed to sync to Supabase:', error);
      } catch (e) {
        console.error('Supabase sync error:', e);
      }
    }
  };

  const logActivity = async (action: string, details?: any) => {
    const user = useAuthStore.getState().user;
    if (user && isSupabaseConfigured) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        details,
      });
    }
  };

  return {
    mindmap: currentMindmap,
    savedMindmaps,
    aiConfig: {
      ...DEFAULT_AI_CONFIG,
      apiKey: localStorage.getItem('deepseek_api_key') || DEFAULT_AI_CONFIG.apiKey,
      baseUrl: localStorage.getItem('deepseek_base_url') || DEFAULT_AI_CONFIG.baseUrl,
      model: localStorage.getItem('deepseek_model') || DEFAULT_AI_CONFIG.model,
      enabled: !!(localStorage.getItem('deepseek_api_key') || DEFAULT_AI_CONFIG.apiKey),
    },
    dragState: {
      isDragging: false,
      type: null,
      id: null,
      offset: { x: 0, y: 0 },
      startPosition: null,
    },
    selectionState: {
      selectedNodeIds: [],
      selectedElementIds: [],
      selectedConnectionIds: [],
      hoveredNodeId: null,
      hoveredElementId: null,
      hoveredConnectionId: null,
    },
    canvasState: {
      isPanning: false,
      panStart: null,
    },
    layoutConfig: DEFAULT_LAYOUT_CONFIG,
    editingNodeId: null,
    editingElementId: null,
    currentTool: 'select',
    isPreviewMode: false,
    isAIProcessing: false,
    aiProgressMessage: '',
    aiProcessingNodeId: null,
    canvasSize: { width: 800, height: 600 },
    
    setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

    resetAll: () => {
      const initialMindmap = createInitialMindmap();
      localStorage.removeItem('aimindflow_current_mindmap');
      localStorage.removeItem('aimindflow_saved_mindmaps');
      set({ 
        mindmap: initialMindmap, 
        savedMindmaps: [],
        selectionState: {
          selectedNodeIds: [],
          selectedElementIds: [],
          selectedConnectionIds: [],
          hoveredNodeId: null,
          hoveredElementId: null,
          hoveredConnectionId: null,
        },
        isPreviewMode: false,
      });
    },

    setAIConfig: (config) => {
      set((state) => {
        const newConfig = { ...state.aiConfig, ...config };
        if (config.apiKey !== undefined) {
          localStorage.setItem('deepseek_api_key', config.apiKey);
          newConfig.enabled = !!(config.apiKey || DEFAULT_AI_CONFIG.apiKey);
        }
        if (config.baseUrl !== undefined) {
          localStorage.setItem('deepseek_base_url', config.baseUrl);
        }
        if (config.model !== undefined) {
          localStorage.setItem('deepseek_model', config.model);
        }
        return { aiConfig: newConfig };
      });
    },

    setMindmap: (mindmap) => {
      set((state) => {
        const updatedMindmap = { ...mindmap, updatedAt: new Date() };
        persistMindmap(updatedMindmap);
        return { 
          mindmap: updatedMindmap,
          savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
        };
      });
    },

    setPreviewMode: (isPreview) => {
      set({ isPreviewMode: isPreview });
    },

    loadMindmap: (id) => {
      const { savedMindmaps } = get();
      const mindmap = savedMindmaps.find(m => m.id === id);
      if (mindmap) {
        const updatedMindmap = { ...mindmap, updatedAt: new Date() };
        set({ 
          mindmap: updatedMindmap,
          savedMindmaps: updateSavedList(updatedMindmap, savedMindmaps),
          selectionState: {
            selectedNodeIds: [],
            selectedElementIds: [],
            selectedConnectionIds: [],
            hoveredNodeId: null,
            hoveredElementId: null,
            hoveredConnectionId: null,
          },
          editingNodeId: null,
          editingElementId: null,
        });
        persistMindmap(updatedMindmap);
        setTimeout(() => get().applyLayout(), 0);
      }
    },

    deleteMindmap: (id) => {
      set((state) => {
        const newList = state.savedMindmaps.filter(m => m.id !== id);
        localStorage.setItem('aimindflow_saved_mindmaps', JSON.stringify(newList));
        
        // Delete from Supabase if logged in and configured
        const user = useAuthStore.getState().user;
        if (user && isSupabaseConfigured) {
          supabase.from('mindmaps').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to delete from Supabase:', error);
          });
          logActivity('delete_mindmap', { id });
        }

        if (state.mindmap.id === id) {
          const nextMindmap = newList[0] || createInitialMindmap();
          persistMindmap(nextMindmap);
          return { 
            mindmap: nextMindmap,
            savedMindmaps: newList.length > 0 ? newList : [nextMindmap]
          };
        }
        
        return { savedMindmaps: newList };
      });
    },
  
    fetchUserMindmaps: async () => {
      if (!isSupabaseConfigured) return;
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data, error } = await supabase
        .from('mindmaps')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        // Ignore AbortError as it's often caused by rapid navigation or auth state changes
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch mindmaps from Supabase:', error);
        }
        return;
      }

      if (data && data.length > 0) {
        const mindmaps = data.map(item => item.data as MindMap);
        const currentMindmap = get().mindmap;
        
        // If current mindmap is default and cloud has data, load the latest cloud one
        const isDefault = currentMindmap.name === 'My Mind Map' && 
                         Object.keys(currentMindmap.nodes).length <= 6; // Initial nodes count
        
        if (isDefault) {
          set({ 
            mindmap: mindmaps[0],
            savedMindmaps: mindmaps 
          });
          localStorage.setItem('aimindflow_current_mindmap', JSON.stringify(mindmaps[0]));
        } else {
          set({ savedMindmaps: mindmaps });
        }
        
        localStorage.setItem('aimindflow_saved_mindmaps', JSON.stringify(mindmaps));
      }
    },
  
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  addNode: (parentId, text = '新节点', explicitSide) => {
    const newId = generateId();
    const parent = get().mindmap.nodes[parentId];
    
    if (!parent) return newId;
    
    const { layoutConfig } = get();
    let side: 'left' | 'right' | undefined = explicitSide;

    if (!side) {
      if (parent.parentId === null) { // Root node
        if (layoutConfig.direction === 'right') {
          side = 'right';
        } else if (layoutConfig.direction === 'left') {
          side = 'left';
        } else {
          // 'both' direction: distribute evenly, prefer right side first
          const leftCount = parent.children.filter(id => get().mindmap.nodes[id]?.side === 'left').length;
          const rightCount = parent.children.filter(id => get().mindmap.nodes[id]?.side === 'right').length;
          
          // If we're adding a sibling (Enter key), we might want to stay on the same side
          // but addNode doesn't know which node was selected. 
          // However, if the user didn't provide explicitSide, we balance.
          side = rightCount <= leftCount ? 'right' : 'left';
        }
      } else {
        // Non-root nodes inherit side from parent
        side = parent.side;
        
        // If parent's side is missing, try to infer it from parent's position relative to root
        if (!side) {
          const root = get().mindmap.nodes[get().mindmap.rootId];
          if (root) {
            side = parent.position.x < root.position.x ? 'left' : 'right';
          }
        }
      }
    }

    // Ensure side is never undefined for children of root or deeper
    if (!side && parent) {
      const root = get().mindmap.nodes[get().mindmap.rootId];
      if (root) {
        // For direct children of root, use balancing or direction
        if (parent.id === root.id) {
           // This part is already handled above in the if (!side) { if (parent.parentId === null) ... } block
        } else {
           // Should have been handled by inheritance above
        }
      }
    }

    // If we added to a specific side, we should ensure layout is 'both' if it was root
    // to allow both sides to exist
    if (parent.parentId === null && side) {
      if (layoutConfig.direction !== 'both' && layoutConfig.direction !== side) {
        set((state) => ({
          layoutConfig: { ...state.layoutConfig, direction: 'both' }
        }));
      }
    }

    const calculateNodeWidth = (text: string, level: number) => {
      const baseWidth = level === 0 ? 40 : 32;
      const charWidth = level === 0 ? 16 : 14;
      return Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);
    };

    const newNode: MindNode = {
      id: newId,
      parentId,
      text,
      position: { 
        x: parent.position.x + (side === 'left' ? -200 : 200), 
        y: parent.position.y + (parent.children.length * 60),
      },
      collapsed: false,
      children: [],
      level: parent.level + 1,
      width: calculateNodeWidth(text, parent.level + 1),
      height: 36,
      side,
    };
    
    set((state) => {
      const newMindmap = {
        ...state.mindmap,
        nodes: {
          ...state.mindmap.nodes,
          [newId]: newNode,
          [parentId]: {
            ...state.mindmap.nodes[parentId],
            children: [...state.mindmap.nodes[parentId].children, newId],
          },
        },
        updatedAt: new Date(),
      };
      persistMindmap(newMindmap);
      return { 
        mindmap: newMindmap,
        savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps)
      };
    });
    
    // Apply layout after adding node
    setTimeout(() => get().applyLayout(), 0);
    
    return newId;
  },
  
  updateNodeText: (nodeId, text) => {
      const oldText = get().mindmap.nodes[nodeId]?.text;
      set((state) => {
        const node = state.mindmap.nodes[nodeId];
        if (!node) return state;

        const level = node.level;
        const baseWidth = level === 0 ? 40 : 32;
        const charWidth = level === 0 ? 16 : 14;
        const width = Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);

        const newMindmap = {
          ...state.mindmap,
          nodes: {
            ...state.mindmap.nodes,
            [nodeId]: {
              ...node,
              text,
              width,
            },
          },
          updatedAt: new Date(),
        };
        persistMindmap(newMindmap);
        return { 
          mindmap: newMindmap,
          savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps)
        };
      });
      logActivity('update_node_text', { nodeId, oldText, newText: text });
      // Re-layout after text change as width changed
      setTimeout(() => get().applyLayout(), 0);
    },
  
  updateMindmapName: (name) => {
    set((state) => {
      const newMindmap = {
        ...state.mindmap,
        name,
        updatedAt: new Date(),
      };
      persistMindmap(newMindmap);
      return { 
        mindmap: newMindmap,
        savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps)
      };
    });
  },

  createNewMindmap: () => {
    const newMindmap = createInitialMindmap();
    logActivity('create_mindmap', { id: newMindmap.id, name: newMindmap.name });
    set((state) => {
      persistMindmap(newMindmap);
      return { 
        mindmap: newMindmap,
        savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps),
        selectionState: {
          selectedNodeIds: [],
          selectedElementIds: [],
          selectedConnectionIds: [],
          hoveredNodeId: null,
          hoveredElementId: null,
          hoveredConnectionId: null,
        },
        editingNodeId: null,
        editingElementId: null,
        currentTool: 'select',
      };
    });
    setTimeout(() => get().applyLayout(), 0);
  },
  
  updateNodeStyle: (nodeId, style) => {
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: {
            ...state.mindmap.nodes,
            [nodeId]: {
              ...state.mindmap.nodes[nodeId],
              style: {
                ...state.mindmap.nodes[nodeId]?.style,
                ...style,
              },
            },
          },
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },
  
  deleteNode: (nodeId) => {
    const { mindmap } = get();
    const node = mindmap.nodes[nodeId];
    
    if (!node || node.id === mindmap.rootId) return;
    
    // Collect all descendant IDs
    const collectDescendants = (id: string): string[] => {
      const n = mindmap.nodes[id];
      if (!n) return [id];
      return [id, ...n.children.flatMap(collectDescendants)];
    };
    
    const toDelete = new Set(collectDescendants(nodeId));
    const newNodes = { ...mindmap.nodes };
    
    // Remove from parent
    if (node.parentId && newNodes[node.parentId]) {
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        children: newNodes[node.parentId].children.filter((id) => id !== nodeId),
      };
    }
    
    // Delete all descendants
    toDelete.forEach((id) => delete newNodes[id]);
    
    // Also delete any free connections that involve these nodes
    const newConnections = { ...mindmap.connections };
    Object.keys(newConnections).forEach(connId => {
      const conn = newConnections[connId];
      if (toDelete.has(conn.sourceId) || toDelete.has(conn.targetId)) {
        delete newConnections[connId];
      }
    });
    
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: newNodes,
          connections: newConnections,
          updatedAt: new Date(),
        },
        selectionState: {
          ...state.selectionState,
          selectedNodeIds: state.selectionState.selectedNodeIds.filter((id) => !toDelete.has(id)),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
    
    logActivity('delete_node', { nodeId, text: node.text, descendantsCount: toDelete.size });
    setTimeout(() => get().applyLayout(), 0);
  },
  
  toggleCollapse: (nodeId) => {
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: {
            ...state.mindmap.nodes,
            [nodeId]: {
              ...state.mindmap.nodes[nodeId],
              collapsed: !state.mindmap.nodes[nodeId].collapsed,
            },
          },
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
    
    setTimeout(() => get().applyLayout(), 0);
  },
  
  selectNode: (nodeId, addToSelection = false) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        selectedElementIds: addToSelection ? state.selectionState.selectedElementIds : [],
        selectedConnectionIds: addToSelection ? state.selectionState.selectedConnectionIds : [],
        selectedNodeIds: addToSelection 
          ? [...state.selectionState.selectedNodeIds, nodeId]
          : [nodeId],
      },
    }));
  },
  
  selectElement: (elementId, addToSelection = false) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        selectedNodeIds: addToSelection ? state.selectionState.selectedNodeIds : [],
        selectedConnectionIds: addToSelection ? state.selectionState.selectedConnectionIds : [],
        selectedElementIds: addToSelection 
          ? [...state.selectionState.selectedElementIds, elementId]
          : [elementId],
      },
    }));
  },

  selectConnection: (connectionId, addToSelection = false) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        selectedNodeIds: addToSelection ? state.selectionState.selectedNodeIds : [],
        selectedElementIds: addToSelection ? state.selectionState.selectedElementIds : [],
        selectedConnectionIds: addToSelection 
          ? [...state.selectionState.selectedConnectionIds, connectionId]
          : [connectionId],
      },
    }));
  },
  
  clearSelection: () => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        selectedNodeIds: [],
        selectedElementIds: [],
        selectedConnectionIds: [],
      },
    }));
  },
  
  setHoveredNode: (nodeId) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        hoveredNodeId: nodeId,
      },
    }));
  },

  setHoveredElement: (elementId) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        hoveredElementId: elementId,
      },
    }));
  },

  setHoveredConnection: (connectionId) => {
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        hoveredConnectionId: connectionId,
      },
    }));
  },
  
  setEditingNode: (nodeId) => {
    set({ editingNodeId: nodeId, editingElementId: null });
  },
  
  setEditingElement: (elementId) => {
    set({ editingElementId: elementId, editingNodeId: null });
  },
  
  startDrag: (id, position, type, handle) => {
    let startPos: Position | null = null;
    let offset = { x: 0, y: 0 };

    if (type === 'node') {
      const node = get().mindmap.nodes[id];
      if (node) {
        startPos = node.position;
        offset = { x: position.x - node.position.x, y: position.y - node.position.y };
      }
    } else if (type === 'element' || type === 'resize' || type === 'connection') {
      const element = get().mindmap.elements[id] || get().mindmap.nodes[id];
      if (element) {
        startPos = element.position;
        offset = { x: position.x - element.position.x, y: position.y - element.position.y };
      }
    }

    set({
      dragState: {
        isDragging: true,
        type,
        id,
        handle,
        startPosition: startPos,
        offset,
        connectionTarget: type === 'connection' ? position : undefined,
      },
    });
  },
  
  updateDrag: (position, options) => {
    const { dragState } = get();
    if (!dragState.isDragging || !dragState.id) return;
    
    if (dragState.type === 'node') {
      const newPosition = {
        x: position.x - dragState.offset.x,
        y: position.y - dragState.offset.y,
      };
      get().updateNodePosition(dragState.id, newPosition);
    } else if (dragState.type === 'element') {
      const newPosition = {
        x: position.x - dragState.offset.x,
        y: position.y - dragState.offset.y,
      };
      get().updateElement(dragState.id, { position: newPosition });
    } else if (dragState.type === 'connection') {
      set((state) => ({
        dragState: {
          ...state.dragState,
          connectionTarget: position,
        },
      }));
    } else if (dragState.type === 'resize') {
      const element = get().mindmap.elements[dragState.id];
      if (!element || !dragState.handle) return;

      const { handle } = dragState;
      const x = element.position.x;
      const y = element.position.y;
      const w = element.width || 0;
      const h = element.height || 0;

      let newX = x;
      let newY = y;
      let newW = w;
      let newH = h;

      if (handle.includes('e')) {
        newW = Math.max(10, position.x - x);
      }
      if (handle.includes('w')) {
        const dx = position.x - x;
        newX = x + dx;
        newW = Math.max(10, w - dx);
        if (newW === 10) newX = x + w - 10;
      }
      if (handle.includes('s')) {
        newH = Math.max(10, position.y - y);
      }
      if (handle.includes('n')) {
        const dy = position.y - y;
        newY = y + dy;
        newH = Math.max(10, h - dy);
        if (newH === 10) newY = y + h - 10;
      }

      // Handle shift key for proportional scaling
      if (options?.shiftKey && (element.type === 'image' || element.type === 'video' || element.type === 'rect' || element.type === 'circle')) {
        const aspectRatio = (element.type === 'circle') ? 1 : w / h;
        if (handle.length === 1) {
          // Single handle (n, s, e, w) - not typical for proportional but let's handle
          if (handle === 'n' || handle === 's') {
            newW = newH * aspectRatio;
          } else {
            newH = newW / aspectRatio;
          }
        } else {
          // Corner handle (nw, ne, sw, se)
          const currentRatio = Math.abs(newW / newH);
          if (currentRatio > aspectRatio) {
            newW = Math.abs(newH) * aspectRatio * (newW < 0 ? -1 : 1);
          } else {
            newH = Math.abs(newW) / aspectRatio * (newH < 0 ? -1 : 1);
          }
        }

        // Adjust position for w/n handles after ratio calculation
        if (handle.includes('w')) {
          newX = x + (w - newW);
        }
        if (handle.includes('n')) {
          newY = y + (h - newH);
        }
      }

      get().updateElement(dragState.id, {
        position: { x: newX, y: newY },
        width: newW,
        height: newH,
      });
    }
  },
  
  endDrag: () => {
    set({
      dragState: {
        isDragging: false,
        type: null,
        id: null,
        handle: undefined,
        startPosition: null,
        offset: { x: 0, y: 0 },
      },
    });
  },
  
  startPan: (position) => {
    set({
      canvasState: {
        isPanning: true,
        panStart: position,
      },
    });
  },
  
  updatePan: (position) => {
    const { canvasState, mindmap } = get();
    if (!canvasState.isPanning || !canvasState.panStart) return;
    
    const dx = position.x - canvasState.panStart.x;
    const dy = position.y - canvasState.panStart.y;
    
    set({
      mindmap: {
        ...mindmap,
        viewport: {
          ...mindmap.viewport,
          x: mindmap.viewport.x + dx,
          y: mindmap.viewport.y + dy,
        },
      },
      canvasState: {
        ...canvasState,
        panStart: position,
      },
    });
  },
  
  endPan: () => {
    set({
      canvasState: {
        isPanning: false,
        panStart: null,
      },
    });
  },
  
  setViewport: (viewport) => {
    set((state) => ({
      mindmap: {
        ...state.mindmap,
        viewport: { ...state.mindmap.viewport, ...viewport },
      },
    }));
  },
  
  zoomIn: () => {
    set((state) => ({
      mindmap: {
        ...state.mindmap,
        viewport: {
          ...state.mindmap.viewport,
          zoom: Math.min(2, state.mindmap.viewport.zoom + 0.1),
        },
      },
    }));
  },
  
  zoomOut: () => {
    set((state) => ({
      mindmap: {
        ...state.mindmap,
        viewport: {
          ...state.mindmap.viewport,
          zoom: Math.max(0.25, state.mindmap.viewport.zoom - 0.1),
        },
      },
    }));
  },
  
  resetView: () => {
    set((state) => ({
      mindmap: {
        ...state.mindmap,
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    }));
  },

  focusNode: (nodeId, canvasWidth, canvasHeight) => {
    const { mindmap } = get();
    const node = mindmap.nodes[nodeId];
    if (!node) return;

    // Use a target zoom that is at least the current zoom if it's already reasonably high,
    // otherwise zoom in to a comfortable reading level (1.1)
    const currentZoom = mindmap.viewport.zoom;
    const targetZoom = Math.max(currentZoom, 1.1);
    
    const targetVx = canvasWidth / 2 - node.position.x * targetZoom;
    const targetVy = canvasHeight / 2 - node.position.y * targetZoom;

    // Simple animation loop
    const startVx = mindmap.viewport.x;
    const startVy = mindmap.viewport.y;
    const startZoom = currentZoom;
    
    // Adjust duration based on the "distance" of the zoom jump
    const zoomDelta = Math.abs(targetZoom - startZoom);
    const duration = zoomDelta > 0.5 ? 600 : 400; 
    
    const startTime = performance.now();

    // Cancel any existing focus animation if possible (using a simple flag on state)
    // For now, we just ensure the animation is smooth.
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuart for smoother finish
      const ease = 1 - Math.pow(1 - progress, 4);

      const currentVx = startVx + (targetVx - startVx) * ease;
      const currentVy = startVy + (targetVy - startVy) * ease;
      const zoom = startZoom + (targetZoom - startZoom) * ease;

      set((state) => ({
        mindmap: {
          ...state.mindmap,
          viewport: {
            x: currentVx,
            y: currentVy,
            zoom,
          },
        },
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  organizeMindmap: (canvasWidth, canvasHeight) => {
    // 1. Apply Layout
    get().applyLayout();

    // 2. Calculate bounding box of all content
    const { mindmap, canvasSize } = get();
    const { nodes, elements } = mindmap;
    const nodeValues = Object.values(nodes);
    const elementValues = Object.values(elements);
    
    if (nodeValues.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Nodes bounding box
    nodeValues.forEach(node => {
      const halfW = node.width / 2;
      const halfH = node.height / 2;
      minX = Math.min(minX, node.position.x - halfW);
      maxX = Math.max(maxX, node.position.x + halfW);
      minY = Math.min(minY, node.position.y - halfH);
      maxY = Math.max(maxY, node.position.y + halfH);
    });

    // Elements bounding box
    elementValues.forEach(el => {
      const x = el.position.x;
      const y = el.position.y;
      const w = el.width || 0;
      const h = el.height || 0;
      const elMinX = w < 0 ? x + w : x;
      const elMaxX = w < 0 ? x : x + w;
      const elMinY = h < 0 ? y + h : y;
      const elMaxY = h < 0 ? y : y + h;
      minX = Math.min(minX, elMinX);
      maxX = Math.max(maxX, elMaxX);
      minY = Math.min(minY, elMinY);
      maxY = Math.max(maxY, elMaxY);
    });

    const contentWidth = Math.max(maxX - minX, 100);
    const contentHeight = Math.max(maxY - minY, 100);
    const contentCenterX = minX + (maxX - minX) / 2;
    const contentCenterY = minY + (maxY - minY) / 2;

    // 3. Determine target viewport dimensions
    // Handle cases where canvasWidth/Height might be event objects from onClick
    const width = typeof canvasWidth === 'number' ? canvasWidth : (canvasSize.width || window.innerWidth);
    const height = typeof canvasHeight === 'number' ? canvasHeight : (canvasSize.height || window.innerHeight);
    const padding = 60;

    // 4. Calculate adaptive zoom
    const zoomX = (width - padding * 2) / contentWidth;
    const zoomY = (height - padding * 2) / contentHeight;
    const targetZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.1), 1.5);

    // 5. Calculate target viewport offset to center content
    const targetVx = width / 2 - contentCenterX * targetZoom;
    const targetVy = height / 2 - contentCenterY * targetZoom;

    // 6. Clear selection and hover states for a clean look
    set((state) => ({
      selectionState: {
        ...state.selectionState,
        selectedNodeIds: [],
        selectedElementIds: [],
        selectedConnectionIds: [],
        hoveredNodeId: null,
        hoveredElementId: null,
        hoveredConnectionId: null,
      }
    }));

    // 7. Animate transition
    const startVx = mindmap.viewport.x;
    const startVy = mindmap.viewport.y;
    const startZoom = mindmap.viewport.zoom;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      set((state) => ({
        mindmap: {
          ...state.mindmap,
          viewport: {
            x: startVx + (targetVx - startVx) * ease,
            y: startVy + (targetVy - startVy) * ease,
            zoom: startZoom + (targetZoom - startZoom) * ease,
          },
        },
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },
  
  setLayoutConfig: (config) => {
    set((state) => ({
      layoutConfig: { ...state.layoutConfig, ...config },
    }));
  },
  
  applyLayout: () => {
    const { mindmap, layoutConfig } = get();
    const { nodes, rootId } = mindmap;
    const root = nodes[rootId];
    
    if (!root) return;
    
    const newPositions: Record<string, Position> = {};
    const updatedNodes = { ...nodes };

    // Tree layout algorithm
    const layoutSubtree = (nodeId: string, x: number, y: number, side: 'left' | 'right'): number => {
      const node = updatedNodes[nodeId];
      if (!node) return y;
      
      newPositions[nodeId] = { x, y };
      
      if (node.collapsed || node.children.length === 0) {
        return y + node.height + layoutConfig.verticalSpacing;
      }
      
      let currentY = y;
      
      for (const childId of node.children) {
        const childNode = updatedNodes[childId];
        if (!childNode) continue;

        let childX: number;
        if (side === 'left') {
          childX = x - ((node.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing;
        } else {
          childX = x + ((node.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        }

        currentY = layoutSubtree(childId, childX, currentY, side);
      }
      
      // Center parent vertically among children
      if (node.children.length > 0) {
        const firstChildId = node.children[0];
        const lastChildId = node.children[node.children.length - 1];
        const firstChildY = newPositions[firstChildId]?.y ?? y;
        const lastChildY = newPositions[lastChildId]?.y ?? y;
        const lastChildHeight = updatedNodes[lastChildId]?.height ?? 0;
        
        // Calculate the vertical center of the children's total height
        const childrenCenterY = (firstChildY + (lastChildY + lastChildHeight)) / 2;
        newPositions[nodeId] = { x, y: childrenCenterY - node.height / 2 };
      }
      
      return currentY;
    };

    // Initialize root position
    const centerX = 800; // Can be dynamic
    const centerY = 400;
    newPositions[rootId] = { x: centerX, y: centerY - root.height / 2 };

    if (layoutConfig.direction === 'both') {
      const leftChildren = root.children.filter(id => nodes[id]?.side === 'left');
      const rightChildren = root.children.filter(id => nodes[id]?.side === 'right');

      // Calculate total height for both sides to center them better
      const calculateTotalHeight = (childIds: string[]) => {
        return childIds.reduce((acc, id) => {
          const node = updatedNodes[id];
          return acc + (node?.height || 40) + layoutConfig.verticalSpacing;
        }, 0) - layoutConfig.verticalSpacing;
      };

      const leftTotalHeight = calculateTotalHeight(leftChildren);
      const rightTotalHeight = calculateTotalHeight(rightChildren);

      let leftY = centerY - leftTotalHeight / 2;
      let rightY = centerY - rightTotalHeight / 2;

      leftChildren.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        const childX = centerX - ((root.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing;
        leftY = layoutSubtree(id, childX, leftY, 'left');
      });

      rightChildren.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        const childX = centerX + ((root.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        rightY = layoutSubtree(id, childX, rightY, 'right');
      });
    } else {
      const side = layoutConfig.direction === 'left' ? 'left' : 'right';
      const totalHeight = root.children.reduce((acc, id) => {
        const node = updatedNodes[id];
        return acc + (node?.height || 40) + layoutConfig.verticalSpacing;
      }, 0) - layoutConfig.verticalSpacing;
      
      let currentY = centerY - totalHeight / 2;
      root.children.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        
        let childX: number;
        if (side === 'left') {
          childX = centerX - ((root.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing;
        } else {
          childX = centerX + ((root.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        }
        
        currentY = layoutSubtree(id, childX, currentY, side);
      });
    }

    // Center root vertically among all its children
    if (root.children.length > 0) {
      const childrenWithPos = root.children
        .map(id => ({ id, pos: newPositions[id], height: updatedNodes[id]?.height || 0 }))
        .filter(item => item.pos);
        
      if (childrenWithPos.length > 0) {
        const minY = Math.min(...childrenWithPos.map(item => item.pos!.y));
        const maxYWithHeight = Math.max(...childrenWithPos.map(item => item.pos!.y + item.height));
        newPositions[rootId] = { x: centerX, y: (minY + maxYWithHeight) / 2 - root.height / 2 };
      }
    }
    
    // Update all node positions in the store
    for (const [id, position] of Object.entries(newPositions)) {
      if (updatedNodes[id]) {
        updatedNodes[id] = { ...updatedNodes[id], position };
      }
    }
    
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: updatedNodes,
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },

  applyColorPalette: (palette) => {
    const { mindmap } = get();
    const updatedNodes = { ...mindmap.nodes };

    Object.values(updatedNodes).forEach((node) => {
      let backgroundColor = '';
      if (node.parentId === null) {
        backgroundColor = palette.root;
      } else {
        // level 1 use levels[0], level 2 use levels[1], etc.
        const levelIdx = Math.min(node.level - 1, palette.levels.length - 1);
        backgroundColor = palette.levels[levelIdx];
      }

      updatedNodes[node.id] = {
        ...node,
        style: {
          ...node.style,
          backgroundColor,
        },
      };
    });

    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: updatedNodes,
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },

  addElement: (element) => {
    const id = generateId();
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          elements: {
            ...state.mindmap.elements,
            [id]: { ...element, id } as CanvasElement,
          },
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
    return id;
  },

  updateElement: (id, element) => {
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          elements: {
            ...state.mindmap.elements,
            [id]: { ...state.mindmap.elements[id], ...element },
          },
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },

  deleteElement: (id) => {
    set((state) => {
      const { [id]: _, ...rest } = state.mindmap.elements;
      const newState = {
        mindmap: {
          ...state.mindmap,
          elements: rest,
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },

  addConnection: (connection) => {
    const id = generateId();
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          connections: {
            ...state.mindmap.connections,
            [id]: { ...connection, id },
          },
          updatedAt: new Date(),
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
    return id;
  },

  deleteConnection: (id) => {
    set((state) => {
      // Handle default connection deletion (parent-child relationship)
      if (id.startsWith('node-conn-')) {
        const childId = id.replace('node-conn-', '');
        const childNode = state.mindmap.nodes[childId];
        
        if (childNode && childNode.parentId) {
          const parentId = childNode.parentId;
          const parentNode = state.mindmap.nodes[parentId];
          
          if (parentNode) {
            const newNodes = {
              ...state.mindmap.nodes,
              [parentId]: {
                ...parentNode,
                children: parentNode.children.filter(cid => cid !== childId),
              },
              [childId]: {
                ...childNode,
                parentId: null, // Now an orphan/top-level node
              }
            };

            const newMindmap = {
              ...state.mindmap,
              nodes: newNodes,
              updatedAt: new Date(),
            };
            
            persistMindmap(newMindmap);
            return {
              mindmap: newMindmap,
              savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps),
              selectionState: {
                ...state.selectionState,
                selectedConnectionIds: state.selectionState.selectedConnectionIds.filter((connId) => connId !== id),
                hoveredConnectionId: state.selectionState.hoveredConnectionId === id ? null : state.selectionState.hoveredConnectionId,
              },
            };
          }
        }
      }

      // Handle free connection deletion
      const { [id]: _, ...rest } = state.mindmap.connections;
      const newState = {
        mindmap: {
          ...state.mindmap,
          connections: rest,
          updatedAt: new Date(),
        },
        selectionState: {
          ...state.selectionState,
          selectedConnectionIds: state.selectionState.selectedConnectionIds.filter((connId) => connId !== id),
          hoveredConnectionId: state.selectionState.hoveredConnectionId === id ? null : state.selectionState.hoveredConnectionId,
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
    
    // Re-layout after removing parent-child relationship
    if (id.startsWith('node-conn-')) {
      setTimeout(() => get().applyLayout(), 0);
    }
  },

  updateNodePosition: (nodeId: string, position: Position) => {
    set((state) => {
      const newState = {
        mindmap: {
          ...state.mindmap,
          nodes: {
            ...state.mindmap.nodes,
            [nodeId]: {
              ...state.mindmap.nodes[nodeId],
              position,
            },
          },
        },
      };
      persistMindmap(newState.mindmap);
      return newState;
    });
  },

  generateSubNodes: async (nodeId, customPrompt) => {
    const { mindmap, aiConfig, addNode, applyLayout } = get();
    
    // Check if user is logged in and subscription status
    const authStore = (await import('./authStore')).useAuthStore.getState();
    const { user, subscription } = authStore;
    
    if (!user) {
      toast.error('请先登录以使用 AI 功能');
      authStore.setAuthModalOpen(true);
      return;
    }

    // Check AI usage limit
    if (subscription) {
      if (subscription.ai_usage_count >= subscription.ai_limit) {
        toast.error(`已达到 AI 使用次数限制 (${subscription.ai_usage_count}/${subscription.ai_limit})。请升级订阅以继续使用。`);
        return;
      }
    }

    const node = mindmap.nodes[nodeId];
    if (!node) return;

    if (!aiConfig.apiKey) {
      toast.error('请先在右下角设置中配置 DeepSeek API Key');
      return;
    }

    set({ isAIProcessing: true, aiProgressMessage: '正在思索中...', aiProcessingNodeId: nodeId });
    logActivity('ai_generate_start', { nodeId, nodeText: node.text });

    try {
      const response = await fetch(`${aiConfig.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的思维导图助手。请根据用户的内容或指令，生成深度、详尽且逻辑严密的思维导图结构。
要求：
1. **深度优先**：不要只停留在表面，尽可能向下挖掘细节。理想情况下，对于复杂主题，应生成 4-6 层的深度，确保逻辑链条完整。
2. **结构化输出**：严格使用 Markdown 列表格式（使用 - 或 *），通过缩进表示层级。
3. **内容详实**：每个分支应包含多个子项，确保思维导图内容丰富、专业且具有启发性。
4. **简洁明了**：节点文字应精炼，通常控制在 10 个字以内，避免长句。
5. **纯净输出**：直接返回 Markdown 列表内容，不要有任何开场白、解释或 Markdown 代码块包装符（如 \`\`\`markdown）。

示例：
- 核心概念
  - 核心维度 A
    - 关键要素 A1
      - 具体细节 A1a
        - 执行要点 A1a-1
  - 核心维度 B
    - ...`,
            },
            {
              role: 'user',
              content: customPrompt 
                ? `针对主题 "${node.text}"，执行以下指令并生成深度思维导图：${customPrompt}`
                : `请为主题 "${node.text}" 创作一个详尽、多层级的思维导图结构。`,
            },
          ],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0].message.content) {
        set({ aiProgressMessage: '正在构建节点结构...' });
        const content = data.choices[0].message.content;
        
        // Parse Markdown list to tree structure
        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        
        interface TempNode {
          text: string;
          indent: number;
          children: TempNode[];
          parentId?: string;
        }

        const rootNodes: TempNode[] = [];
        const stack: TempNode[] = [];

        lines.forEach((line: string) => {
          const indentMatch = line.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[0].length : 0;
          const text = line.replace(/^\s*[-*+]\s*/, '').trim();
          
          if (!text) return;

          const newNode: TempNode = { text, indent, children: [] };

          while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
          }

          if (stack.length === 0) {
            rootNodes.push(newNode);
          } else {
            stack[stack.length - 1].children.push(newNode);
          }
          stack.push(newNode);
        });

        // Recursive function to add nodes
        const addNodesRecursive = (parentId: string, tempNodes: TempNode[]) => {
          tempNodes.forEach(tempNode => {
            const newNodeId = addNode(parentId, tempNode.text);
            if (tempNode.children.length > 0) {
              addNodesRecursive(newNodeId, tempNode.children);
            }
          });
        };

        if (nodeId === mindmap.rootId && rootNodes.length > 0) {
          // Clear existing children if AI is used on the root node
          const currentChildren = [...mindmap.nodes[nodeId].children];
          currentChildren.forEach(childId => get().deleteNode(childId));

          if (rootNodes.length === 1) {
            // If there's only one root-level node in AI response, use it as the new root text
            // and add its children as direct sub-nodes
            get().updateNodeText(nodeId, rootNodes[0].text);
            addNodesRecursive(nodeId, rootNodes[0].children);
          } else {
            // If there are multiple root-level nodes, add them all as children
            addNodesRecursive(nodeId, rootNodes);
          }
        } else {
          addNodesRecursive(nodeId, rootNodes);
        }

        // Auto layout after adding nodes
        setTimeout(() => {
          applyLayout();
          set({ isAIProcessing: false, aiProgressMessage: '', aiProcessingNodeId: null });
          logActivity('ai_generate_success', { nodeId, nodeText: node.text });
          
          // Update AI usage count in background
          if (user) {
            authStore.updateAIUsage(user.id);
          }
        }, 100);
      } else {
        set({ isAIProcessing: false, aiProgressMessage: '', aiProcessingNodeId: null });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      set({ isAIProcessing: false, aiProgressMessage: '', aiProcessingNodeId: null });
      toast.error('AI 生成失败，请检查 API 配置或网络。');
    }
  },
};
});
