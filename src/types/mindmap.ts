export interface Position {
  x: number;
  y: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  icon?: string;
}

export const PRESET_COLORS = [
  // 基础色
  { name: 'Red', value: 'hsl(0, 75%, 55%)' },
  { name: 'Orange', value: 'hsl(30, 90%, 55%)' },
  { name: 'Amber', value: 'hsl(45, 95%, 50%)' },
  { name: 'Yellow', value: 'hsl(55, 90%, 50%)' },
  { name: 'Lime', value: 'hsl(80, 80%, 50%)' },
  { name: 'Green', value: 'hsl(130, 60%, 45%)' },
  { name: 'Emerald', value: 'hsl(160, 80%, 40%)' },
  { name: 'Teal', value: 'hsl(175, 80%, 40%)' },
  { name: 'Cyan', value: 'hsl(190, 90%, 50%)' },
  { name: 'Sky', value: 'hsl(200, 95%, 55%)' },
  { name: 'Blue', value: 'hsl(220, 90%, 56%)' },
  { name: 'Indigo', value: 'hsl(240, 80%, 60%)' },
  { name: 'Violet', value: 'hsl(265, 85%, 60%)' },
  { name: 'Purple', value: 'hsl(280, 75%, 60%)' },
  { name: 'Fuchsia', value: 'hsl(300, 80%, 55%)' },
  { name: 'Pink', value: 'hsl(330, 85%, 60%)' },
  { name: 'Rose', value: 'hsl(350, 90%, 60%)' },
  // 莫兰迪/柔和色
  { name: 'Slate', value: 'hsl(215, 20%, 50%)' },
  { name: 'Sage', value: 'hsl(120, 15%, 50%)' },
  { name: 'Sand', value: 'hsl(40, 20%, 60%)' },
  { name: 'Clay', value: 'hsl(15, 25%, 55%)' },
  { name: 'Muted Blue', value: 'hsl(210, 30%, 60%)' },
  { name: 'Muted Purple', value: 'hsl(260, 20%, 60%)' },
  { name: 'Muted Red', value: 'hsl(0, 30%, 60%)' },
  // 柔和低饱和度色
  { name: 'Soft Peach', value: 'hsl(20, 100%, 95%)' },
  { name: 'Soft Mint', value: 'hsl(140, 50%, 95%)' },
  { name: 'Soft Sky', value: 'hsl(200, 70%, 95%)' },
  { name: 'Soft Lavender', value: 'hsl(260, 60%, 95%)' },
  { name: 'Soft Rose', value: 'hsl(340, 70%, 95%)' },
  // 深色系列
  { name: 'Navy', value: 'hsl(220, 100%, 20%)' },
  { name: 'Maroon', value: 'hsl(0, 100%, 20%)' },
  { name: 'Forest', value: 'hsl(120, 100%, 15%)' },
  { name: 'Midnight', value: 'hsl(240, 100%, 10%)' },
  // 黑白灰
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Dark Gray', value: '#4b5563' },
  { name: 'Black', value: '#1f2937' },
];

export const NODE_ICONS = [
  'Star', 'Heart', 'Lightbulb', 'Target', 'Zap',
  'Bookmark', 'Flag', 'Bell', 'CheckCircle', 'AlertCircle',
  'Folder', 'File', 'Image', 'Video', 'Music',
  'User', 'Users', 'Settings', 'Search', 'Home',
  'Calendar', 'Clock', 'Mail', 'Phone', 'MessageCircle',
  'Globe', 'Link', 'Lock', 'Unlock', 'Key',
];

export const FONT_SIZES = [
  { label: '小', value: 12 },
  { label: '中', value: 14 },
  { label: '大', value: 16 },
  { label: '特大', value: 20 },
];

export const FONT_WEIGHTS: { label: string; value: NodeStyle['fontWeight'] }[] = [
  { label: '常规', value: 'normal' },
  { label: '中等', value: 'medium' },
  { label: '半粗', value: 'semibold' },
  { label: '粗体', value: 'bold' },
];

