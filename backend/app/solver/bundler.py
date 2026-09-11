"""
Candidate Super-Task Bundling Engine.
Pre-analyzes multi-department maintenance demands to construct candidate bundled Super-Tasks.
CP-SAT solver then dynamically decides whether to activate candidate Super-Tasks or execute isolated single blocks.
"""

from typing import List, Dict, Tuple
from app.models.schema import MaintenanceDemand, SuperTask, DepartmentEnum


def generate_candidate_super_tasks(demands: List[MaintenanceDemand]) -> List[SuperTask]:
    """
    Scans demands grouped by section_id for multi-department overlap potential.
    Creates candidate SuperTask items with unified duration and downtime savings calculation.
    """
    section_demands: Dict[str, List[MaintenanceDemand]] = {}
    for d in demands:
        section_demands.setdefault(d.section_id, []).append(d)

    candidate_super_tasks: List[SuperTask] = []
    bundle_counter = 1

    for sec_id, d_list in section_demands.items():
        # Look for pairs of demands from different departments with overlapping time windows
        n = len(d_list)
        for i in range(n):
            for j in range(i + 1, n):
                d1 = d_list[i]
                d2 = d_list[j]

                # Must be different departments
                if d1.department == d2.department:
                    continue

                # Must have overlapping preferred windows [earliest, latest]
                overlap_start = max(d1.earliest_start_min, d2.earliest_start_min)
                overlap_finish = min(d1.latest_finish_min, d2.latest_finish_min)

                if overlap_start < overlap_finish:
                    # Feasible overlap window exists
                    max_dur = max(d1.duration_mins, d2.duration_mins)
                    sum_dur = d1.duration_mins + d2.duration_mins
                    
                    # Unified bundle duration = max duration + 15 min safety setup/clearing buffer
                    unified_dur = max_dur + 15
                    
                    # Net track downtime saved compared to 2 separate block windows
                    downtime_saved = max(0, sum_dur - unified_dur)

                    if downtime_saved > 0:
                        st_id = f"ST-{d1.section_id[-7:]}-{bundle_counter:02d}"
                        bundle_counter += 1

                        depts = list({d1.department, d2.department})

                        candidate_super_tasks.append(SuperTask(
                            super_task_id=st_id,
                            section_id=sec_id,
                            bundled_demand_ids=[d1.demand_id, d2.demand_id],
                            primary_department=d1.department,
                            co_departments=[d for d in depts if d != d1.department],
                            duration_mins=unified_dur,
                            downtime_saved_mins=downtime_saved,
                        ))

    return candidate_super_tasks
