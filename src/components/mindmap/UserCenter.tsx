import React from 'react';
import { useAuthStore } from '@/stores/authStore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, CreditCard, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface UserCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserCenter: React.FC<UserCenterProps> = ({ open, onOpenChange }) => {
  const { user, profile, subscription, signOut } = useAuthStore();
  const [username, setUsername] = React.useState(profile?.username || '');

  React.useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUpdateProfile = () => {
    // 这里可以添加更新个人资料的逻辑
    toast.success('个人资料已更新');
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="account">账户订阅</TabsTrigger>
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
            
            <Button variant="destructive" onClick={() => signOut()} className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              退出登录
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserCenter;
