import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Keyboard, 
  MousePointer2, 
  Zap, 
  Layout, 
  ChevronRight,
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ open, onOpenChange }) => {
  const shortcutGroups = [
    {
      title: '节点操作',
      icon: <Layout className="w-4 h-4" />,
      items: [
        { keys: ['Enter'], desc: '插入兄弟节点' },
        { keys: ['Tab'], desc: '插入子节点' },
        { keys: ['F2'], desc: '编辑当前节点' },
        { keys: ['Delete'], desc: '删除选中节点' },
        { keys: ['Space'], desc: '展开/折叠子节点' },
        { keys: ['Ctrl', 'Z'], desc: '撤销' },
        { keys: ['Ctrl', 'Shift', 'Z'], desc: '重做' },
      ]
    },
    {
      title: '画布与视图',
      icon: <MousePointer2 className="w-4 h-4" />,
      items: [
        { keys: ['Space', '拖拽'], desc: '平移画布' },
        { keys: ['Ctrl', '滚轮'], desc: '放大/缩小' },
        { keys: ['Ctrl', '0'], desc: '适应屏幕' },
        { keys: ['双击空白'], desc: '自动整理布局' },
      ]
    }
  ];

  const aiTips = [
    {
      title: '智能脑暴',
      desc: '选中一个节点，点击工具栏的 AI 图标，即可自动生成相关子主题。',
    },
    {
      title: '上下文理解',
      desc: 'AI 会根据父节点和已有的同级节点内容，生成逻辑更连贯的建议。',
    },
    {
      title: '一键整理',
      desc: '复杂的想法交给 AI，它能帮您快速梳理层级关系。',
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[600px] p-0 flex flex-col overflow-hidden border-none bg-background/95 backdrop-blur-xl">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[200px] border-r bg-muted/30 p-4 flex flex-col gap-1 shrink-0">
            <DialogTitle className="flex items-center gap-2 px-2 py-4 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-foreground">帮助指南</span>
            </DialogTitle>
            
            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="shortcuts" 
                className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Keyboard className="w-4 h-4" />
                快捷键说明
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Zap className="w-4 h-4" />
                AI 助手技巧
              </TabsTrigger>
              <TabsTrigger 
                value="faq" 
                className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <HelpCircle className="w-4 h-4" />
                常见问题
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <Tabs defaultValue="shortcuts" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-8">
              <TabsContent value="shortcuts" className="mt-0 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-1">键盘快捷键</h3>
                  <p className="text-sm text-muted-foreground">熟练使用快捷键，让创作快如闪电。</p>
                </div>

                {shortcutGroups.map((group) => (
                  <div key={group.title} className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      {group.icon}
                      {group.title}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {group.items.map((item) => (
                        <div key={item.desc} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 group hover:border-primary/30 transition-colors">
                          <span className="text-sm font-medium">{item.desc}</span>
                          <div className="flex gap-1">
                            {item.keys.map((key) => (
                              <kbd key={key} className="px-2 py-1 bg-muted rounded text-[10px] font-mono border shadow-sm min-w-[24px] flex items-center justify-center">
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="mt-0 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-1">AI 助手技巧</h3>
                  <p className="text-sm text-muted-foreground">让 DeepSeek 助您的创意一臂之力。</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {aiTips.map((tip) => (
                    <div key={tip.title} className="p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-12 h-12 text-primary" />
                      </div>
                      <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-current" />
                        {tip.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground relative z-10">
                        {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl border-2 border-dashed border-border flex flex-col items-center text-center gap-3">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                  <div className="space-y-1">
                    <h4 className="font-bold">更多 AI 功能探索中</h4>
                    <p className="text-sm text-muted-foreground">一键总结、语气转换、多语言翻译即将上线。</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">常见问题</h3>
                  <p className="text-sm text-muted-foreground">如果您遇到困难，请先在这里查找。</p>
                </div>

                <div className="space-y-4">
                  {[
                    { q: '如何保存我的思维导图？', a: '系统会自动实时保存。如果您登录了账号，数据会同步到云端。' },
                    { q: '支持哪些导出格式？', a: '目前支持 PNG、JPG。专业版用户支持 SVG 和 PDF 矢量导出。' },
                    { q: '可以离线使用吗？', a: '可以！您的数据会优先保存在浏览器本地。' },
                    { q: 'AI 生成次数有限制吗？', a: '免费版用户每天 20 次，专业版用户无限制生成。' },
                  ].map((faq) => (
                    <div key={faq.q} className="p-4 rounded-xl border bg-card/50">
                      <div className="font-bold mb-1 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        {faq.q}
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Sparkles: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default HelpGuideModal;
