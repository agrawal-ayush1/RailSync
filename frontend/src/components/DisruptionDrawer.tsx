import React, { useState } from 'react';
import type { DisruptionEvent, OptimizationResponse } from '../types';
import { AlertTriangle, RefreshCw, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface DisruptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectAndReplan: (disruption: DisruptionEvent) => Promise<void>;
  isReplanning: boolean;
  lastResponse?: OptimizationResponse;
}

export const DisruptionDrawer: React.FC<DisruptionDrawerProps> = ({
  isOpen,
  onClose,
  onInjectAndReplan,
  isReplanning,
  lastResponse,
}) => {
  const [disruptionType, setDisruptionType] = useState('EMERGENCY_RAIL_DEFECT');
  const [sectionId, setSectionId] = useState('SEC-UP-GZB-ALJN');
  const [occurrenceMin, setOccurrenceMin] = useState(630); // 10:30 AM
  const [durationMins, setDurationMins] = useState(90);
  const [description, setDescription] = useState('Emergency rail defect detected at Km 54.');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const event: DisruptionEvent = {
      event_id: `DIS-${Date.now()}`,
      disruption_type: disruptionType,
      section_id: sectionId,
      occurrence_time_min: occurrenceMin,
      duration_mins: durationMins,
      description: description,
    };
    await onInjectAndReplan(event);
  };

  const formatMinToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const diff = lastResponse?.diff_from_previous;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-950 border-l border-red-900/40 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white font-mono uppercase tracking-tight">
                  Inject Operational Disruption
                </h2>
                <p className="text-xs text-slate-400 font-medium">Simulate track defects, signal failures, or unscheduled train delays</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Operational State Transition Visualizer */}
          <div className="mb-6 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 font-bold">NORMAL</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-red-400 font-extrabold bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
              ⚠ DISRUPTION
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-300 font-bold">CP-SAT REPLAN</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-400 font-bold">NEW SAFE PLAN</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4.5 mb-6">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                DISRUPTION TYPE
              </label>
              <select
                value={disruptionType}
                onChange={(e) => setDisruptionType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 font-mono outline-none"
              >
                <option value="EMERGENCY_RAIL_DEFECT">Emergency Rail Defect / Fracture (P-Way Urgent)</option>
                <option value="SIGNAL_INTERLOCKING_FAILURE">Signal Interlocking Failure (S&T Incident)</option>
                <option value="CATENARY_OHE_TRIP">OHE Catenary Wire Trip (TRD Incident)</option>
                <option value="TRAIN_UNSCHEDULED_DELAY">Unscheduled Upstream Freight Delay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                TARGET TRACK SECTION
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 font-mono outline-none"
              >
                <option value="SEC-UP-GZB-ALJN">SEC-UP-GZB-ALJN (Ghaziabad - Aligarh UP)</option>
                <option value="SEC-DN-ALJN-GZB">SEC-DN-ALJN-GZB (Aligarh - Ghaziabad DOWN)</option>
                <option value="SEC-UP-ALJN-CNB">SEC-UP-ALJN-CNB (Aligarh - Kanpur UP)</option>
                <option value="SEC-DN-CNB-ALJN">SEC-DN-CNB-ALJN (Kanpur - Aligarh DOWN)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  DISRUPTION TIME (SIM CLOCK)
                </label>
                <div className="flex items-center gap-2.5 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="range"
                    min="60"
                    max="1200"
                    step="30"
                    value={occurrenceMin}
                    onChange={(e) => setOccurrenceMin(Number(e.target.value))}
                    className="w-full accent-red-400"
                  />
                  <span className="text-xs font-mono font-black text-cyan-300 shrink-0">
                    {formatMinToTime(occurrenceMin)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  BLOCKAGE DURATION (MINS)
                </label>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                INCIDENT DESCRIPTION
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isReplanning}
              className="w-full btn btn-danger py-3 text-xs font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
              {isReplanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" /> Re-optimizing CP-SAT Schedule...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" /> Inject Disruption & Replan Remaining Schedule
                </>
              )}
            </button>
          </form>

          {/* Schedule Diff Inspection */}
          {diff && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" /> REPLAN SCHEDULE DIFF
                </span>
                <span className="text-slate-400 font-mono">
                  CLOCK: {formatMinToTime(diff.disruption_clock_min)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-bold">FROZEN HISTORICAL ACTIVITIES:</div>
                  <div className="text-emerald-400 font-black text-sm">{diff.frozen_activity_count} LOCKED</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-bold">SHIFTED MAINTENANCE BLOCKS:</div>
                  <div className="text-amber-400 font-black text-sm">{diff.moved_blocks.length} RE-SCHEDULED</div>
                </div>
              </div>

              {diff.moved_blocks.length > 0 && (
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SHIFTED BLOCKS DETAILS:</div>
                  {diff.moved_blocks.map((mb) => (
                    <div key={mb.block_id} className="p-2 rounded bg-slate-950 text-slate-300 flex items-center justify-between text-[11px] border border-slate-800/80">
                      <span className="font-semibold">{mb.block_id}: {mb.work_description}</span>
                      <span className="text-amber-300 font-black">+{mb.shift_mins}m shift</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

