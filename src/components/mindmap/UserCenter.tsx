import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMindmapStore } from '@/stores/mindmapStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, CreditCard, LogOut, Settings, Bot, Globe, Key, Cpu } from 'lucide-react';
import { toast } from 'sonner';

interface UserCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserCenter: React.FC<UserCenterProps> = ({ open, onOpenChange }) => {
  const { user, profile, subscription, signOut } = useAuthStore();
  const { aiConfig, setAIConfig } = useMindmapStore();
  const [username, setUsername] = React.useState(profile?.username || '');
  const [config, setConfig] = React.useState(aiConfig);

  React.useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  React.useEffect(() => {
    setConfig(aiConfig);
  }, [aiConfig, open]);

  const handleUpdateProfile = () => {
    // 这里可以添加更新个人资料的逻辑
    toast.success('个人资料已更新');
  };

  const handleSaveAIConfig = () => {
    setAIConfig(config);
    toast.success('AI 配置已保存');
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            用户中心
          </DialogTitle>
          <DialogDescription>
            管理您的个人资料和账户设置。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="account">账户订阅</TabsTrigger>
            <TabsTrigger value="ai">AI 设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{profile?.username || '未设置昵称'}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="username">昵称</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <Button onClick={handleUpdateProfile} className="w-full">更新资料</Button>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">当前版本</span>
                <Badge variant={subscription?.plan_type === 'pro' ? 'default' : 'secondary'}>
                  {subscription?.plan_type === 'pro' ? 'PRO 专业版' : 'FREE 免费版'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {subscription?.plan_type === 'pro' 
                  ? '您已解锁所有专业功能，享受无限 AI 生成和云同步。' 
                  : '升级到专业版以解锁 AI 助手和无限存储空间。'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>邮箱验证</span>
                </div>
                <span className="text-green-500 font-medium">已验证</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>账户安全</span>
                </div>
                <span className="text-muted-foreground">常规级别</span>
              </div>
            </div>
            
            <Separator />
            
            <Button onClick={() => signOut()} variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
            <div className="grid gap-4">
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
                <p className="text-[10px] text-muted-foreground">若留空则使用系统默认 API Key (仅限订阅用户或免费额度)</p>
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
            
            <Button onClick={handleSaveAIConfig} className="w-full mt-2">保存 AI 配置</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserCenter;
