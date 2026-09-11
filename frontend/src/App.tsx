import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import type {
  ScenarioData,
  OptimizationResponse,
  DisruptionEvent,
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
  Info,
} from 'lucide-react';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [optResponse, setOptResponse] = useState<OptimizationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'gantt' | 'corridor' | 'super_tasks' | 'explain'>('gantt');
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDisruptionOpen, setIsDisruptionOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [status, setStatus] = useState<'BASELINE' | 'OPTIMAL' | 'FEASIBLE' | 'REOPTIMIZED' | 'APPROVED' | 'DISRUPTED'>('BASELINE');
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
    } catch (err: any) {
      setErrorToast(`Replan error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApprove = async (notes: string) => {
    try {
      await api.approvePlan(notes);
      setStatus('APPROVED');
    } catch (err: any) {
      setErrorToast(`Approval failed: ${err.message}`);
    }
  };

  const handleReset = async () => {
    try {
      const res = await api.resetScenario();
      setScenario(res.scenario);
      setOptResponse(null);
      setStatus('BASELINE');
    } catch (err: any) {
      setErrorToast('Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-6">
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

      {/* Synthetic Notice Banner */}
      <div className="mb-4 px-4 py-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          {scenario?.is_synthetic_notice || 'Synthetic Demo Data — not live Indian Railways data.'}
        </span>
        <span className="hidden md:inline text-slate-500">
          Indian Railways Operation Concept Prototype (SIH26027)
        </span>
      </div>

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
        <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center justify-between">
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
      <div className="flex border-b border-slate-800 mb-4 bg-slate-900/40 px-2 rounded-t-lg">
        <button
          onClick={() => setActiveTab('gantt')}
          className={`tab-btn flex items-center gap-2 ${activeTab === 'gantt' ? 'active' : ''}`}
        >
          <Clock className="w-4 h-4" />
          Corridor Timeline (Gantt Console)
        </button>
        <button
          onClick={() => setActiveTab('corridor')}
          className={`tab-btn flex items-center gap-2 ${activeTab === 'corridor' ? 'active' : ''}`}
        >
          <Navigation className="w-4 h-4" />
          Corridor Map Schematic
        </button>
        <button
          onClick={() => setActiveTab('super_tasks')}
          className={`tab-btn flex items-center gap-2 ${activeTab === 'super_tasks' ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          Super-Task Inspector ({optResponse?.super_tasks.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`tab-btn flex items-center gap-2 ${activeTab === 'explain' ? 'active' : ''}`}
        >
          <Cpu className="w-4 h-4" />
          Decision Inspector ({optResponse?.explanations.length || 0})
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
      />
    </div>
  );
};
export default App;
