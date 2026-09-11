"""
Dynamic Replanning & History Freeze Module for RailSync.
Handles disruption injection, activity state freezing, and incremental re-optimization.
"""

from typing import Dict, Any, Optional
from app.models.schema import (
    ScenarioData,
    DisruptionEvent,
    OptimizationResponse,
)
from app.solver.cpsat_engine import solve_railsync_schedule


def execute_disruption_replan(
    scenario: ScenarioData,
    disruption: DisruptionEvent,
    previous_schedule: Optional[Dict[str, Any]] = None,
) -> OptimizationResponse:
    """
    Executes dynamic replanning workflow:
    1. Sets simulation clock to disruption occurrence time.
    2. Freezes past/in-progress maintenance demands using previous schedule outputs.
    3. Injects hard disruption interval constraint on target track section.
    4. Invokes CP-SAT engine to re-optimize remaining un-executed schedule horizon.
    """
    clock_min = disruption.occurrence_time_min
    scenario.simulation_clock_min = clock_min

    # Freeze completed/past maintenance demands from previous schedule
    if previous_schedule and "scheduled_blocks" in previous_schedule:
        frozen_blocks_map = {b["block_id"]: b for b in previous_schedule["scheduled_blocks"]}

        for d in scenario.demands:
            for b_id, b_data in frozen_blocks_map.items():
                if d.demand_id in b_data.get("demand_ids", []):
                    b_start = b_data["start_min"]
                    
                    if b_start < clock_min:
                        d.is_frozen = True
                        d.historic_start_min = b_start
                        d.historic_end_min = b_start + d.duration_mins

    # Run CP-SAT solver under updated constraint bounds
    return solve_railsync_schedule(
        scenario=scenario,
        disruption=disruption,
        simulation_clock_min=clock_min,
        time_limit_sec=5.0,
        previous_schedule=previous_schedule,
    )
