import React from 'react';
import { 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  Spline, 
  Activity, 
  Square, 
  Circle,
  Pencil
} from 'lucide-react';
import { useMindmapStore } from '@/stores/mindmapStore';
import { ToolType } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: (tool: ToolType) => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, icon, label, active, onClick }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg transition-all duration-200",
              active 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onClick(tool)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const LeftToolbar: React.FC = () => {
  const { currentTool, setCurrentTool, setLayoutConfig } = useMindmapStore();

  const handleToolClick = (tool: ToolType) => {
    setCurrentTool(tool);
    // If selecting curve or polyline tool, also update global connection style
    if (tool === 'curve' || tool === 'polyline') {
      setLayoutConfig({ connectionStyle: tool });
    }
  };

  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'text', icon: <Type className="w-5 h-5" />, label: '文字 (T)' },
    { type: 'image', icon: <ImageIcon className="w-5 h-5" />, label: '图片 (I)' },
    { type: 'curve', icon: <Spline className="w-5 h-5" />, label: '曲线 (C)' },
    { type: 'polyline', icon: <Activity className="w-5 h-5" />, label: '折线 (P)' },
    { type: 'rect', icon: <Square className="w-5 h-5" />, label: '矩形 (R)' },
    { type: 'circle', icon: <Circle className="w-5 h-5" />, label: '圆形 (O)' },
  ];

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-2 bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-xl">
      {tools.map((tool) => (
        <ToolButton
          key={tool.type}
          tool={tool.type}
          icon={tool.icon}
          label={tool.label}
          active={currentTool === tool.type}
          onClick={handleToolClick}
        />
      ))}
    </div>
  );
};

export default LeftToolbar;
