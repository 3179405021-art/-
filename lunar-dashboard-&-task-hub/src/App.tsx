/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  User, 
  Layout, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import { getChineseLunarInfo, generateProjectIdea } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: string;
  title: string;
  content: string;
  type: 'lunar' | 'custom' | 'placeholder' | 'whiteboard';
  isLoading?: boolean;
  isEditing?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

export default function App() {
  const [time, setTime] = useState(new Date());
  const [profile, setProfile] = useState<UserProfile>(() => ({
    id: `USER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    name: '访客用户',
    email: 'guest@example.com',
    bio: '这是一个热爱探索的数字游民。',
    avatarUrl: 'https://picsum.photos/seed/user/200/200'
  }));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'p1',
      title: '中国黄历每日信息',
      content: '点击刷新获取今日黄历...',
      type: 'lunar',
    },
    {
      id: 'p2',
      title: '暂留项目',
      content: '这是一个预留的项目位，您可以点击下方的添加按钮来生成新的灵感。',
      type: 'placeholder',
    }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLunarData = async (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isLoading: true } : p));
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const info = await getChineseLunarInfo(dateStr);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content: info, isLoading: false } : p));
  };

  const addNewProject = async (type: 'gemini' | 'whiteboard') => {
    setIsAdding(true);
    setShowAddMenu(false);
    
    if (type === 'gemini') {
      const existingTitles = projects.map(p => p.title);
      const idea = await generateProjectIdea(existingTitles);
      
      const newProject: Project = {
        id: `p-${Date.now()}`,
        title: idea.split('\n')[0].replace(/^[#\s*]+/, '') || '新互动项目',
        content: idea,
        type: 'custom',
      };
      setProjects(prev => [...prev, newProject]);
    } else {
      const newProject: Project = {
        id: `p-${Date.now()}`,
        title: '新白板项目',
        content: '在这里输入您的想法...',
        type: 'whiteboard',
        isEditing: true
      };
      setProjects(prev => [...prev, newProject]);
    }
    
    setIsAdding(false);
  };

  const updateProjectContent = (id: string, newContent: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
  };

  const updateProjectTitle = (id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
  };

  const toggleEdit = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isEditing: !p.isEditing } : p));
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/5"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">个人信息中心</h2>
                    <p className="text-sm text-zinc-500 mt-1">管理您的基本信息和账户设置</p>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <Plus size={24} className="rotate-45 text-zinc-400" />
                  </button>
                </div>

                <div className="flex flex-col items-center mb-10">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-zinc-50 shadow-2xl ring-1 ring-black/5">
                      <img 
                        src={tempProfile.avatarUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-[2rem] text-white">
                      <Plus size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">上传图片</span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <div className="mt-4 w-full max-w-sm">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1.5 text-center">或输入图片链接</label>
                    <input 
                      type="text" 
                      value={tempProfile.avatarUrl}
                      onChange={(e) => setTempProfile({ ...tempProfile, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-xs text-center font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">用户 ID</label>
                      <input 
                        type="text" 
                        value={tempProfile.id}
                        onChange={(e) => setTempProfile({ ...tempProfile, id: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">姓名</label>
                      <input 
                        type="text" 
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">电子邮箱</label>
                    <input 
                      type="email" 
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">个人简介</label>
                    <textarea 
                      rows={3}
                      value={tempProfile.bio}
                      onChange={(e) => setTempProfile({ ...tempProfile, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      setProfile(tempProfile);
                      setIsProfileOpen(false);
                    }}
                    className="px-8 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                  >
                    保存更改
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-50 px-8 py-4 border-t border-zinc-100 flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                <Sparkles size={12} />
                <span>您的信息仅保存在本地会话中</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                setTempProfile(profile);
                setIsProfileOpen(true);
              }}
              className="group flex items-center gap-4 hover:bg-black/5 p-1.5 pr-4 rounded-2xl transition-all cursor-pointer text-left"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/5 shadow-sm group-hover:shadow-md transition-all">
                <img 
                  src={profile.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight leading-tight">{profile.name}</span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{profile.id}</span>
              </div>
            </button>

            <div className="flex items-center gap-3 bg-black/5 px-6 py-3 rounded-[2rem] border border-black/5 shadow-inner">
              <Clock size={20} className="text-zinc-400" />
              <span className="text-2xl sm:text-4xl font-black text-black font-mono tracking-tighter tabular-nums leading-none">
                {time.toLocaleTimeString('zh-CN', { 
                  timeZone: 'Asia/Shanghai', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false 
                })}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={isAdding}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isAdding ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
              <span className="text-sm font-medium">添加互动项目</span>
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAddMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden z-20"
                  >
                    <button
                      onClick={() => addNewProject('gemini')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100"
                    >
                      <Sparkles size={16} className="text-emerald-500" />
                      <div>
                        <div className="text-sm font-semibold">Gemini 灵感生成</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">AI 驱动</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addNewProject('whiteboard')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                    >
                      <Layout size={16} className="text-blue-500" />
                      <div>
                        <div className="text-sm font-semibold">空白白板项目</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">自由编辑</div>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white rounded-2xl border border-black/5 p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      project.type === 'lunar' ? "bg-orange-50 text-orange-600" : 
                      project.type === 'placeholder' ? "bg-zinc-100 text-zinc-600" : 
                      project.type === 'whiteboard' ? "bg-blue-50 text-blue-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {project.type === 'lunar' ? <Calendar size={18} /> : 
                       project.type === 'placeholder' ? <Sparkles size={18} /> : 
                       project.type === 'whiteboard' ? <Layout size={18} /> :
                       <ChevronRight size={18} />}
                    </div>
                    {project.isEditing ? (
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => updateProjectTitle(project.id, e.target.value)}
                        className="font-semibold text-lg tracking-tight bg-zinc-50 border-b border-zinc-200 focus:outline-none focus:border-black transition-all w-full px-1"
                        placeholder="项目标题"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg tracking-tight">{project.title}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.type === 'lunar' && !project.isEditing && (
                      <button 
                        onClick={() => fetchLunarData(project.id)}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
                        title="刷新数据"
                      >
                        <RefreshCw size={16} className={project.isLoading ? "animate-spin" : ""} />
                      </button>
                    )}
                    {project.type !== 'placeholder' && (
                      <button 
                        onClick={() => toggleEdit(project.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          project.isEditing ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-500"
                        )}
                        title={project.isEditing ? "保存" : "编辑"}
                      >
                        {project.isEditing ? <Sparkles size={16} /> : <Plus size={16} className="rotate-45" />}
                      </button>
                    )}
                    <button 
                      onClick={() => removeProject(project.id)}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-zinc-400"
                      title="删除项目"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-grow overflow-auto prose prose-sm prose-zinc max-w-none">
                  {project.isLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                      <div className="h-4 bg-zinc-100 rounded w-full"></div>
                      <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
                    </div>
                  ) : project.isEditing ? (
                    <textarea
                      autoFocus
                      value={project.content}
                      onChange={(e) => updateProjectContent(project.id, e.target.value)}
                      className="w-full h-full min-h-[150px] p-4 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm resize-none font-sans"
                    />
                  ) : (
                    <div className="text-zinc-600 leading-relaxed">
                      <Markdown>{project.content}</Markdown>
                    </div>
                  )}
                </div>

                {project.type === 'placeholder' && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        removeProject(project.id);
                        addNewProject('gemini');
                      }}
                      className="py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={12} />
                      AI 灵感
                    </button>
                    <button 
                      onClick={() => {
                        removeProject(project.id);
                        addNewProject('whiteboard');
                      }}
                      className="py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Layout size={12} />
                      白板
                    </button>
                  </div>
                )}

                {project.type === 'lunar' && !project.isLoading && project.content.includes('点击刷新') && (
                  <button 
                    onClick={() => fetchLunarData(project.id)}
                    className="mt-6 w-full py-2.5 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    获取今日黄历
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/50 backdrop-blur-sm border-t border-black/5 px-6 py-2 text-[10px] uppercase tracking-widest text-zinc-400 flex justify-between items-center">
        <span>System Status: Operational</span>
        <span>© {new Date().getFullYear()} Lunar Dashboard v1.0</span>
      </footer>
    </div>
  );
}
