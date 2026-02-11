import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Trash2, Minimize2, Maximize2, MessageSquare, Bot, User, Wand2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
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
    updateChatMessage,
    applyAIChatContent,
    setAIProcessing,
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
        // 流式更新时使用 instant 避免平滑滚动的抖动
        const isStreaming = isAIProcessing && messages.length > 0 && messages[messages.length - 1].role === 'assistant';
        
        requestAnimationFrame(() => {
          scrollArea.scrollTo({
            top: scrollArea.scrollHeight,
            behavior: isStreaming ? 'auto' : 'smooth'
          });
        });
      }
    }
  }, [messages, isOpen, isAIProcessing]);

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
    setAIProcessing(true);
    
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
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 响应失败');
      }

      // 创建一个空的助手消息
      const assistantMsgId = Math.random().toString(36).substring(2, 11);
      addChatMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: ''
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 50; // 50ms 刷新频率，减少闪烁

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  assistantContent += content;
                  
                  const now = Date.now();
                  if (now - lastUpdateTime > UPDATE_INTERVAL) {
                    updateChatMessage(assistantMsgId, assistantContent);
                    lastUpdateTime = now;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        // 确保最后一次更新
        updateChatMessage(assistantMsgId, assistantContent);
      }

      // 更新使用次数
      if (user) {
        updateAIUsage(user.id);
      }
      setAIProcessing(false);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setAIProcessing(false);
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

  const handleApplyContent = (content: string, messageId: string) => {
    const selectedNodeId = selectionState.selectedNodeIds[0] || mindmap.rootId;
    applyAIChatContent(selectedNodeId, content, messageId);
  };

  const MessageBubble: React.FC<{ msg: any; isStreaming?: boolean }> = ({ msg, isStreaming }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('已复制到剪贴板');
    };

    const isUser = msg.role === 'user';

    const markdownComponents = React.useMemo(() => ({
      ul: ({ children }: any) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
      ol: ({ children }: any) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
      li: ({ children }: any) => <li className="marker:text-primary/40 break-words">{children}</li>,
      p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed text-sm break-words whitespace-pre-wrap">{children}</p>,
      code: ({ children, inline }: any) => (
        inline 
          ? <code className="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono text-primary break-all">{children}</code>
          : <div className="relative my-2">
              <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto custom-scrollbar">
                <code className="text-[12px] font-mono text-foreground">{children}</code>
              </pre>
            </div>
      ),
      h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2 mt-4 break-words">{children}</h1>,
      h2: ({ children }: any) => <h2 className="text-md font-bold mb-2 mt-3 break-words">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-sm font-bold mb-1 mt-2 break-words">{children}</h3>,
      blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary/20 pl-3 italic my-2 text-muted-foreground break-words">{children}</blockquote>,
    }), []);

    return (
      <motion.div 
        // 仅对非流式消息开启布局动画，避免打字机过程中的抖动
        layout={isStreaming ? false : "position"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.25, 
          ease: "easeOut",
          // 流式更新时禁用布局过渡
          layout: { duration: isStreaming ? 0 : 0.25 }
        }}
        className={cn(
          "flex gap-3 w-full mb-6",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300",
          isUser 
            ? "bg-primary text-primary-foreground border-primary/20" 
            : "bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-200/50"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        {/* Bubble Content */}
        <div className={cn(
          "flex flex-col gap-1.5 max-w-[85%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "relative group/msg px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-sm w-full",
            !isStreaming && "transition-all duration-300",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10" 
              : "bg-card text-foreground rounded-tl-none border border-border/50 hover:border-primary/20 shadow-violet-500/5"
          )}>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={cn(
                "absolute -top-2 p-1.5 rounded-lg bg-background border border-border shadow-sm opacity-0 group-hover/msg:opacity-100 transition-all duration-200 hover:bg-muted z-10",
                isUser ? "-left-8" : "-right-8"
              )}
              title="复制内容"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {/* Message Body */}
            <div className={cn(
              "markdown-content prose prose-sm max-w-none dark:prose-invert break-words overflow-hidden",
              isUser ? "prose-p:text-primary-foreground" : "prose-p:text-foreground"
            )}>
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className="relative">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {isStreaming && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle rounded-sm shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* AI Action Button - 仅在生成完成后显示，避免生成过程中的布局跳动 */}
            {!isUser && !isStreaming && hasStructuredContent(msg.content) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  size="sm"
                  variant={msg.isApplied ? "ghost" : "secondary"}
                  className={cn(
                    "mt-4 w-full h-10 text-xs gap-2 transition-all shadow-md font-semibold rounded-xl border",
                    msg.isApplied 
                      ? "bg-muted text-muted-foreground border-transparent cursor-default" 
                      : "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 text-primary hover:from-primary hover:to-primary hover:text-primary-foreground hover:shadow-primary/20"
                  )}
                  onClick={() => !msg.isApplied && handleApplyContent(msg.content, msg.id)}
                  disabled={msg.isApplied}
                >
                  <Wand2 className={cn("w-4 h-4", !msg.isApplied && "animate-pulse")} />
                  {msg.isApplied ? "方案已应用" : "应用方案到思维导图"}
                </Button>
              </motion.div>
            )}
          </div>
          
          {/* Timestamp */}
          <span className="text-[10px] text-muted-foreground/40 px-1">
            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>
    );
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
                  <AnimatePresence initial={false}>
                    {user && messages.map((msg, index) => {
                      const isLast = index === messages.length - 1;
                      const isStreaming = isLast && isAIProcessing && msg.role === 'assistant';
                      return <MessageBubble key={msg.id} msg={msg} isStreaming={isStreaming} />;
                    })}
                  </AnimatePresence>
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
