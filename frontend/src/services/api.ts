import axios from 'axios';
import type {
  ScenarioData,
  OptimizationResponse,
  DisruptionEvent,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  getScenario: async (): Promise<ScenarioData> => {
    const res = await client.get<ScenarioData>('/scenario');
    return res.data;
  },

  resetScenario: async (): Promise<{ status: string; scenario: ScenarioData }> => {
    const res = await client.post('/reset');
    return res.data;
  },

  optimizeSchedule: async (timeLimitSec: number = 5.0): Promise<OptimizationResponse> => {
    const res = await client.post<OptimizationResponse>('/optimize', {
      time_limit_sec: timeLimitSec,
    });
    return res.data;
  },

  injectDisruption: async (disruption: DisruptionEvent): Promise<{ status: string }> => {
    const res = await client.post('/disrupt', disruption);
    return res.data;
  },

  replanSchedule: async (simulationClockMin?: number): Promise<OptimizationResponse> => {
    const res = await client.post<OptimizationResponse>('/replan', {
      simulation_clock_min: simulationClockMin,
    });
    return res.data;
  },

  approvePlan: async (plannerNotes: string = 'Approved by Controller.'): Promise<{ status: string; plan_id: string; dispatch_notice: string }> => {
    const res = await client.post('/approve', {
      planner_notes: plannerNotes,
    });
    return res.data;
  },
};
