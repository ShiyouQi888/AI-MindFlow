import React from 'react';
import { Keyboard, Mouse, Info } from 'lucide-react';

const HelpPanel: React.FC = () => {
  return (
    <div className="floating-panel absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 w-auto max-w-[95vw] flex items-center gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex items-center gap-2 border-r border-border/50 pr-4 shrink-0">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-xs">快捷键</h3>
      </div>
      
      <div className="flex items-center gap-5 text-[11px]">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">Tab</kbd>
          <span className="text-muted-foreground/80">添加子节点</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">Enter</kbd>
          <span className="text-muted-foreground/80">添加兄弟节点</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">Delete</kbd>
          <span className="text-muted-foreground/80">删除节点</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">F2</kbd>
          <span className="text-muted-foreground/80">编辑节点</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">Space</kbd>
          <span className="text-muted-foreground/80">展开/折叠</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">双击</kbd>
          <span className="text-muted-foreground/80">编辑文本</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">滚轮</kbd>
          <span className="text-muted-foreground/80">缩放</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">拖拽</kbd>
          <span className="text-muted-foreground/80">平移画布</span>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
