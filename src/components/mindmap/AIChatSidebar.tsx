import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Trash2, Minimize2, Maximize2, MessageSquare, Bot, User, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMindmapStore } from '@/stores/mindmapStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AIChatSidebar: React.FC = () => {
  const { 
    aiChatState, 
    setAIChatOpen, 
    addChatMessage, 
    clearChatHistory, 
    applyAIChatContent,
    aiConfig,
    isAIProcessing,
    mindmap,
    selectionState
  } = useMindmapStore();

  const { user, subscription, setAuthModalOpen, updateAIUsage } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { isOpen, messages } = aiChatState;

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
        requestAnimationFrame(() => {
          scrollArea.scrollTo({
            top: scrollArea.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isCollapsed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isCollapsed]);

  const handleSend = async () => {
    if (!input.trim() || isAIProcessing) return;

    // Check if user is logged in and subscription status
    if (!user) {
      toast.error('请先登录以使用 AI 助理');
      setAuthModalOpen(true);
      return;
    }

    // Check AI usage limit
    if (subscription) {
      if (subscription.status === 'free' && subscription.ai_usage_count >= 1) {
        toast.error('您已达到今日 AI 使用限额。请升级订阅以解锁无限次数。');
        return;
      }
    }

    const userPrompt = input.trim();
    setInput('');
    
    // Add user message
    addChatMessage({
      role: 'user',
      content: userPrompt
    });

    if (!aiConfig.apiKey) {
      toast.error('请先配置 AI API Key');
      addChatMessage({
        role: 'assistant',
        content: '抱歉，我无法回答。请先在设置中配置您的 DeepSeek API Key。'
      });
      return;
    }

    try {
      // Show thinking status in store if needed, or handle locally
      // For simplicity, we'll just make the fetch call here
      const response = await fetch(`${aiConfig.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的思维导图助手，名叫 AI MindFlow。你可以回答用户关于思维导图的问题，提供创意方案，或者直接根据用户的要求生成思维导图结构（使用 Markdown 列表格式）。在生成列表结构时，请务必在列表前后添加简短的文字说明，告知用户你已经生成了方案。'
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0].message.content) {
        addChatMessage({
          role: 'assistant',
          content: data.choices[0].message.content
        });
        
        // Update usage count
        if (user) {
          updateAIUsage(user.id);
        }
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      toast.error('AI 响应失败，请稍后重试');
      addChatMessage({
        role: 'assistant',
        content: '抱歉，服务出现了一点问题，请检查网络或 API 配置后重试。'
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const hasStructuredContent = (content: string) => {
    return /^\s*([-*+]\s+|\d+\.\s+|#+\s+)/m.test(content);
  };

  const getCleanText = (content: string) => {
    // 1. 先移除代码块内容 (```...```)
    let text = content.replace(/```[\s\S]*?```/g, '');

    // 2. 按行处理，仅过滤掉结构化的列表行和标题行
    const lines = text.split('\n');
    const filteredLines = lines.map(line => {
      const trimmed = line.trim();
      
      // 如果是列表项 (-, *, +, 1.) 或 标题 (#)，则该行在预览中不显示
      if (/^\s*([-*+]\s+|\d+\.\s+|#+\s+)/.test(line)) {
        return null;
      }
      
      // 如果是分割线，不显示
      if (/^[-*_]{3,}$/.test(trimmed)) {
        return null;
      }

      // 保留其他所有普通文本行
      return line;
    }).filter(line => line !== null);

    let cleanText = filteredLines.join('\n').trim();

    // 3. 彻底移除预览文本中的所有 Markdown 格式符号（加粗、斜体、行内代码等）
    cleanText = cleanText
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/`/g, '');

    // 如果过滤后为空，且原内容包含结构化数据，显示提示语
    if (!cleanText && hasStructuredContent(content)) {
      return "我已经为您规划好了思维导图结构，您可以点击下方按钮将其应用到画布中：";
    }

    return cleanText;
  };

  const handleApplyContent = (content: string) => {
    const selectedNodeId = selectionState.selectedNodeIds[0] || mindmap.rootId;
    applyAIChatContent(selectedNodeId, content);
  };

  return (
    <div 
      className={cn(
        "h-full bg-background border-l border-border transition-all duration-300 ease-in-out z-[40] flex flex-col",
        isCollapsed ? "w-12" : "w-[420px]"
      )}
    >
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-h-0",
        isCollapsed ? "p-1" : "p-3 bg-secondary/30 backdrop-blur-xl"
      )}>
        <div className={cn(
          "flex-1 flex flex-col bg-card border border-border shadow-lg overflow-hidden min-h-0",
          isCollapsed ? "rounded-lg" : "rounded-2xl"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm transition-all flex-shrink-0",
            isCollapsed ? "flex-col py-4 px-0 gap-4 h-full" : "px-4 py-3"
          )}>
            <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="font-bold text-sm tracking-tight">AI 助理</span>}
            </div>
            <div className={cn("flex items-center gap-1", isCollapsed && "flex-col mt-auto pb-4")}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "展开" : "收起"}
              >
                {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                onClick={() => setAIChatOpen(false)}
                title="关闭"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className={cn(
            "flex-1 flex flex-col min-h-0 transition-opacity duration-300",
            isCollapsed ? "opacity-0 invisible pointer-events-none" : "opacity-100"
          )}>
            {/* Chat Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4" type="auto">
                <div className="space-y-6 pb-4">
                  {!user && (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 p-6 bg-primary/5 rounded-3xl border border-dashed border-primary/20">
                      <div className="p-4 bg-primary/10 rounded-full shadow-inner">
                        <Bot className="w-10 h-10 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-bold text-foreground">欢迎使用 AI 助理</p>
                        <p className="text-sm text-muted-foreground">登录后即可开启智能对话，体验高效创作</p>
                      </div>
                      <Button 
                        onClick={() => setAuthModalOpen(true)}
                        className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-bold tracking-wide"
                      >
                        立即登录 / 注册
                      </Button>
                    </div>
                  )}

                  {user && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-50">
                      <div className="p-4 bg-primary/5 rounded-full shadow-inner">
                        <MessageSquare className="w-8 h-8 text-primary/40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">开始与 AI 助理对话</p>
                        <p className="text-xs text-muted-foreground">您可以问我任何问题，或让我帮您规划思维导图</p>
                      </div>
                    </div>
                  )}
                  {user && messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/50",
                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card text-violet-600"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed relative group/msg shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted/50 text-foreground rounded-tl-none border border-border/30"
                      )}>
                        {msg.role === 'assistant' ? (getCleanText(msg.content) || msg.content) : msg.content}
                        
                        {msg.role === 'assistant' && hasStructuredContent(msg.content) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mt-4 w-full h-10 text-xs gap-2 bg-background border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-md font-semibold rounded-xl"
                            onClick={() => handleApplyContent(msg.content)}
                          >
                            <Wand2 className="w-4 h-4" />
                            应用方案到思维导图
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 pt-2 bg-card border-t border-border/50 flex-shrink-0">
                <div className={cn(
                  "relative flex flex-col gap-2 p-2 bg-muted/30 border border-border rounded-2xl transition-all shadow-inner",
                  user ? "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30" : "opacity-50 grayscale pointer-events-none"
                )}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={user ? "输入您的问题..." : "登录后开启对话"}
                    disabled={!user}
                    className="w-full min-h-[100px] max-h-[250px] p-2 bg-transparent border-none text-sm resize-none focus:outline-none placeholder:text-muted-foreground/40 custom-scrollbar leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-1 pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => setIsClearDialogOpen(true)}
                      disabled={!user}
                      title="清空记录"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </Button>

                    <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <div className="p-1.5 bg-destructive/10 rounded-lg">
                              <Trash2 className="w-5 h-5" />
                            </div>
                            确定要清空聊天记录吗？
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            这将永久删除所有历史对话内容。此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              clearChatHistory();
                              toast.success('已清空聊天记录');
                            }} 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            确认清空
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground/40 hidden sm:block">Shift + Enter 换行</span>
                      <Button
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-xl shadow-lg transition-all active:scale-95",
                          input.trim() && user ? "bg-primary shadow-primary/30 hover:scale-105" : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                        )}
                        onClick={handleSend}
                        disabled={!input.trim() || isAIProcessing || !user}
                      >
                        <Send className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-center text-muted-foreground/30 font-medium">
                  AI 可能会产生误差，请核实重要信息
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatSidebar;
