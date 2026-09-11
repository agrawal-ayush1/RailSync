import React from 'react';
import type { OptimizationKpis, BaselineComparisonMetrics } from '../types';
import { Activity, Clock, ShieldCheck, Layers, Cpu, TrendingDown } from 'lucide-react';

interface KpiHeaderProps {
  kpis?: OptimizationKpis;
  baseline?: BaselineComparisonMetrics;
}

export const KpiHeader: React.FC<KpiHeaderProps> = ({ kpis, baseline }) => {
  if (!kpis || !baseline) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-slate-900/60 h-16 rounded border border-slate-800/80"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
      {/* 1. Track Downtime & Capacity */}
      <div className="telemetry-card telemetry-card-cyan bg-slate-950/80 py-2 px-3">
        <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono font-bold uppercase tracking-wider">
          <span>TRACK DOWNTIME</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-white tracking-tight leading-none">
            {kpis.asset_availability_pct}
            <span className="text-xs font-bold text-cyan-400 ml-0.5">%</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.5 rounded">
            +{baseline.block_hours_reduction_pct}% CAP
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tight flex items-center justify-between">
          <span>AVAILABILITY</span>
          <span className="text-cyan-300">{kpis.downtime_saved_hours}h saved</span>
        </div>
      </div>

      {/* 2. Line Capacity Preserved */}
      <div className="telemetry-card telemetry-card-emerald bg-slate-950/80 py-2 px-3">
        <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono font-bold uppercase tracking-wider">
          <span>LINE CAPACITY</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-white tracking-tight leading-none">
            {kpis.line_capacity_preserved_pct}
            <span className="text-xs font-bold text-emerald-400 ml-0.5">%</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.5 rounded">
            PROTECTED
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tight">
          VVIP & Mail schedules safe
        </div>
      </div>

      {/* 3. Total Train Delays Avoided */}
      <div className="telemetry-card telemetry-card-purple bg-slate-950/80 py-2 px-3">
        <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono font-bold uppercase tracking-wider">
          <span>TRAIN DELAYS</span>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-purple-200 tracking-tight leading-none">
            {kpis.total_train_delay_mins}
            <span className="text-[10px] font-semibold text-purple-400 ml-0.5">m</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.5 rounded flex items-center">
            <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> -{baseline.train_delay_reduction_pct}%
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tight">
          vs {baseline.heuristic_train_delay_mins}m un-optimized
        </div>
      </div>

      {/* 4. Multi-Dept Super-Tasks */}
      <div className="telemetry-card telemetry-card-amber bg-slate-950/80 py-2 px-3">
        <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono font-bold uppercase tracking-wider">
          <span>SUPER-TASKS</span>
          <Layers className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-amber-300 tracking-tight leading-none">
            {kpis.super_tasks_created}
          </span>
          <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-950/80 border border-amber-800/60 px-1 py-0.5 rounded">
            {baseline.multi_dept_colocation_rate_pct}% CO-LOC
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tight">
          Eng + S&T + TRD combined
        </div>
      </div>

      {/* 5. Solver Runtime Telemetry */}
      <div className="telemetry-card telemetry-card-blue bg-slate-950/80 py-2 px-3">
        <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono font-bold uppercase tracking-wider">
          <span>SOLVER RUNTIME</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-cyan-300 tracking-tight leading-none">
            {kpis.solved_in_ms}
            <span className="text-[10px] font-semibold text-slate-400 ml-0.5">ms</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-extrabold bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.5 rounded uppercase">
            {kpis.solver_status}
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tight">
          OR-Tools CP-SAT Engine
        </div>
      </div>
    </div>
  );
};