export interface MindNode {
  id: string;
  parentId: string | null;
  text: string;
  position: Position;
  collapsed: boolean;
  style?: NodeStyle;
  children: string[];
  level: number;
  width: number;
  height: number;
  side?: 'left' | 'right';
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FreeConnection {
  id: string;
  sourceId: string;
  sourceType: 'node' | 'element';
  targetId: string;
  targetType: 'node' | 'element';
  style: {
    stroke?: string;
    strokeWidth?: number;
    dash?: number[];
  };
}

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface MindMap {
  id: string;
  name: string;
  rootId: string;
  nodes: Record<string, MindNode>;
  elements: Record<string, CanvasElement>;
  connections: Record<string, FreeConnection>;
  viewport: Viewport;
  createdAt: Date;
  updatedAt: Date;
}

export interface DragState {
  isDragging: boolean;
  type: 'node' | 'element' | 'resize' | 'connection' | null;
  id: string | null;
  handle?: string;
  startPosition: Position | null;
  offset: Position;
  connectionTarget?: {
    x: number;
    y: number;
  };
}

export interface SelectionState {
  selectedNodeIds: string[];
  selectedElementIds: string[];
  hoveredNodeId: string | null;
  hoveredElementId: string | null;
}

export interface CanvasState {
  isPanning: boolean;
  panStart: Position | null;
}

export type LayoutType = 'tree' | 'radial' | 'free';

export type ConnectionStyle = 'curve' | 'polyline' | 'straight';

export type ToolType = 'select' | 'text' | 'image' | 'curve' | 'polyline' | 'rect' | 'circle';

export interface CanvasElement {
  id: string;
  type: Exclude<ToolType, 'select'>;
  position: Position;
  width?: number;
  height?: number;
  points?: Position[];
  text?: string;
  url?: string;
  style: {
    stroke?: string;
    fill?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  };
}

export interface LayoutConfig {
  type: LayoutType;
  connectionStyle: ConnectionStyle;
  horizontalSpacing: number;
  verticalSpacing: number;
  direction: 'right' | 'left' | 'both';
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  type: 'tree',
  connectionStyle: 'curve',
  horizontalSpacing: 200,
  verticalSpacing: 30,
  direction: 'right',
};

export const NODE_COLORS = [
  'hsl(220, 90%, 56%)',   // Primary blue
  'hsl(280, 70%, 55%)',   // Purple
  'hsl(165, 80%, 45%)',   // Teal
  'hsl(35, 90%, 55%)',    // Orange
  'hsl(340, 75%, 55%)',   // Pink
  'hsl(200, 85%, 50%)',   // Cyan
  'hsl(130, 60%, 45%)',   // Green
];

export interface ColorPalette {
  name: string;
  root: string;
  levels: string[];
  background?: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: '极简商务',
    root: '#2563eb', // Blue 600
    levels: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  },
  {
    name: '清新自然',
    root: '#059669', // Emerald 600
    levels: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  },
  {
    name: '热情活力',
    root: '#dc2626', // Red 600
    levels: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  },
  {
    name: '多彩霓虹',
    root: '#22d3ee', // Cyan 400
    levels: ['#f472b6', '#fbbf24', '#4ade80', '#818cf8'], // Diverse colors
  },
  {
    name: '复古调色',
    root: '#78350f', // Amber 900
    levels: ['#1e3a8a', '#064e3b', '#7f1d1d', '#4c1d95'], // Deep diverse colors
  },
  {
    name: '优雅紫色',
    root: '#7c3aed', // Violet 600
    levels: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  },
  {
    name: '赛博朋克',
    root: '#f0abfc', // Fuchsia 300
    levels: ['#22d3ee', '#f472b6', '#fbbf24', '#818cf8'],
  },
  {
    name: '莫兰迪语',
    root: '#94a3b8', // Slate 400
    levels: ['#b45309', '#065f46', '#1e40af', '#86198f'],
  },
  {
    name: '薄荷苏打',
    root: '#0d9488', // Teal 600
    levels: ['#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1'],
  },
  {
    name: '热带雨林',
    root: '#166534', // Green 800
    levels: ['#ea580c', '#eab308', '#2563eb', '#db2777'],
  },
];

export function getNodeColor(level: number): string {
  return NODE_COLORS[level % NODE_COLORS.length];
}
