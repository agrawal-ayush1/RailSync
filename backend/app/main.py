"""
FastAPI Server for RailSync Application.
Exposes REST endpoints for Scenario Fetching, Baseline Optimization, Disruption Injection, Replanning, and Approval.
"""

from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.models.schema import (
    ScenarioData,
    OptimizationResponse,
    DisruptionEvent,
)
from app.data.corridor_hdn import get_synthetic_hdn_scenario
from app.solver.cpsat_engine import solve_railsync_schedule
from app.solver.replanner import execute_disruption_replan

app = FastAPI(
    title="RailSync Operations API",
    description="AI-Powered Automatic Block Planning System for Indian Railways",
    version="1.0.0",
)

# Enable CORS for local Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session state for hackathon demo reliability
STATE: Dict[str, Any] = {
    "scenario": get_synthetic_hdn_scenario(),
    "last_schedule": None,
    "active_disruption": None,
    "is_approved": False,
    "approval_notes": None,
}


@app.get("/api/scenario", response_model=ScenarioData)
def get_scenario():
    """Returns current HDN corridor scenario topology, scheduled trains, and maintenance demands."""
    return STATE["scenario"]


@app.post("/api/reset")
def reset_scenario():
    """Resets scenario to baseline state."""
    STATE["scenario"] = get_synthetic_hdn_scenario()
    STATE["last_schedule"] = None
    STATE["active_disruption"] = None
    STATE["is_approved"] = False
    STATE["approval_notes"] = None
    return {"status": "RESET_COMPLETE", "scenario": STATE["scenario"]}


class OptimizeRequest(BaseModel):
    time_limit_sec: float = 5.0


@app.post("/api/optimize", response_model=OptimizationResponse)
def optimize_schedule(req: OptimizeRequest = OptimizeRequest()):
    """
    Executes Google OR-Tools CP-SAT solver on current corridor scenario.
    Returns real optimized schedule, KPIs, candidate Super-Tasks, and traceable explanations.
    """
    try:
        scenario = STATE["scenario"]
        response = solve_railsync_schedule(
            scenario=scenario,
            simulation_clock_min=scenario.simulation_clock_min,
            time_limit_sec=req.time_limit_sec,
        )
        STATE["last_schedule"] = response.model_dump()
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization solver failed: {str(e)}")


@app.post("/api/disrupt")
def inject_disruption(disruption: DisruptionEvent):
    """Injects a real-world operational disruption into the simulation state."""
    STATE["active_disruption"] = disruption
    STATE["scenario"].simulation_clock_min = disruption.occurrence_time_min
    return {
        "status": "DISRUPTION_INJECTED",
        "disruption": disruption,
        "simulation_clock_min": disruption.occurrence_time_min,
    }


class ReplanRequest(BaseModel):
    simulation_clock_min: Optional[int] = None


@app.post("/api/replan", response_model=OptimizationResponse)
def replan_schedule(req: ReplanRequest = ReplanRequest()):
    """
    Re-optimizes unexecuted schedule window while freezing completed/past operations.
    """
    if not STATE["active_disruption"]:
        # Fallback default disruption if none set
        STATE["active_disruption"] = DisruptionEvent(
            event_id="DIS-AUTO-01",
            disruption_type="EMERGENCY_RAIL_DEFECT",
            section_id="SEC-UP-GZB-ALJN",
            occurrence_time_min=630,
            duration_mins=90,
            description="Emergency rail defect reported at Km 54.",
        )

    disruption = STATE["active_disruption"]
    if req.simulation_clock_min is not None:
        disruption.occurrence_time_min = req.simulation_clock_min

    try:
        response = execute_disruption_replan(
            scenario=STATE["scenario"],
            disruption=disruption,
            previous_schedule=STATE["last_schedule"],
        )
        STATE["last_schedule"] = response.model_dump()
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Replanning engine failed: {str(e)}")


class ApproveRequest(BaseModel):
    planner_notes: str = Field(default="Approved by Chief Controller.")


@app.post("/api/approve")
def approve_plan(req: ApproveRequest = ApproveRequest()):
    """Marks generated optimal schedule as officially approved for dispatch."""
    if not STATE["last_schedule"]:
        raise HTTPException(status_code=400, detail="No optimization plan exists to approve.")

    STATE["is_approved"] = True
    STATE["approval_notes"] = req.planner_notes
    return {
        "status": "APPROVED",
        "plan_id": STATE["last_schedule"]["plan_id"],
        "planner_notes": req.planner_notes,
        "dispatch_notice": "Dispatch order generated and transmitted to Division Control Office.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
