import React from 'react';
import { audioEngine } from '../services/audioEngine';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingCount,
  soundEnabled,
  onToggleSound,
  collapsed,
  onToggleCollapse
}) => {
  const tabs = [
    { id: 'archive', label: '评判总览', code: '01' },
    { id: 'agents', label: '并行智能体', code: '02' },
    { id: 'tasks', label: '申报材料', code: '03' },
    { id: 'codex', label: '岗位标准', code: '04' },
    { id: 'bench', label: '仲裁复核', code: '05', badge: pendingCount },
    { id: 'workshop', label: '模拟面试', code: '06' },
    { id: 'growth', label: '能力发展', code: '07' },
    { id: 'export', label: '凭据导出', code: '08' },
    { id: 'tests', label: '基准验证', code: '09' }
  ];

  return (
    <aside
      className={`sticky top-0 h-screen z-40 bg-[#2b1408] border-r-4 border-[#4a2411] shadow-[4px_0_16px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* 顶部系统名牌 */}
      <div>
        <div className="p-3 border-b-2 border-[#4a2411] bg-[#220e04] flex items-center justify-between">
          {!collapsed ? (
            <div
              className="cursor-pointer"
              onClick={() => {
                audioEngine.play('click');
                onTabChange('archive');
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#4a2411] border border-[#d49b55] font-pixel text-[10px] text-[#ffdf79] flex items-center justify-center">
                  EJ
                </span>
                <span className="font-serifSc font-black text-sm text-[#ffdf79] tracking-wider">
                  E-Judge
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#381a0b] text-[#d49b55] border border-[#5b2b14] font-mono">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-[#eedcb1]/60 font-serifSc mt-0.5 tracking-wider">
                学生职务数智评判系统
              </p>
            </div>
          ) : (
            <div
              className="mx-auto w-8 h-8 rounded bg-[#4a2411] border border-[#d49b55] font-pixel text-xs text-[#ffdf79] flex items-center justify-center cursor-pointer"
              onClick={() => {
                audioEngine.play('click');
                onTabChange('archive');
              }}
              title="E-Judge.AI 2026"
            >
              EJ
            </div>
          )}
        </div>

        {/* 导航按钮组：竖排星露谷木质插槽 */}
        <nav className="p-2 space-y-1.5 mt-2">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  audioEngine.play('click');
                  onTabChange(tab.id);
                }}
                className={`w-full flex items-center rounded text-xs font-serifSc transition-all group relative border ${
                  isActive
                    ? 'bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] shadow-[inset_0_2px_4px_rgba(255,255,255,0.12)] font-bold'
                    : 'bg-[#381a0b]/40 text-[#eedcb1]/75 hover:bg-[#4a2411] hover:text-[#ffdf79] border-transparent'
                } ${collapsed ? 'justify-center py-2.5 px-0' : 'justify-between py-2 px-3'}`}
                title={collapsed ? `${tab.code} ${tab.label}` : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#200d04] text-[#d49b55] border border-[#3d1a09]">
                    {tab.code}
                  </span>
                  {!collapsed && <span className="tracking-wider">{tab.label}</span>}
                </div>

                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className={`rounded-full bg-[#a93226] text-white text-[9px] font-mono font-bold animate-pulse ${
                      collapsed ? 'absolute top-1 right-1 w-2 h-2 p-0' : 'px-1.5 py-0.2'
                    }`}
                  >
                    {!collapsed && tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 底部折叠切换与音效控制 */}
      <div className="p-2 border-t-2 border-[#4a2411] bg-[#220e04] space-y-1.5">
        <button
          onClick={() => {
            onToggleSound();
            if (!soundEnabled) audioEngine.play('click');
          }}
          className={`w-full py-1.5 text-xs font-serifSc rounded border flex items-center justify-center transition-colors ${
            soundEnabled
              ? 'bg-[#4a2411] border-[#d49b55] text-[#ffdf79]'
              : 'bg-[#1b0a03] border-[#381a0b] text-stone-500'
          }`}
          title={soundEnabled ? '音效已开' : '静音模式'}
        >
          {!collapsed ? (soundEnabled ? '音效开启' : '静音中') : soundEnabled ? '音' : '静'}
        </button>

        <button
          onClick={() => {
            audioEngine.play('paper');
            onToggleCollapse();
          }}
          className="w-full py-1 text-[11px] font-serifSc rounded bg-[#381a0b] hover:bg-[#4a2411] text-[#eedcb1]/80 hover:text-[#ffdf79] border border-[#5b2b14] flex items-center justify-center"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {!collapsed ? '收起侧边栏 ◀' : '▶'}
        </button>
      </div>
    </aside>
  );
};
