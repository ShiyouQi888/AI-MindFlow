import React from 'react';
import { Keyboard, Mouse, Info } from 'lucide-react';

const HelpPanel: React.FC = () => {
  const shortcutGroups = [
    {
      label: '节点操作',
      shortcuts: [
        { keys: ['Tab'], desc: '子节点' },
        { keys: ['Enter'], desc: '兄弟节点' },
        { keys: ['F2'], desc: '编辑' },
        { keys: ['Del'], desc: '删除' },
        { keys: ['Space'], desc: '折叠' },
      ]
    },
    {
      label: '工具',
      shortcuts: [
        { keys: ['V'], desc: '选择' },
        { keys: ['T'], desc: '文字' },
        { keys: ['I'], desc: '图片' },
        { keys: ['C'], desc: '曲线' },
        { keys: ['P'], desc: '折线' },
        { keys: ['R'], desc: '矩形' },
        { keys: ['O'], desc: '圆形' },
      ]
    },
    {
      label: '画布',
      shortcuts: [
        { keys: ['Esc'], desc: '取消' },
        { keys: ['双击'], desc: '整理' },
        { desc: '缩放', mouse: '滚轮' },
        { desc: '平移', mouse: '拖拽' },
      ]
    }
  ];

  return (
    <div className="floating-panel absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 w-auto max-w-[95vw] flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex items-center gap-2 border-r border-border/50 pr-4 shrink-0">
        <Keyboard className="w-4 h-4 text-primary" />
        <span className="font-semibold text-xs">快捷键</span>
      </div>
      
      <div className="flex items-center gap-8">
        {shortcutGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="flex items-center gap-4">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">{group.label}</span>
            <div className="flex items-center gap-4">
              {group.shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {s.keys ? (
                    s.keys.map(key => (
                      <kbd key={key} className="min-w-[1.5rem] h-5 px-1.5 flex items-center justify-center bg-secondary/80 rounded text-[10px] font-mono shadow-sm border border-border/50">
                        {key}
                      </kbd>
                    ))
                  ) : s.mouse ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary/40 rounded border border-border/30 text-muted-foreground">
                      {s.mouse}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground/90">{s.desc}</span>
                </div>
              ))}
            </div>
            {groupIdx < shortcutGroups.length - 1 && (
              <div className="w-[1px] h-3 bg-border/40 mx-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpPanel;
