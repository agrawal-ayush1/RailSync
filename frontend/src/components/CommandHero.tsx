import React from 'react';
import { Zap, CheckCircle2, ArrowRight, RefreshCw, Cpu, Layers } from 'lucide-react';

interface CommandHeroProps {
  status: string;
  isOptimizing: boolean;
  onOptimize: () => void;
  solverRuntimeMs?: number;
  solverStatus?: string;
  superTasksCount?: number;
}

export const CommandHero: React.FC<CommandHeroProps> = ({
  status,
  isOptimizing,
  onOptimize,
  solverRuntimeMs,
  solverStatus,
  superTasksCount,
}) => {
  // Define System Pipeline Stages based on current status
  const getStageState = (stageKey: string) => {
    switch (stageKey) {
      case 'UNIFY':
      case 'EVALUATE':
      case 'BUNDLE':
        return 'done';
      case 'OPTIMIZE':
        if (status === 'BASELINE') return isOptimizing ? 'active' : 'pending';
        return 'done';
      case 'REPLAN':
        if (status === 'REOPTIMIZED' || status === 'DISRUPTED') return 'done';
        if (status === 'OPTIMAL' || status === 'FEASIBLE') return 'active';
        return 'pending';
      case 'APPROVE':
        if (status === 'APPROVED') return 'done';
        if (status === 'OPTIMAL' || status === 'FEASIBLE' || status === 'REOPTIMIZED') return 'active';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const stages = [
    { key: 'UNIFY', label: 'UNIFY DEMANDS' },
    { key: 'EVALUATE', label: 'EVALUATE RULES' },
    { key: 'BUNDLE', label: 'BUNDLE SUPER-TASKS' },
    { key: 'OPTIMIZE', label: 'CP-SAT OPTIMIZE' },
    { key: 'REPLAN', label: 'DYNAMIC REPLAN' },
    { key: 'APPROVE', label: 'DISPATCH APPROVE' },
  ];

  return (
    <div className="glass-panel p-4 mb-4 border-l-4 border-l-cyan-500 bg-slate-900/90">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Title & Concept */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-black tracking-tight text-white font-mono uppercase">
              AUTOMATIC BLOCK PLANNING COMMAND CENTER
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              STATE: <span className="text-cyan-400">{status}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Multi-Department Maintenance Demand Synchronization & Line Capacity Preservation
          </p>
        </div>

        {/* Center/Right: Primary Action CTA or Telemetry */}
        <div className="flex items-center gap-3">
          {status === 'BASELINE' ? (
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="btn btn-primary text-xs py-2.5 px-5 shadow-lg shadow-cyan-500/20"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>CP-SAT OPTIMIZING...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>GENERATE OPTIMAL PLAN</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4" />
                <span>CP-SAT {solverStatus || status}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="text-cyan-300 font-bold">
                {solverRuntimeMs ? `${solverRuntimeMs} ms` : '< 35 ms'}
              </div>
              {superTasksCount !== undefined && superTasksCount > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{superTasksCount} Super-Task{superTasksCount > 1 ? 's' : ''} Active</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Pipeline Stepper */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-500 uppercase font-bold shrink-0 mr-1">
          PIPELINE:
        </span>
        {stages.map((stage, idx) => {
          const st = getStageState(stage.key);
          return (
            <React.Fragment key={stage.key}>
              <div className={`pipeline-step ${st === 'done' ? 'pipeline-step-done' : st === 'active' ? 'pipeline-step-active' : 'pipeline-step-pending'}`}>
                {st === 'done' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : st === 'active' ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                )}
                <span>{stage.label}</span>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
