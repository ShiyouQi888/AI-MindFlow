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
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-background relative overflow-hidden flex flex-col md:flex-row min-h-[550px]">
          {/* Left Side: Branding & Decorative */}
          <div className="hidden md:flex flex-col items-center justify-center w-[340px] bg-muted/30 relative overflow-hidden p-8 border-r">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent -z-10" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl p-3 transform hover:rotate-6 transition-transform duration-300">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
                  AI MindFlow
                </h2>
                <p className="text-muted-foreground font-medium">记录灵感，连接思绪</p>
              </div>
              
              <div className="pt-8 space-y-4 w-full">
                <div className="flex items-center gap-3 px-4 py-3 bg-background/50 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">智能生成</p>
                    <p className="text-[10px] text-muted-foreground">AI 助力思维发散</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-background/50 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">实时同步</p>
                    <p className="text-[10px] text-muted-foreground">多端协同无缝连接</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="flex-1 p-8 flex flex-col">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="md:hidden flex flex-col items-center text-center mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md p-1">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">AI MindFlow</DialogTitle>
              </div>
            </div>

            {/* Desktop DialogTitle (Hidden visually, for accessibility) */}
            <DialogTitle className="sr-only">账号登录与注册</DialogTitle>
            
            <div className="flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
              {isRegisterSuccess ? (
                <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">注册成功！</h3>
                  <div className="space-y-4 text-sm text-muted-foreground mb-8">
                    <p>我们已向您的邮箱发送了一封确认邮件：</p>
                    <p className="font-medium text-foreground py-2 px-4 bg-muted rounded-lg break-all">{email}</p>
                    <p>请点击激活链接激活账户后登录。</p>
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
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-1">
                      {activeTab === 'login' ? '欢迎回来' : '开启创作之旅'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'login' ? '请登录您的账号以继续' : '只需几步即可创建您的账号'}
                    </p>
                  </div>

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
            </div>

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
