import React from 'react';
import { 
  Palette, 
  Type, 
  Smile,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings2,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useMindmapStore } from '@/stores/mindmapStore';
import { 
  PRESET_COLORS, 
  FONT_SIZES, 
  FONT_WEIGHTS, 
  NODE_ICONS,
  NodeStyle,
  COLOR_PALETTES,
} from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const StylePanel: React.FC = () => {
  const [isMainCollapsed, setIsMainCollapsed] = React.useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = React.useState(false);
  const [isNodeStyleCollapsed, setIsNodeStyleCollapsed] = React.useState(false);
  const [isElementStyleCollapsed, setIsElementStyleCollapsed] = React.useState(false);

  const { 
    mindmap, 
    selectionState, 
    updateNodeStyle, 
    updateElement, 
    deleteElement,
    clearSelection,
    applyColorPalette,
  } = useMindmapStore();
  
  const selectedNodeId = selectionState.selectedNodeIds[0];
  const selectedNode = selectedNodeId ? mindmap.nodes[selectedNodeId] : null;
  
  const selectedElementId = selectionState.selectedElementIds[0];
  const selectedElement = selectedElementId ? mindmap.elements[selectedElementId] : null;
  
  if (!selectedNode && !selectedElement) {
    return (
      <div className={`fixed top-24 right-4 z-50 transition-all duration-300 ease-in-out flex items-center gap-3 ${isMainCollapsed ? 'translate-x-[280px]' : 'translate-x-0'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsMainCollapsed(!isMainCollapsed)}
          className="h-12 w-10 flex items-center justify-center bg-card border border-border rounded-2xl shadow-lg hover:bg-secondary transition-all text-muted-foreground hover:text-foreground group shrink-0"
          title={isMainCollapsed ? "展开面板" : "收起面板"}
        >
          {isMainCollapsed ? (
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        <div className="floating-panel w-64 overflow-hidden shadow-2xl rounded-2xl p-2 bg-secondary/30 backdrop-blur-xl border-border/50">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <button 
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">配色模板</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isPaletteCollapsed ? '-rotate-90' : ''}`} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPaletteCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
              <div className="p-4 pt-0 space-y-4">
                <Separator className="mb-4 opacity-50" />
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      className="group relative flex flex-col items-center gap-2 p-2 rounded-xl border border-border bg-card hover:bg-secondary transition-all hover:scale-[1.02] hover:shadow-md"
                      onClick={() => applyColorPalette(palette)}
                    >
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full border border-card z-40 shadow-sm" style={{ backgroundColor: palette.root }} />
                        {palette.levels.map((color, idx) => (
                          <div 
                            key={idx}
                            className="w-5 h-5 rounded-full border border-card shadow-sm" 
                            style={{ 
                              backgroundColor: color,
                              zIndex: 30 - idx,
                            }} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                        {palette.name}
                      </span>
                    </button>
                  ))}
                </div>
                <Separator />
                <div className="text-center text-muted-foreground text-xs py-4">
                  <Settings2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p>选择节点或元素以单独编辑样式</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (selectedElement) {
    const currentStyle = selectedElement.style || {};
    
    const handleStrokeChange = (color: string) => {
      updateElement(selectedElementId, { style: { ...currentStyle, stroke: color } });
    };
    
    const handleFillChange = (color: string) => {
      updateElement(selectedElementId, { style: { ...currentStyle, fill: color } });
    };

    const handleStrokeWidthChange = (width: number) => {
      updateElement(selectedElementId, { style: { ...currentStyle, strokeWidth: width } });
    };

    const handleFontSizeChange = (size: number) => {
      updateElement(selectedElementId, { style: { ...currentStyle, fontSize: size } });
    };

    const handleFontWeightChange = (weight: NodeStyle['fontWeight']) => {
      updateElement(selectedElementId, { style: { ...currentStyle, fontWeight: weight } });
    };

    const handleDeleteElement = () => {
      deleteElement(selectedElementId);
      clearSelection();
    };

    return (
      <div className={`fixed top-24 right-4 z-50 transition-all duration-300 ease-in-out flex items-center gap-3 ${isMainCollapsed ? 'translate-x-[280px]' : 'translate-x-0'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsMainCollapsed(!isMainCollapsed)}
          className="h-12 w-10 flex items-center justify-center bg-card border border-border rounded-2xl shadow-lg hover:bg-secondary transition-all text-muted-foreground hover:text-foreground group shrink-0"
          title={isMainCollapsed ? "展开面板" : "收起面板"}
        >
          {isMainCollapsed ? (
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        <div className="floating-panel w-64 overflow-hidden shadow-2xl rounded-2xl p-2 bg-secondary/30 backdrop-blur-xl border-border/50">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <button 
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setIsElementStyleCollapsed(!isElementStyleCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">元素样式</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {selectedElement.type}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isElementStyleCollapsed ? '-rotate-90' : ''}`} />
              </div>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isElementStyleCollapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>
              <div className="p-4 pt-0 space-y-4">
                <Separator className="mb-4 opacity-50" />
                {/* Stroke Color / Text Color */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {selectedElement.type === 'text' ? '文字颜色' : '边框颜色'}
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-6 h-6 rounded-lg transition-all hover:scale-110 ${
                        currentStyle.stroke === color.value 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-card' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleStrokeChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {selectedElement.type !== 'text' && selectedElement.type !== 'image' && selectedElement.type !== 'video' && (
                <>
                  <Separator />
                  {/* Fill Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">填充颜色</label>
                    <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      <button
                        className={`w-6 h-6 rounded-lg border border-border transition-all hover:scale-110 flex items-center justify-center ${
                          !currentStyle.fill || currentStyle.fill === 'transparent'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' 
                            : ''
                        }`}
                        onClick={() => handleFillChange('transparent')}
                        title="无填充"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`w-6 h-6 rounded-lg transition-all hover:scale-110 ${
                            currentStyle.fill === color.value 
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-card' 
                              : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleFillChange(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'text' && (
                <>
                  <Separator />
                  {/* Font Size */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">字体大小</label>
                    <div className="flex gap-1">
                      {FONT_SIZES.map((size) => (
                        <button
                          key={size.value}
                          className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                            currentStyle.fontSize === size.value || (!currentStyle.fontSize && size.value === 16)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                          onClick={() => handleFontSizeChange(size.value)}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">字体粗细</label>
                    <div className="flex gap-1">
                      {FONT_WEIGHTS.map((weight) => (
                        <button
                          key={weight.value}
                          className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                            currentStyle.fontWeight === weight.value || (!currentStyle.fontWeight && weight.value === 'normal')
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                          style={{ fontWeight: weight.value === 'semibold' ? 600 : weight.value === 'medium' ? 500 : weight.value }}
                          onClick={() => handleFontWeightChange(weight.value)}
                        >
                          {weight.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Stroke Width */}
              {selectedElement.type !== 'text' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">粗细</label>
                  <div className="flex gap-1">
                    {[0, 1, 2, 4, 6].map((width) => (
                      <button
                        key={width}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                          (currentStyle.strokeWidth === width) || 
                          (currentStyle.strokeWidth === undefined && width === 2 && selectedElement.type !== 'image' && selectedElement.type !== 'video') ||
                          (currentStyle.strokeWidth === undefined && width === 0 && (selectedElement.type === 'image' || selectedElement.type === 'video'))
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                        onClick={() => handleStrokeWidthChange(width)}
                      >
                        {width === 0 ? '无' : `${width}px`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

                <Separator />

                {/* Actions */}
                <div className="pt-2">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full gap-2 rounded-lg"
                    onClick={handleDeleteElement}
                  >
                    <LucideIcons.Trash2 className="w-4 h-4" />
                    删除元素
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (selectedNode) {
    const currentStyle = selectedNode.style || {};
    
    const handleColorChange = (color: string) => {
      updateNodeStyle(selectedNodeId, { backgroundColor: color });
    };
    
    const handleTextColorChange = (color: string) => {
      updateNodeStyle(selectedNodeId, { textColor: color });
    };
    
    const handleFontSizeChange = (size: number) => {
      updateNodeStyle(selectedNodeId, { fontSize: size });
    };
    
    const handleFontWeightChange = (weight: NodeStyle['fontWeight']) => {
      updateNodeStyle(selectedNodeId, { fontWeight: weight });
    };
    
    const handleIconChange = (icon: string | undefined) => {
      updateNodeStyle(selectedNodeId, { icon });
    };
    
    return (
      <div className={`fixed top-24 right-4 z-50 transition-all duration-300 ease-in-out flex items-center gap-3 ${isMainCollapsed ? 'translate-x-[280px]' : 'translate-x-0'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsMainCollapsed(!isMainCollapsed)}
          className="h-12 w-10 flex items-center justify-center bg-card border border-border rounded-2xl shadow-lg hover:bg-secondary transition-all text-muted-foreground hover:text-foreground group shrink-0"
          title={isMainCollapsed ? "展开面板" : "收起面板"}
        >
          {isMainCollapsed ? (
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        <div className="floating-panel w-64 overflow-hidden shadow-2xl rounded-2xl p-2 bg-secondary/30 backdrop-blur-xl border-border/50">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <button 
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setIsNodeStyleCollapsed(!isNodeStyleCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">节点样式</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {selectedNode.text}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isNodeStyleCollapsed ? '-rotate-90' : ''}`} />
              </div>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNodeStyleCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-4 pt-0 space-y-4">
                <Separator className="mb-4 opacity-50" />
                {/* Background Color */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">背景颜色</label>
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`w-6 h-6 rounded-lg transition-all hover:scale-110 ${
                            currentStyle.backgroundColor === color.value 
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-card' 
                              : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleColorChange(color.value)}
                          title={color.name}
                        />
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Text Color */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">文字颜色</label>
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-6 h-6 rounded-lg transition-all hover:scale-110 ${
                        currentStyle.textColor === color.value 
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleTextColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
                </div>
                
                <Separator />
                
                {/* Font Size */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">字体大小</label>
                  <div className="flex gap-1">
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size.value}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                          currentStyle.fontSize === size.value || (!currentStyle.fontSize && size.value === 14)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                        onClick={() => handleFontSizeChange(size.value)}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Font Weight */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">字体粗细</label>
                  <div className="flex gap-1">
                    {FONT_WEIGHTS.map((weight) => (
                      <button
                        key={weight.value}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                          currentStyle.fontWeight === weight.value || (!currentStyle.fontWeight && weight.value === 'normal')
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                        style={{ fontWeight: weight.value === 'semibold' ? 600 : weight.value === 'medium' ? 500 : weight.value }}
                        onClick={() => handleFontWeightChange(weight.value)}
                      >
                        {weight.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Icon */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">节点图标</label>
                    {currentStyle.icon && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        onClick={() => handleIconChange(undefined)}
                      >
                        <X className="w-3 h-3" />
                        清除
                      </button>
                    )}
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-lg">
                        <span className="flex items-center gap-2">
                          {currentStyle.icon ? (
                            <>
                              <IconPreview name={currentStyle.icon} className="w-4 h-4" />
                              <span className="text-sm">{currentStyle.icon}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">选择图标</span>
                          )}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 rounded-xl" align="end">
                      <div className="grid grid-cols-6 gap-1">
                        {NODE_ICONS.map((iconName) => (
                          <button
                            key={iconName}
                            className={`p-2 rounded-md hover:bg-secondary transition-colors ${
                              currentStyle.icon === iconName ? 'bg-primary text-primary-foreground' : ''
                            }`}
                            onClick={() => handleIconChange(iconName)}
                            title={iconName}
                          >
                            <IconPreview name={iconName} className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

interface IconPreviewProps {
  name: string;
  className?: string;
}

const IconPreview: React.FC<IconPreviewProps> = ({ name, className }) => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    return <Smile className={className} />;
  }
  
  return <IconComponent className={className} />;
};

export default StylePanel;
