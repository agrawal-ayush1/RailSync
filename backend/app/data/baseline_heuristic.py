"""
Un-optimized Departmental Silo Baseline Heuristic Engine.
Simulates legacy Indian Railways department-by-department sequential block request planning.
Provides honest baseline metrics for "Before RailSync" vs "After RailSync" comparison.
"""

from typing import List, Dict, Tuple
from app.models.schema import (
    ScenarioData,
    ScheduledBlock,
    ScheduledTrainPath,
    BaselineComparisonMetrics,
    DepartmentEnum,
)


def run_baseline_heuristic(scenario: ScenarioData) -> Tuple[List[ScheduledBlock], List[ScheduledTrainPath], BaselineComparisonMetrics]:
    """
    Schedules maintenance demands department-by-department without Super-Task bundling.
    Engineering demands placed first, then S&T, then TRD, then Mechanical.
    Each demand gets a separate standalone window on its track section.
    """
    demands = sorted(scenario.demands, key=lambda d: (d.earliest_start_min, d.duration_mins))
    sections = {s.section_id: s for s in scenario.sections}
    
    scheduled_blocks: List[ScheduledBlock] = []
    # Track section occupancy timelines: section_id -> List[(start_min, end_min)]
    section_occupancy: Dict[str, List[Tuple[int, int]]] = {s.section_id: [] for s in scenario.sections}

    total_unbundled_block_mins = 0

    # 1. Schedule Maintenance Blocks in Silos
    for demand in demands:
        duration = demand.duration_mins
        earliest = demand.earliest_start_min
        latest = demand.latest_finish_min
        sec_id = demand.section_id

        # Find first fit window in [earliest, latest - duration]
        placed_start = earliest
        while placed_start + duration <= latest:
            placed_end = placed_start + duration
            # Check overlap with existing section blocks
            has_overlap = False
            for b_start, b_end in section_occupancy[sec_id]:
                if not (placed_end <= b_start or placed_start >= b_end):
                    has_overlap = True
                    placed_start = b_end  # Jump past overlap
                    break
            if not has_overlap:
                break
        
        # If latest exceeded, place at latest window
        if placed_start + duration > latest:
            placed_start = max(earliest, latest - duration)
            placed_end = placed_start + duration

        section_occupancy[sec_id].append((placed_start, placed_end))
        total_unbundled_block_mins += duration

        block = ScheduledBlock(
            block_id=f"BASE-{demand.demand_id}",
            section_id=sec_id,
            demand_ids=[demand.demand_id],
            is_super_task=False,
            departments=[demand.department],
            work_descriptions=[demand.work_description],
            start_min=placed_start,
            end_min=placed_start + duration,
            duration_mins=duration,
            downtime_saved_mins=0,
            is_frozen=demand.is_frozen,
        )
        scheduled_blocks.append(block)

    # 2. Schedule Trains around Maintenance Blocks (causing delays)
    scheduled_trains: List[ScheduledTrainPath] = []
    total_heuristic_train_delays = 0

    for train in scenario.trains:
        accumulated_delay = 0
        traversals_out = []
        
        for trav in train.traversals:
            sec_id = trav.section_id
            sched_entry = trav.scheduled_entry_min + accumulated_delay
            run_time = trav.run_time_mins
            actual_entry = sched_entry

            # Check overlap with maintenance blocks on section
            block_overlaps = True
            while block_overlaps:
                block_overlaps = False
                actual_exit = actual_entry + run_time
                for b_start, b_end in section_occupancy[sec_id]:
                    # Train conflicts if traversal intersects block interval
                    if not (actual_exit <= b_start or actual_entry >= b_end):
                        block_overlaps = True
                        actual_entry = b_end + 5  # Wait for block + 5 min safety clearance
                        break

            delay_on_section = actual_entry - trav.scheduled_entry_min
            accumulated_delay = max(0, delay_on_section)

            traversals_out.append({
                "section_id": sec_id,
                "entry_min": actual_entry,
                "exit_min": actual_entry + run_time,
                "delay_mins": delay_on_section,
            })

        total_heuristic_train_delays += accumulated_delay

        scheduled_trains.append(ScheduledTrainPath(
            train_id=train.train_id,
            name=train.name,
            priority_class=train.priority_class,
            direction=train.direction,
            scheduled_start_min=train.traversals[0].scheduled_entry_min,
            actual_start_min=traversals_out[0]["entry_min"],
            delay_mins=accumulated_delay,
            traversals=traversals_out,
        ))

    total_unbundled_hours = round(total_unbundled_block_mins / 60.0, 2)

    # Placeholders for comparison object; actual optimized comparison values will be filled by solver
    baseline_metrics = BaselineComparisonMetrics(
        heuristic_total_block_hours=total_unbundled_hours,
        optimized_total_block_hours=total_unbundled_hours,
        block_hours_reduction_pct=0.0,
        heuristic_train_delay_mins=total_heuristic_train_delays,
        optimized_train_delay_mins=total_heuristic_train_delays,
        train_delay_reduction_pct=0.0,
        multi_dept_colocation_rate_pct=0.0,
    )

    return scheduled_blocks, scheduled_trains, baseline_metrics
