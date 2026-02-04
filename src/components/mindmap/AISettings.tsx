import React from 'react';
import { Settings, Sparkles, Key, Globe, Cpu } from 'lucide-react';
import { useMindmapStore } from '@/stores/mindmapStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AISettings: React.FC = () => {
  const { aiConfig, setAIConfig } = useMindmapStore();

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md shadow-lg border-border hover:border-primary/50 transition-colors"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">AI 功能配置</TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI 功能配置
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                DeepSeek API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={aiConfig.apiKey}
                onChange={(e) => setAIConfig({ apiKey: e.target.value })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                前往 <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">DeepSeek 开放平台</a> 获取 API Key
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="baseUrl" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                API 基础路径
              </Label>
              <Input
                id="baseUrl"
                placeholder="https://api.deepseek.com"
                value={aiConfig.baseUrl}
                onChange={(e) => setAIConfig({ baseUrl: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                模型名称
              </Label>
              <Input
                id="model"
                placeholder="deepseek-chat"
                value={aiConfig.model}
                onChange={(e) => setAIConfig({ model: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs text-primary/80">
                配置完成后，选中节点会出现 AI 图标，点击图标即可呼出对话框扩展思路。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AISettings;
