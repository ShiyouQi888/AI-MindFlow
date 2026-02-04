import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Position, Viewport } from '@/types/mindmap';

interface InlineAIInputProps {
  nodePosition: Position;
  nodeHeight: number;
  viewport: Viewport;
  onConfirm: (prompt: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const InlineAIInput: React.FC<InlineAIInputProps> = ({
  nodePosition,
  nodeHeight,
  viewport,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Calculate screen position
  const screenX = nodePosition.x * viewport.zoom + viewport.x;
  const screenY = (nodePosition.y + nodeHeight / 2) * viewport.zoom + viewport.y + 10;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onConfirm(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-[100] transition-all duration-200 animate-in fade-in zoom-in-95"
      style={{
        left: screenX,
        top: screenY,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-2 p-1.5 bg-background/40 backdrop-blur-lg border border-primary/20 rounded-full shadow-[0_8px_32px_rgba(139,92,246,0.15)] min-w-[340px] group hover:border-primary/40 transition-all duration-300">
        <div className="pl-3.5 text-primary/60 group-hover:text-primary transition-colors">
          <Sparkles className="w-4 h-4" />
        </div>
        <Input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入指令以扩展思路..."
          className="h-8 border-none bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40"
          disabled={isProcessing}
        />
        <div className="flex items-center gap-1.5 pr-1">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="h-8 px-4 rounded-full bg-primary/70 hover:bg-primary text-white text-xs font-medium gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="whitespace-nowrap">开始生成</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineAIInput;
