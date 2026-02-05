import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderCaptchaProps {
  onSuccess: () => void;
  className?: string;
}

const SliderCaptcha: React.FC<SliderCaptchaProps> = ({ onSuccess, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const SLIDER_SIZE = 40;
  const SUCCESS_THRESHOLD = 0.95; // 95% of the track

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSuccess) return;
    setIsDragging(true);
    setIsError(false);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || isSuccess) return;

      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      let x = clientX - rect.left - SLIDER_SIZE / 2;

      const maxX = rect.width - SLIDER_SIZE;
      x = Math.max(0, Math.min(x, maxX));
      
      setDragX(x);

      if (x >= maxX * SUCCESS_THRESHOLD) {
        setIsSuccess(true);
        setIsDragging(false);
        setDragX(maxX);
        onSuccess();
      }
    };

    const handleUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      const track = trackRef.current;
      if (track) {
        const maxX = track.getBoundingClientRect().width - SLIDER_SIZE;
        if (dragX < maxX * SUCCESS_THRESHOLD) {
          // Reset if not reached success
          setDragX(0);
          setIsError(true);
          setTimeout(() => setIsError(false), 1000);
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragX, isSuccess, onSuccess]);

  return (
    <div className={cn("w-full select-none", className)}>
      <div 
        ref={trackRef}
        className={cn(
          "relative h-10 bg-muted rounded-lg border border-border overflow-hidden transition-colors",
          isSuccess && "bg-green-500/10 border-green-500/30",
          isError && "bg-destructive/10 border-destructive/30"
        )}
      >
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground pointer-events-none">
          {isSuccess ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 验证通过
            </span>
          ) : isError ? (
            <span className="text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> 请滑到最右侧
            </span>
          ) : (
            "按住滑块，拖动到最右侧验证"
          )}
        </div>

        {/* Progress Bar */}
        <div 
          className={cn(
            "absolute inset-y-0 left-0 bg-primary/20 transition-all",
            isDragging ? "duration-0" : "duration-300",
            isSuccess && "bg-green-500/20"
          )}
          style={{ width: dragX + SLIDER_SIZE / 2 }}
        />

        {/* Slider Handle */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={cn(
            "absolute top-0 h-full aspect-square bg-background border border-border rounded-lg shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:border-primary/50 z-10",
            isDragging ? "duration-0 scale-95" : "duration-300",
            isSuccess && "bg-green-500 border-green-600 text-white cursor-default"
          )}
          style={{ left: dragX }}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <ChevronRight className={cn("w-5 h-5 transition-transform", isDragging && "translate-x-0.5")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SliderCaptcha;
