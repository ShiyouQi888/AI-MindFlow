import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Sparkles, Rocket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onOpenChange }) => {
  const { subscription } = useAuthStore();
  const isPro = subscription?.plan_type === 'pro';

  const plans = [
    {
      name: '免费版',
      price: '¥0',
      period: '/永久',
      description: '适合个人基础灵感记录',
      icon: <Sparkles className="w-5 h-5 text-slate-400" />,
      features: [
        '基础思维导图编辑',
        '本地存储 (无限制)',
        '云端项目存储 (3个)',
        '标准质量导出 (PNG/JPG)',
        'AI 节点生成 (体验版)',
      ],
      current: !isPro,
      buttonText: '当前方案',
      buttonVariant: 'outline' as const,
    },
    {
      name: '专业版',
      price: '¥19',
      period: '/月',
      description: '解锁 AI 生产力与无限云端',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      features: [
        '所有免费版功能',
        '无限云端项目存储',
        'AI 节点生成 (无限制)',
        '超清/矢量导出 (SVG/PDF)',
        '专属主题与配色方案',
        '多端同步与优先支持',
      ],
      current: isPro,
      buttonText: isPro ? '当前方案' : '立即升级',
      buttonVariant: 'default' as const,
      popular: true,
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                会员订阅
              </Badge>
            </div>
            <DialogTitle className="text-3xl font-bold">选择适合您的创作方案</DialogTitle>
            <DialogDescription className="text-base">
              升级到专业版，让 AI 助您释放无限灵感。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 ${
                  plan.popular 
                    ? 'border-primary shadow-xl shadow-primary/10 bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Zap className="w-3 h-3 fill-current" />
                    最受欢迎
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-background border shadow-sm group-hover:scale-110 transition-transform">
                    {plan.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{plan.price}</div>
                    <div className="text-xs text-muted-foreground">{plan.period}</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-sm">
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        plan.popular ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-foreground/80 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full h-11 font-bold ${plan.popular ? 'shadow-lg shadow-primary/20' : ''}`}
                  variant={plan.buttonVariant}
                  disabled={plan.current}
                >
                  {plan.buttonText}
                  {!plan.current && plan.popular && <Rocket className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-8">
            订阅即表示您同意我们的《服务协议》和《隐私政策》。随时可以取消。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
