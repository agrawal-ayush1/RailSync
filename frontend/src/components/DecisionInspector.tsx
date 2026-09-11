import React from 'react';
import { Layers, ShieldCheck, Moon, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react';

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
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Decision Inspector & Traceable Solver Rationale
          </h2>
          <p className="text-xs text-slate-400">
            Post-optimization structural introspection derived 100% from CP-SAT mathematical model variables & active bounds
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
          {explanations.length} TRACEABLE DECISION LOGS GENERATED
        </div>
      </div>

      {explanations.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/40 rounded-lg border border-slate-800">
          No optimization rationale available yet. Click "Generate Optimal Plan" to execute solver.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {explanations.map((exp) => (
            <div
              key={exp.id}
              className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3.5"
            >
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg shrink-0 mt-0.5">
                {getIcon(exp.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-extrabold font-mono tracking-wider text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {exp.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED MODEL LOG
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{exp.title}</h3>
                <p className="text-xs text-cyan-300 font-medium mb-1.5">{exp.summary}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{exp.details}</p>

                {/* Metrics Pill Grid */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {Object.entries(exp.metrics).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      <span className="text-slate-500">{k.replace(/_/g, ' ')}:</span>{' '}
                      <span className="text-slate-100 font-bold">{String(v)}</span>
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
