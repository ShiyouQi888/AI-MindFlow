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
  AIChatState,
  AIChatMessage,
  ColorPalette,
} from '@/types/mindmap';

const generateId = () => Math.random().toString(36).substring(2, 11);

const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || '',
  model: import.meta.env.VITE_DEEPSEEK_MODEL || '',
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
  isFetching: boolean;
  
  // History
  history: {
    past: MindMap[];
    future: MindMap[];
  };
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

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
  zoomIn: (px?: number, py?: number) => void;
  zoomOut: (px?: number, py?: number) => void;
  zoomAt: (delta: number, px: number, py: number) => void;
  resetView: () => void;
  focusNode: (nodeId: string, canvasWidth: number, canvasHeight: number) => void;
  organizeMindmap: (canvasWidth?: number, canvasHeight?: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  resetAll: () => void;
  canvasSize: { width: number; height: number };
  
  // Layout
  setLayoutConfig: (config: Partial<LayoutConfig>) => void;
  applyLayout: (forceAll?: boolean) => void;
  
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
  generateSubNodes: (nodeId: string, prompt?: string, options?: { replace?: boolean }) => Promise<void>;
  isAIProcessing: boolean;
  aiProgressMessage: string;
  aiProcessingNodeId: string | null;

  // AI Chat
  aiChatState: AIChatState;
  setAIChatOpen: (isOpen: boolean) => void;
  setAIChatWidth: (width: number) => void;
  addChatMessage: (message: Omit<AIChatMessage, 'id' | 'timestamp'> & { id?: string }) => void;
  clearChatHistory: () => void;
  updateChatMessage: (id: string, content: string) => void;
  applyAIChatContent: (nodeId: string, content: string, messageId?: string) => void;
  setAIProcessing: (isProcessing: boolean) => void;
}

