import React, { useState } from 'react';
import { Candidate, ResourceItem } from '../../types';
import { HDU_RESOURCES } from '../../data/mockData';
import { audioEngine } from '../../services/audioEngine';

interface GrowthViewProps {
  candidates: Candidate[];
}

export const GrowthView: React.FC<GrowthViewProps> = ({ candidates }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.id || '');
  const candidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const [counselorNote, setCounselorNote] = useState('该生集体荣誉感强 踏实负责 建议进一步增强多部门交叉协作与抗压能力');
  const [studentWish, setStudentWish] = useState('希望能在志愿公益项目孵化和校外赞助谈判中获得更多导师指引');

  const metricNames: Record<string, string> = {
    m1: '思想政治与品德',
    m2: '学业表现',
    m3: '学生工作经历',
    m4: '岗位匹配能力',
    m5: '材料规范与诚信'
  };

  // 计算档位缺口（差距小于5档的维度）
  const gaps: Array<{ key: 'm1' | 'm2' | 'm3' | 'm4' | 'm5'; current: number; gap: number }> = [];
  if (candidate) {
    (['m1', 'm2', 'm3', 'm4', 'm5'] as const).forEach(k => {
      const curLevel = candidate.metrics[k].level;
      if (curLevel < 5) {
        gaps.push({ key: k, current: curLevel, gap: 5 - curLevel });
      }
    });
  }

  // 匹配资源库
  const matchedResources: ResourceItem[] = HDU_RESOURCES.filter(r =>
    gaps.some(g => g.key === r.targetMetric)
  );

  return (
    <div className="space-y-6">
      
      {/* 顶部指引 */}
      <div className="sd-box p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/images/badges/growth.jpg" alt="橡树之叶" className="w-7 h-7 rounded border-2 border-[#8b5329] object-cover shadow" />
            <h3 className="font-serifSc font-bold text-base text-[#4a2817]">
              学生能力发展与因材施教规划单
            </h3>
          </div>
          <p className="text-xs text-stone-600 font-serifSc">
            将选拔结果延伸至育人链条，整合学生档案、辅导员寄语、学生期望与政策导向，形成一页纸行动建议
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-serifSc">
          <span className="text-stone-700 font-bold">调阅学生档案：</span>
          <select
            value={selectedCandidateId}
            onChange={e => {
              audioEngine.play('paper');
              setSelectedCandidateId(e.target.value);
            }}
            className="px-3 py-1.5 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] font-bold focus:outline-none"
          >
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 左右分栏：左侧输入条件与缺口分析，右侧一页纸建议单预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 左侧控制输入与缺口诊断 */}
        <div className="lg:col-span-5 sd-box p-4 rounded-lg space-y-4">
          <div className="border-b border-[#5b3117]/30 pb-2">
            <h4 className="font-bold text-sm text-[#4a2817] font-serifSc">
              胜任力档位缺口自动诊断
            </h4>
            <span className="text-xs text-stone-600 font-serifSc">
              系统自动对标 5 档卓越基线 识别待加强维度
            </span>
          </div>

          <div className="space-y-2">
            {gaps.length === 0 ? (
              <div className="p-3 bg-emerald-50 rounded border border-emerald-300 text-xs text-emerald-800 font-serifSc">
                ✦ 该生各项指标均已达到5档满格 建议列为校级拔尖学生干部导师库候选
              </div>
            ) : (
              gaps.map(g => (
                <div
                  key={g.key}
                  className="p-2.5 rounded bg-white/70 border border-stone-300 flex items-center justify-between text-xs font-serifSc"
                >
                  <div>
                    <span className="font-bold text-stone-800">{metricNames[g.key]}</span>
                    <span className="text-[10px] text-stone-500 ml-1.5">当前评级 {g.current} 档</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                    距离卓越差 {g.gap} 档
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 辅导员寄语与学生期望输入 */}
          <div className="space-y-3 pt-2 border-t border-[#5b3117]/20 text-xs font-serifSc">
            <div>
              <label className="font-bold text-stone-800 block mb-1">
                辅导员谈话寄语与日常表现记录：
              </label>
              <textarea
                value={counselorNote}
                onChange={e => setCounselorNote(e.target.value)}
                rows={3}
                className="w-full p-2 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">
                学生本人成长诉求与未来期望：
              </label>
              <textarea
                value={studentWish}
                onChange={e => setStudentWish(e.target.value)}
                rows={3}
                className="w-full p-2 text-xs rounded border border-[#5b3117] bg-[#fbf2d5] text-[#381f13] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 右侧：生成的一页纸个性化培养建议单 */}
        <div className="lg:col-span-7 sd-box p-5 rounded-lg export-watermark flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 relative z-10">
            {/* 抬头 */}
            <div className="text-center border-b-2 border-[#5b3117] pb-3">
              <span className="text-xs font-mono tracking-widest text-[#8b5329] block mb-0.5">
                E-JUDGE.AI · 2026 MENTORSHIP
              </span>
              <h3 className="text-base font-bold text-[#381f13] font-serifSc">
                学生骨干个性化能力发展建议单
              </h3>
              <div className="flex items-center justify-center gap-4 text-xs text-stone-600 mt-1 font-mono">
                <span>姓名：{candidate.name}（脱敏化名）</span>
                <span>学号：{candidate.id}</span>
                <span>班级：{candidate.major}</span>
              </div>
            </div>

            {/* 一体现状 */}
            <div className="p-3 bg-amber-50/80 rounded border border-amber-200 text-xs font-serifSc">
              <strong className="text-amber-900 block mb-1">一、申报现状与评判概况</strong>
              <p className="text-stone-700 leading-relaxed">
                该生申报职务为【{candidate.position_name}】，材料评定分 {candidate.material_score}，现场面试分 {candidate.interview_score}，综合得分 {candidate.composite_score}。
              </p>
            </div>

            {/* 二析缺口 */}
            <div className="p-3 bg-white/80 rounded border border-stone-300 text-xs font-serifSc">
              <strong className="text-stone-900 block mb-1">二、关键能力短板与发展诉求</strong>
              <p className="text-stone-700 leading-relaxed mb-1">
                辅导员观察反馈：{counselorNote}
              </p>
              <p className="text-stone-700 leading-relaxed">
                学生自我期许：{studentWish}
              </p>
            </div>

            {/* 三定建议 */}
            <div className="p-3 bg-emerald-50/90 rounded border border-emerald-300 text-xs font-serifSc">
              <strong className="text-emerald-900 block mb-1.5">三、精准匹配校园赋能资源与行动清单</strong>
              <div className="space-y-2">
                {matchedResources.map(res => (
                  <div key={res.id} className="p-2 bg-white rounded border border-emerald-200">
                    <div className="flex items-center justify-between font-bold text-stone-800 mb-0.5">
                      <span>• {res.title}</span>
                      <span className="text-[11px] text-emerald-700 font-mono">{res.provider} · {res.timeframe}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      执行指引：{res.action}。预期提升：{res.benefit}。
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 四明下一步 */}
            <div className="p-2.5 bg-amber-100/50 rounded border border-amber-300 text-xs text-amber-900 font-serifSc">
              <strong>四、下一步跟踪计划：</strong>
              <span> 建议在下一学期期中由辅导员与部门负责人开展一次中期履职复盘，对照上述行动项落实度进行闭环回顾。</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#5b3117]/30 flex items-center justify-between text-xs text-stone-500 font-serifSc relative z-10">
            <span>经杭电拔尖育人资源库认证</span>
            <button
              onClick={() => {
                audioEngine.play('coin');
                window.print();
              }}
              className="sd-btn-gold px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5"
            >
              <img src="/images/icons/quill.jpg" alt="羽毛笔" className="w-4 h-4 rounded object-cover inline-block" />
              <span>誊印发展建议单</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
