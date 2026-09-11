import React from 'react';
import {
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
        return <span className="badge badge-optimal text-[10px] py-0.5 px-2"><Zap className="w-3 h-3" /> CP-SAT OPTIMIZED</span>;
      case 'REOPTIMIZED':
        return <span className="badge badge-reoptimized text-[10px] py-0.5 px-2"><RefreshCw className="w-3 h-3" /> RE-OPTIMIZED</span>;
      case 'APPROVED':
        return <span className="badge badge-optimal text-[10px] py-0.5 px-2 bg-emerald-950/90 border-emerald-500/60 text-emerald-300"><CheckCircle className="w-3 h-3 text-emerald-400" /> DISPATCH APPROVED</span>;
      case 'DISRUPTED':
        return <span className="badge badge-disrupted text-[10px] py-0.5 px-2"><AlertTriangle className="w-3 h-3" /> DISRUPTED</span>;
      default:
        return <span className="badge badge-baseline text-[10px] py-0.5 px-2">CP-SAT READY</span>;
    }
  };

  return (
    <header className="glass-panel px-3.5 py-2 mb-2 border-b border-cyan-900/40 bg-slate-950/90 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* LEFT: Branding & Core Identity */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 rounded-md shadow-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19L20 19" />
              <path d="M4 5L20 5" />
              <path d="M7 5V19" />
              <path d="M12 5V19" strokeWidth="2.8" className="text-cyan-300" />
              <path d="M17 5V19" />
              <circle cx="12" cy="12" r="2.2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white font-sans flex items-center leading-none">
                <span className="text-white tracking-wider">RAIL</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-black tracking-wider ml-0.5">SYNC</span>
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
              AI-Powered Automatic Block Planning
            </p>
          </div>
        </div>

        {/* CENTER: Corridor Telemetry & Clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded border border-slate-800 shadow-inner">
          <span className="text-slate-400 text-[11px] font-mono font-bold">CORRIDOR:</span>
          <span className="text-white font-mono font-extrabold text-xs tracking-wider flex items-center gap-1">
            <span className="text-cyan-400">GZB</span>
            <span className="text-slate-600">➔</span>
            <span className="text-amber-400">ALJN</span>
            <span className="text-slate-600">➔</span>
            <span className="text-purple-400">CNB</span>
          </span>
          <span className="text-[9px] bg-cyan-950/80 text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-800/50">
            HDN-1
          </span>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 font-extrabold">{formatTime(simulationClockMin)}</span>
          </div>
        </div>

        {/* RIGHT: Status, Synthetic Notice & Actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-[11px]">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>ONLINE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Synthetic Demo Data — not live Indian Railways data</span>
          </div>

          <button
            onClick={onOpenDisruption}
            className="btn btn-danger py-1 px-2.5 text-[11px]"
            title="Inject Track or Signal Disruption"
          >
            <AlertTriangle className="w-3 h-3" /> Disruption
          </button>

          {simulationClockMin > 0 && (
            <button
              onClick={onReplan}
              disabled={isOptimizing}
              className="btn btn-secondary py-1 px-2.5 text-[11px] border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
              title="Replan Schedule From Clock"
            >
              <RefreshCw className="w-3 h-3" /> Replan
            </button>
          )}

          {status === 'APPROVED' ? (
            <button
              onClick={onApprove}
              className="btn btn-secondary py-1 px-2.5 text-[11px] border-emerald-500/60 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 font-bold"
              title="View Signed Dispatch Order"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Dispatched
            </button>
          ) : (
            <button
              onClick={onApprove}
              disabled={status === 'BASELINE'}
              className="btn btn-secondary py-1 px-2.5 text-[11px] border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 font-bold"
              title="Approve & Dispatch Plan"
            >
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
          )}

          <button
            onClick={onReset}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all border border-slate-800"
            title="Reset Demo Scenario"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};



