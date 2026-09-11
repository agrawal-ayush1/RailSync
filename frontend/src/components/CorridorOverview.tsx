import React from 'react';
import type { CorridorSection, ScheduledBlock, ScheduledTrainPath } from '../types';
import { MapPin, Navigation, Zap, Activity } from 'lucide-react';

interface CorridorOverviewProps {
  sections: CorridorSection[];
  blocks: ScheduledBlock[];
  trains: ScheduledTrainPath[];
}

export const CorridorOverview: React.FC<CorridorOverviewProps> = ({
  sections,
  blocks,
}) => {
  const sectionCount = sections.length;
  const totalLengthKm = sections.reduce((sum, s) => sum + s.length_km, 0);

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Corridor Infrastructure Topology & Track Schematic Map
          </h2>
          <p className="text-xs text-slate-400">
            Indian Railways High-Density Network HDN-1 (Ghaziabad - Aligarh - Kanpur Section)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{sectionCount} MAIN LINE TRACK SECTIONS • {totalLengthKm} KM CORRIDOR LENGTH</span>
        </div>
      </div>

      {/* Station Track Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { code: 'GZB', name: 'Ghaziabad Junction', km: '0.0', type: 'Major Interchange Yard' },
          { code: 'ALJN', name: 'Aligarh Junction', km: '106.0', type: 'Division Control Section' },
          { code: 'CNB', name: 'Kanpur Central', km: '301.0', type: 'High Density Terminal' },
        ].map((stn) => (
          <div key={stn.code} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
              <MapPin className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{stn.code}</span>
                <span className="text-[11px] text-slate-400 font-mono">Km {stn.km}</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">{stn.name}</div>
              <div className="text-[10px] text-slate-500">{stn.type}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Corridor Track Lines Diagram */}
      <div className="space-y-4">
        {sections.map((sec) => {
          const secBlocks = blocks.filter((b) => b.section_id === sec.section_id);

          return (
            <div key={sec.section_id} className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${sec.direction === 'UP' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                    {sec.direction} LINE
                  </span>
                  <span className="text-sm font-bold text-slate-200">{sec.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>{sec.length_km} KM</span>
                  <span>|</span>
                  <span className="text-emerald-400 font-semibold">{sec.max_speed_kmh} KM/H MAX SPEED</span>
                  <span>|</span>
                  <span className="text-amber-400 font-semibold">{secBlocks.length} ACTIVE BLOCKS</span>
                </div>
              </div>

              {/* Track Line Visualizer Bar */}
              <div className="relative h-6 bg-slate-950 rounded border border-slate-800 flex items-center px-2 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(51,65,85,0.4)_50%)] bg-[length:20px_100%] pointer-events-none" />
                
                {/* Active Blocks Badges */}
                {secBlocks.map((b) => (
                  <div
                    key={b.block_id}
                    className={`h-4 rounded px-2 text-[10px] font-bold flex items-center gap-1 ${
                      b.is_super_task
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                        : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                    }`}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {b.block_id} ({b.duration_mins}m)
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