const createEmptyMindmap = (): MindMap => {
  const rootId = generateId();
  return {
    id: generateId(),
    name: '未命名思维导图',
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        text: '中心主题',
        position: { x: 400, y: 300 },
        collapsed: false,
        children: [],
        level: 0,
        width: 120,
        height: 36,
      },
    },
    elements: {},
    connections: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    layoutConfig: { ...DEFAULT_LAYOUT_CONFIG, direction: 'right' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const createInitialMindmap = (): MindMap => {
  const rootId = generateId();
  const nodeOpsId = generateId();
  const canvasOpsId = generateId();
  const toolOpsId = generateId();
  
  // Node Operation sub-nodes
  const tabId = generateId();
  const enterId = generateId();
  const f2Id = generateId();
  const delId = generateId();
  const spaceId = generateId();
  
  // Canvas Operation sub-nodes
  const escId = generateId();
  const dblClickId = generateId();
  const zoomId = generateId();
  const panId = generateId();
  const f11Id = generateId();

  // Tool Operation sub-nodes
  const vId = generateId();
  const tId = generateId();
  const iId = generateId();
  const cId = generateId();
  const pId = generateId();

  const calculateNodeWidth = (text: string, level: number) => {
    const baseWidth = level === 0 ? 40 : 32;
    const charWidth = level === 0 ? 16 : 14;
    return Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);
  };

  return {
    id: generateId(),
    name: '使用帮助',
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        text: '使用帮助',
        position: { x: 400, y: 300 },
        collapsed: false,
        children: [nodeOpsId, canvasOpsId, toolOpsId],
        level: 0,
        width: calculateNodeWidth('使用帮助', 0),
        height: 36,
      },
      // Node Operations Group
      [nodeOpsId]: {
        id: nodeOpsId,
        parentId: rootId,
        text: '节点操作',
        position: { x: 600, y: 150 },
        collapsed: false,
        children: [tabId, enterId, f2Id, delId, spaceId],
        level: 1,
        width: calculateNodeWidth('节点操作', 1),
        height: 36,
        side: 'right',
      },
      [tabId]: {
        id: tabId,
        parentId: nodeOpsId,
        text: 'Tab: 添加子节点',
        position: { x: 800, y: 50 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('Tab: 添加子节点', 2),
        height: 36,
        side: 'right',
      },
      [enterId]: {
        id: enterId,
        parentId: nodeOpsId,
        text: 'Enter: 添加兄弟节点',
        position: { x: 800, y: 100 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('Enter: 添加兄弟节点', 2),
        height: 36,
        side: 'right',
      },
      [f2Id]: {
        id: f2Id,
        parentId: nodeOpsId,
        text: 'F2 / 双击: 编辑节点',
        position: { x: 800, y: 150 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('F2 / 双击: 编辑节点', 2),
        height: 36,
        side: 'right',
      },
      [delId]: {
        id: delId,
        parentId: nodeOpsId,
        text: 'Del / Backspace: 删除',
        position: { x: 800, y: 200 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('Del / Backspace: 删除', 2),
        height: 36,
        side: 'right',
      },
      [spaceId]: {
        id: spaceId,
        parentId: nodeOpsId,
        text: 'Space: 折叠/展开',
        position: { x: 800, y: 250 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('Space: 折叠/展开', 2),
        height: 36,
        side: 'right',
      },
      // Canvas Operations Group
      [canvasOpsId]: {
        id: canvasOpsId,
        parentId: rootId,
        text: '画布操作',
        position: { x: 200, y: 200 },
        collapsed: false,
        children: [escId, dblClickId, zoomId, panId, f11Id],
        level: 1,
        width: calculateNodeWidth('画布操作', 1),
        height: 36,
        side: 'left',
      },
      [escId]: {
        id: escId,
        parentId: canvasOpsId,
        text: 'Esc: 取消选择/退出',
        position: { x: 0, y: 100 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('Esc: 取消选择/退出', 2),
        height: 36,
        side: 'left',
      },
      [dblClickId]: {
        id: dblClickId,
        parentId: canvasOpsId,
        text: '双击空白: 自动整理',
        position: { x: 0, y: 150 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('双击空白: 自动整理', 2),
        height: 36,
        side: 'left',
      },
      [zoomId]: {
        id: zoomId,
        parentId: canvasOpsId,
        text: '滚轮: 缩放视图',
        position: { x: 0, y: 200 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('滚轮: 缩放视图', 2),
        height: 36,
        side: 'left',
      },
      [panId]: {
        id: panId,
        parentId: canvasOpsId,
        text: '右键/空格拖拽: 平移',
        position: { x: 0, y: 250 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('右键/空格拖拽: 平移', 2),
        height: 36,
        side: 'left',
      },
      [f11Id]: {
        id: f11Id,
        parentId: canvasOpsId,
        text: 'F8: 预览模式',
        position: { x: 0, y: 300 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('F8: 预览模式', 2),
        height: 36,
        side: 'left',
      },
      // Tool Shortcuts Group
      [toolOpsId]: {
        id: toolOpsId,
        parentId: rootId,
        text: '工具快捷键',
        position: { x: 200, y: 450 },
        collapsed: false,
        children: [vId, tId, iId, cId, pId],
        level: 1,
        width: calculateNodeWidth('工具快捷键', 1),
        height: 36,
        side: 'left',
      },
      [vId]: {
        id: vId,
        parentId: toolOpsId,
        text: 'V: 选择工具',
        position: { x: 0, y: 400 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('V: 选择工具', 2),
        height: 36,
        side: 'left',
      },
      [tId]: {
        id: tId,
        parentId: toolOpsId,
        text: 'T: 插入文字',
        position: { x: 0, y: 450 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('T: 插入文字', 2),
        height: 36,
        side: 'left',
      },
      [iId]: {
        id: iId,
        parentId: toolOpsId,
        text: 'I: 插入图片',
        position: { x: 0, y: 500 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('I: 插入图片', 2),
        height: 36,
        side: 'left',
      },
      [cId]: {
        id: cId,
        parentId: toolOpsId,
        text: 'C: 曲线连接',
        position: { x: 0, y: 550 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('C: 曲线连接', 2),
        height: 36,
        side: 'left',
      },
      [pId]: {
        id: pId,
        parentId: toolOpsId,
        text: 'P: 折线连接',
        position: { x: 0, y: 600 },
        collapsed: false,
        children: [],
        level: 2,
        width: calculateNodeWidth('P: 折线连接', 2),
        height: 36,
        side: 'left',
      },
    },
    elements: {},
    connections: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    layoutConfig: { ...DEFAULT_LAYOUT_CONFIG, direction: 'both' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

import { toast } from "sonner";

export const useMindmapStore = create<MindmapStore>((set, get) => {
  let syncTimeout: any = null;

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

  const persistMindmap = (mindmap: MindMap) => {
    // 1. 立即同步到本地，确保本地数据始终是最新的
    localStorage.setItem('aimindflow_current_mindmap', JSON.stringify(mindmap));
    
    // 2. 防抖同步到 Supabase，减少高频操作（如 AI 生成、拖拽）时的网络请求压力
    if (syncTimeout) clearTimeout(syncTimeout);
    
    syncTimeout = setTimeout(async () => {
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
          
          if (error) {
            // 忽略常见的 AbortError 或取消请求
            if (error.message?.includes('aborted') || error.code === 'ABORTED') {
              return;
            }
            console.error('Failed to sync to Supabase:', error);
          }
        } catch (e: any) {
          // 忽略 fetch 取消导致的错误
          if (e.name === 'AbortError' || e.message?.includes('aborted')) {
            return;
          }
          console.error('Supabase sync error:', e);
        }
      }
    }, 2000); // 设置 2 秒防抖，平衡实时性与性能
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
    layoutConfig: currentMindmap.layoutConfig || {
      ...DEFAULT_LAYOUT_CONFIG,
      direction: 'right',
    },
    editingNodeId: null,
    editingElementId: null,
    currentTool: 'select',
    isPreviewMode: false,
    isFetching: false,
    isAIProcessing: false,
    aiProgressMessage: '',
    aiProcessingNodeId: null,
    aiChatState: {
      isOpen: false,
      messages: [],
    },
    canvasSize: { width: 800, height: 600 },
    
    // History
    history: {
      past: [],
      future: [],
    },

    saveHistory: () => {
      const { mindmap, history } = get();
      // 限制历史记录数量，避免内存占用过大
      const MAX_HISTORY = 50;
      const newPast = [JSON.parse(JSON.stringify(mindmap)), ...history.past].slice(0, MAX_HISTORY);
      set({
        history: {
          past: newPast,
          future: [], // 发生新操作时清空 future
        }
      });
    },

    undo: () => {
      const { history, mindmap } = get();
      if (history.past.length === 0) return;

      const previous = history.past[0];
      const newPast = history.past.slice(1);
      const newFuture = [JSON.parse(JSON.stringify(mindmap)), ...history.future];

      set({
        mindmap: previous,
        history: {
          past: newPast,
          future: newFuture,
        }
      });
      persistMindmap(previous);
      setTimeout(() => get().applyLayout(), 0);
    },

    redo: () => {
      const { history, mindmap } = get();
      if (history.future.length === 0) return;

      const next = history.future[0];
      const newFuture = history.future.slice(1);
      const newPast = [JSON.parse(JSON.stringify(mindmap)), ...history.past];

      set({
        mindmap: next,
        history: {
          past: newPast,
          future: newFuture,
        }
      });
      persistMindmap(next);
      setTimeout(() => get().applyLayout(), 0);
    },
    
    setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

    setAIChatOpen: (isOpen) => set((state) => ({ 
      aiChatState: { ...state.aiChatState, isOpen } 
    })),

    setAIChatWidth: (width) => set((state) => ({
      aiChatState: { ...state.aiChatState, width }
    })),

    addChatMessage: (message) => set((state) => ({
      aiChatState: {
        ...state.aiChatState,
        messages: [
          ...state.aiChatState.messages,
          {
            id: message.id || generateId(),
            role: message.role,
            content: message.content,
            timestamp: Date.now(),
          }
        ]
      }
    })),

    clearChatHistory: () => set((state) => ({
      aiChatState: { ...state.aiChatState, messages: [] }
    })),

    updateChatMessage: (id, content) => set((state) => ({
      aiChatState: {
        ...state.aiChatState,
        messages: state.aiChatState.messages.map(m => 
          m.id === id ? { ...m, content } : m
        )
      }
    })),

    setAIProcessing: (isProcessing) => set({ isAIProcessing: isProcessing }),

    applyAIChatContent: (nodeId, content, messageId) => {
      get().saveHistory();
      const { addNode, updateNodeText, mindmap, applyLayout } = get();
      const node = mindmap.nodes[nodeId];
      if (!node) return;

      // 如果提供了 messageId，先检查该消息是否已应用
      if (messageId) {
        const message = get().aiChatState.messages.find(m => m.id === messageId);
        if (message?.isApplied) {
          toast.error('该方案已应用，请勿重复操作');
          return;
        }
      }

      const lines = content.split('\n').filter((line) => line.trim().length > 0);
      
      interface TempNode {
        text: string;
        indent: number;
        children: TempNode[];
      }

      const rootNodes: TempNode[] = [];
      const stack: TempNode[] = [];

      lines.forEach((line) => {
        // 识别列表项 (- text) 或 标题 (# text)
        const listMatch = line.match(/^(\s*)([-*+]\s+|\d+\.\s+)(.*)/);
        const headerMatch = line.match(/^(\s*)(#+)\s+(.*)/);
        
        if (!listMatch && !headerMatch) return;

        let text = '';
        let indent = 0;

        if (listMatch) {
          indent = listMatch[1].length;
          text = listMatch[3].trim();
        } else if (headerMatch) {
          // 标题层级转换为缩进，# 为 0, ## 为 2, ### 为 4...
          indent = (headerMatch[2].length - 1) * 2;
          text = headerMatch[3].trim();
        }
        
        // 彻底移除文本中的所有 Markdown 格式符号（加粗、斜体、行内代码、标题号等）
        text = text
          .replace(/\*\*/g, '')
          .replace(/__/g, '')
          .replace(/\*/g, '')
          .replace(/_/g, '')
          .replace(/`/g, '')
          .replace(/#+/g, '')
          .trim();

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

      const addNodesRecursive = (pid: string, tempNodes: TempNode[]) => {
        tempNodes.forEach(tempNode => {
          const newNodeId = addNode(pid, tempNode.text);
          if (tempNode.children.length > 0) {
            addNodesRecursive(newNodeId, tempNode.children);
          }
        });
      };

      if (rootNodes.length > 0) {
        // 启发式算法：如果子节点数量少于等于 6 个，或者包含明显的顺序/流程特征，则使用向右布局；如果包含纵向结构特征，则使用向下布局
        let direction: 'right' | 'both' | 'down' = 'both';
        
        const sequenceKeywords = ['步骤', '阶段', '流程', '第一', '首先', '其次', '最后', '过程', '环节', '准备', '实施', '总结', '方案', '计划'];
        const verticalKeywords = ['架构', '组织', '层级', '结构', '体系', '分解', '组成'];
        
        const hasSequence = rootNodes.some(node => 
          sequenceKeywords.some(kw => node.text.toLowerCase().includes(kw)) || 
          /^[0-9一二三四五六七八九十]+[\.、\s]/.test(node.text)
        );

        const hasVertical = rootNodes.some(node => 
          verticalKeywords.some(kw => node.text.toLowerCase().includes(kw))
        );
        
        if (hasVertical) {
          direction = 'down';
        } else if (rootNodes.length <= 6 || hasSequence) {
          direction = 'right';
        }
        
        set((state) => ({
          layoutConfig: { ...state.layoutConfig, direction }
        }));

        // 如果只有一个根节点，则将其文本应用到当前选中的节点，并添加其子节点
        if (rootNodes.length === 1) {
          updateNodeText(nodeId, rootNodes[0].text);
          
          // 如果当前节点是根节点，同步更新思维导图名称
          if (nodeId === mindmap.rootId) {
            get().updateMindmapName(rootNodes[0].text);
          }
          
          addNodesRecursive(nodeId, rootNodes[0].children);
        } else {
          // 如果有多个根节点，则全部作为子节点添加到当前节点下
          addNodesRecursive(nodeId, rootNodes);
        }
        
        setTimeout(() => applyLayout(), 100);

        // 如果提供了 messageId，标记该消息为已应用
        if (messageId) {
          set((state) => ({
            aiChatState: {
              ...state.aiChatState,
              messages: state.aiChatState.messages.map(m => 
                m.id === messageId ? { ...m, isApplied: true } : m
              )
            }
          }));
        }

        toast.success('已应用 AI 生成的内容');
      }
    },

    resetAll: () => {
      get().saveHistory();
      const emptyMindmap = createEmptyMindmap();
      // 保存清空后的状态到本地存储，防止刷新后恢复帮助文档
      localStorage.setItem('aimindflow_current_mindmap', JSON.stringify(emptyMindmap));
      localStorage.setItem('aimindflow_saved_mindmaps', JSON.stringify([emptyMindmap]));
      set({ 
        mindmap: emptyMindmap, 
        savedMindmaps: [emptyMindmap],
        selectionState: {
          selectedNodeIds: [],
          selectedElementIds: [],
          selectedConnectionIds: [],
          hoveredNodeId: null,
          hoveredElementId: null,
          hoveredConnectionId: null,
        },
        isPreviewMode: false,
        layoutConfig: {
          ...DEFAULT_LAYOUT_CONFIG,
          direction: 'right',
        },
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
      get().saveHistory();
      set((state) => {
        const updatedMindmap = { ...mindmap, updatedAt: new Date() };
        persistMindmap(updatedMindmap);
        return { 
          mindmap: updatedMindmap,
          layoutConfig: updatedMindmap.layoutConfig || { ...DEFAULT_LAYOUT_CONFIG, direction: 'right' },
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
        get().saveHistory();
        const updatedMindmap = { ...mindmap, updatedAt: new Date() };
        set({ 
          mindmap: updatedMindmap,
          layoutConfig: updatedMindmap.layoutConfig || { ...DEFAULT_LAYOUT_CONFIG, direction: 'right' },
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
      if (!user || get().isFetching) return;

      set({ isFetching: true });

      try {
        const { data, error } = await supabase
          .from('mindmaps')
          .select('data, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          // Check if it's an AbortError or a cancelled request
          const isAbortError = 
            error.name === 'AbortError' || 
            error.message?.includes('AbortError') || 
            error.hint?.includes('Request was aborted');
            
          if (!isAbortError) {
            console.error('Failed to fetch mindmaps from Supabase:', error);
          }
          return;
        }

        if (data && data.length > 0) {
          const mindmaps = data.map(item => item.data as MindMap);
          const currentMindmap = get().mindmap;
          
          // If current mindmap is default and cloud has data, load the latest cloud one
          const isDefault = currentMindmap.name === '使用帮助' || 
                           (currentMindmap.name === '未命名思维导图' && Object.keys(currentMindmap.nodes).length <= 1);
          
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
      } finally {
        set({ isFetching: false });
      }
    },
  
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  addNode: (parentId, text = '新节点', explicitSide) => {
    get().saveHistory();
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
          // 'both' direction (default or explicitly set)
          // Distribute evenly, prefer right side first
          const leftCount = parent.children.filter(id => get().mindmap.nodes[id]?.side === 'left').length;
          const rightCount = parent.children.filter(id => get().mindmap.nodes[id]?.side === 'right').length;
          
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
    } else {
      // If explicitSide is provided, automatically switch layout direction if needed
      if (parent.parentId === null) {
        if (explicitSide === 'left' && layoutConfig.direction === 'right') {
          set((state) => ({
            layoutConfig: { ...state.layoutConfig, direction: 'both' }
          }));
        } else if (explicitSide === 'right' && layoutConfig.direction === 'left') {
          set((state) => ({
            layoutConfig: { ...state.layoutConfig, direction: 'both' }
          }));
        }
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
      get().saveHistory();
      const oldText = get().mindmap.nodes[nodeId]?.text;
      set((state) => {
        const node = state.mindmap.nodes[nodeId];
        if (!node) return state;

        const level = node.level;
        const baseWidth = level === 0 ? 40 : 32;
        const charWidth = level === 0 ? 16 : 14;
        const width = Math.max(level === 0 ? 120 : 80, text.length * charWidth + baseWidth);

        const updatedMindmap = {
          ...state.mindmap,
          // 如果更新的是根节点，同步更新项目名称
          name: nodeId === state.mindmap.rootId ? text : state.mindmap.name,
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
        persistMindmap(updatedMindmap);
        return { 
          mindmap: updatedMindmap,
          savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
        };
      });
      logActivity('update_node_text', { nodeId, oldText, newText: text });
      // Re-layout after text change as width changed
      setTimeout(() => get().applyLayout(), 0);
    },
  
  updateMindmapName: (name) => {
    get().saveHistory();
    set((state) => {
      const rootId = state.mindmap.rootId;
      const rootNode = state.mindmap.nodes[rootId];
      
      // 计算新的节点宽度
      const baseWidth = 40; // 根节点 level 为 0
      const charWidth = 16;
      const width = Math.max(120, name.length * charWidth + baseWidth);
      
      const newMindmap = {
        ...state.mindmap,
        name,
        // 同时更新中心主题节点的文本和宽度
        nodes: {
          ...state.mindmap.nodes,
          [rootId]: {
            ...rootNode,
            text: name,
            width,
          }
        },
        updatedAt: new Date(),
      };
      persistMindmap(newMindmap);
      return { 
        mindmap: newMindmap,
        savedMindmaps: updateSavedList(newMindmap, state.savedMindmaps)
      };
    });
    // 更新后重新计算布局
    setTimeout(() => get().applyLayout(), 0);
  },

  createNewMindmap: () => {
    get().saveHistory();
    const newMindmap = createEmptyMindmap();
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
    get().saveHistory();
    set((state) => {
      const updatedMindmap = {
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
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },
  
  deleteNode: (nodeId) => {
    get().saveHistory();
    // Use current nodes from state instead of stale get()
    set((state) => {
      const { mindmap } = state;
      const node = mindmap.nodes[nodeId];
      
      if (!node || node.id === mindmap.rootId) return state;
      
      // Collect all descendant IDs
      const collectDescendants = (id: string, currentNodes: Record<string, MindNode>): string[] => {
        const n = currentNodes[id];
        if (!n) return [id];
        return [id, ...n.children.flatMap(childId => collectDescendants(childId, currentNodes))];
      };
      
      const toDelete = new Set(collectDescendants(nodeId, mindmap.nodes));
      const newNodes = { ...mindmap.nodes };
      
      // Remove from all potential parents' children arrays
      Object.keys(newNodes).forEach(id => {
        if (newNodes[id].children.includes(nodeId)) {
          newNodes[id] = {
            ...newNodes[id],
            children: newNodes[id].children.filter(childId => childId !== nodeId)
          };
        }
      });
      
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
      
      const updatedMindmap = {
        ...mindmap,
        nodes: newNodes,
        connections: newConnections,
        updatedAt: new Date(),
      };
      
      persistMindmap(updatedMindmap);
      
      logActivity('delete_node', { nodeId, text: node.text, descendantsCount: toDelete.size });

      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps),
        selectionState: {
          ...state.selectionState,
          selectedNodeIds: state.selectionState.selectedNodeIds.filter((id) => !toDelete.has(id)),
        },
      };
    });
    
    // Apply layout after state update
    setTimeout(() => get().applyLayout(), 0);
  },
  
  toggleCollapse: (nodeId) => {
    get().saveHistory();
    set((state) => {
      const updatedMindmap = {
        ...state.mindmap,
        nodes: {
          ...state.mindmap.nodes,
          [nodeId]: {
            ...state.mindmap.nodes[nodeId],
            collapsed: !state.mindmap.nodes[nodeId].collapsed,
          },
        },
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
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
    if (type !== 'resize') {
      get().saveHistory();
    }
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
  
  zoomIn: (px, py) => {
    const { canvasSize } = get();
    const centerX = px !== undefined ? px : (canvasSize.width / 2 || window.innerWidth / 2);
    const centerY = py !== undefined ? py : (canvasSize.height / 2 || window.innerHeight / 2);
    get().zoomAt(100, centerX, centerY);
  },
  
  zoomOut: (px, py) => {
    const { canvasSize } = get();
    const centerX = px !== undefined ? px : (canvasSize.width / 2 || window.innerWidth / 2);
    const centerY = py !== undefined ? py : (canvasSize.height / 2 || window.innerHeight / 2);
    get().zoomAt(-100, centerX, centerY);
  },

  zoomAt: (delta, px, py) => {
    set((state) => {
      const { viewport } = state.mindmap;
      // Use a more sensitive zoom factor for smoother experience
      // Math.pow(1.001, delta) is a standard way to map scroll delta to zoom
      const zoomFactor = Math.pow(1.001, delta);
      const newZoom = Math.min(10, Math.max(0.05, viewport.zoom * zoomFactor));
      
      if (newZoom === viewport.zoom) return state;

      // Calculate new offset to keep the point (px, py) fixed in screen space
      const x = px - ((px - viewport.x) / viewport.zoom) * newZoom;
      const y = py - ((py - viewport.y) / viewport.zoom) * newZoom;

      return {
        mindmap: {
          ...state.mindmap,
          viewport: { x, y, zoom: newZoom },
        },
      };
    });
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

    // Use a target zoom that is at least 1.2 for a clear focus, 
    // but if the user is already zoomed in more, keep their zoom level.
    const currentZoom = mindmap.viewport.zoom;
    const targetZoom = Math.max(currentZoom, 1.2);
    
    const targetVx = canvasWidth / 2 - node.position.x * targetZoom;
    const targetVy = canvasHeight / 2 - node.position.y * targetZoom;

    // Simple animation loop
    const startVx = mindmap.viewport.x;
    const startVy = mindmap.viewport.y;
    const startZoom = currentZoom;
    
    // Adjust duration for a snappier feel
    const duration = 300; 
    
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
    get().saveHistory();
    // 1. Apply Layout (force all nodes to follow the layout algorithm)
    get().applyLayout(true);

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
      if (el.type === 'polyline' || el.type === 'curve') {
        if (el.points && el.points.length > 0) {
          el.points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          });
        }
      } else {
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
      }
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
    get().saveHistory();
    set((state) => {
      const newLayoutConfig = { ...state.layoutConfig, ...config };
      const updatedMindmap = { 
        ...state.mindmap, 
        layoutConfig: newLayoutConfig,
        updatedAt: new Date() 
      };
      persistMindmap(updatedMindmap);
      return {
        layoutConfig: newLayoutConfig,
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },
  
  applyLayout: (forceAll = false) => {
    const { mindmap, layoutConfig } = get();
    const { nodes, rootId } = mindmap;
    const root = nodes[rootId];
    
    if (!root) return;
    
    const newPositions: Record<string, Position> = {};
    const updatedNodes = { ...nodes };

    // Reset isCustomPosition if forced
    if (forceAll) {
      Object.keys(updatedNodes).forEach(id => {
        updatedNodes[id] = { ...updatedNodes[id], isCustomPosition: false };
      });
    }

    // Helper to calculate total height/width of a subtree
    const getSubtreeHeight = (nodeId: string): number => {
      const node = updatedNodes[nodeId];
      if (!node) return 0;
      if (node.collapsed || !node.children || node.children.length === 0) return node.height;
      const validChildren = node.children.filter(id => updatedNodes[id]);
      if (validChildren.length === 0) return node.height;
      
      const spacing = layoutConfig.direction === 'down' ? 80 : layoutConfig.verticalSpacing;
      const childrenTotalHeight = validChildren.reduce((acc, childId) => acc + getSubtreeHeight(childId), 0) + (validChildren.length - 1) * spacing;
      return Math.max(node.height, childrenTotalHeight);
    };

    const getSubtreeWidth = (nodeId: string): number => {
      const node = updatedNodes[nodeId];
      if (!node) return 0;
      if (node.collapsed || !node.children || node.children.length === 0) return node.width || 120;
      const validChildren = node.children.filter(id => updatedNodes[id]);
      if (validChildren.length === 0) return node.width || 120;
      
      const spacing = layoutConfig.direction === 'down' ? 40 : layoutConfig.horizontalSpacing;
      const childrenTotalWidth = validChildren.reduce((acc, childId) => acc + getSubtreeWidth(childId), 0) + (validChildren.length - 1) * spacing;
      return Math.max(node.width || 120, childrenTotalWidth);
    };

    // Tree layout algorithm (Horizontal)
    const layoutSubtreeHorizontal = (nodeId: string, x: number, y: number, side: 'left' | 'right'): number => {
      const node = updatedNodes[nodeId];
      if (!node) return y;
      const subtreeHeight = getSubtreeHeight(nodeId);
      if (node.isCustomPosition) {
        newPositions[nodeId] = node.position;
      } else {
        newPositions[nodeId] = { x, y: y + subtreeHeight / 2 };
      }
      if (node.collapsed || !node.children || node.children.length === 0) return y + subtreeHeight + layoutConfig.verticalSpacing;
      const validChildren = node.children.filter(childId => updatedNodes[childId]);
      if (validChildren.length === 0) return y + subtreeHeight + layoutConfig.verticalSpacing;
      let currentY = y;
      for (const childId of validChildren) {
        const childNode = updatedNodes[childId];
        if (!childNode) continue;
        const childX = side === 'left' 
          ? newPositions[nodeId].x - ((node.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing
          : newPositions[nodeId].x + ((node.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        currentY = layoutSubtreeHorizontal(childId, childX, currentY, side);
      }
      if (validChildren.length > 0 && !node.isCustomPosition) {
        const firstPos = newPositions[validChildren[0]], lastPos = newPositions[validChildren[validChildren.length - 1]];
        if (firstPos && lastPos) newPositions[nodeId] = { x, y: (firstPos.y + lastPos.y) / 2 };
      }
      return y + subtreeHeight + layoutConfig.verticalSpacing;
    };

    // Tree layout algorithm (Vertical - Down)
    const layoutSubtreeVertical = (nodeId: string, x: number, y: number): number => {
      const node = updatedNodes[nodeId];
      if (!node) return x;
      const subtreeWidth = getSubtreeWidth(nodeId);
      const siblingSpacing = 40;
      const parentChildSpacing = 80;

      if (node.isCustomPosition) {
        newPositions[nodeId] = node.position;
      } else {
        newPositions[nodeId] = { x: x + subtreeWidth / 2, y };
      }
      if (node.collapsed || !node.children || node.children.length === 0) return x + subtreeWidth + siblingSpacing;
      const validChildren = node.children.filter(childId => updatedNodes[childId]);
      if (validChildren.length === 0) return x + subtreeWidth + siblingSpacing;
      let currentX = x;
      const childY = newPositions[nodeId].y + (node.height || 36) / 2 + (updatedNodes[validChildren[0]]?.height || 36) / 2 + parentChildSpacing;
      for (const childId of validChildren) {
        currentX = layoutSubtreeVertical(childId, currentX, childY);
      }
      if (validChildren.length > 0 && !node.isCustomPosition) {
        const firstPos = newPositions[validChildren[0]], lastPos = newPositions[validChildren[validChildren.length - 1]];
        if (firstPos && lastPos) newPositions[nodeId] = { x: (firstPos.x + lastPos.x) / 2, y };
      }
      return x + subtreeWidth + siblingSpacing;
    };

    // Initialize root position
    const centerX = 800; // Can be dynamic
    const centerY = 400;
    
    // Always use the existing root position if it's already there
    // This helps preserve the mindmap's overall position on the canvas
    if (root.position && !forceAll) {
      newPositions[rootId] = root.position;
    } else {
      newPositions[rootId] = { x: centerX, y: centerY };
    }

    const rootPos = newPositions[rootId];

    if (layoutConfig.direction === 'both') {
      const leftChildren = root.children.filter(id => nodes[id]?.side === 'left' && nodes[id]);
      const rightChildren = root.children.filter(id => nodes[id]?.side === 'right' && nodes[id]);

      const calculateTotalHeight = (childIds: string[]) => {
        const validChildIds = childIds.filter(id => updatedNodes[id]);
        if (validChildIds.length === 0) return 0;
        return validChildIds.reduce((acc, id) => acc + getSubtreeHeight(id), 0) + (validChildIds.length - 1) * layoutConfig.verticalSpacing;
      };

      const leftTotalHeight = calculateTotalHeight(leftChildren);
      const rightTotalHeight = calculateTotalHeight(rightChildren);

      let leftY = rootPos.y - leftTotalHeight / 2;
      let rightY = rootPos.y - rightTotalHeight / 2;

      leftChildren.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        const childX = rootPos.x - ((root.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing;
        leftY = layoutSubtreeHorizontal(id, childX, leftY, 'left');
      });

      rightChildren.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        const childX = rootPos.x + ((root.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        rightY = layoutSubtreeHorizontal(id, childX, rightY, 'right');
      });
    } else if (layoutConfig.direction === 'down') {
      const validChildren = root.children.filter(id => updatedNodes[id]);
      const siblingSpacing = 40;
      const parentChildSpacing = 80;
      const totalWidth = validChildren.length > 0 
        ? validChildren.reduce((acc, id) => acc + getSubtreeWidth(id), 0) + (validChildren.length - 1) * siblingSpacing
        : 0;
      
      let currentX = rootPos.x - totalWidth / 2;
      const firstChildHeight = validChildren.length > 0 ? (updatedNodes[validChildren[0]]?.height || 36) : 36;
      const childY = rootPos.y + (root.height || 36) / 2 + firstChildHeight / 2 + parentChildSpacing;
      validChildren.forEach(id => {
        currentX = layoutSubtreeVertical(id, currentX, childY);
      });
    } else {
      const side = layoutConfig.direction === 'left' ? 'left' : 'right';
      const validChildren = root.children.filter(id => updatedNodes[id]);
      const totalHeight = validChildren.length > 0 
        ? validChildren.reduce((acc, id) => acc + getSubtreeHeight(id), 0) + (validChildren.length - 1) * layoutConfig.verticalSpacing
        : 0;
      
      let currentY = rootPos.y - totalHeight / 2;
      validChildren.forEach(id => {
        const childNode = updatedNodes[id];
        if (!childNode) return;
        const childX = side === 'left' 
          ? rootPos.x - ((root.width || 120) + (childNode.width || 120)) / 2 - layoutConfig.horizontalSpacing
          : rootPos.x + ((root.width || 120) + (childNode.width || 120)) / 2 + layoutConfig.horizontalSpacing;
        currentY = layoutSubtreeHorizontal(id, childX, currentY, side);
      });
    }

    // Center root among all its valid children (only if not custom position)
    if (root.children.length > 0 && !root.isCustomPosition) {
      const childrenWithPos = root.children
        .filter(id => updatedNodes[id])
        .map(id => ({ id, pos: newPositions[id] }))
        .filter(item => item.pos);
        
      if (childrenWithPos.length > 0) {
        if (layoutConfig.direction === 'down') {
          const minX = Math.min(...childrenWithPos.map(item => item.pos!.x));
          const maxX = Math.max(...childrenWithPos.map(item => item.pos!.x));
          newPositions[rootId] = { x: (minX + maxX) / 2, y: rootPos.y };
        } else {
          const minY = Math.min(...childrenWithPos.map(item => item.pos!.y));
          const maxY = Math.max(...childrenWithPos.map(item => item.pos!.y));
          newPositions[rootId] = { x: rootPos.x, y: (minY + maxY) / 2 };
        }
      }
    }
    
    // Update all node positions in the store
    for (const [id, position] of Object.entries(newPositions)) {
      if (updatedNodes[id]) {
        updatedNodes[id] = { ...updatedNodes[id], position };
      }
    }
    
    set((state) => {
      const updatedMindmap = {
        ...state.mindmap,
        nodes: updatedNodes,
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },

  applyColorPalette: (palette) => {
    get().saveHistory();
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
      const updatedMindmap = {
        ...state.mindmap,
        nodes: updatedNodes,
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },

  addElement: (element) => {
    get().saveHistory();
    const id = generateId();
    set((state) => {
      const updatedMindmap = {
        ...state.mindmap,
        elements: {
          ...state.mindmap.elements,
          [id]: { ...element, id } as CanvasElement,
        },
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
    return id;
  },

  updateElement: (id, element) => {
    // 逻辑同 updateNodePosition，拖拽过程中的更新不保存历史
    set((state) => {
      const updatedElement = { ...state.mindmap.elements[id], ...element };
      const updatedMindmap = {
        ...state.mindmap,
        elements: {
          ...state.mindmap.elements,
          [id]: updatedElement,
        },
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },

  deleteElement: (id) => {
    get().saveHistory();
    set((state) => {
      const { [id]: _, ...rest } = state.mindmap.elements;
      const updatedMindmap = {
        ...state.mindmap,
        elements: rest,
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },

  addConnection: (connection) => {
    get().saveHistory();
    const id = generateId();
    set((state) => {
      const updatedMindmap = {
        ...state.mindmap,
        connections: {
          ...state.mindmap.connections,
          [id]: { ...connection, id },
        },
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
    return id;
  },

  deleteConnection: (id) => {
    get().saveHistory();
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
      const updatedMindmap = {
        ...state.mindmap,
        connections: rest,
        updatedAt: new Date(),
      };
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps),
        selectionState: {
          ...state.selectionState,
          selectedConnectionIds: state.selectionState.selectedConnectionIds.filter((connId) => connId !== id),
          hoveredConnectionId: state.selectionState.hoveredConnectionId === id ? null : state.selectionState.hoveredConnectionId,
        },
      };
    });
    
    // Re-layout after removing parent-child relationship
    if (id.startsWith('node-conn-')) {
      setTimeout(() => get().applyLayout(), 0);
    }
  },

  updateNodePosition: (nodeId: string, position: Position) => {
    // 只有当不是正在拖拽时才保存历史，拖拽结束时的保存由 endDrag 或相关逻辑处理
    // 但在当前的 updateDrag 实现中，它是直接调用 updateNodePosition 的
    // 为了避免拖拽过程中产生大量历史记录，我们不在 updateNodePosition 中保存历史
    // 历史记录已在 startDrag 中保存了开始状态
    set((state) => {
      const node = state.mindmap.nodes[nodeId];
      if (!node) return state;

      const updatedMindmap = {
        ...state.mindmap,
        nodes: {
          ...state.mindmap.nodes,
          [nodeId]: {
            ...node,
            position,
            isCustomPosition: true,
          },
        },
        updatedAt: new Date(),
      };
      
      persistMindmap(updatedMindmap);
      return {
        mindmap: updatedMindmap,
        savedMindmaps: updateSavedList(updatedMindmap, state.savedMindmaps)
      };
    });
  },

  generateSubNodes: async (nodeId, customPrompt, options) => {
    const { mindmap, aiConfig, addNode, applyLayout } = get();
    const isReplace = options?.replace === true;
    
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
      if (subscription.status === 'free' && subscription.ai_usage_count >= 1) {
        toast.error('您已达到今日 AI 使用限额。请升级订阅以解锁无限次数。');
        return;
      }
    }

    const node = mindmap.nodes[nodeId];
    if (!node) return;

    if (!aiConfig.apiKey) {
      toast.error('请先在用户中心 -> AI 设置中配置 DeepSeek API Key');
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
        get().saveHistory();
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
          // Only clear existing children if replace is explicitly requested
          if (isReplace) {
            const currentChildren = [...mindmap.nodes[nodeId].children];
            currentChildren.forEach(childId => get().deleteNode(childId));
            
            // Also clear other elements and connections if it's a global replace
            set((state) => ({
              mindmap: {
                ...state.mindmap,
                elements: {},
                connections: {},
              }
            }));
          }

          if (rootNodes.length === 1) {
            // If there's only one root-level node in AI response, use it as the new root text
            // and add its children as direct sub-nodes
            const newText = rootNodes[0].text;
            
            // Only update root text if replace is true or it's default text
            const isDefaultText = node.text === '使用帮助' || node.text === '未命名思维导图' || node.text === '中心主题';
            if (isReplace || isDefaultText) {
              get().updateNodeText(nodeId, newText);
              
              // Also update mindmap name if it's default
              if (get().mindmap.name === '使用帮助' || get().mindmap.name === '未命名思维导图') {
                get().updateMindmapName(newText);
              }
            }
            
            addNodesRecursive(nodeId, rootNodes[0].children);
          } else {
            // If there are multiple root-level nodes, add them all as children
            // And update the root text to the prompt if it's requested
            if (isReplace && customPrompt) {
              // Clean the prompt to use as a title
              const cleanTitle = customPrompt
                .replace(/^(帮我|请|帮我生成|请生成|帮我写|请写|创建一个关于|生成一个关于|关于)(一个|关于)?/g, '')
                .replace(/(的思维导图|的导图|的结构图|的结构|思维导图|导图)$/g, '')
                .trim();
                
              const newText = cleanTitle.length > 30 ? cleanTitle.substring(0, 30) + '...' : (cleanTitle || customPrompt);
              get().updateNodeText(nodeId, newText);
              
              if (get().mindmap.name === '使用帮助' || get().mindmap.name === '未命名思维导图') {
                get().updateMindmapName(newText);
              }
            }
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
