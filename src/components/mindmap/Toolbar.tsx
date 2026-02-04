import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Trash2,
  ChevronRight,
  Download,
  Undo,
  Redo,
  Layout,
  MousePointer,
  Move,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Wand2,
  FileText,
  Type,
  Image as ImageIcon,
} from 'lucide-react';
import { useMindmapStore } from '@/stores/mindmapStore';
import { getNodeColor } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Upload } from 'lucide-react';

const Toolbar: React.FC = () => {
  const { theme } = useTheme();
  const {
    mindmap,
    selectionState,
    addNode,
    deleteNode,
    toggleCollapse,
    zoomIn,
    zoomOut,
    resetView,
    organizeMindmap,
    applyLayout,
    layoutConfig,
    setLayoutConfig,
    setMindmap,
  } = useMindmapStore();

  // Resolve theme colors for export
  const themeColors = useMemo(() => {
    // We use theme here to ensure recalculation when theme changes
    const _ = theme;
    
    const getVar = (name: string) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val ? `hsl(${val})` : '';
    };

    return {
      background: getVar('--background'),
      foreground: getVar('--foreground'),
      nodeBg: getVar('--node-bg'),
      nodeBorder: getVar('--node-border'),
      connectionLine: getVar('--connection-line'),
      nodeRoot: getVar('--node-root'),
      nodeLevel1: getVar('--node-level-1'),
      nodeLevel2: getVar('--node-level-2'),
      nodeLevel3: getVar('--node-level-3'),
      nodeLevel4: getVar('--node-level-4'),
    };
  }, [theme]);

  const getThemeLevelColor = (level: number) => {
    if (level === 0) return themeColors.nodeRoot || getNodeColor(0);
    if (level === 1) return themeColors.nodeLevel1 || getNodeColor(1);
    if (level === 2) return themeColors.nodeLevel2 || getNodeColor(2);
    if (level === 3) return themeColors.nodeLevel3 || getNodeColor(3);
    if (level === 4) return themeColors.nodeLevel4 || getNodeColor(4);
    return getNodeColor(level);
  };

  const handleToggleDirection = () => {
    const directions: Array<'right' | 'left' | 'both'> = ['right', 'left', 'both'];
    const currentIndex = directions.indexOf(layoutConfig.direction);
    const nextIndex = (currentIndex + 1) % directions.length;
    setLayoutConfig({ direction: directions[nextIndex] });
    // Re-apply layout after changing direction
    setTimeout(() => applyLayout(), 0);
  };
  
  const selectedId = selectionState.selectedNodeIds[0];
  const selectedNode = selectedId ? mindmap.nodes[selectedId] : null;
  const isRoot = selectedId === mindmap.rootId;
  const hasChildren = selectedNode && selectedNode.children.length > 0;
  
  const handleAddChild = (side?: 'left' | 'right') => {
    if (selectedId) {
      addNode(selectedId, undefined, side);
    }
  };
  
  const handleDelete = () => {
    if (selectedId && !isRoot) {
      deleteNode(selectedId);
    }
  };
  
  const handleToggleCollapse = () => {
    if (selectedId && hasChildren) {
      toggleCollapse(selectedId);
    }
  };
  
  const handleExport = () => {
    const { nodes, elements, connections } = mindmap;
    const nodeValues = Object.values(nodes);
    const elementValues = Object.values(elements);
    
    if (nodeValues.length === 0) return;

    // 1. Calculate bounding box of all content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodeValues.forEach(node => {
      const halfW = node.width / 2;
      const halfH = node.height / 2;
      minX = Math.min(minX, node.position.x - halfW);
      minY = Math.min(minY, node.position.y - halfH);
      maxX = Math.max(maxX, node.position.x + halfW);
      maxY = Math.max(maxY, node.position.y + halfH);
    });

    elementValues.forEach(el => {
      if (el.type === 'rect' || el.type === 'circle' || el.type === 'image') {
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
      } else if (el.type === 'text') {
        const fontSize = el.style.fontSize || 16;
        const textWidth = (el.text || '').length * fontSize * 0.6;
        minX = Math.min(minX, el.position.x);
        maxX = Math.max(maxX, el.position.x + textWidth);
        minY = Math.min(minY, el.position.y - fontSize);
        maxY = Math.max(maxY, el.position.y);
      } else if (el.points) {
        el.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      }
    });

    // Add padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    // 2. Create temporary canvas
    const tempCanvas = document.createElement('canvas');
    const dpr = 2; // Higher quality for export
    tempCanvas.width = width * dpr;
    tempCanvas.height = height * dpr;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    
    // Fill background
    ctx.fillStyle = themeColors.background || (theme === 'dark' ? 'hsl(225, 25%, 9%)' : 'hsl(220, 20%, 97%)');
    ctx.fillRect(0, 0, width, height);

    // Offset the context to the top-left of the bounding box
    ctx.translate(-minX, -minY);

    // 3. Draw everything
    // Draw Connections
    ctx.strokeStyle = themeColors.connectionLine || (theme === 'dark' ? 'hsl(225, 20%, 30%)' : 'hsl(220, 20%, 70%)');
    ctx.lineWidth = 2;
    nodeValues.forEach(node => {
      if (node.parentId) {
        const parent = nodes[node.parentId];
        if (parent && !parent.collapsed) {
          const side = node.side || 'right';
          const sX = parent.position.x + (side === 'left' ? -parent.width / 2 : parent.width / 2);
          const sY = parent.position.y;
          const tX = node.position.x + (side === 'left' ? node.width / 2 : -node.width / 2);
          const tY = node.position.y;

          ctx.beginPath();
          ctx.moveTo(sX, sY);
          
          const connStyle = layoutConfig.connectionStyle;
          if (connStyle === 'curve') {
            const cp1x = sX + (tX - sX) * 0.5;
            const cp2x = sX + (tX - sX) * 0.5;
            ctx.bezierCurveTo(cp1x, sY, cp2x, tY, tX, tY);
          } else if (connStyle === 'polyline') {
            const midX = sX + (tX - sX) * 0.5;
            ctx.lineTo(midX, sY);
            ctx.lineTo(midX, tY);
            ctx.lineTo(tX, tY);
          } else {
            ctx.lineTo(tX, tY);
          }
          ctx.stroke();
        }
      }
    });

    // Draw Free Connections
    Object.values(connections).forEach((conn) => {
      const source = nodes[conn.sourceId] || elements[conn.sourceId];
      const target = nodes[conn.targetId] || elements[conn.targetId];
      if (!source || !target) return;

      let sX, sY, tX, tY;

      // Source point
      if ('level' in source) { // Node
        const side = source.side || 'right';
        sX = source.position.x + (side === 'left' ? -source.width / 2 - 10 : source.width / 2 + 10);
        sY = source.position.y;
      } else { // Element
        if (source.type === 'text') {
          const fontSize = source.style.fontSize || 16;
          const textWidth = (source.text || '').length * fontSize * 0.6;
          sX = source.position.x + textWidth + 10;
          sY = source.position.y - fontSize / 2;
        } else {
          sX = source.position.x + (source.width || 0) + 10;
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
          const textWidth = (target.text || '').length * fontSize * 0.6;
          tX = target.position.x + textWidth / 2;
          tY = target.position.y - fontSize / 2;
        } else {
          tX = target.position.x + (target.width || 0) / 2;
          tY = target.position.y + (target.height || 0) / 2;
        }
      }

      ctx.beginPath();
      ctx.moveTo(sX, sY);
      
      const connStyle = layoutConfig.connectionStyle;
      if (connStyle === 'curve') {
        const cp1x = sX + (tX - sX) * 0.5;
        const cp2x = sX + (tX - sX) * 0.5;
        ctx.bezierCurveTo(cp1x, sY, cp2x, tY, tX, tY);
      } else {
        ctx.lineTo(tX, tY);
      }

      ctx.strokeStyle = conn.style.stroke || (theme === 'dark' ? '#3b82f6' : '#2563eb');
      ctx.lineWidth = conn.style.strokeWidth || 2;
      if (conn.style.dash) ctx.setLineDash(conn.style.dash);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    });

    // Draw Elements
    elementValues.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.style.stroke || themeColors.foreground || (theme === 'dark' ? '#ffffff' : '#000000');
      ctx.fillStyle = el.style.fill || 'transparent';
      ctx.lineWidth = el.style.strokeWidth || 2;
      
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
          ctx.font = `${fontWeightValue} ${el.style.fontSize || 16}px system-ui`;
          ctx.fillStyle = el.style.stroke || themeColors.foreground || (theme === 'dark' ? '#ffffff' : '#000000');
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
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
        case 'image':
          if (el.url && el.width && el.height) {
            // In a real app, you might need to wait for image to load or use a pre-cached image
            // For now, we assume images are cached since they are rendered on main canvas
            const img = new Image();
            img.src = el.url;
            if (img.complete && img.naturalWidth > 0) {
              const drawX = el.width < 0 ? el.position.x + el.width : el.position.x;
              const drawY = el.height < 0 ? el.position.y + el.height : el.position.y;
              ctx.drawImage(img, drawX, drawY, Math.abs(el.width), Math.abs(el.height));
            }
          }
          break;
      }
      ctx.restore();
    });

    // Draw Nodes
    nodeValues.forEach(node => {
      const x = node.position.x - node.width / 2;
      const y = node.position.y - node.height / 2;
      const isRoot = node.id === mindmap.rootId;
      const style = node.style || {};
      
      ctx.beginPath();
      const radius = isRoot ? 12 : 8;
      ctx.roundRect(x, y, node.width, node.height, radius);
      
      // Use actual node colors
      const defaultColor = getThemeLevelColor(node.level);
      const bgColor = style.backgroundColor || (isRoot ? defaultColor : (themeColors.nodeBg || (theme === 'dark' ? 'hsl(225, 25%, 14%)' : 'hsl(0, 0%, 100%)')));
      ctx.fillStyle = bgColor;
      ctx.fill();
      
      ctx.strokeStyle = themeColors.nodeBorder || (theme === 'dark' ? 'hsl(225, 20%, 22%)' : 'hsl(220, 15%, 85%)');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Left color indicator (for non-root nodes without custom bg)
      if (!isRoot && !style.backgroundColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, 4, node.height, [8, 0, 0, 8]);
        ctx.fillStyle = defaultColor;
        ctx.fill();
      }
      
      // Text
      const textColor = style.textColor || (isRoot || style.backgroundColor ? 'white' : (themeColors.foreground || (theme === 'dark' ? 'hsl(210, 20%, 95%)' : 'hsl(220, 25%, 10%)')));
      ctx.fillStyle = textColor;
      const fontSize = style.fontSize || (isRoot ? 16 : 14);
      ctx.font = `600 ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const iconOffset = style.icon ? 10 : 0;
      ctx.fillText(node.text, node.position.x + iconOffset / 2, node.position.y);

      // Collapse indicator
      if (node.children.length > 0) {
        const indicatorX = x + node.width - 8;
        const indicatorY = node.position.y;
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
        ctx.fillStyle = themeColors.nodeBg || (theme === 'dark' ? 'hsl(225, 20%, 20%)' : 'hsl(0, 0%, 98%)');
        ctx.fill();
        ctx.strokeStyle = themeColors.nodeBorder || (theme === 'dark' ? 'hsl(225, 20%, 30%)' : 'hsl(220, 15%, 80%)');
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = themeColors.foreground || (theme === 'dark' ? 'hsl(210, 20%, 80%)' : 'hsl(220, 25%, 20%)');
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.collapsed ? '+' : '−', indicatorX, indicatorY);
      }
    });

    const link = document.createElement('a');
    link.download = `${mindmap.name}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const generateTreeText = (nodeId: string, depth: number = 0, format: 'md' | 'txt'): string => {
    const node = mindmap.nodes[nodeId];
    if (!node) return '';

    let text = '';
    if (format === 'md') {
      const prefix = '#'.repeat(Math.min(depth + 1, 6)) + ' ';
      text = `${prefix}${node.text}\n\n`;
    } else {
      const indent = '  '.repeat(depth);
      text = `${indent}- ${node.text}\n`;
    }

    // Always process children, even if collapsed in view, to export full content
    for (const childId of node.children) {
      text += generateTreeText(childId, depth + 1, format);
    }
    
    return text;
  };

  const handleExportText = (format: 'md' | 'txt') => {
    const content = generateTreeText(mindmap.rootId, 0, format);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${mindmap.name}.${format}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAMF = () => {
    const data = {
      version: '1.0.0',
      type: 'AI-MindFlow-Data',
      timestamp: new Date().toISOString(),
      mindmap: {
        ...mindmap,
        // Ensure dates are stringified
        createdAt: new Date(mindmap.createdAt).toISOString(),
        updatedAt: new Date(mindmap.updatedAt).toISOString(),
      }
    };
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${mindmap.name}.amf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("导出专属文件成功");
  };

  const handleImportAMF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.type !== 'AI-MindFlow-Data') {
          throw new Error('不支持的文件格式');
        }

        const importedMindmap = data.mindmap;
        // Restore Date objects
        importedMindmap.createdAt = new Date(importedMindmap.createdAt);
        importedMindmap.updatedAt = new Date(importedMindmap.updatedAt);

        setMindmap(importedMindmap);
        toast.success("导入专属文件成功");
        
        // Reset view and layout after import
        setTimeout(() => {
          applyLayout();
          resetView();
        }, 100);
      } catch (error) {
        console.error('Import error:', error);
        toast.error(error instanceof Error ? error.message : "导入失败，文件格式错误");
      }
    };
    reader.readAsText(file);
    // Clear input
    e.target.value = '';
  };
  
  return (
    <div className="floating-panel absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-2 bg-popover/90 text-popover-foreground">
      {isRoot ? (
        <div className="flex gap-1">
          <ToolbarButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <Plus className="w-4 h-4" />
                <ArrowLeft className="w-2.5 h-2.5 absolute -left-1 -top-1 bg-background rounded-full p-0.5 shadow-sm" />
              </div>
            }
            tooltip="向左添加分支"
            onClick={() => handleAddChild('left')}
            disabled={!selectedId}
          />
          <ToolbarButton
            icon={
              <div className="relative flex items-center justify-center w-4 h-4">
                <Plus className="w-4 h-4" />
                <ArrowRight className="w-2.5 h-2.5 absolute -right-1 -top-1 bg-background rounded-full p-0.5 shadow-sm" />
              </div>
            }
            tooltip="向右添加分支"
            onClick={() => handleAddChild('right')}
            disabled={!selectedId}
          />
        </div>
      ) : (
        <ToolbarButton
          icon={<Plus className="w-4 h-4" />}
          tooltip="添加子节点 (Tab)"
          onClick={() => handleAddChild()}
          disabled={!selectedId}
        />
      )}
      
      <ToolbarButton
        icon={<Trash2 className="w-4 h-4" />}
        tooltip="删除节点 (Delete)"
        onClick={handleDelete}
        disabled={!selectedId || isRoot}
        variant="destructive"
      />
      
      <ToolbarButton
        icon={<ChevronRight className={`w-4 h-4 transition-transform ${selectedNode?.collapsed ? '' : 'rotate-90'}`} />}
        tooltip="展开/折叠 (Space)"
        onClick={handleToggleCollapse}
        disabled={!hasChildren}
      />
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <ToolbarButton
        icon={<ZoomIn className="w-4 h-4" />}
        tooltip="放大"
        onClick={zoomIn}
      />
      
      <div className="px-2 text-sm font-medium text-muted-foreground min-w-[50px] text-center">
        {Math.round(mindmap.viewport.zoom * 100)}%
      </div>
      
      <ToolbarButton
        icon={<ZoomOut className="w-4 h-4" />}
        tooltip="缩小"
        onClick={zoomOut}
      />
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <ToolbarButton
         icon={
           layoutConfig.direction === 'right' ? <ArrowRight className="w-4 h-4" /> :
           layoutConfig.direction === 'left' ? <ArrowLeft className="w-4 h-4" /> :
           <ArrowLeftRight className="w-4 h-4" />
         }
         tooltip={`布局方向: ${
           layoutConfig.direction === 'right' ? '向右' :
           layoutConfig.direction === 'left' ? '向左' : '双向'
         }`}
         onClick={handleToggleDirection}
       />
      
      <ToolbarButton
        icon={<RotateCcw className="w-4 h-4" />}
        tooltip="重置视图"
        onClick={resetView}
      />
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <ToolbarButton
        icon={<Wand2 className="w-4 h-4" />}
        tooltip="一键整理"
        onClick={organizeMindmap}
      />
      
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
            <ImageIcon className="w-4 h-4 mr-2" />
            <span>导出为 PNG 图片</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportText('md')} className="cursor-pointer">
            <FileText className="w-4 h-4 mr-2" />
            <span>导出为 Markdown (.md)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportText('txt')} className="cursor-pointer">
            <FileText className="w-4 h-4 mr-2" />
            <span>导出为 TXT 文本</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportAMF} className="cursor-pointer font-medium text-primary">
            <Download className="w-4 h-4 mr-2" />
            <span>导出为 .amf 专属文件</span>
          </DropdownMenuItem>
          <label className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            <span>导入 .amf 专属文件</span>
            <input
              type="file"
              accept=".amf"
              className="hidden"
              onChange={handleImportAMF}
            />
          </label>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  tooltip,
  onClick,
  disabled = false,
  variant = 'default',
  active = false,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`
            h-8 w-8 p-0 
            ${active ? 'bg-primary text-primary-foreground' : ''} 
            ${variant === 'destructive' ? 'hover:bg-destructive hover:text-destructive-foreground' : ''}
          `}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default Toolbar;
