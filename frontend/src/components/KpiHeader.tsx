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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-slate-900/60 h-20 rounded border border-slate-800/80"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      {/* 1. Track Downtime & Capacity */}
      <div className="telemetry-card telemetry-card-cyan">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
          <span>TRACK DOWNTIME</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-white">
            {kpis.asset_availability_pct}%
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">
            +{baseline.block_hours_reduction_pct}% capacity
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          {kpis.downtime_saved_hours}h track downtime saved
        </div>
      </div>

      {/* 2. Line Capacity Preserved */}
      <div className="telemetry-card telemetry-card-emerald">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
          <span>LINE CAPACITY</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-white">
            {kpis.line_capacity_preserved_pct}%
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">Protected</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          VVIP & Mail schedules protected
        </div>
      </div>

      {/* 3. Total Train Delays Avoided */}
      <div className="telemetry-card telemetry-card-purple">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
          <span>TRAIN DELAYS</span>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-purple-300">
            {kpis.total_train_delay_mins} <span className="text-xs text-slate-400 font-normal">mins</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center">
            <TrendingDown className="w-3 h-3 mr-0.5" /> -{baseline.train_delay_reduction_pct}%
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          vs {baseline.heuristic_train_delay_mins}m un-optimized baseline
        </div>
      </div>

      {/* 4. Multi-Dept Super-Tasks */}
      <div className="telemetry-card telemetry-card-amber">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
          <span>SUPER-TASKS</span>
          <Layers className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-amber-300">
            {kpis.super_tasks_created}
          </span>
          <span className="text-[11px] text-amber-400 font-mono font-bold">
            {baseline.multi_dept_colocation_rate_pct}% Co-located
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          Eng + S&T + TRD combined
        </div>
      </div>

      {/* 5. Solver Runtime Telemetry */}
      <div className="telemetry-card telemetry-card-blue">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono font-bold uppercase">
          <span>SOLVER TELEMETRY</span>
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-cyan-300">
            {kpis.solved_in_ms} <span className="text-xs text-slate-400 font-normal">ms</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold uppercase">
            {kpis.solver_status}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          OR-Tools CP-SAT Engine
        </div>
      </div>
    </div>
  );
};

