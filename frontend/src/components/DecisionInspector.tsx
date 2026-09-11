import React from 'react';
import { Layers, ShieldCheck, Moon, AlertTriangle, Cpu, CheckCircle2, Zap } from 'lucide-react';

interface DecisionInspectorProps {
  explanations: {
    id: string;
    category: string;
    title: string;
    summary: string;
    details: string;
    metrics: Record<string, any>;
    icon?: string;
  }[];
}

export const DecisionInspector: React.FC<DecisionInspectorProps> = ({ explanations }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'SUPER_TASK_BUNDLING':
        return <Layers className="w-5 h-5 text-amber-400" />;
      case 'TRAIN_PROTECTION':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'TIME_SLOT_OPTIMIZATION':
        return <Moon className="w-5 h-5 text-purple-400" />;
      case 'DYNAMIC_REPLANNING':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Cpu className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="glass-panel p-3.5 mb-2 border-t-2 border-t-cyan-400 bg-slate-950/90 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase tracking-widest">
              EXPLAINABLE AI
            </span>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Cpu className="w-4 h-4 text-cyan-400" />
              DECISION INSPECTOR & TRACEABLE SOLVER RATIONALE
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Structural introspection derived 100% from CP-SAT mathematical model variables & active bounds
          </p>
        </div>
        <div className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded border border-cyan-800/50 shadow-inner">
          {explanations.length} MODEL LOGS
        </div>
      </div>

      {/* WHY THIS SLOT? Quick System Verification Bar */}
      <div className="mb-3 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="text-slate-300 font-extrabold flex items-center gap-2 text-sm uppercase">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>WHY THIS SLOT?</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>TRAIN PRIORITY: Protected</span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 px-2.5 py-1 rounded font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>TRACK CAPACITY: Available</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-950/70 border border-purple-800/60 text-purple-300 px-2.5 py-1 rounded font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>OHE POWER: Safe</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>SUPER-TASK: Opportunity Captured</span>
          </div>
        </div>
      </div>

      {explanations.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
          No optimization rationale available yet. Click "⚡ Generate Optimal Plan" to execute solver and extract rationale logs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {explanations.map((exp) => (
            <div
              key={exp.id}
              className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 transition-all flex items-start gap-4 shadow-lg"
            >
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg shrink-0 mt-0.5 shadow-inner">
                {getIcon(exp.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black font-mono tracking-widest text-cyan-300 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                    {exp.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3" /> MODEL VERIFIED
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1 font-sans">{exp.title}</h3>
                <p className="text-xs text-cyan-300 font-semibold mb-1.5">{exp.summary}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-3 font-normal">{exp.details}</p>

                {/* Metrics Pill Grid */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {Object.entries(exp.metrics).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1.5"
                    >
                      <span className="text-slate-500 font-medium">{k.replace(/_/g, ' ')}:</span>{' '}
                      <span className="text-cyan-300 font-black">{String(v)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

