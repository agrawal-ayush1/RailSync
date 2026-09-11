"""
Synthetic Dataset Generator for Indian Railways HDN Corridor (Ghaziabad - Aligarh - Kanpur HDN-1)
Explicitly labeled as Synthetic Demo Data.
"""

from app.models.schema import (
    CorridorSection,
    TrainService,
    SectionTraversal,
    MaintenanceDemand,
    DirectionEnum,
    DepartmentEnum,
    DemandPriorityEnum,
    ScenarioData,
)


def get_synthetic_hdn_scenario() -> ScenarioData:
    sections = [
        CorridorSection(
            section_id="SEC-UP-GZB-ALJN",
            name="Ghaziabad (GZB) - Aligarh (ALJN) UP Main",
            direction=DirectionEnum.UP,
            start_station="GZB",
            end_station="ALJN",
            length_km=106.0,
            max_speed_kmh=130,
            tracks_count=1,
            electrical_zone_id="OHE-ZONE-01-UP",
        ),
        CorridorSection(
            section_id="SEC-DN-ALJN-GZB",
            name="Aligarh (ALJN) - Ghaziabad (GZB) DOWN Main",
            direction=DirectionEnum.DOWN,
            start_station="ALJN",
            end_station="GZB",
            length_km=106.0,
            max_speed_kmh=130,
            tracks_count=1,
            electrical_zone_id="OHE-ZONE-01-DN",
        ),
        CorridorSection(
            section_id="SEC-UP-ALJN-CNB",
            name="Aligarh (ALJN) - Kanpur (CNB) UP Main",
            direction=DirectionEnum.UP,
            start_station="ALJN",
            end_station="CNB",
            length_km=195.0,
            max_speed_kmh=130,
            tracks_count=1,
            electrical_zone_id="OHE-ZONE-02-UP",
        ),
        CorridorSection(
            section_id="SEC-DN-CNB-ALJN",
            name="Kanpur (CNB) - Aligarh (ALJN) DOWN Main",
            direction=DirectionEnum.DOWN,
            start_station="CNB",
            end_station="ALJN",
            length_km=195.0,
            max_speed_kmh=130,
            tracks_count=1,
            electrical_zone_id="OHE-ZONE-02-DN",
        ),
    ]

    # Trains over 24h timeline (0 to 1440 mins) with realistic Automatic Block gaps
    trains = [
        # Priority 1: VVIP Premium Trains
        TrainService(
            train_id="22436",
            name="Vande Bharat Express (NDLS-BSB)",
            priority_class=1,
            direction=DirectionEnum.DOWN,
            traversals=[
                SectionTraversal(section_id="SEC-DN-ALJN-GZB", scheduled_entry_min=360, scheduled_exit_min=410, run_time_mins=50),
                SectionTraversal(section_id="SEC-DN-CNB-ALJN", scheduled_entry_min=420, scheduled_exit_min=510, run_time_mins=90),
            ],
            max_allowable_delay_mins=60,
        ),
        TrainService(
            train_id="12004",
            name="Shatabdi Express (NDLS-LKO)",
            priority_class=1,
            direction=DirectionEnum.DOWN,
            traversals=[
                SectionTraversal(section_id="SEC-DN-ALJN-GZB", scheduled_entry_min=430, scheduled_exit_min=485, run_time_mins=55),
                SectionTraversal(section_id="SEC-DN-CNB-ALJN", scheduled_entry_min=495, scheduled_exit_min=590, run_time_mins=95),
            ],
            max_allowable_delay_mins=60,
        ),
        TrainService(
            train_id="12302",
            name="Howrah Rajdhani Express",
            priority_class=1,
            direction=DirectionEnum.UP,
            traversals=[
                SectionTraversal(section_id="SEC-UP-ALJN-CNB", scheduled_entry_min=900, scheduled_exit_min=995, run_time_mins=95),
                SectionTraversal(section_id="SEC-UP-GZB-ALJN", scheduled_entry_min=1005, scheduled_exit_min=1055, run_time_mins=50),
            ],
            max_allowable_delay_mins=60,
        ),
        # Priority 2: Mail / Express Trains (Emergency delay tolerance up to 180 mins)
        TrainService(
            train_id="12452",
            name="Shram Shakti Express",
            priority_class=2,
            direction=DirectionEnum.DOWN,
            traversals=[
                SectionTraversal(section_id="SEC-DN-ALJN-GZB", scheduled_entry_min=120, scheduled_exit_min=180, run_time_mins=60),
                SectionTraversal(section_id="SEC-DN-CNB-ALJN", scheduled_entry_min=190, scheduled_exit_min=290, run_time_mins=100),
            ],
            max_allowable_delay_mins=180,
        ),
        TrainService(
            train_id="12556",
            name="Gorakhdham Express",
            priority_class=2,
            direction=DirectionEnum.DOWN,
            traversals=[
                SectionTraversal(section_id="SEC-DN-ALJN-GZB", scheduled_entry_min=720, scheduled_exit_min=780, run_time_mins=60),
                SectionTraversal(section_id="SEC-DN-CNB-ALJN", scheduled_entry_min=790, scheduled_exit_min=890, run_time_mins=100),
            ],
            max_allowable_delay_mins=180,
        ),
        TrainService(
            train_id="12874",
            name="Jharkhand Swarna Jayanti Exp",
            priority_class=2,
            direction=DirectionEnum.UP,
            traversals=[
                SectionTraversal(section_id="SEC-UP-ALJN-CNB", scheduled_entry_min=480, scheduled_exit_min=580, run_time_mins=100),
                SectionTraversal(section_id="SEC-UP-GZB-ALJN", scheduled_entry_min=590, scheduled_exit_min=650, run_time_mins=60),
            ],
            max_allowable_delay_mins=180,
        ),
        TrainService(
            train_id="12398",
            name="Mahabodhi Express",
            priority_class=2,
            direction=DirectionEnum.UP,
            traversals=[
                SectionTraversal(section_id="SEC-UP-ALJN-CNB", scheduled_entry_min=1100, scheduled_exit_min=1200, run_time_mins=100),
                SectionTraversal(section_id="SEC-UP-GZB-ALJN", scheduled_entry_min=1210, scheduled_exit_min=1270, run_time_mins=60),
            ],
            max_allowable_delay_mins=180,
        ),
        # Priority 3: Freight / Container Services (Flexible pathing windows up to 240 mins)
        TrainService(
            train_id="BOXN-5001",
            name="Coal Rake Freight (DDU-DER)",
            priority_class=3,
            direction=DirectionEnum.UP,
            traversals=[
                SectionTraversal(section_id="SEC-UP-ALJN-CNB", scheduled_entry_min=180, scheduled_exit_min=300, run_time_mins=120),
                SectionTraversal(section_id="SEC-UP-GZB-ALJN", scheduled_entry_min=310, scheduled_exit_min=385, run_time_mins=75),
            ],
            max_allowable_delay_mins=240,
        ),
        TrainService(
            train_id="BTPN-6002",
            name="POL Tanker Rake (IOCL)",
            priority_class=3,
            direction=DirectionEnum.DOWN,
            traversals=[
                SectionTraversal(section_id="SEC-DN-ALJN-GZB", scheduled_entry_min=540, scheduled_exit_min=615, run_time_mins=75),
                SectionTraversal(section_id="SEC-DN-CNB-ALJN", scheduled_entry_min=625, scheduled_exit_min=750, run_time_mins=125),
            ],
            max_allowable_delay_mins=240,
        ),
        TrainService(
            train_id="CONCOR-8003",
            name="Container Express (Dadri-JNPT)",
            priority_class=3,
            direction=DirectionEnum.UP,
            traversals=[
                SectionTraversal(section_id="SEC-UP-ALJN-CNB", scheduled_entry_min=750, scheduled_exit_min=870, run_time_mins=120),
                SectionTraversal(section_id="SEC-UP-GZB-ALJN", scheduled_entry_min=880, scheduled_exit_min=955, run_time_mins=75),
            ],
            max_allowable_delay_mins=240,
        ),
    ]

    # Departmental Maintenance Demands
    demands = [
        # Candidate Super-Task Pair 1 (GZB-ALJN UP): Engineering + TRD
        MaintenanceDemand(
            demand_id="DEM-ENG-101",
            department=DepartmentEnum.ENG,
            section_id="SEC-UP-GZB-ALJN",
            work_description="P-Way BCM Track Tamping & Rail Grinding (Km 42-48)",
            duration_mins=120,
            earliest_start_min=60,   # 01:00 AM
            latest_finish_min=300,  # 05:00 AM
            priority=DemandPriorityEnum.HIGH,
            requires_power_block=False,
            required_resource_id="TAMPER_GZB_01",
        ),
        MaintenanceDemand(
            demand_id="DEM-TRD-201",
            department=DepartmentEnum.TRD,
            section_id="SEC-UP-GZB-ALJN",
            work_description="OHE Catenary Contact Wire Inspection & Insulator Wash",
            duration_mins=90,
            earliest_start_min=60,   # 01:00 AM
            latest_finish_min=300,  # 05:00 AM
            priority=DemandPriorityEnum.HIGH,
            requires_power_block=True,
            required_resource_id="TOWER_WAGON_GZB_01",
        ),
        # Candidate Super-Task Pair 2 (ALJN-CNB DOWN): Engineering + Signalling
        MaintenanceDemand(
            demand_id="DEM-ENG-102",
            department=DepartmentEnum.ENG,
            section_id="SEC-DN-CNB-ALJN",
            work_description="Turnout Renewal & Weld Stress Relieving at Kanpur Yard",
            duration_mins=120,
            earliest_start_min=660,  # 11:00 AM
            latest_finish_min=1020, # 17:00 PM
            priority=DemandPriorityEnum.HIGH,
            requires_power_block=False,
            required_resource_id="GANG_CNB_03",
        ),
        MaintenanceDemand(
            demand_id="DEM-SIG-301",
            department=DepartmentEnum.SIG,
            section_id="SEC-DN-CNB-ALJN",
            work_description="Digital Axle Counter & Point Machine Overhaul",
            duration_mins=90,
            earliest_start_min=660,  # 11:00 AM
            latest_finish_min=1020, # 17:00 PM
            priority=DemandPriorityEnum.ROUTINE,
            requires_power_block=False,
            required_resource_id="SIG_TEAM_CNB_01",
        ),
        # Single Department Demands
        MaintenanceDemand(
            demand_id="DEM-TRD-202",
            department=DepartmentEnum.TRD,
            section_id="SEC-DN-ALJN-GZB",
            work_description="OHE Neutral Section Modification & Bracket Alignment",
            duration_mins=90,
            earliest_start_min=840,  # 14:00 PM
            latest_finish_min=1080, # 18:00 PM
            priority=DemandPriorityEnum.HIGH,
            requires_power_block=True,
            required_resource_id="TOWER_WAGON_ALJN_02",
        ),
        MaintenanceDemand(
            demand_id="DEM-ENG-103",
            department=DepartmentEnum.ENG,
            section_id="SEC-UP-ALJN-CNB",
            work_description="Ultrasonic Flaw Detection (USFD) Rail Testing",
            duration_mins=100,
            earliest_start_min=120,  # 02:00 AM
            latest_finish_min=360,  # 06:00 AM
            priority=DemandPriorityEnum.ROUTINE,
            requires_power_block=False,
            required_resource_id="USFD_TEAM_ALJN_01",
        ),
        MaintenanceDemand(
            demand_id="DEM-SIG-302",
            department=DepartmentEnum.SIG,
            section_id="SEC-UP-GZB-ALJN",
            work_description="Track Circuit Bonding Replacement at Aligarh Outer",
            duration_mins=60,
            earliest_start_min=960,  # 16:00 PM
            latest_finish_min=1140, # 19:00 PM
            priority=DemandPriorityEnum.ROUTINE,
            requires_power_block=False,
            required_resource_id="SIG_TEAM_GZB_02",
        ),
        MaintenanceDemand(
            demand_id="DEM-MECH-401",
            department=DepartmentEnum.MECH,
            section_id="SEC-DN-CNB-ALJN",
            work_description="Hot Box Detector Calibrator Check & Freight Siding Line",
            duration_mins=60,
            earliest_start_min=180,  # 03:00 AM
            latest_finish_min=420,  # 07:00 AM
            priority=DemandPriorityEnum.ROUTINE,
            requires_power_block=False,
            required_resource_id="C_W_TEAM_CNB_01",
        ),
    ]

    return ScenarioData(
        corridor_id="HDN1-GZB-CNB",
        corridor_name="Indian Railways HDN-1 (Ghaziabad - Aligarh - Kanpur Corridor)",
        sections=sections,
        trains=trains,
        demands=demands,
        simulation_clock_min=0,
        is_synthetic_notice="Synthetic Demo Data — not live Indian Railways data.",
    )
