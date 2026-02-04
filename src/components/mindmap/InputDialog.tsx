import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Video, Upload, Link as LinkIcon, Sparkles, BrainCircuit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  type?: 'text' | 'image' | 'video' | 'ai';
  defaultValue?: string;
  placeholder?: string;
}

import { toast } from "sonner";

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  type = 'text',
  defaultValue = '',
  placeholder = '',
}) => {
  const [value, setValue] = useState(defaultValue);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Determine if this is an AI-related dialog
  const isAI = type === 'ai' || title.toLowerCase().includes('ai');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit(value);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('请选择有效的图片文件');
      return;
    }
    
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('请选择有效的视频文件');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setValue(dataUrl);
      setIsUploading(false);
      // Auto submit after upload for better UX
      onSubmit(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-[480px] overflow-hidden ${isAI ? 'border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : ''}`}>
        {isAI && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500" />
        )}
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            {isAI ? (
              <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-500">
                <Sparkles className="w-5 h-5" />
              </div>
            ) : type === 'image' ? (
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <ImageIcon className="w-5 h-5" />
              </div>
            ) : type === 'video' ? (
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Video className="w-5 h-5" />
              </div>
            ) : null}
            <span className={isAI ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" : ""}>
              {title}
            </span>
          </DialogTitle>
        </DialogHeader>

        {type === 'image' || type === 'video' ? (
          <div className="py-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" /> 上传{type === 'image' ? '图片' : '视频'}
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> {type === 'image' ? '图片' : '视频'} URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <div 
                  className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium">点击或拖拽上传{type === 'image' ? '图片' : '视频'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {type === 'image' ? '支持 JPG, PNG, GIF, SVG' : '支持 MP4, WebM, OGG'}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={type === 'image' ? "image/*" : "video/*"}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {isUploading && <p className="text-xs text-primary animate-pulse">正在处理...</p>}
                </div>
              </TabsContent>
              
              <TabsContent value="url">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`请输入${type === 'image' ? '图片' : '视频'} URL (https://...)`}
                    className="w-full h-12 text-base"
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-6">
                      取消
                    </Button>
                    <Button type="submit" disabled={!value} className="rounded-full px-8">确定</Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {isAI && (
              <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-4 mb-2">
                <div className="flex items-center gap-2 text-violet-600 mb-1">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Copilot</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  我可以为您提供创意延伸、知识点拆解或逻辑梳理。
                </p>
              </div>
            )}
            
            <div className="relative group">
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={`w-full h-14 text-base px-4 rounded-xl transition-all ${
                  isAI 
                    ? 'border-violet-200 focus-visible:ring-violet-500 focus-visible:border-violet-500 shadow-sm' 
                    : 'focus-visible:ring-primary shadow-sm'
                }`}
              />
              {isAI && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 group-focus-within:text-violet-600 transition-colors">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-8 flex gap-3 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="rounded-full px-6 h-11"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                className={`rounded-full px-8 h-11 font-medium transition-all ${
                  isAI 
                    ? 'bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200' 
                    : 'shadow-lg shadow-primary/20'
                }`}
              >
                {isAI ? '开始生成' : '确定'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InputDialog;
