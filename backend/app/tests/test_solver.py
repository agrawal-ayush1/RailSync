"""
Comprehensive Test Suite for RailSync CP-SAT Solver & Replanning Engine.
Includes Regression Tests for Fixes 1, 2, 3, 4, 5.
"""

import pytest
from app.data.corridor_hdn import get_synthetic_hdn_scenario
from app.solver.cpsat_engine import solve_railsync_schedule
from app.solver.replanner import execute_disruption_replan
from app.models.schema import (
    ScenarioData,
    CorridorSection,
    TrainService,
    SectionTraversal,
    MaintenanceDemand,
    DirectionEnum,
    DepartmentEnum,
    DemandPriorityEnum,
    DisruptionEvent,
)


def test_scenario_1_normal_optimization():
    """Scenario 1: Normal 24h baseline optimization."""
    scenario = get_synthetic_hdn_scenario()
    response = solve_railsync_schedule(scenario)

    assert response.status in ("OPTIMAL", "FEASIBLE")
    assert response.kpis.super_tasks_created > 0
    assert response.kpis.downtime_saved_hours > 0
    assert response.solve_time_ms < 5000  # Fast solve (< 5s)
    assert len(response.scheduled_blocks) > 0
    assert len(response.scheduled_trains) > 0
    assert len(response.explanations) > 0


def test_no_track_section_overlaps():
    """Verify that no train and maintenance block overlap on any track section."""
    scenario = get_synthetic_hdn_scenario()
    response = solve_railsync_schedule(scenario)

    for block in response.scheduled_blocks:
        b_sec = block.section_id
        b_start = block.start_min
        b_end = block.end_min

        for train in response.scheduled_trains:
            for trav in train.traversals:
                if trav["section_id"] == b_sec:
                    t_entry = trav["entry_min"]
                    t_exit = trav["exit_min"]
                    overlap = not (t_exit <= b_start or t_entry >= b_end)
                    assert not overlap, f"Overlap on {b_sec}: Block {block.block_id} [{b_start}-{b_end}] vs Train {train.train_id} [{t_entry}-{t_exit}]"


def test_fix_1_super_task_history_persistence():
    """FIX 1: Regression Test - Super-Task history persistence during replan."""
    scenario = get_synthetic_hdn_scenario()
    initial_res = solve_railsync_schedule(scenario)
    assert len(initial_res.super_tasks) > 0, "Initial schedule must have active Super-Tasks"
    initial_st_ids = [st.super_task_id for st in initial_res.super_tasks]

    # Inject disruption at T=630 min (10:30 AM)
    disruption = DisruptionEvent(
        event_id="DIS-01",
        disruption_type="EMERGENCY_RAIL_DEFECT",
        section_id="SEC-UP-GZB-ALJN",
        occurrence_time_min=630,
        duration_mins=90,
        description="Emergency rail defect at Km 54.",
    )

    replan_res = execute_disruption_replan(scenario, disruption, previous_schedule=initial_res.model_dump())

    replan_st_ids = [st.super_task_id for st in replan_res.super_tasks]
    
    # Assert past active Super-Tasks persist and remain active in replanned schedule
    for st_id in initial_st_ids:
        assert st_id in replan_st_ids, f"Super-Task {st_id} must persist in replanned schedule!"

    # Assert past Super-Task start/end remained unchanged
    orig_st = next(st for st in initial_res.super_tasks if st.super_task_id == initial_st_ids[0])
    replan_st = next(st for st in replan_res.super_tasks if st.super_task_id == initial_st_ids[0])
    assert orig_st.scheduled_start_min == replan_st.scheduled_start_min
    assert orig_st.scheduled_end_min == replan_st.scheduled_end_min


def test_fix_2_trd_power_block_isolation():
    """FIX 2: TRD Catenary Power Isolation hard safety constraint test."""
    scenario = get_synthetic_hdn_scenario()
    
    # Add explicit TRD demand requiring power block on Zone OHE-ZONE-01
    trd_demand = MaintenanceDemand(
        demand_id="DEM-TRD-TEST",
        department=DepartmentEnum.TRD,
        section_id="SEC-UP-GZB-ALJN",
        work_description="OHE Catenary Wire Replacement",
        duration_mins=120,
        earliest_start_min=120,
        latest_finish_min=300,
        priority=DemandPriorityEnum.EMERGENCY,
        requires_power_block=True,
    )
    scenario.demands.append(trd_demand)

    response = solve_railsync_schedule(scenario)
    assert response.status in ("OPTIMAL", "FEASIBLE", "FEASIBLE_RELAXED")

    # Find scheduled TRD block window
    trd_block = next((b for b in response.scheduled_blocks if "DEM-TRD-TEST" in b.demand_ids), None)
    assert trd_block is not None, "TRD Emergency Power Block must be scheduled"

    # Verify no electric train occupied SEC-UP-GZB-ALJN (Zone OHE-ZONE-01-UP) during power block
    affected_sections = {"SEC-UP-GZB-ALJN"}
    same_zone_trains_checked = 0
    different_zone_trains_checked = 0

    for train in response.scheduled_trains:
        for trav in train.traversals:
            t_entry = trav["entry_min"]
            t_exit = trav["exit_min"]
            overlap = not (t_exit <= trd_block.start_min or t_entry >= trd_block.end_min)
            
            if trav["section_id"] in affected_sections:
                same_zone_trains_checked += 1
                assert not overlap, f"Electric train {train.train_id} violated TRD Catenary Power Block on {trav['section_id']}"
            elif trav["section_id"] == "SEC-DN-ALJN-GZB":
                if overlap:
                    different_zone_trains_checked += 1

    assert same_zone_trains_checked > 0, "Should have electric trains scheduled on UP track"
    assert different_zone_trains_checked > 0, "Trains on separate electrical zone (DOWN track) should remain schedulable during power block"


