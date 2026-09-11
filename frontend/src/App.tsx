import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import type {
  ScenarioData,
  OptimizationResponse,
  DisruptionEvent,
  ApprovalResponse,
} from './types';

import { Header } from './components/Header';
import { CommandHero } from './components/CommandHero';
import { KpiHeader } from './components/KpiHeader';
import { GanttConsole } from './components/GanttConsole';
import { CorridorOverview } from './components/CorridorOverview';
import { SuperTaskHub } from './components/SuperTaskHub';
import { DecisionInspector } from './components/DecisionInspector';
import { DisruptionDrawer } from './components/DisruptionDrawer';
import { ApprovalModal } from './components/ApprovalModal';

import {
  Clock,
  Layers,
  Cpu,
  Navigation,
} from 'lucide-react';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [optResponse, setOptResponse] = useState<OptimizationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'gantt' | 'corridor' | 'super_tasks' | 'explain'>('gantt');
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDisruptionOpen, setIsDisruptionOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [status, setStatus] = useState<'BASELINE' | 'OPTIMAL' | 'FEASIBLE' | 'REOPTIMIZED' | 'APPROVED' | 'DISRUPTED'>('BASELINE');
  const [approvalDetails, setApprovalDetails] = useState<ApprovalResponse | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Load initial scenario on mount
  useEffect(() => {
    loadScenario();
  }, []);

  const loadScenario = async () => {
    try {
      const data = await api.getScenario();
      setScenario(data);
    } catch (err: any) {
      setErrorToast('Failed to connect to RailSync backend API. Please ensure FastAPI is running on port 8000.');
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setErrorToast(null);
    try {
      const res = await api.optimizeSchedule(5.0);
      setOptResponse(res);
      setStatus(res.status as any);
      setApprovalDetails(null);
    } catch (err: any) {
      setErrorToast(`Solver failed: ${err.message || 'CP-SAT optimization error'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleInjectDisruption = async (disruption: DisruptionEvent) => {
    setIsOptimizing(true);
    try {
      await api.injectDisruption(disruption);
      const res = await api.replanSchedule(disruption.occurrence_time_min);
      setOptResponse(res);
      setStatus('REOPTIMIZED');
      setApprovalDetails(null);
      setIsDisruptionOpen(false);
    } catch (err: any) {
      setErrorToast(`Replanning error: ${err.message || 'Re-optimization failed'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReplan = async () => {
    setIsOptimizing(true);
    try {
      const clockMin = scenario?.simulation_clock_min || 630;
      const res = await api.replanSchedule(clockMin);
      setOptResponse(res);
      setStatus('REOPTIMIZED');
      setApprovalDetails(null);
    } catch (err: any) {
      setErrorToast(`Replan error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApprove = async (notes: string): Promise<ApprovalResponse> => {
    try {
      const res = await api.approvePlan(notes);
      setApprovalDetails(res);
      setStatus('APPROVED');
      return res;
    } catch (err: any) {
      const msg = err.message || 'Approval failed';
      setErrorToast(`Approval failed: ${msg}`);
      throw new Error(msg);
    }
  };

  const handleReset = async () => {
    try {
      const res = await api.resetScenario();
      setScenario(res.scenario);
      setOptResponse(null);
      setStatus('BASELINE');
      setApprovalDetails(null);
    } catch (err: any) {
      setErrorToast('Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 px-3 py-2 md:px-4 md:py-2.5">
      {/* Top Header Navigation */}
      <Header
        status={status}
        simulationClockMin={optResponse?.simulation_clock_min || scenario?.simulation_clock_min || 0}
        isOptimizing={isOptimizing}
        onOptimize={handleOptimize}
        onOpenDisruption={() => setIsDisruptionOpen(true)}
        onReplan={handleReplan}
        onApprove={() => setIsApprovalOpen(true)}
        onReset={handleReset}
      />

      {/* Command Hero & System Pipeline Stepper */}
      <CommandHero
        status={status}
        isOptimizing={isOptimizing}
        onOptimize={handleOptimize}
        solverRuntimeMs={optResponse?.kpis?.solved_in_ms}
        solverStatus={optResponse?.kpis?.solver_status}
        superTasksCount={optResponse?.kpis?.super_tasks_created}
      />

      {/* Error Toast */}
      {errorToast && (
        <div className="mb-2 p-2 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center justify-between font-mono">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-red-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Operational KPI Header Summary Strip */}
      <KpiHeader
        kpis={optResponse?.kpis}
        baseline={optResponse?.baseline_comparison}
      />

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap items-center border-b border-slate-800/90 mb-1.5 bg-slate-950/80 px-1.5 pt-1 rounded-t-lg gap-1">
        <button
          onClick={() => setActiveTab('gantt')}
          className={`tab-btn flex items-center gap-1.5 font-mono py-1.5 px-3 text-xs ${activeTab === 'gantt' ? 'active' : ''}`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Operations Timeline (Gantt)</span>
        </button>
        <button
          onClick={() => setActiveTab('corridor')}
          className={`tab-btn flex items-center gap-1.5 font-mono py-1.5 px-3 text-xs ${activeTab === 'corridor' ? 'active' : ''}`}
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Corridor Track Schematic</span>
        </button>
        <button
          onClick={() => setActiveTab('super_tasks')}
          className={`tab-btn flex items-center gap-1.5 font-mono py-1.5 px-3 text-xs ${activeTab === 'super_tasks' ? 'active' : ''}`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Super-Task Hub ({optResponse?.super_tasks.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`tab-btn flex items-center gap-1.5 font-mono py-1.5 px-3 text-xs ${activeTab === 'explain' ? 'active' : ''}`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Decision Inspector ({optResponse?.explanations.length || 0})</span>
        </button>
      </div>

      {/* Tab Content Views */}
      {scenario && (
        <div>
          {activeTab === 'gantt' && (
            <GanttConsole
              sections={scenario.sections}
              blocks={optResponse?.scheduled_blocks || []}
              trains={optResponse?.scheduled_trains || []}
              simulationClockMin={optResponse?.simulation_clock_min || scenario.simulation_clock_min || 0}
              status={status}
              diffFromPrevious={optResponse?.diff_from_previous}
            />
          )}

          {activeTab === 'corridor' && (
            <CorridorOverview
              sections={scenario.sections}
              blocks={optResponse?.scheduled_blocks || []}
              trains={optResponse?.scheduled_trains || []}
            />
          )}

          {activeTab === 'super_tasks' && (
            <SuperTaskHub
              superTasks={optResponse?.super_tasks || []}
              blocks={optResponse?.scheduled_blocks || []}
              demands={scenario.demands}
            />
          )}

          {activeTab === 'explain' && (
            <DecisionInspector
              explanations={optResponse?.explanations || []}
            />
          )}
        </div>
      )}

      {/* Disruption Drawer */}
      <DisruptionDrawer
        isOpen={isDisruptionOpen}
        onClose={() => setIsDisruptionOpen(false)}
        onInjectAndReplan={handleInjectDisruption}
        isReplanning={isOptimizing}
        lastResponse={optResponse || undefined}
      />

      {/* Approval Sign-Off Modal */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onConfirmApprove={handleApprove}
        planResponse={optResponse || undefined}
        currentStatus={status}
        approvalDetails={approvalDetails}
      />
    </div>
  );
};
export default App;

