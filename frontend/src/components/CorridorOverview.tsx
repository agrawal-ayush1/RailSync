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
    <div className="glass-panel p-3.5 mb-2 border-t-2 border-t-cyan-400 bg-slate-950/90 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase tracking-widest">
              INFRASTRUCTURE TOPOLOGY
            </span>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Navigation className="w-4 h-4 text-cyan-400" />
              CORRIDOR TRACK SCHEMATIC MAP
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Indian Railways High-Density Network HDN-1 (Ghaziabad - Aligarh - Kanpur Section)
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-cyan-300 bg-slate-900 px-3 py-1 rounded border border-slate-800 shadow-inner">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{sectionCount} SECTIONS • {totalLengthKm} KM CORRIDOR LENGTH</span>
        </div>
      </div>

      {/* Station Track Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3.5">
        {[
          { code: 'GZB', name: 'Ghaziabad Junction', km: '0.0', type: 'Major Interchange Yard' },
          { code: 'ALJN', name: 'Aligarh Junction', km: '106.0', type: 'Division Control Section' },
          { code: 'CNB', name: 'Kanpur Central', km: '301.0', type: 'High Density Terminal' },
        ].map((stn) => (
          <div key={stn.code} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/90 flex items-center gap-3.5 shadow-lg hover:border-cyan-500/30 transition-all">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-lg shadow-inner">
              <MapPin className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-mono tracking-wider">{stn.code}</span>
                <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">Km {stn.km}</span>
              </div>
              <div className="text-xs text-slate-200 font-bold mt-0.5">{stn.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{stn.type}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Corridor Track Lines Diagram */}
      <div className="space-y-4">
        {sections.map((sec) => {
          const secBlocks = blocks.filter((b) => b.section_id === sec.section_id);

          return (
            <div key={sec.section_id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/90 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 text-xs font-black font-mono rounded ${sec.direction === 'UP' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-purple-950 text-purple-300 border border-purple-800'}`}>
                    {sec.direction} LINE
                  </span>
                  <span className="text-sm font-extrabold text-slate-100 font-sans">{sec.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono font-bold">
                  <span>{sec.length_km} KM</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-emerald-400">{sec.max_speed_kmh} KM/H MAX</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-amber-400">{secBlocks.length} ACTIVE BLOCKS</span>
                </div>
              </div>

              {/* Track Line Visualizer Bar */}
              <div className="relative h-7 bg-slate-950 rounded-lg border border-slate-800 flex items-center px-2.5 overflow-hidden gap-2 shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(51,65,85,0.4)_50%)] bg-[length:24px_100%] pointer-events-none" />
                
                {/* Active Blocks Badges */}
                {secBlocks.map((b) => (
                  <div
                    key={b.block_id}
                    className={`h-5 rounded px-2.5 text-[10px] font-black font-mono flex items-center gap-1 shadow-sm ${
                      b.is_super_task
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-400'
                        : 'bg-emerald-950/90 text-emerald-300 border border-emerald-400'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
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

