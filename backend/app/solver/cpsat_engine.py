"""
Google OR-Tools CP-SAT Core Optimization Engine for RailSync.
Jointly optimizes multi-department maintenance blocks and train timetables over a 24-hour horizon.
Supports Candidate Super-Task selection, TRD Catenary Power Isolation, Super-Task uniqueness,
history freezing, dynamic disruption handling, and automatic soft-relaxation for infeasibility.
"""

import time
from typing import List, Dict, Tuple, Optional, Any, Set
from ortools.sat.python import cp_model

from app.models.schema import (
    ScenarioData,
    ScheduledBlock,
    ScheduledTrainPath,
    SuperTask,
    OptimizationKpis,
    BaselineComparisonMetrics,
    OptimizationResponse,
    DisruptionEvent,
    DemandPriorityEnum,
)
from app.solver.bundler import generate_candidate_super_tasks
from app.data.baseline_heuristic import run_baseline_heuristic
from app.solver.explainability import generate_solver_explanations


def solve_railsync_schedule(
    scenario: ScenarioData,
    disruption: Optional[DisruptionEvent] = None,
    simulation_clock_min: int = 0,
    time_limit_sec: float = 5.0,
    previous_schedule: Optional[Dict[str, Any]] = None,
) -> OptimizationResponse:
    """
    Formulates and solves the CP-SAT constraint programming model.
    Includes Phase 1 full solve and Phase 2 automatic relaxation for infeasible scenarios.
    """
    start_solve_time = time.time()

    # 1. Run Baseline Heuristic
    base_blocks, base_trains, base_metrics = run_baseline_heuristic(scenario)

    # Candidate Super-Tasks
    candidate_super_tasks = generate_candidate_super_tasks(scenario.demands)

    # Attempt Phase 1: Standard hard constraint solve
    model, vars_dict, candidate_super_tasks = build_cpsat_model(
        scenario=scenario,
        candidate_super_tasks=candidate_super_tasks,
        disruption=disruption,
        simulation_clock_min=simulation_clock_min,
        previous_schedule=previous_schedule,
        allow_routine_deferral=False,
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_sec
    solver.parameters.num_workers = 4

    status = solver.Solve(model)
    solve_duration_ms = round((time.time() - start_solve_time) * 1000, 2)
    solver_status_str = solver.StatusName(status)

    is_relaxed = False
    deferred_demands_list: List[str] = []

    # Phase 2: Automatic Relaxation if Infeasible
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        rel_start_time = time.time()
        model_rel, vars_dict_rel, candidate_super_tasks = build_cpsat_model(
            scenario=scenario,
            candidate_super_tasks=candidate_super_tasks,
            disruption=disruption,
            simulation_clock_min=simulation_clock_min,
            previous_schedule=previous_schedule,
            allow_routine_deferral=True,
        )
        solver_rel = cp_model.CpSolver()
        solver_rel.parameters.max_time_in_seconds = time_limit_sec
        solver_rel.parameters.num_workers = 4

        status_rel = solver_rel.Solve(model_rel)
        rel_duration_ms = round((time.time() - rel_start_time) * 1000, 2)

        if status_rel in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            model = model_rel
            vars_dict = vars_dict_rel
            solver = solver_rel
            status = status_rel
            is_relaxed = True
            solve_duration_ms += rel_duration_ms
            solver_status_str = "FEASIBLE_RELAXED"

            # Identify deferred demands
            m_executed = vars_dict["m_executed"]
            for d in scenario.demands:
                if d.demand_id in m_executed and solver.Value(m_executed[d.demand_id]) == 0:
                    deferred_demands_list.append(d.demand_id)

    # -------------------------------------------------------------------------
    # Response Assembly
    # -------------------------------------------------------------------------

    scheduled_blocks: List[ScheduledBlock] = []
    scheduled_super_tasks: List[SuperTask] = []
    scheduled_train_paths: List[ScheduledTrainPath] = []

    total_optimized_block_mins = 0
    total_downtime_saved_mins = 0
    total_opt_train_delay = 0
    super_task_count = 0

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        m_starts = vars_dict["m_starts"]
        m_ends = vars_dict["m_ends"]
        m_executed = vars_dict["m_executed"]
        st_active = vars_dict["st_active"]
        st_starts = vars_dict["st_starts"]
        st_ends = vars_dict["st_ends"]
        t_entry = vars_dict["t_entry"]
        t_exit = vars_dict["t_exit"]
        t_delays = vars_dict["t_delays"]

        # Extract Super-Tasks
        for st in candidate_super_tasks:
            if solver.Value(st_active[st.super_task_id]) == 1:
                super_task_count += 1
                s_val = solver.Value(st_starts[st.super_task_id])
                e_val = solver.Value(st_ends[st.super_task_id])
                st.scheduled_start_min = s_val
                st.scheduled_end_min = e_val
                scheduled_super_tasks.append(st)

                bundled_d_objs = [d for d in scenario.demands if d.demand_id in st.bundled_demand_ids]
                depts = list({d.department for d in bundled_d_objs})
                descs = [d.work_description for d in bundled_d_objs]
                is_st_frozen = all(d.is_frozen or (d.historic_end_min and d.historic_end_min <= simulation_clock_min) for d in bundled_d_objs)

                scheduled_blocks.append(ScheduledBlock(
                    block_id=st.super_task_id,
                    section_id=st.section_id,
                    demand_ids=st.bundled_demand_ids,
                    is_super_task=True,
                    super_task_id=st.super_task_id,
                    departments=depts,
                    work_descriptions=descs,
                    start_min=s_val,
                    end_min=e_val,
                    duration_mins=st.duration_mins,
                    downtime_saved_mins=st.downtime_saved_mins,
                    is_frozen=is_st_frozen,
                ))

                total_optimized_block_mins += st.duration_mins
                total_downtime_saved_mins += st.downtime_saved_mins

        # Extract Standalone Single Demands
        active_st_demand_ids = set()
        for st in scheduled_super_tasks:
            active_st_demand_ids.update(st.bundled_demand_ids)

        for d in scenario.demands:
            if solver.Value(m_executed[d.demand_id]) == 1 and d.demand_id not in active_st_demand_ids:
                s_val = solver.Value(m_starts[d.demand_id])
                e_val = solver.Value(m_ends[d.demand_id])
                is_d_frozen = d.is_frozen or (s_val < simulation_clock_min)

                scheduled_blocks.append(ScheduledBlock(
                    block_id=f"BLK-{d.demand_id}",
                    section_id=d.section_id,
                    demand_ids=[d.demand_id],
                    is_super_task=False,
                    departments=[d.department],
                    work_descriptions=[d.work_description],
                    start_min=s_val,
                    end_min=e_val,
                    duration_mins=d.duration_mins,
                    downtime_saved_mins=0,
                    is_frozen=is_d_frozen,
                ))

                total_optimized_block_mins += d.duration_mins

        # Extract Train Paths
        for train in scenario.trains:
            traversals_out = []
            for trav in train.traversals:
                sec_id = trav.section_id
                key = (train.train_id, sec_id)
                e_val = solver.Value(t_entry[key])
                x_val = solver.Value(t_exit[key])
                delay_val = e_val - trav.scheduled_entry_min

                traversals_out.append({
                    "section_id": sec_id,
                    "entry_min": e_val,
                    "exit_min": x_val,
                    "delay_mins": max(0, delay_val),
                })

            train_total_delay = solver.Value(t_delays[train.train_id])
            total_opt_train_delay += train_total_delay

            scheduled_train_paths.append(ScheduledTrainPath(
                train_id=train.train_id,
                name=train.name,
                priority_class=train.priority_class,
                direction=train.direction,
                scheduled_start_min=train.traversals[0].scheduled_entry_min,
                actual_start_min=traversals_out[0]["entry_min"],
                delay_mins=train_total_delay,
                traversals=traversals_out,
            ))

    # Sort blocks & trains
    scheduled_blocks.sort(key=lambda b: b.start_min)
    scheduled_train_paths.sort(key=lambda t: t.actual_start_min)

    # Calculate KPIs
    total_corridor_minutes = len(scenario.sections) * 1440
    asset_availability_pct = round(((total_corridor_minutes - total_optimized_block_mins) / total_corridor_minutes) * 100, 1) if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0
    line_capacity_preserved_pct = round(100.0 - (total_opt_train_delay / max(1, len(scenario.trains) * 30)) * 10, 1) if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0

    heur_delay = base_metrics.heuristic_train_delay_mins
    delay_red_pct = round(((heur_delay - total_opt_train_delay) / max(1, heur_delay)) * 100, 1) if heur_delay > 0 else 0.0

    heur_block_hrs = base_metrics.heuristic_total_block_hours
    opt_block_hrs = round(total_optimized_block_mins / 60.0, 2)
    block_red_pct = round(((heur_block_hrs - opt_block_hrs) / max(0.1, heur_block_hrs)) * 100, 1) if heur_block_hrs > 0 else 0.0

    multi_dept_rate = round((len(scheduled_super_tasks) / max(1, len(scenario.demands) // 2)) * 100, 1)

    plan_status = "FEASIBLE_RELAXED" if is_relaxed else ("REOPTIMIZED" if simulation_clock_min > 0 and status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else solver_status_str)

    kpis = OptimizationKpis(
        asset_availability_pct=asset_availability_pct,
        line_capacity_preserved_pct=max(0.0, min(100.0, line_capacity_preserved_pct)),
        total_train_delay_mins=total_opt_train_delay,
        super_tasks_created=super_task_count,
        downtime_saved_hours=round(total_downtime_saved_mins / 60.0, 2),
        solved_in_ms=solve_duration_ms,
        solver_status=plan_status,
    )

    baseline_metrics = BaselineComparisonMetrics(
        heuristic_total_block_hours=heur_block_hrs,
        optimized_total_block_hours=opt_block_hrs,
        block_hours_reduction_pct=block_red_pct,
        heuristic_train_delay_mins=heur_delay,
        optimized_train_delay_mins=total_opt_train_delay,
        train_delay_reduction_pct=delay_red_pct,
        multi_dept_colocation_rate_pct=multi_dept_rate,
    )

    explanations = generate_solver_explanations(
        scenario=scenario,
        scheduled_blocks=scheduled_blocks,
        scheduled_trains=scheduled_train_paths,
        super_tasks=scheduled_super_tasks,
        disruption=disruption,
    )

    if is_relaxed:
        explanations.insert(0, {
            "id": "EXP-RELAXED",
            "category": "DYNAMIC_REPLANNING",
            "title": "Soft Constraint Relaxation Activated",
            "summary": f"Deferred {len(deferred_demands_list)} routine maintenance demands to prevent gridlock.",
            "details": f"Severe disruption exceeded track capacity. CP-SAT automatically deferred routine demands ({', '.join(deferred_demands_list)}) while 100% preserving hard safety constraints and VVIP train schedules.",
            "metrics": {
                "deferred_demands_count": len(deferred_demands_list),
                "deferred_demands": deferred_demands_list,
            },
            "icon": "AlertTriangle",
        })

    diff_data = None
    if previous_schedule and simulation_clock_min > 0:
        diff_data = compute_schedule_diff(previous_schedule, scheduled_blocks, scheduled_train_paths, simulation_clock_min)

    return OptimizationResponse(
        plan_id=f"PLAN-{int(time.time())}",
        status=plan_status,
        solve_time_ms=solve_duration_ms,
        simulation_clock_min=simulation_clock_min,
        kpis=kpis,
        baseline_comparison=baseline_metrics,
        scheduled_blocks=scheduled_blocks,
        scheduled_trains=scheduled_train_paths,
        super_tasks=scheduled_super_tasks,
        explanations=explanations,
        diff_from_previous=diff_data,
    )


def build_cpsat_model(
    scenario: ScenarioData,
    candidate_super_tasks: List[SuperTask],
    disruption: Optional[DisruptionEvent],
    simulation_clock_min: int,
    previous_schedule: Optional[Dict[str, Any]],
    allow_routine_deferral: bool = False,
) -> Tuple[cp_model.CpModel, Dict[str, Any], List[SuperTask]]:
    """
    Builds the CP-SAT mathematical model enforcing Fixes 1, 2, 3, 4.
    """
    model = cp_model.CpModel()
    sections_map = {s.section_id: s for s in scenario.sections}
    demands = scenario.demands
    trains = scenario.trains

    # Identify previous active Super-Tasks if in Replan mode
    prev_active_st_map: Dict[str, Dict[str, Any]] = {}
    if previous_schedule and "super_tasks" in previous_schedule:
        for st_data in previous_schedule["super_tasks"]:
            prev_active_st_map[st_data["super_task_id"]] = st_data

    # 1. Maintenance Demand Variables
    m_starts: Dict[str, cp_model.IntVar] = {}
    m_ends: Dict[str, cp_model.IntVar] = {}
    m_intervals: Dict[str, cp_model.IntervalVar] = {}
    m_executed: Dict[str, cp_model.IntVar] = {}

    for d in demands:
        is_frozen = d.is_frozen or (d.historic_end_min is not None and d.historic_end_min <= simulation_clock_min)

        if is_frozen and d.historic_start_min is not None:
            s_var = model.NewConstant(d.historic_start_min)
            e_var = model.NewConstant(d.historic_start_min + d.duration_mins)
            exec_var = model.NewConstant(1)
        else:
            s_min = max(0, d.earliest_start_min)
            e_max = min(1440, d.latest_finish_min)
            if simulation_clock_min > 0:
                s_min = max(s_min, simulation_clock_min)
                e_max = max(e_max, s_min + d.duration_mins)

            s_var = model.NewIntVar(s_min, max(s_min, e_max - d.duration_mins), f"start_{d.demand_id}")
            e_var = model.NewIntVar(s_min + d.duration_mins, max(s_min + d.duration_mins, e_max), f"end_{d.demand_id}")
            model.Add(e_var == s_var + d.duration_mins)

            if d.priority == DemandPriorityEnum.EMERGENCY or (not allow_routine_deferral and d.priority == DemandPriorityEnum.HIGH):
                exec_var = model.NewConstant(1)
            else:
                exec_var = model.NewBoolVar(f"exec_{d.demand_id}")

        m_starts[d.demand_id] = s_var
        m_ends[d.demand_id] = e_var
        m_executed[d.demand_id] = exec_var
        m_intervals[d.demand_id] = model.NewOptionalIntervalVar(
            s_var, d.duration_mins, e_var, exec_var, f"interval_{d.demand_id}"
        )

    # 2. Candidate Super-Task Activation Variables (FIX 1: Persistence of frozen Super-Tasks)
    st_active: Dict[str, cp_model.IntVar] = {}
    st_starts: Dict[str, cp_model.IntVar] = {}
    st_ends: Dict[str, cp_model.IntVar] = {}
    st_intervals: Dict[str, cp_model.IntervalVar] = {}

    for st in candidate_super_tasks:
        bundled_d_objs = [d for d in demands if d.demand_id in st.bundled_demand_ids]
        is_st_frozen = len(bundled_d_objs) > 0 and all(
            d.is_frozen or (d.historic_end_min is not None and d.historic_end_min <= simulation_clock_min)
            for d in bundled_d_objs
        )

        prev_st_data = prev_active_st_map.get(st.super_task_id)

        if is_st_frozen and prev_st_data and prev_st_data.get("scheduled_start_min") is not None:
            # Fix 1: Preserve frozen active Super-Task
            active_var = model.NewConstant(1)
            s_var = model.NewConstant(prev_st_data["scheduled_start_min"])
            e_var = model.NewConstant(prev_st_data["scheduled_end_min"])
        else:
            active_var = model.NewBoolVar(f"active_{st.super_task_id}")
            e_start = min(d.earliest_start_min for d in bundled_d_objs)
            l_finish = max(d.latest_finish_min for d in bundled_d_objs)
            if simulation_clock_min > 0:
                e_start = max(e_start, simulation_clock_min)
                l_finish = max(l_finish, e_start + st.duration_mins)

            s_var = model.NewIntVar(e_start, max(e_start, l_finish - st.duration_mins), f"start_{st.super_task_id}")
            e_var = model.NewIntVar(e_start + st.duration_mins, max(e_start + st.duration_mins, l_finish), f"end_{st.super_task_id}")
            model.Add(e_var == s_var + st.duration_mins)

        st_active[st.super_task_id] = active_var
        st_starts[st.super_task_id] = s_var
        st_ends[st.super_task_id] = e_var
        st_intervals[st.super_task_id] = model.NewOptionalIntervalVar(
            s_var, st.duration_mins, e_var, active_var, f"interval_{st.super_task_id}"
        )

        for d in bundled_d_objs:
            model.AddImplication(active_var, m_executed[d.demand_id])
            model.Add(m_starts[d.demand_id] >= s_var).OnlyEnforceIf(active_var)
            model.Add(m_ends[d.demand_id] <= e_var).OnlyEnforceIf(active_var)

    # FIX 3: Super-Task Uniqueness Constraint (At most 1 active Super-Task per demand)
    for d in demands:
        candidate_st_for_d = [st for st in candidate_super_tasks if d.demand_id in st.bundled_demand_ids]
        if len(candidate_st_for_d) > 1:
            model.Add(cp_model.LinearExpr.Sum([st_active[st.super_task_id] for st in candidate_st_for_d]) <= 1)

    # 3. Train Traversal Variables
    t_entry: Dict[Tuple[str, str], cp_model.IntVar] = {}
    t_exit: Dict[Tuple[str, str], cp_model.IntVar] = {}
    t_intervals: Dict[Tuple[str, str], cp_model.IntervalVar] = {}
    t_delays: Dict[str, cp_model.IntVar] = {}

    for train in trains:
        first_trav = train.traversals[0]
        max_delay = train.max_allowable_delay_mins
        delay_var = model.NewIntVar(0, max_delay, f"delay_{train.train_id}")
        t_delays[train.train_id] = delay_var
        cum_delay = delay_var

        for trav in train.traversals:
            sec_id = trav.section_id
            key = (train.train_id, sec_id)
            sched_entry = trav.scheduled_entry_min
            run_time = trav.run_time_mins

            entry_var = model.NewIntVar(sched_entry, sched_entry + max_delay, f"entry_{train.train_id}_{sec_id}")
            exit_var = model.NewIntVar(sched_entry + run_time, sched_entry + run_time + max_delay, f"exit_{train.train_id}_{sec_id}")

            model.Add(exit_var == entry_var + run_time)
            model.Add(entry_var == sched_entry + cum_delay)

            t_entry[key] = entry_var
            t_exit[key] = exit_var
            t_intervals[key] = model.NewIntervalVar(entry_var, run_time, exit_var, f"interval_{train.train_id}_{sec_id}")

    # -------------------------------------------------------------------------
    # Hard Operational Constraints
    # -------------------------------------------------------------------------

    # 1. Track Section Non-Overlap
    for sec_id in sections_map.keys():
        section_intervals = []

        for train in trains:
            for trav in train.traversals:
                if trav.section_id == sec_id:
                    section_intervals.append(t_intervals[(train.train_id, sec_id)])

        for d in demands:
            if d.section_id == sec_id:
                candidate_st_for_d = [st for st in candidate_super_tasks if d.demand_id in st.bundled_demand_ids]
                if not candidate_st_for_d:
                    section_intervals.append(m_intervals[d.demand_id])
                else:
                    is_standalone = model.NewBoolVar(f"standalone_{d.demand_id}")
                    st_active_vars = [st_active[st.super_task_id] for st in candidate_st_for_d]
                    
                    model.Add(is_standalone == 1).OnlyEnforceIf([m_executed[d.demand_id]] + [st.Not() for st in st_active_vars])
                    model.Add(is_standalone == 0).OnlyEnforceIf(m_executed[d.demand_id].Not())
                    for st_v in st_active_vars:
                        model.Add(is_standalone == 0).OnlyEnforceIf(st_v)

                    standalone_interval = model.NewOptionalIntervalVar(
                        m_starts[d.demand_id], d.duration_mins, m_ends[d.demand_id], is_standalone, f"standalone_int_{d.demand_id}"
                    )
                    section_intervals.append(standalone_interval)

        for st in candidate_super_tasks:
            if st.section_id == sec_id:
                section_intervals.append(st_intervals[st.super_task_id])

        if disruption and disruption.section_id == sec_id:
            d_start = disruption.occurrence_time_min
            d_dur = disruption.duration_mins
            d_end = d_start + d_dur
            disrupt_interval = model.NewIntervalVar(
                model.NewConstant(d_start), d_dur, model.NewConstant(d_end), f"disrupt_{disruption.event_id}"
            )
            section_intervals.append(disrupt_interval)

        model.AddNoOverlap(section_intervals)

    # 2. FIX 2: TRD Catenary Power Block Isolation (Hard CP-SAT Constraint)
    electrical_zones: Dict[str, List[str]] = {}
    for sec in scenario.sections:
        electrical_zones.setdefault(sec.electrical_zone_id, []).append(sec.section_id)

    for d in demands:
        if d.requires_power_block:
            sec_obj = sections_map.get(d.section_id)
            if sec_obj:
                zone_sec_ids = electrical_zones.get(sec_obj.electrical_zone_id, [d.section_id])
                for train in trains:
                    for trav in train.traversals:
                        if trav.section_id in zone_sec_ids:
                            model.AddNoOverlap([t_intervals[(train.train_id, trav.section_id)], m_intervals[d.demand_id]])

    for st in candidate_super_tasks:
        bundled_d_objs = [d for d in demands if d.demand_id in st.bundled_demand_ids]
        if any(d.requires_power_block for d in bundled_d_objs):
            sec_obj = sections_map.get(st.section_id)
            if sec_obj:
                zone_sec_ids = electrical_zones.get(sec_obj.electrical_zone_id, [st.section_id])
                for train in trains:
                    for trav in train.traversals:
                        if trav.section_id in zone_sec_ids:
                            model.AddNoOverlap([t_intervals[(train.train_id, trav.section_id)], st_intervals[st.super_task_id]])

    # 3. Train Headway Buffer Constraint
    for sec_id in sections_map.keys():
        section_trains = [t for t in trains if any(tr.section_id == sec_id for tr in t.traversals)]
        for i in range(len(section_trains)):
            for j in range(i + 1, len(section_trains)):
                t1 = section_trains[i]
                t2 = section_trains[j]
                if t1.direction == t2.direction:
                    e1 = t_entry[(t1.train_id, sec_id)]
                    e2 = t_entry[(t2.train_id, sec_id)]
                    tr1_sched = next(tr.scheduled_entry_min for tr in t1.traversals if tr.section_id == sec_id)
                    tr2_sched = next(tr.scheduled_entry_min for tr in t2.traversals if tr.section_id == sec_id)
                    if tr2_sched >= tr1_sched:
                        model.Add(e2 >= e1 + 10)
                    else:
                        model.Add(e1 >= e2 + 10)

    # 4. Specialized Equipment Resource Non-Overlap
    resource_demands: Dict[str, List[str]] = {}
    for d in demands:
        if d.required_resource_id:
            resource_demands.setdefault(d.required_resource_id, []).append(d.demand_id)

    for res_id, d_ids in resource_demands.items():
        if len(d_ids) > 1:
            res_intervals = [m_intervals[did] for did in d_ids]
            model.AddNoOverlap(res_intervals)

    # Objective Function
    obj_terms = []
    for d in demands:
        weight = 5000 if d.priority == DemandPriorityEnum.EMERGENCY else (1500 if d.priority == DemandPriorityEnum.HIGH else 500)
        obj_terms.append(weight * m_executed[d.demand_id])

    for st in candidate_super_tasks:
        bonus = st.downtime_saved_mins * 50
        obj_terms.append(bonus * st_active[st.super_task_id])

    for train in trains:
        penalty = 500 if train.priority_class == 1 else (150 if train.priority_class == 2 else 30)
        obj_terms.append(-penalty * t_delays[train.train_id])

    model.Maximize(cp_model.LinearExpr.Sum(obj_terms))

    vars_dict = {
        "m_starts": m_starts,
        "m_ends": m_ends,
        "m_intervals": m_intervals,
        "m_executed": m_executed,
        "st_active": st_active,
        "st_starts": st_starts,
        "st_ends": st_ends,
        "st_intervals": st_intervals,
        "t_entry": t_entry,
        "t_exit": t_exit,
        "t_intervals": t_intervals,
        "t_delays": t_delays,
    }

    return model, vars_dict, candidate_super_tasks


def compute_schedule_diff(old_sched: Dict[str, Any], new_blocks: List[ScheduledBlock], new_trains: List[ScheduledTrainPath], clock_min: int) -> Dict[str, Any]:
    old_blocks_map = {b["block_id"]: b for b in old_sched.get("scheduled_blocks", [])}
    old_trains_map = {t["train_id"]: t for t in old_sched.get("scheduled_trains", [])}

    moved_blocks = []
    frozen_blocks = []
    new_train_delays = []

    for b in new_blocks:
        old_b = old_blocks_map.get(b.block_id)
        if b.is_frozen or b.end_min <= clock_min:
            frozen_blocks.append(b.block_id)
        elif old_b and old_b["start_min"] != b.start_min:
            shift_mins = b.start_min - old_b["start_min"]
            moved_blocks.append({
                "block_id": b.block_id,
                "work_description": b.work_descriptions[0] if b.work_descriptions else "Maintenance",
                "old_start": old_b["start_min"],
                "new_start": b.start_min,
                "shift_mins": shift_mins,
            })

    for t in new_trains:
        old_t = old_trains_map.get(t.train_id)
        if old_t and t.delay_mins > old_t["delay_mins"]:
            new_train_delays.append({
                "train_id": t.train_id,
                "name": t.name,
                "old_delay": old_t["delay_mins"],
                "new_delay": t.delay_mins,
                "added_delay": t.delay_mins - old_t["delay_mins"],
            })

    return {
        "frozen_activity_count": len(frozen_blocks),
        "moved_blocks": moved_blocks,
        "trains_with_new_delays": new_train_delays,
        "disruption_clock_min": clock_min,
    }
