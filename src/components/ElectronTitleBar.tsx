import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const ElectronTitleBar: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && window.process && (window.process as any).type === 'renderer';

  if (!isElectron) return null;

  const { ipcRenderer } = window.require('electron');

  const handleMinimize = () => ipcRenderer.send('window-minimize');
  const handleMaximize = () => ipcRenderer.send('window-maximize');
  const handleClose = () => ipcRenderer.send('window-close');

  return (
    <div 
      className="h-8 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between select-none z-[100] sticky top-0"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center px-4 gap-2.5">
        <div className="w-4 h-4 rounded-sm overflow-hidden">
          <img src="logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wide uppercase">AI MindFlow</span>
      </div>
      
      <div className="flex items-center h-full no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-muted/80 transition-all flex items-center justify-center text-muted-foreground hover:text-foreground group"
          title="最小化"
        >
          <Minus className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
        </button>
        <button 
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-muted/80 transition-all flex items-center justify-center text-muted-foreground hover:text-foreground group"
          title="最大化"
        >
          <Square className="w-3 h-3 group-active:scale-90 transition-transform" />
        </button>
        <button 
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-muted-foreground group"
          title="关闭"
        >
          <X className="w-4 h-4 group-active:scale-90 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ElectronTitleBar;
