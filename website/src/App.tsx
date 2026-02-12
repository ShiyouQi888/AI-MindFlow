import React from 'react';
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Layout, 
  Download, 
  Github, 
  Mail, 
  ChevronRight,
  ShieldCheck,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MousePointer2,
  Workflow,
  Type,
  Image,
  PlayCircle,
  Box,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'main' | 'terms' | 'privacy'>('main');
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const faqs = [
    {
      q: "AI MindFlow 是免费的吗？",
      a: "是的，目前 AI MindFlow 的核心功能完全免费开放。您可以直接下载使用，并连接您自己的 AI API 密钥进行创作。"
    },
    {
      q: "支持哪些 AI 模型？",
      a: "目前主要支持 DeepSeek 全系列模型，同时也支持标准的 OpenAI 接口协议，这意味着您可以接入大多数主流的 AI 服务。"
    },
    {
      q: "数据会上传到云端吗？",
      a: "您的思维导图数据默认存储在本地设备上，我们非常重视隐私。只有在您请求 AI 生成时，相关的文本片段会发送到 AI 服务商进行处理。"
    },
    {
      q: "支持 macOS 或 Linux 吗？",
      a: "目前首发版本支持 Windows。macOS 和移动端版本已在开发计划中，敬请期待。"
    }
  ];

  const TermsPage = () => (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">用户协议</h1>
      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. 协议接受</h2>
          <p>欢迎使用 AI MindFlow。通过访问或使用我们的软件，您同意受本用户协议的约束。如果您不同意这些条款，请勿使用本软件。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. 服务内容</h2>
          <p>AI MindFlow 提供基于人工智能的思维导图生成、编辑和管理服务。我们不断更新和优化服务，可能在不事先通知的情况下修改或停止部分功能。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. 用户责任</h2>
          <p>您应对使用本软件产生的所有内容负责。不得利用本服务制作、存储或传播 any 违反法律法规、侵犯他人权利或有害的信息。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. 知识产权</h2>
          <p>AI MindFlow 软件及其所有相关权利归原作者齐世有所有。用户使用 AI 生成的内容，其版权归属遵循相关法律法规，我们不主张用户生成内容的版权。</p>
        </section>
        <button 
          onClick={() => { setActiveTab('main'); window.scrollTo(0, 0); }}
          className="mt-12 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  );

  const PrivacyPage = () => (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. 信息收集</h2>
          <p>AI MindFlow 是一款注重隐私的工具。大部分数据存储在您的本地设备上。我们仅在必要时收集有限的信息，如软件崩溃日志，以改进产品质量。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. AI 数据处理</h2>
          <p>当您使用 AI 功能时，相关的文本请求会被发送 to DeepSeek 等 AI 服务提供商进行处理。我们不会将您的私有数据用于模型训练。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. 信息安全</h2>
          <p>我们采取合理的安全措施保护您的信息。建议您定期备份存储在本地的思维导图文件。</p>
        </section>
        <button 
          onClick={() => { setActiveTab('main'); window.scrollTo(0, 0); }}
          className="mt-12 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('main'); window.scrollTo(0, 0); }}>
            <div className="p-2 bg-violet-600 rounded-xl text-white">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI MindFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => { setActiveTab('main'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">特性</button>
            <button onClick={() => { setActiveTab('main'); setTimeout(() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">下载</button>
            <a href="mailto:shijuebaba@qq.com" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">联系作者</a>
          </div>
          <button 
            onClick={() => { setActiveTab('main'); setTimeout(() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
            className="px-5 py-2 bg-violet-600 text-white rounded-full text-sm font-semibold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95"
          >
            立即下载
          </button>
        </div>
      </nav>

      {activeTab === 'terms' && <TermsPage />}
      {activeTab === 'privacy' && <PrivacyPage />}
      
      {activeTab === 'main' && (
        <>
          {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-200/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-200/30 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-violet-100 text-violet-700 text-xs font-bold mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>智能 AI 驱动，重塑创作体验</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
              让你的灵感 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">如泉涌般绽放</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-500 mb-12 leading-relaxed">
              AI MindFlow 是一款集成 DeepSeek 强大 AI 能力的思维导图工具。
              从一个简单的念头到一张完整的知识图谱，只需几秒钟。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 bg-violet-600 text-white rounded-2xl font-bold text-lg hover:bg-violet-700 transition-all shadow-2xl shadow-violet-200 flex items-center justify-center gap-2 group active:scale-95"
              >
                立即开始
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                了解更多
              </button>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-24 relative max-w-5xl mx-auto group"
          >
            <div className="rounded-[2.5rem] border-8 border-white bg-white p-1 shadow-[0_40px_100px_-20px_rgba(139,92,246,0.3)] overflow-hidden">
              <div className="rounded-[2rem] bg-white aspect-video flex items-center justify-center overflow-hidden relative">
                {/* Simulated UI */}
                <div className="absolute inset-0 bg-slate-50 flex">
                  {/* Sidebar */}
                  <div className="w-16 border-r border-slate-200 flex flex-col items-center py-6 gap-6">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600"><Brain className="w-5 h-5" /></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                  </div>
                  {/* Canvas */}
                  <div className="flex-1 p-12 relative">
                    <div className="w-32 h-12 bg-violet-600 rounded-xl shadow-lg mx-auto flex items-center justify-center text-white font-bold text-xs">中心主题</div>
                    <div className="mt-8 flex justify-center gap-12">
                      <div className="w-24 h-10 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                      <div className="w-24 h-10 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                    </div>
                  </div>
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-6 py-3 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center gap-3 scale-90 group-hover:scale-100 transition-transform">
                    <MousePointer2 className="w-5 h-5 text-violet-600" />
                    <span className="font-bold text-slate-800">探索智能交互</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">为什么选择 AI MindFlow？</h2>
            <p className="text-slate-600">更智能、更高效、更懂你的思维伴侣</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "AI 一键生成",
                desc: "只需输入主题或一句话，AI 即可为你自动规划完整的思维导图结构。"
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "智能对话辅助",
                desc: "集成侧边栏 AI 助理，随时解答你的疑问，提供创意方案和补充内容。"
              },
              {
                icon: <Layout className="w-6 h-6" />,
                title: "自由灵活布局",
                desc: "支持多种布局算法，节点自由拖拽，随心所欲定制你的知识图谱。"
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: "本地存储安全",
                desc: "你的数据优先存储在本地，并支持多端同步，隐私与效率并存。"
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "极致交互体验",
                desc: "流畅的缩放、平移和精美的动效，让整理思绪成为一种视觉享受。"
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "持续进化",
                desc: "不断接入最新的 AI 模型能力，持续优化交互体验，永不停止进化。"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-all hover:shadow-xl hover:shadow-violet-50 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-violet-600 mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-6">
                <Workflow className="w-3.5 h-3.5" />
                <span>极简工作流</span>
              </div>
              <h2 className="text-4xl font-bold mb-8 leading-tight">从灵感到图谱 <br />只需三步</h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "输入主题", desc: "在对话框输入你想探索的任何想法或知识点。" },
                  { step: "02", title: "AI 生成", desc: "深度学习模型即刻为你拆解逻辑，生成层级分明的思维导图。" },
                  { step: "03", title: "自由调整", desc: "通过拖拽、编辑和对话，完善你的思考细节。" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-violet-100 flex items-center justify-center text-violet-600 font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="relative aspect-square bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 -z-10" />
                {/* Visual Representation of Mindmap nodes */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-24 h-24 bg-violet-600 rounded-2xl shadow-lg flex items-center justify-center text-white z-10"
                  >
                    <Brain className="w-10 h-10" />
                  </motion.div>
                  {[
                    { icon: <Type className="w-5 h-5" />, label: "文字" },
                    { icon: <Image className="w-5 h-5" />, label: "图片" },
                    { icon: <PlayCircle className="w-5 h-5" />, label: "视频" },
                    { icon: <Box className="w-5 h-5" />, label: "组件" },
                    { icon: <LinkIcon className="w-5 h-5" />, label: "链接" }
                  ].map((item, i) => {
                    const angle = (i * 72) * Math.PI / 180;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                          opacity: 1, 
                          x: Math.cos(angle) * 110, 
                          y: Math.sin(angle) * 110 
                        }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                        className="absolute group/node"
                      >
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-1 hover:border-violet-300 hover:shadow-violet-100 transition-all cursor-default">
                          <div className="text-slate-400 group-hover/node:text-violet-600 transition-colors">
                            {item.icon}
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 group-hover/node:text-violet-400 transition-colors uppercase tracking-tighter">
                            {item.label}
                          </span>
                        </div>
                        {/* Connecting Line (Simulated) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-px bg-gradient-to-r from-violet-200 to-transparent -z-10 origin-left" style={{ transform: `rotate(${angle + Math.PI}rad)` }} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">常见问题</h2>
            <p className="text-slate-600">解答您在使用过程中的疑惑</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden transition-all">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-700">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-5 h-5 text-violet-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                  className="overflow-hidden bg-slate-50/50"
                >
                  <div className="px-6 py-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 px-4">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">立即开始你的智能创作之旅</h2>
            <p className="text-slate-400 mb-12 text-lg">支持 Windows 平台，后续将支持 macOS 与移动端</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3">
                <Download className="w-6 h-6" />
                下载 Windows 版 (.exe)
              </button>
              <a 
                href="https://github.com/ShiyouQi888/AI-MindFlow"
                target="_blank"
                className="w-full sm:w-auto px-10 py-5 bg-slate-800 text-white border border-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
              >
                <Github className="w-6 h-6" />
                查看 GitHub
              </a>
            </div>
          </div>
          {/* Abstract background blobs */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-violet-600 rounded-full blur-[120px] opacity-20" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-violet-600 rounded-xl text-white">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold tracking-tight">AI MindFlow</span>
              </div>
              <p className="text-slate-500 text-base max-w-sm mb-8 leading-relaxed">
                致力于打造下一代智能思维导图工具，让创作变得更简单、更高效。
                基于 DeepSeek AI 模型，重塑你的思考方式。
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/ShiyouQi888/AI-MindFlow" target="_blank" className="p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-violet-100 hover:text-violet-600 transition-all border border-slate-100">
                  <Github className="w-5 h-5" />
                </a>
                <a href="mailto:shijuebaba@qq.com" className="p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-violet-100 hover:text-violet-600 transition-all border border-slate-100">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="md:col-span-2 md:col-start-7">
              <h4 className="font-bold text-slate-900 mb-6">产品</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><button onClick={() => { setActiveTab('main'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-violet-600 transition-colors">功能特性</button></li>
                <li><button onClick={() => { setActiveTab('main'); setTimeout(() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-violet-600 transition-colors">下载中心</button></li>
                <li><a href="https://github.com/ShiyouQi888/AI-MindFlow" className="hover:text-violet-600 transition-colors">开源仓库</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold text-slate-900 mb-6">法律</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><button onClick={() => { setActiveTab('terms'); window.scrollTo(0, 0); }} className="hover:text-violet-600 transition-colors">用户协议</button></li>
                <li><button onClick={() => { setActiveTab('privacy'); window.scrollTo(0, 0); }} className="hover:text-violet-600 transition-colors">隐私政策</button></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold text-slate-900 mb-6">支持</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="mailto:shijuebaba@qq.com" className="hover:text-violet-600 transition-colors">反馈建议</a></li>
                <li><a href="https://github.com/ShiyouQi888/AI-MindFlow/issues" className="hover:text-violet-600 transition-colors">问题报告</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-400">
              © 2024 AI MindFlow. Built with ❤️ by 齐世有
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <span>Made with React & Tailwind</span>
              <span>Power by DeepSeek</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )}
</div>
  );
};

export default App;
