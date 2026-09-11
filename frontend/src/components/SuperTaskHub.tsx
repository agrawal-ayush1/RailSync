import React from 'react';
import type { SuperTask, ScheduledBlock, MaintenanceDemand } from '../types';
import { Layers, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

interface SuperTaskHubProps {
  superTasks: SuperTask[];
  blocks: ScheduledBlock[];
  demands: MaintenanceDemand[];
}

export const SuperTaskHub: React.FC<SuperTaskHubProps> = ({
  superTasks,
  demands,
}) => {
  const formatTime = (mins?: number) => {
    if (mins === undefined || mins === null) return 'Unscheduled';
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const totalDowntimeSaved = superTasks.reduce((acc, st) => acc + st.downtime_saved_mins, 0);

  return (
    <div className="glass-panel p-3.5 mb-2 border-t-2 border-t-amber-400 bg-slate-950/90 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 uppercase tracking-widest">
              HERO TECHNOLOGY
            </span>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-amber-400" />
              CROSS-DEPARTMENT SUPER-TASK BUNDLING HUB
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Co-location matrix combining Engineering (P-Way), Signalling (S&T), and Traction (TRD) maintenance windows
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-amber-300 font-mono text-xs shadow-inner">
          <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-extrabold">{totalDowntimeSaved} MINS</span>
          <span className="text-slate-400 text-[10px] font-bold">({(totalDowntimeSaved / 60).toFixed(2)}h) SAVED</span>
        </div>
      </div>

      {superTasks.length === 0 ? (
        <div className="text-center py-6 bg-slate-900/40 rounded-lg border border-slate-800">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-300 text-sm font-bold font-mono">No Super-Tasks activated in Baseline state.</p>
          <p className="text-slate-500 text-xs mt-1">Click "⚡ Generate Optimal Plan" to run CP-SAT multi-department co-location algorithm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {superTasks.map((st) => {
            const bundledDemands = demands.filter((d) => st.bundled_demand_ids.includes(d.demand_id));

            return (
              <div
                key={st.super_task_id}
                className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all shadow-xl relative overflow-hidden"
              >
                {/* Accent Corner Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-mono tracking-wider shadow">
                      SUPER-TASK {st.super_task_id}
                    </span>
                    <span className="text-xs font-bold text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {st.section_id}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-md font-mono shadow-sm flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> +{st.downtime_saved_mins} MINS SAVED
                  </span>
                </div>

                {/* Unified Window Bar */}
                <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800/90 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    UNIFIED BLOCK WINDOW:
                  </div>
                  <div className="text-cyan-300 font-black text-sm tracking-wider flex items-center gap-2">
                    <span>{formatTime(st.scheduled_start_min)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span>{formatTime(st.scheduled_end_min)}</span>
                    <span className="text-amber-400 font-bold text-xs bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      {st.duration_mins} mins
                    </span>
                  </div>
                </div>

                {/* VISUAL CO-LOCATION CONNECTION TREE */}
                <div className="mb-3 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Co-located Department Demands Diagram:</span>
                </div>

                <div className="relative pl-3 border-l-2 border-amber-500/40 space-y-2 mb-4">
                  {bundledDemands.map((d) => (
                    <div
                      key={d.demand_id}
                      className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3 text-xs relative transition-all hover:bg-slate-900/80"
                    >
                      {/* Connection horizontal tick line */}
                      <div className="absolute -left-[14px] top-1/2 w-3 h-0.5 bg-amber-500/40" />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold font-mono text-xs px-2 py-0.5 rounded ${
                            d.department.includes('Engineering') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' :
                            d.department.includes('Traction') || d.department.includes('TRD') ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                            d.department.includes('Signalling') || d.department.includes('S&T') ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' :
                            'bg-purple-950 text-purple-300 border border-purple-800/60'
                          }`}>
                            {d.department}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono font-bold">({d.demand_id})</span>
                        </div>
                        <div className="text-slate-300 mt-1 font-medium">{d.work_description}</div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/30">
                        {d.duration_mins}m req
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-500 flex items-center justify-between">
                  <span className="font-semibold text-[11px]">Combined Access Priority: HIGH</span>
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CP-SAT Bundled & Synchronized
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

