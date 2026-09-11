import React, { useState } from 'react';
import type { OptimizationResponse, ApprovalResponse } from '../types';
import { CheckCircle, ShieldCheck, X, Send, ArrowRight, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApprove: (notes: string) => Promise<ApprovalResponse>;
  planResponse?: OptimizationResponse;
  currentStatus: string;
  approvalDetails?: ApprovalResponse | null;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirmApprove,
  planResponse,
  currentStatus,
  approvalDetails,
}) => {
  const [notes, setNotes] = useState('Approved by Senior Operational Controller for immediate dispatch.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !planResponse) return null;

  const isAlreadyApproved = currentStatus === 'APPROVED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmApprove(notes);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dispatch approval transmission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border border-emerald-900/40 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-mono uppercase tracking-tight">
                {isAlreadyApproved ? 'Dispatch Order Transmitted' : 'Approve & Dispatch Schedule'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isAlreadyApproved
                  ? 'Official human controller sign-off confirmed'
                  : 'Formal human controller sign-off for Division Control Office dispatch'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Human-in-the-Loop Governance Stepper */}
        <div className="mb-5 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-cyan-400" /> 1. CP-SAT PLAN
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-extrabold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> 2. HUMAN REVIEW
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`font-bold flex items-center gap-1 ${isAlreadyApproved ? 'text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800' : 'text-slate-500'}`}>
            <ShieldCheck className="w-3 h-3" /> 3. DISPATCH ORDER
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>DISPATCH APPROVAL FAILED: {errorMsg}</span>
          </div>
        )}

        {isAlreadyApproved ? (
          <div className="space-y-4">
            <div className="text-center py-4 bg-emerald-950/30 rounded-xl border border-emerald-800/60 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                DISPATCH ORDER TRANSMITTED
              </h3>
              <p className="text-xs text-emerald-300 font-mono">
                {approvalDetails?.dispatch_notice || 'Dispatch order generated and transmitted to Division Control Office.'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>PLAN ID:</span>
                <span className="text-cyan-300 font-bold">{approvalDetails?.plan_id || planResponse.plan_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>STATUS:</span>
                <span className="text-emerald-400 font-bold">APPROVED & DISPATCHED</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CONTROLLER REMARKS:</span>
                <span className="text-white font-semibold">{approvalDetails?.planner_notes || notes}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="btn btn-primary text-xs py-2 px-6 font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-500">
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>PLAN IDENTIFIER:</span>
                <span className="text-cyan-300 font-bold">{planResponse.plan_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ASSET AVAILABILITY:</span>
                <span className="text-emerald-400 font-bold">{planResponse.kpis.asset_availability_pct}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SUPER-TASKS ACTIVATED:</span>
                <span className="text-amber-400 font-bold">{planResponse.kpis.super_tasks_created} ({planResponse.kpis.downtime_saved_hours}h saved)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TOTAL TRAIN DELAY:</span>
                <span className="text-purple-300 font-bold">{planResponse.kpis.total_train_delay_mins} mins (-{planResponse.baseline_comparison.train_delay_reduction_pct}%)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                SENIOR CONTROLLER REMARKS & SIGN-OFF NOTES
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-emerald-500 font-mono outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-500/40 disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>TRANSMITTING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Sign & Transmit Dispatch Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