def test_fix_3_super_task_uniqueness():
    """FIX 3: Super-Task Uniqueness Test (sum(active_st) <= 1 per demand)."""
    d1 = MaintenanceDemand(demand_id="D1", department=DepartmentEnum.ENG, section_id="SEC-1", work_description="W1", duration_mins=60, earliest_start_min=0, latest_finish_min=600, priority=DemandPriorityEnum.HIGH)
    d2 = MaintenanceDemand(demand_id="D2", department=DepartmentEnum.SIG, section_id="SEC-1", work_description="W2", duration_mins=60, earliest_start_min=0, latest_finish_min=600, priority=DemandPriorityEnum.HIGH)
    d3 = MaintenanceDemand(demand_id="D3", department=DepartmentEnum.TRD, section_id="SEC-1", work_description="W3", duration_mins=60, earliest_start_min=0, latest_finish_min=600, priority=DemandPriorityEnum.HIGH)
    
    scenario = ScenarioData(
        corridor_id="C1",
        corridor_name="C1",
        sections=[CorridorSection(section_id="SEC-1", name="S1", direction=DirectionEnum.UP, start_station="A", end_station="B", length_km=10)],
        trains=[],
        demands=[d1, d2, d3],
    )
    res = solve_railsync_schedule(scenario)
    
    # Assert no demand is contained in more than 1 active Super-Task
    st_demand_counts = {}
    for st in res.super_tasks:
        for did in st.bundled_demand_ids:
            st_demand_counts[did] = st_demand_counts.get(did, 0) + 1
            assert st_demand_counts[did] <= 1, f"Demand {did} belonged to multiple active Super-Tasks!"


def test_fix_4_severe_disruption_relaxation():
    """FIX 4: Severe Disruption Relaxation (Phase 2 FEASIBLE_RELAXED)."""
    scenario = get_synthetic_hdn_scenario()
    
    # Inject severe 6-hour disruption covering entire morning peak
    disruption = DisruptionEvent(
        event_id="DIS-SEVERE",
        disruption_type="SIGNAL_INTERLOCKING_FAILURE",
        section_id="SEC-UP-GZB-ALJN",
        occurrence_time_min=120,
        duration_mins=360, # 6 hours blockage
        description="Major signal interlocking failure at Ghaziabad Outer.",
    )

    response = solve_railsync_schedule(scenario, disruption=disruption)
    
    # Assert status is FEASIBLE_RELAXED or FEASIBLE
    assert response.status in ("FEASIBLE_RELAXED", "FEASIBLE", "OPTIMAL")
    assert response.kpis.solver_status in ("FEASIBLE_RELAXED", "FEASIBLE", "OPTIMAL")
    
    # Verify zero track section non-overlap violations
    for block in response.scheduled_blocks:
        if block.section_id == disruption.section_id:
            overlap = not (block.end_min <= 120 or block.start_min >= 480)
            assert not overlap, f"Block {block.block_id} violated 6-hour disruption blockage!"


def test_fix_4_true_infeasibility_handling():
    """FIX 4: True Infeasibility Handling (Phase 3 INFEASIBLE)."""
    # Create impossible scenario: Emergency Demand requiring 24h block on section where Emergency Train must run
    d_impossible = MaintenanceDemand(
        demand_id="DEM-IMP",
        department=DepartmentEnum.ENG,
        section_id="SEC-1",
        work_description="Total Track Renewal",
        duration_mins=1440,
        earliest_start_min=0,
        latest_finish_min=1440,
        priority=DemandPriorityEnum.EMERGENCY,
    )
    t_impossible = TrainService(
        train_id="T-VIP",
        name="VVIP Special",
        priority_class=1,
        direction=DirectionEnum.UP,
        traversals=[SectionTraversal(section_id="SEC-1", scheduled_entry_min=600, scheduled_exit_min=660, run_time_mins=60)],
        max_allowable_delay_mins=0, # Zero allowable delay
    )
    scenario = ScenarioData(
        corridor_id="C-IMP",
        corridor_name="C-IMP",
        sections=[CorridorSection(section_id="SEC-1", name="S1", direction=DirectionEnum.UP, start_station="A", end_station="B", length_km=10)],
        trains=[t_impossible],
        demands=[d_impossible],
    )

    response = solve_railsync_schedule(scenario)
    assert response.status == "INFEASIBLE"
    assert response.kpis.asset_availability_pct == 0.0, "Infeasible schedule must not display fake 100% availability"


def test_scenario_7_baseline_comparison():
    """Scenario 7: Honest baseline comparison metrics verification."""
    scenario = get_synthetic_hdn_scenario()
    response = solve_railsync_schedule(scenario)

    base = response.baseline_comparison
    assert base.optimized_train_delay_mins <= base.heuristic_train_delay_mins
    assert base.optimized_total_block_hours <= base.heuristic_total_block_hours


if __name__ == "__main__":
    pytest.main(["-v", __file__])
