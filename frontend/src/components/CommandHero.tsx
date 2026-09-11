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
    { num: '01', key: 'UNIFY', label: 'UNIFY', desc: 'Demands' },
    { num: '02', key: 'EVALUATE', label: 'EVALUATE', desc: 'Rules' },
    { num: '03', key: 'BUNDLE', label: 'BUNDLE', desc: 'Super-Tasks' },
    { num: '04', key: 'OPTIMIZE', label: 'OPTIMIZE', desc: 'CP-SAT' },
    { num: '05', key: 'REPLAN', label: 'REPLAN', desc: 'Disruption' },
    { num: '06', key: 'APPROVE', label: 'APPROVE', desc: 'Dispatch' },
  ];

  return (
    <div className="glass-panel px-3.5 py-2.5 mb-2 border-l-4 border-l-cyan-400 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 shadow-md relative overflow-hidden">
      {/* Background motif */}
      <div className="absolute right-0 top-0 bottom-0 w-1/4 opacity-5 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Row 1: Command Title & Primary CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-black tracking-tight text-white font-mono uppercase">
              AUTOMATIC BLOCK PLANNING
            </h2>
            <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${
              status === 'BASELINE' ? 'bg-slate-800 text-slate-300 border-slate-700' :
              status === 'DISRUPTED' ? 'bg-red-950 text-red-300 border-red-800' :
              'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              STATE: <span className="text-cyan-400 underline decoration-cyan-400">{status}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Synchronize multi-department maintenance with train operations • OR-Tools CP-SAT Engine
          </p>
        </div>

        {/* Right CTA / Telemetry */}
        <div className="flex items-center gap-2">
          {status === 'BASELINE' ? (
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="btn btn-primary text-xs py-1.5 px-4 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 text-white font-extrabold tracking-wider transition-all transform hover:-translate-y-0.5"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>SOLVING CP-SAT...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-100 fill-cyan-300/40" />
                  <span>⚡ GENERATE OPTIMAL PLAN</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono shadow-inner">
              <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>CP-SAT {solverStatus || status}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="text-cyan-300 font-black text-[11px]">
                {solverRuntimeMs ? `${solverRuntimeMs} ms` : '< 35 ms'}
              </div>
              {superTasksCount !== undefined && superTasksCount > 0 && (
                <>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>{superTasksCount} Super-Task{superTasksCount > 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Compact Connected Pipeline Stepper (Height ~32px) */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/70 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        {stages.map((stage, idx) => {
          const st = getStageState(stage.key);
          return (
            <React.Fragment key={stage.key}>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-all flex-1 min-w-[105px] border ${
                st === 'done'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : st === 'active'
                  ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/15'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}>
                <span className="text-[10px] font-extrabold opacity-60 shrink-0">{stage.num}</span>
                {st === 'done' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : st === 'active' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                )}
                <span className="font-extrabold tracking-tight text-white">{stage.label}</span>
                <span className="text-[9px] text-slate-400 opacity-70 hidden sm:inline">{stage.desc}</span>
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


