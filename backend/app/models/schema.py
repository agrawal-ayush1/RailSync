from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DirectionEnum(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    BOTH = "BOTH"


class DepartmentEnum(str, Enum):
    ENG = "Engineering (P-Way)"
    SIG = "Signalling & Telecom (S&T)"
    TRD = "Traction Distribution (TRD/OHE)"
    MECH = "Mechanical (C&W)"


class DemandPriorityEnum(str, Enum):
    EMERGENCY = "EMERGENCY"
    HIGH = "HIGH"
    ROUTINE = "ROUTINE"


class CorridorSection(BaseModel):
    section_id: str = Field(..., description="Unique section ID, e.g., SEC-UP-GZB-ALJN")
    name: str = Field(..., description="Human readable name, e.g., Ghaziabad - Aligarh UP Main")
    direction: DirectionEnum
    start_station: str
    end_station: str
    length_km: float
    max_speed_kmh: int = 130
    tracks_count: int = 1
    electrical_zone_id: str = "OHE-ZONE-1"


class SectionTraversal(BaseModel):
    section_id: str
    scheduled_entry_min: int  # Minutes from 00:00 (0..1440)
    scheduled_exit_min: int
    run_time_mins: int


class TrainService(BaseModel):
    train_id: str = Field(..., description="Train number/code, e.g., 12004")
    name: str = Field(..., description="Train name, e.g., Vande Bharat Express")
    priority_class: int = Field(..., description="1 = VVIP, 2 = Mail/Express, 3 = Freight")
    direction: DirectionEnum
    traversals: List[SectionTraversal]
    max_allowable_delay_mins: int = 60


class MaintenanceDemand(BaseModel):
    demand_id: str = Field(..., description="Unique demand ID, e.g., DEM-ENG-101")
    department: DepartmentEnum
    section_id: str
    work_description: str
    duration_mins: int
    earliest_start_min: int  # Earliest minute of 24h day
    latest_finish_min: int   # Latest finish minute of 24h day
    priority: DemandPriorityEnum
    requires_power_block: bool = False
    required_resource_id: Optional[str] = None
    is_frozen: bool = False
    historic_start_min: Optional[int] = None
    historic_end_min: Optional[int] = None


class SuperTask(BaseModel):
    super_task_id: str
    section_id: str
    bundled_demand_ids: List[str]
    primary_department: DepartmentEnum
    co_departments: List[DepartmentEnum]
    duration_mins: int
    downtime_saved_mins: int
    scheduled_start_min: Optional[int] = None
    scheduled_end_min: Optional[int] = None


class ScheduledBlock(BaseModel):
    block_id: str
    section_id: str
    demand_ids: List[str]
    is_super_task: bool = False
    super_task_id: Optional[str] = None
    departments: List[DepartmentEnum]
    work_descriptions: List[str]
    start_min: int
    end_min: int
    duration_mins: int
    downtime_saved_mins: int = 0
    is_frozen: bool = False


class ScheduledTrainPath(BaseModel):
    train_id: str
    name: str
    priority_class: int
    direction: DirectionEnum
    scheduled_start_min: int
    actual_start_min: int
    delay_mins: int
    traversals: List[Dict[str, Any]]  # section_id, entry_min, exit_min, delay_mins


class DisruptionEvent(BaseModel):
    event_id: str = Field(default="DIS-01")
    disruption_type: str = Field(..., description="e.g. EMERGENCY_RAIL_DEFECT, SIGNAL_FAULT, TRAIN_DELAY")
    section_id: str
    occurrence_time_min: int = Field(..., description="Simulation clock minute when disruption happens")
    duration_mins: int
    description: str
    affected_train_id: Optional[str] = None


class BaselineComparisonMetrics(BaseModel):
    heuristic_total_block_hours: float
    optimized_total_block_hours: float
    block_hours_reduction_pct: float
    heuristic_train_delay_mins: int
    optimized_train_delay_mins: int
    train_delay_reduction_pct: float
    multi_dept_colocation_rate_pct: float


class OptimizationKpis(BaseModel):
    asset_availability_pct: float
    line_capacity_preserved_pct: float
    total_train_delay_mins: int
    super_tasks_created: int
    downtime_saved_hours: float
    solved_in_ms: float
    solver_status: str


class OptimizationResponse(BaseModel):
    plan_id: str
    status: str  # OPTIMAL, FEASIBLE, REOPTIMIZED
    solve_time_ms: float
    simulation_clock_min: int = 0
    kpis: OptimizationKpis
    baseline_comparison: BaselineComparisonMetrics
    scheduled_blocks: List[ScheduledBlock]
    scheduled_trains: List[ScheduledTrainPath]
    super_tasks: List[SuperTask]
    explanations: List[Dict[str, Any]]
    diff_from_previous: Optional[Dict[str, Any]] = None


class ScenarioData(BaseModel):
    corridor_id: str
    corridor_name: str
    sections: List[CorridorSection]
    trains: List[TrainService]
    demands: List[MaintenanceDemand]
    simulation_clock_min: int = 0
    is_synthetic_notice: str = "Synthetic Demo Data — not live Indian Railways data."
