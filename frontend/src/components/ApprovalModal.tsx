import React, { useState } from 'react';
import type { OptimizationResponse } from '../types';
import { CheckCircle, ShieldCheck, X, Send, ArrowRight, UserCheck } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApprove: (notes: string) => Promise<void>;
  planResponse?: OptimizationResponse;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirmApprove,
  planResponse,
}) => {
  const [notes, setNotes] = useState('Approved by Senior Operational Controller for immediate dispatch.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (!isOpen || !planResponse) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirmApprove(notes);
    setIsSubmitting(false);
    setIsApproved(true);
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
                Approve & Dispatch Schedule
              </h2>
              <p className="text-xs text-slate-400 font-medium">Formal human controller sign-off for Division Control Office dispatch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Human-in-the-Loop Governance Stepper */}
        <div className="mb-5 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-cyan-400 font-bold">1. SYSTEM RECOMMENDATION</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-amber-400 font-extrabold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> 2. HUMAN REVIEW
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-emerald-400 font-bold">3. DISPATCH ORDER</span>
        </div>

        {isApproved ? (
          <div className="text-center py-6 space-y-3">
            <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-white font-mono uppercase">Plan Approved & Dispatched!</h3>
            <p className="text-xs text-slate-400 font-mono">
              Plan ID: <span className="text-cyan-300 font-bold">{planResponse.plan_id}</span> | Transmitted to Division Office
            </p>
            <button onClick={onClose} className="btn btn-primary text-xs py-2 px-6 mt-2 font-bold">
              Done
            </button>
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-emerald-500 font-mono outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-500/40">
                <Send className="w-4 h-4" /> Sign & Transmit Dispatch Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

