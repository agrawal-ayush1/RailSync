import React from 'react';
import type { SuperTask, ScheduledBlock, MaintenanceDemand } from '../types';
import { Layers, CheckCircle2, TrendingDown } from 'lucide-react';

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
    <div className="glass-panel p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Cross-Department Super-Task Bundling Hub
          </h2>
          <p className="text-xs text-slate-400">
            Co-location matrix combining Engineering (P-Way), Signalling (S&T), and Traction (TRD) maintenance windows
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-md text-amber-300 font-mono text-xs">
          <TrendingDown className="w-4 h-4 text-amber-400" />
          <span className="font-bold">{totalDowntimeSaved} MINS</span>
          <span className="text-slate-400">({(totalDowntimeSaved / 60).toFixed(2)} HOURS) TOTAL DOWNTIME SAVED</span>
        </div>
      </div>

      {superTasks.length === 0 ? (
        <div className="text-center py-8 bg-slate-900/40 rounded-lg border border-slate-800">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">No Super-Tasks activated yet. Click "Generate Optimal Plan" to run CP-SAT bundling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {superTasks.map((st) => {
            const bundledDemands = demands.filter((d) => st.bundled_demand_ids.includes(d.demand_id));

            return (
              <div
                key={st.super_task_id}
                className="bg-slate-900/80 p-4 rounded-lg border border-amber-500/40 hover:border-amber-400 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                      SUPER-TASK {st.super_task_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {st.section_id}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    +{st.downtime_saved_mins} MINS SAVED
                  </span>
                </div>

                <div className="mb-3 p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-400">
                    UNIFIED BLOCK WINDOW:
                  </div>
                  <div className="text-cyan-300 font-bold">
                    {formatTime(st.scheduled_start_min)} - {formatTime(st.scheduled_end_min)} ({st.duration_mins} mins)
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-2 font-medium">CO-LOCATED DEPARTMENTAL REQUESTS:</div>

                <div className="space-y-2">
                  {bundledDemands.map((d) => (
                    <div
                      key={d.demand_id}
                      className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{d.department}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({d.demand_id})</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">{d.work_description}</div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[11px] text-slate-400">
                        Requested: {d.duration_mins}m
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Combined Access Priority: HIGH</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CP-SAT Co-located
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
