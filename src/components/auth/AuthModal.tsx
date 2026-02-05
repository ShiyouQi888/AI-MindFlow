import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import SliderCaptcha from './SliderCaptcha';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const { signIn, signUp } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaPassed) {
      toast.error('请先完成滑块验证');
      return;
    }
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('登录成功！欢迎回来');
        onOpenChange(false);
      } else {
        const { error } = await signUp(email, password, username);
        if (error) throw error;
        setIsRegisterSuccess(true);
        toast.success('注册成功！');
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
    setIsRegisterSuccess(false);
    setCaptchaPassed(false);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setIsRegisterSuccess(false);
        setActiveTab('login');
        setCaptchaPassed(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
        <div className="bg-background relative overflow-hidden flex flex-col min-h-[500px]">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent -z-10" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md p-1.5">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">AI MindFlow</h2>
              </div>
              <p className="text-sm text-muted-foreground">记录灵感，连接思绪</p>
            </div>

            {isRegisterSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">注册成功！</h3>
                <div className="space-y-4 text-sm text-muted-foreground mb-8">
                  <p>我们已向您的邮箱发送了一封确认邮件：</p>
                  <p className="font-medium text-foreground py-2 px-4 bg-muted rounded-lg break-all">{email}</p>
                  <p>请点击邮件中的链接激活您的账户，然后即可登录使用。</p>
                </div>
                <Button 
                  onClick={() => {
                    setIsRegisterSuccess(false);
                    setActiveTab('login');
                  }}
                  className="w-full h-11 shadow-lg shadow-primary/20"
                >
                  去登录
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
                  <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">登录</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">注册</TabsTrigger>
                </TabsList>

                <form onSubmit={handleAuth} className="space-y-4">
                  <TabsContent value="login" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">邮箱地址</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-xs font-medium text-muted-foreground">登录密码</Label>
                        <button type="button" className="text-[10px] text-primary hover:underline">忘记密码？</button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">个性昵称</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="灵感大师"
                          className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">邮箱地址</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">设置密码</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="mt-6 space-y-4">
                    <SliderCaptcha onSuccess={() => setCaptchaPassed(true)} />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 shadow-lg shadow-primary/20 group" 
                      disabled={loading || !captchaPassed}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <>
                          {activeTab === 'login' ? '立即登录' : '创建账户'}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Tabs>
            )}

            <div className="mt-auto pt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                数据已加密
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Zap className="w-3 h-3 text-amber-500" />
                云同步已开启
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
