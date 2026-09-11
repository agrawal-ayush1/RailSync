export type Direction = 'UP' | 'DOWN' | 'BOTH';

export type Department =
  | 'Engineering (P-Way)'
  | 'Signalling & Telecom (S&T)'
  | 'Traction Distribution (TRD/OHE)'
  | 'Mechanical (C&W)';

export type Priority = 'EMERGENCY' | 'HIGH' | 'ROUTINE';

export interface CorridorSection {
  section_id: string;
  name: string;
  direction: Direction;
  start_station: string;
  end_station: string;
  length_km: number;
  max_speed_kmh: number;
  tracks_count: number;
  electrical_zone_id: string;
}

export interface SectionTraversal {
  section_id: string;
  scheduled_entry_min: number;
  scheduled_exit_min: number;
  run_time_mins: number;
}

export interface TrainService {
  train_id: string;
  name: string;
  priority_class: number;
  direction: Direction;
  traversals: SectionTraversal[];
  max_allowable_delay_mins: number;
}

export interface MaintenanceDemand {
  demand_id: string;
  department: Department;
  section_id: string;
  work_description: string;
  duration_mins: number;
  earliest_start_min: number;
  latest_finish_min: number;
  priority: Priority;
  requires_power_block: boolean;
  required_resource_id?: string;
  is_frozen?: boolean;
  historic_start_min?: number;
  historic_end_min?: number;
}

export interface SuperTask {
  super_task_id: string;
  section_id: string;
  bundled_demand_ids: string[];
  primary_department: Department;
  co_departments: Department[];
  duration_mins: number;
  downtime_saved_mins: number;
  scheduled_start_min?: number;
  scheduled_end_min?: number;
}

export interface ScheduledBlock {
  block_id: string;
  section_id: string;
  demand_ids: string[];
  is_super_task: boolean;
  super_task_id?: string;
  departments: Department[];
  work_descriptions: string[];
  start_min: number;
  end_min: number;
  duration_mins: number;
  downtime_saved_mins: number;
  is_frozen?: boolean;
}

export interface ScheduledTrainPath {
  train_id: string;
  name: string;
  priority_class: number;
  direction: Direction;
  scheduled_start_min: number;
  actual_start_min: number;
  delay_mins: number;
  traversals: {
    section_id: string;
    entry_min: number;
    exit_min: number;
    delay_mins: number;
  }[];
}

export interface DisruptionEvent {
  event_id: string;
  disruption_type: string;
  section_id: string;
  occurrence_time_min: number;
  duration_mins: number;
  description: string;
  affected_train_id?: string;
}

export interface BaselineComparisonMetrics {
  heuristic_total_block_hours: number;
  optimized_total_block_hours: number;
  block_hours_reduction_pct: number;
  heuristic_train_delay_mins: number;
  optimized_train_delay_mins: number;
  train_delay_reduction_pct: number;
  multi_dept_colocation_rate_pct: number;
}

export interface OptimizationKpis {
  asset_availability_pct: number;
  line_capacity_preserved_pct: number;
  total_train_delay_mins: number;
  super_tasks_created: number;
  downtime_saved_hours: number;
  solved_in_ms: number;
  solver_status: string;
}

export interface OptimizationResponse {
  plan_id: string;
  status: string;
  solve_time_ms: number;
  simulation_clock_min: number;
  kpis: OptimizationKpis;
  baseline_comparison: BaselineComparisonMetrics;
  scheduled_blocks: ScheduledBlock[];
  scheduled_trains: ScheduledTrainPath[];
  super_tasks: SuperTask[];
  explanations: {
    id: string;
    category: string;
    title: string;
    summary: string;
    details: string;
    metrics: Record<string, any>;
    icon?: string;
  }[];
  diff_from_previous?: {
    frozen_activity_count: number;
    moved_blocks: {
      block_id: string;
      work_description: string;
      old_start: number;
      new_start: number;
      shift_mins: number;
    }[];
    trains_with_new_delays: {
      train_id: string;
      name: string;
      old_delay: number;
      new_delay: number;
      added_delay: number;
    }[];
    disruption_clock_min: number;
  };
}

export interface ScenarioData {
  corridor_id: string;
  corridor_name: string;
  sections: CorridorSection[];
  trains: TrainService[];
  demands: MaintenanceDemand[];
  simulation_clock_min: number;
  is_synthetic_notice: string;
}
