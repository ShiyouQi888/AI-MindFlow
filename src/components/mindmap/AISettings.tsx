import React from 'react';
import { useMindmapStore } from '@/stores/mindmapStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bot, Save, Globe, Key, Cpu } from 'lucide-react';
import { toast } from 'sonner';

interface AISettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ open, onOpenChange }) => {
  const { aiConfig, setAIConfig } = useMindmapStore();
  const [config, setConfig] = React.useState(aiConfig);

  React.useEffect(() => {
    setConfig(aiConfig);
  }, [aiConfig, open]);

  const handleSave = () => {
    setAIConfig(config);
    toast.success('AI 配置已保存');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI 助手设置
          </DialogTitle>
          <DialogDescription>
            配置您的 AI 模型参数。目前支持 OpenAI 兼容格式的 API（如 DeepSeek）。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="ai-enabled" className="flex flex-col gap-1">
              <span>启用 AI 功能</span>
              <span className="font-normal text-xs text-muted-foreground">开启后可使用智能生成功能</span>
            </Label>
            <Switch
              id="ai-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="base-url" className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              API Base URL
            </Label>
            <Input
              id="base-url"
              placeholder="请输入 API 地址"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              模型名称
            </Label>
            <Input
              id="model"
              placeholder="请输入模型名称"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AISettings;
