import React, { useEffect } from 'react';
import MindmapCanvas from '@/components/mindmap/MindmapCanvas';
import Toolbar from '@/components/mindmap/Toolbar';
import LeftToolbar from '@/components/mindmap/LeftToolbar';
import HelpPanel from '@/components/mindmap/HelpPanel';
import MiniMap from '@/components/mindmap/MiniMap';
import StylePanel from '@/components/mindmap/StylePanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import ElectronTitleBar from '@/components/ElectronTitleBar';
import UserMenu from '@/components/auth/UserMenu';
import { useMindmapStore } from '@/stores/mindmapStore';
import { useAuthStore } from '@/stores/authStore';
import { FilePlus, Save, AlertTriangle, ChevronRight, History, Trash2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ScrollArea,
  ScrollBar
} from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const Index: React.FC = () => {
  const { 
    mindmap, 
    savedMindmaps, 
    applyLayout, 
    updateMindmapName, 
    createNewMindmap,
    loadMindmap,
    deleteMindmap,
    isPreviewMode,
    setPreviewMode
  } = useMindmapStore();
  const { initialize: initializeAuth } = useAuthStore();
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);
  const [mindmapToDelete, setMindmapToDelete] = React.useState<string | null>(null);
  
  // Initialize auth
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle preview mode keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewMode) {
        setPreviewMode(false);
      }
      // F11 to toggle preview mode instead of browser default if possible
      if (e.key === 'F11') {
        if (e.cancelable) {
          e.preventDefault();
        }
        setPreviewMode(!isPreviewMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isPreviewMode, setPreviewMode]);

  // Handle browser fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPreviewMode) {
        setPreviewMode(false);
      }
    };

    if (isPreviewMode) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to exit full-screen mode: ${err.message}`);
        });
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isPreviewMode, setPreviewMode]);

  // Apply initial layout
  useEffect(() => {
    applyLayout();
  }, [applyLayout]);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMindmapName(e.target.value);
  };
  
  const handleConfirmNew = () => {
    createNewMindmap();
    toast.success("已创建新的思维导图");
    setIsNewDialogOpen(false);
  };
  
  return (
    <div className={`w-screen h-screen bg-background overflow-hidden flex flex-col ${isPreviewMode ? 'preview-mode' : ''}`}>
      {!isPreviewMode && <ElectronTitleBar />}
      {/* Header */}
      {!isPreviewMode && (
        <header className="flex-shrink-0 h-14 border-b border-border flex items-center px-4 gap-4 bg-card/50 backdrop-blur-md z-50">
          {/* Simplified Header - Removed redundant logo and name if requested, but keeping recent list */}
          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 text-muted-foreground mr-1 flex-shrink-0">
              <History className="w-4 h-4" />
              <span className="text-xs font-medium hidden md:inline-block">最近</span>
            </div>
            
            <ScrollArea className="flex-1 whitespace-nowrap">
              <div className="flex items-center gap-2 pb-1">
                {savedMindmaps.map((m) => (
                  <div 
                    key={m.id}
                    className={`
                      group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-sm
                      ${m.id === mindmap.id 
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium' 
                        : 'bg-muted/30 border-transparent hover:bg-muted hover:border-border/50 text-muted-foreground'}
                    `}
                    onClick={() => loadMindmap(m.id)}
                  >
                    <span className="max-w-[100px] truncate">{m.name || '未命名导图'}</span>
                    {savedMindmaps.length > 1 && (
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMindmapToDelete(m.id);
                      }}
                      className={`
                        p-0.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors
                        ${m.id === mindmap.id ? 'opacity-0 group-hover:opacity-100' : 'hidden group-hover:flex'}
                      `}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>

          <div className="h-8 w-px bg-border/60 mx-1" />
          
          <div className="flex items-center gap-2 group flex-shrink-0">
            <input
              type="text"
              value={mindmap.name}
              onChange={handleNameChange}
              className="bg-transparent border-none text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-2 py-1.5 w-40 md:w-48 hover:bg-accent/50 transition-colors"
              placeholder="未命名思维导图"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary transition-all shadow-sm"
                  onClick={() => setIsNewDialogOpen(true)}
                >
                  <FilePlus className="w-4.5 h-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>新建思维导图</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">自动保存已开启</span>
            </div>
            
            <div className="h-6 w-px bg-border/40" />
            
            <ThemeToggle />
            
            <div className="h-6 w-px bg-border/40" />
            
            <UserMenu />
            
            <div className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50 hidden sm:block">
              {Object.keys(mindmap.nodes).length} 节点
            </div>
          </div>
        </header>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mindmapToDelete} onOpenChange={(open) => !open && setMindmapToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              确定要删除此导图吗？
            </AlertDialogTitle>
            <AlertDialogDescription>
              这将永久删除 "{savedMindmaps.find(m => m.id === mindmapToDelete)?.name}" 及其所有节点内容。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (mindmapToDelete) {
                  deleteMindmap(mindmapToDelete);
                  toast.success("已删除思维导图");
                  setMindmapToDelete(null);
                }
              }} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              确定要新建思维导图吗？
            </AlertDialogTitle>
            <AlertDialogDescription>
              当前内容将被清空，请确保你已经完成了当前导图的编辑。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNew} className="bg-primary hover:bg-primary/90">
              确认新建
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative">
        <MindmapCanvas />
        {!isPreviewMode && (
          <>
            <Toolbar />
            <LeftToolbar />
            <StylePanel />
            <HelpPanel />
            <MiniMap />
          </>
        )}
        
        {/* Exit Preview Button */}
        {isPreviewMode && (
          <div className="absolute top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewMode(false)}
              className="group flex items-center gap-2 px-4 h-10 rounded-full shadow-2xl bg-background/80 backdrop-blur-md border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
            >
              <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">退出预览</span>
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 group-hover:text-primary-foreground group-hover:border-primary-foreground/30">
                Esc
              </kbd>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
