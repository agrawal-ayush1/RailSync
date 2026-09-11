import React from 'react';
import {
  Train,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  RefreshCw,
  Clock,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  status: string; // BASELINE, OPTIMAL, FEASIBLE, REOPTIMIZED, APPROVED
  simulationClockMin: number;
  isOptimizing: boolean;
  onOptimize: () => void;
  onOpenDisruption: () => void;
  onReplan: () => void;
  onApprove: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  simulationClockMin,
  isOptimizing,
  onOptimize,
  onOpenDisruption,
  onReplan,
  onApprove,
  onReset,
}) => {
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'OPTIMAL':
      case 'FEASIBLE':
        return <span className="badge badge-optimal"><Zap className="w-3.5 h-3.5" /> CP-SAT OPTIMIZED</span>;
      case 'REOPTIMIZED':
        return <span className="badge badge-reoptimized"><RefreshCw className="w-3.5 h-3.5" /> RE-OPTIMIZED</span>;
      case 'APPROVED':
        return <span className="badge badge-optimal"><CheckCircle className="w-3.5 h-3.5" /> APPROVED & DISPATCHED</span>;
      case 'DISRUPTED':
        return <span className="badge badge-disrupted"><AlertTriangle className="w-3.5 h-3.5" /> DISRUPTION ACTIVE</span>;
      default:
        return <span className="badge badge-baseline">BASELINE (UN-OPTIMIZED)</span>;
    }
  };

  return (
    <header className="glass-panel px-5 py-3 mb-3 border-b border-slate-800">
      {/* Top Main Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        {/* LEFT: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
            <Train className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider text-white font-mono flex items-center gap-2">
                RAILSYNC
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              AI-Powered Automatic Block Planning
            </p>
          </div>
        </div>

        {/* CENTER: Corridor Telemetry */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 px-4 py-1.5 rounded border border-slate-800">
          <span className="text-slate-400 text-xs font-mono font-bold">CORRIDOR:</span>
          <span className="text-white font-mono font-bold text-sm tracking-wider">GZB → ALJN → CNB</span>
          <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono font-semibold px-2 py-0.5 rounded border border-slate-700">
            HDN-1 CORRIDOR
          </span>
        </div>

        {/* RIGHT: Operational Telemetry & Synthetic Disclosure */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">Synthetic Demo Data — not live Indian Railways data</span>
          </div>
        </div>
      </div>

      {/* Bottom Operational Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5">
        {/* Simulation Clock */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 uppercase">Sim Clock:</span>
          <span className="text-cyan-300 font-bold text-sm">{formatTime(simulationClockMin)}</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="btn btn-primary text-xs"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Solving CP-SAT...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" /> Generate Optimal Plan
              </>
            )}
          </button>

          <button
            onClick={onOpenDisruption}
            className="btn btn-danger text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Inject Disruption
          </button>

          {simulationClockMin > 0 && (
            <button
              onClick={onReplan}
              disabled={isOptimizing}
              className="btn btn-secondary text-xs border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replan Remaining
            </button>
          )}

          <button
            onClick={onApprove}
            disabled={status === 'BASELINE'}
            className="btn btn-secondary text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve Plan
          </button>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors border border-slate-800"
            title="Reset Demo Scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

