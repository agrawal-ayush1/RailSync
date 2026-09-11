import React, { useState, useMemo } from 'react';
import type {
  CorridorSection,
  ScheduledBlock,
  ScheduledTrainPath,
  OptimizationResponse,
} from '../types';
import { Layers, Train, Lock, X } from 'lucide-react';

interface GanttConsoleProps {
  sections: CorridorSection[];
  blocks: ScheduledBlock[];
  trains: ScheduledTrainPath[];
  simulationClockMin: number;
  status: string;
  diffFromPrevious?: OptimizationResponse['diff_from_previous'];
}

/* ── colour constants ── */
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  'Engineering (P-Way)': { bg: 'rgba(16,185,129,0.25)', border: '#10b981', text: '#6ee7b7', label: 'ENG / P-WAY' },
  'Signalling & Telecom (S&T)': { bg: 'rgba(6,182,212,0.25)', border: '#06b6d4', text: '#67e8f9', label: 'S&T' },
  'Traction Distribution (TRD/OHE)': { bg: 'rgba(234,179,8,0.25)', border: '#eab308', text: '#fde047', label: 'TRD / OHE' },
  'Mechanical (C&W)': { bg: 'rgba(168,85,247,0.25)', border: '#a855f7', text: '#c4b5fd', label: 'MECH' },
};
const SUPER_TASK_STYLE = { bg: 'rgba(245,158,11,0.22)', border: '#f59e0b', text: '#fbbf24' };

const TRAIN_COLORS: Record<string, { color: string; label: string }> = {
  'VandeBharat': { color: '#22d3ee', label: 'Vande Bharat' },
  'Rajdhani':    { color: '#a78bfa', label: 'Rajdhani' },
  'Express':     { color: '#60a5fa', label: 'Express' },
  'Freight':     { color: '#fb923c', label: 'Freight' },
};

const getTrainCategory = (priority: number, name: string) => {
  if (name.includes('Vande Bharat')) return 'VandeBharat';
  if (priority === 1) return 'Rajdhani';
  if (priority === 2) return 'Express';
  return 'Freight';
};

const getDeptStyle = (depts: string[]) => {
  if (depts.length > 1) return SUPER_TASK_STYLE;
  const d = depts[0] || '';
  return DEPT_COLORS[d] || { bg: 'rgba(139,92,246,0.25)', border: '#8b5cf6', text: '#c4b5fd' };
};

const getDeptLabel = (dept: string) => DEPT_COLORS[dept]?.label || dept.split('(')[0]?.trim() || dept;

/* ── layout ── */
const SIDEBAR_W = 200; // px
const ROW_H = 88;      // px  – optimized height for layered trains + blocks
const HEADER_H = 32;
const TIME_MINS = 1440;

const formatTime = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/* ─────────── component ─────────── */
export const GanttConsole: React.FC<GanttConsoleProps> = ({
  sections,
  blocks,
  trains,
  simulationClockMin,
  status,
  diffFromPrevious,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{
    type: 'BLOCK' | 'TRAIN';
    data: any;
    x: number;
    y: number;
  } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'BLOCK' | 'TRAIN';
    id: string;
    data: any;
  } | null>(null);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'UP' | 'DOWN'>('ALL');

  const filteredSections = useMemo(
    () => sections.filter((s) => filterDirection === 'ALL' || s.direction === filterDirection),
    [sections, filterDirection],
  );

  /* Build a set of moved block IDs for visual indication */
  const movedBlockIds = useMemo(() => {
    const s = new Set<string>();
    diffFromPrevious?.moved_blocks?.forEach((m) => s.add(m.block_id));
    return s;
  }, [diffFromPrevious]);

  const totalH = HEADER_H + filteredSections.length * ROW_H;

  /* Major ticks at 0,4,8,12,16,20,24 and minor ticks at 2,6,10,14,18,22 */
  const majorHours = [0, 4, 8, 12, 16, 20, 24];
  const minorHours = [2, 6, 10, 14, 18, 22];

  /* state label */
  const stateLabel = (() => {
    switch (status) {
      case 'OPTIMAL': case 'FEASIBLE': return 'OPTIMAL PLAN';
      case 'REOPTIMIZED': return 'REPLANNED • HISTORY LOCKED';
      case 'APPROVED': return 'DISPATCH APPROVED';
      case 'DISRUPTED': return 'DISRUPTION ACTIVE';
      default: return 'UN-OPTIMIZED PLAN';
    }
  })();
  const stateColor = (() => {
    switch (status) {
      case 'OPTIMAL': case 'FEASIBLE': return 'text-emerald-400';
      case 'REOPTIMIZED': return 'text-cyan-400';
      case 'APPROVED': return 'text-emerald-300';
      case 'DISRUPTED': return 'text-red-400';
      default: return 'text-slate-400';
    }
  })();

  /* ── tooltip handler (pointer-follow) ── */
  const handleMouseMove = (e: React.MouseEvent, type: 'BLOCK' | 'TRAIN', data: any) => {
    const rect = (e.currentTarget as HTMLElement).closest('.gantt-scroll-area')?.getBoundingClientRect();
    if (!rect) return;
    setHoveredItem({
      type,
      data,
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top + 12,
    });
  };

  return (
    <div className="gantt-outer-panel">
      {/* ─── TOOLBAR ─── */}
      <div className="gantt-toolbar">
        <div className="gantt-toolbar-left">
          <h2 className="gantt-title">
            RAILWAY OPERATIONS CONTROL TIMELINE
          </h2>
          <span className={`gantt-state-badge ${stateColor}`}>
            {stateLabel}
          </span>
        </div>

        <div className="gantt-toolbar-right">
          {/* Direction Filter */}
          <div className="gantt-dir-filter">
            {(['ALL', 'UP', 'DOWN'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterDirection(dir)}
                className={`gantt-dir-btn ${filterDirection === dir ? 'gantt-dir-btn-active' : ''}`}
              >
                {dir === 'ALL' ? 'ALL' : `${dir}`}
              </button>
            ))}
          </div>

          {/* Compact Legend */}
          <div className="gantt-legend">
            <div className="gantt-legend-item">
              <span className="gantt-legend-swatch" style={{ background: SUPER_TASK_STYLE.border }} />
              <span>Super-Task</span>
            </div>
            <div className="gantt-legend-item">
              <span className="gantt-legend-swatch" style={{ background: DEPT_COLORS['Engineering (P-Way)'].border }} />
              <span>ENG</span>
            </div>
            <div className="gantt-legend-item">
              <span className="gantt-legend-swatch" style={{ background: DEPT_COLORS['Traction Distribution (TRD/OHE)'].border }} />
              <span>TRD</span>
            </div>
            <div className="gantt-legend-item">
              <span className="gantt-legend-swatch" style={{ background: DEPT_COLORS['Signalling & Telecom (S&T)'].border }} />
              <span>S&T</span>
            </div>
            <span className="gantt-legend-sep">|</span>
            {Object.entries(TRAIN_COLORS).map(([k, v]) => (
              <div key={k} className="gantt-legend-item">
                <span className="gantt-legend-line" style={{ background: v.color }} />
                <span>{v.label}</span>
              </div>
            ))}
            {simulationClockMin > 0 && (
              <>
                <span className="gantt-legend-sep">|</span>
                <div className="gantt-legend-item">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Frozen</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── TIMELINE CANVAS ─── */}
      <div className="gantt-scroll-area" onMouseLeave={() => setHoveredItem(null)}>
        <div className="gantt-canvas" style={{ height: totalH, minWidth: 1100 }}>
          {/* ── Time Axis Header ── */}
          <div className="gantt-time-header" style={{ height: HEADER_H }}>
            <div className="gantt-sidebar-header" style={{ width: SIDEBAR_W }}>
              SECTION
            </div>
            <div className="gantt-time-axis">
              {/* Major ticks */}
              {majorHours.map((h) => {
                const pct = (h * 60 / TIME_MINS) * 100;
                return (
                  <div key={`major-${h}`} className="gantt-tick gantt-tick-major" style={{ left: `${pct}%` }}>
                    <span className="gantt-tick-label">{`${h.toString().padStart(2, '0')}:00`}</span>
                  </div>
                );
              })}
              {/* Minor ticks */}
              {minorHours.map((h) => {
                const pct = (h * 60 / TIME_MINS) * 100;
                return (
                  <div key={`minor-${h}`} className="gantt-tick gantt-tick-minor" style={{ left: `${pct}%` }}>
                    <span className="gantt-tick-label gantt-tick-label-minor">{`${h.toString().padStart(2, '0')}:00`}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Simulation Clock Marker ── */}
          {simulationClockMin > 0 && (
            <>
              {/* Frozen history shading */}
              <div
                className="gantt-frozen-overlay"
                style={{
                  left: SIDEBAR_W,
                  width: `calc((100% - ${SIDEBAR_W}px) * ${simulationClockMin / TIME_MINS})`,
                  top: HEADER_H,
                  bottom: 0,
                }}
              />
              {/* NOW line */}
              <div
                className="gantt-now-line"
                style={{
                  left: `calc(${SIDEBAR_W}px + (100% - ${SIDEBAR_W}px) * ${simulationClockMin / TIME_MINS})`,
                  top: 0,
                  bottom: 0,
                }}
              >
                <div className="gantt-now-label">
                  {formatTime(simulationClockMin)} • SIM TIME
                </div>
              </div>
            </>
          )}

          {/* ── Section Rows ── */}
          {filteredSections.map((sec, idx) => {
            const top = HEADER_H + idx * ROW_H;
            const secBlocks = blocks.filter((b) => b.section_id === sec.section_id);
            const isEven = idx % 2 === 0;

            return (
              <div
                key={sec.section_id}
                className={`gantt-row ${isEven ? 'gantt-row-even' : ''}`}
                style={{ top, height: ROW_H }}
              >
                {/* ── Sidebar ── */}
                <div className="gantt-sidebar" style={{ width: SIDEBAR_W }}>
                  <div className="gantt-sidebar-direction">
                    <span className={`gantt-dir-tag ${sec.direction === 'UP' ? 'gantt-dir-up' : 'gantt-dir-dn'}`}>
                      {sec.direction}
                    </span>
                    <span className="gantt-sidebar-id">{sec.section_id}</span>
                  </div>
                  <div className="gantt-sidebar-name" title={sec.name}>
                    {sec.start_station} → {sec.end_station}
                  </div>
                  <div className="gantt-sidebar-meta">
                    {sec.length_km} km • {sec.max_speed_kmh} km/h
                  </div>
                </div>

                {/* ── Track Lane ── */}
                <div className="gantt-track-lane">
                  {/* Grid lines */}
                  {majorHours.map((h) => (
                    <div key={h} className="gantt-grid-major" style={{ left: `${(h * 60 / TIME_MINS) * 100}%` }} />
                  ))}
                  {minorHours.map((h) => (
                    <div key={h} className="gantt-grid-minor" style={{ left: `${(h * 60 / TIME_MINS) * 100}%` }} />
                  ))}

                  {/* ── Maintenance Blocks ── */}
                  {secBlocks.map((blk) => {
                    const leftPct = (blk.start_min / TIME_MINS) * 100;
                    const widthPct = (blk.duration_mins / TIME_MINS) * 100;
                    const style = blk.is_super_task ? SUPER_TASK_STYLE : getDeptStyle(blk.departments);
                    const isFrozen = !!blk.is_frozen;
                    const isMoved = movedBlockIds.has(blk.block_id);
                    const isSelected = selectedItem?.id === blk.block_id;
                    const deptLabels = blk.departments.map(getDeptLabel);

                    return (
                      <div
                        key={blk.block_id}
                        className={`gantt-block ${blk.is_super_task ? 'gantt-block-st' : ''} ${isFrozen ? 'gantt-block-frozen' : ''} ${isMoved ? 'gantt-block-moved' : ''} ${isSelected ? 'gantt-block-selected' : ''}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 1.8)}%`,
                          '--block-bg': style.bg,
                          '--block-border': style.border,
                          '--block-text': style.text,
                        } as React.CSSProperties}
                        onClick={() => setSelectedItem({ type: 'BLOCK', id: blk.block_id, data: blk })}
                        onMouseMove={(e) => handleMouseMove(e, 'BLOCK', blk)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Top line: icon + ID + saving badge */}
                        <div className="gantt-block-header">
                          <span className="gantt-block-id">
                            {blk.is_super_task && <Layers className="w-3 h-3" style={{ color: style.text }} />}
                            {isFrozen && <Lock className="w-3 h-3 text-slate-400" />}
                            {blk.is_super_task ? (blk.super_task_id || blk.block_id) : blk.block_id}
                          </span>
                          {blk.is_super_task && blk.downtime_saved_mins > 0 && widthPct > 5 && (
                            <span className="gantt-st-saving">
                              ▼{blk.downtime_saved_mins}m SAVED
                            </span>
                          )}
                        </div>
                        {/* Middle: dept labels */}
                        {widthPct > 4 && (
                          <div className="gantt-block-depts">
                            {blk.is_super_task
                              ? deptLabels.join(' + ')
                              : deptLabels[0] || ''}
                          </div>
                        )}
                        {/* Bottom: time window */}
                        {widthPct > 6 && (
                          <div className="gantt-block-time">
                            {formatTime(blk.start_min)} – {formatTime(blk.end_min)} • {blk.duration_mins}m
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Train Strings ── */}
                  {trains.map((train) => {
                    const trav = train.traversals.find((t) => t.section_id === sec.section_id);
                    if (!trav) return null;

                    const runMins = trav.exit_min - trav.entry_min;
                    const leftPct = (trav.entry_min / TIME_MINS) * 100;
                    const widthPct = (runMins / TIME_MINS) * 100;
                    const cat = getTrainCategory(train.priority_class, train.name);
                    const color = TRAIN_COLORS[cat]?.color || '#60a5fa';
                    const isSelected = selectedItem?.id === train.train_id;

                    return (
                      <div
                        key={`${train.train_id}-${sec.section_id}`}
                        className={`gantt-train ${isSelected ? 'gantt-train-selected' : ''}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 1.2)}%`,
                          '--train-color': color,
                        } as React.CSSProperties}
                        onClick={() => setSelectedItem({ type: 'TRAIN', id: train.train_id, data: train })}
                        onMouseMove={(e) => handleMouseMove(e, 'TRAIN', { ...train, _trav: trav })}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <span className="gantt-train-id">
                          <Train className="w-2.5 h-2.5 shrink-0" style={{ color }} />
                          {train.train_id}
                        </span>
                        {widthPct > 5 && (
                          <span className="gantt-train-arrow" style={{ color }}>▸</span>
                        )}
                        {trav.delay_mins > 0 && (
                          <span className="gantt-train-delay">+{trav.delay_mins}m</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Floating Tooltip ── */}
        {hoveredItem && (
          <div
            className="gantt-tooltip"
            style={{
              left: Math.min(hoveredItem.x, 600),
              top: hoveredItem.y,
            }}
          >
            {hoveredItem.type === 'BLOCK' ? (
              <BlockTooltip blk={hoveredItem.data} />
            ) : (
              <TrainTooltip train={hoveredItem.data} />
            )}
          </div>
        )}
      </div>

      {/* ── Selected Item Detail Panel ── */}
      {selectedItem && (
        <div className="gantt-detail-panel">
          <div className="gantt-detail-content">
            <span className="gantt-detail-badge">
              {selectedItem.type === 'BLOCK' ? 'MAINTENANCE BLOCK' : 'TRAIN SERVICE'}
            </span>
            <h3 className="gantt-detail-title">
              {selectedItem.type === 'BLOCK'
                ? (selectedItem.data.is_super_task
                    ? `SUPER-TASK ${selectedItem.data.super_task_id || selectedItem.data.block_id}`
                    : selectedItem.data.block_id)
                : `${selectedItem.data.name} (${selectedItem.data.train_id})`}
            </h3>
            <div className="gantt-detail-meta">
              {selectedItem.type === 'BLOCK' ? (
                <>
                  <span>Section: <b>{selectedItem.data.section_id}</b></span>
                  <span className="gantt-detail-sep">|</span>
                  <span>
                    Window: <b className="text-cyan-300">{formatTime(selectedItem.data.start_min)} – {formatTime(selectedItem.data.end_min)}</b> ({selectedItem.data.duration_mins} mins)
                  </span>
                  <span className="gantt-detail-sep">|</span>
                  <span>Dept: <b>{selectedItem.data.departments.map(getDeptLabel).join(' + ')}</b></span>
                  {selectedItem.data.is_super_task && selectedItem.data.downtime_saved_mins > 0 && (
                    <>
                      <span className="gantt-detail-sep">|</span>
                      <span className="text-amber-300 font-bold">Downtime Saved: {selectedItem.data.downtime_saved_mins} mins</span>
                    </>
                  )}
                  {selectedItem.data.is_frozen && (
                    <>
                      <span className="gantt-detail-sep">|</span>
                      <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> FROZEN HISTORY</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span>Class: <b className="text-purple-300">{selectedItem.data.priority_class === 1 ? 'VVIP Premium' : selectedItem.data.priority_class === 2 ? 'Express/Mail' : 'Freight'}</b></span>
                  <span className="gantt-detail-sep">|</span>
                  <span>
                    Departure Delay: <b className={selectedItem.data.delay_mins > 0 ? 'text-red-400' : 'text-emerald-400'}>{selectedItem.data.delay_mins} mins</b>
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setSelectedItem(null)} className="gantt-detail-close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Tooltip Sub-components ── */
const BlockTooltip: React.FC<{ blk: ScheduledBlock }> = ({ blk }) => {
  const deptLabels = blk.departments.map(getDeptLabel);
  return (
    <>
      <div className="gantt-tt-header">
        {blk.is_super_task ? (
          <span className="gantt-tt-badge-st">SUPER-TASK</span>
        ) : (
          <span className="gantt-tt-badge-block">MAINTENANCE BLOCK</span>
        )}
        <span className="gantt-tt-id">{blk.is_super_task ? (blk.super_task_id || blk.block_id) : blk.block_id}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Departments</span>
        <span className="gantt-tt-value">{deptLabels.join(' + ')}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Section</span>
        <span className="gantt-tt-value">{blk.section_id}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Window</span>
        <span className="gantt-tt-value">{formatTime(blk.start_min)} – {formatTime(blk.end_min)}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Duration</span>
        <span className="gantt-tt-value">{blk.duration_mins} mins</span>
      </div>
      {blk.is_super_task && blk.downtime_saved_mins > 0 && (
        <div className="gantt-tt-row gantt-tt-highlight">
          <span className="gantt-tt-label">Downtime Saved</span>
          <span className="gantt-tt-value text-amber-300 font-bold">{blk.downtime_saved_mins} mins</span>
        </div>
      )}
      {blk.demand_ids?.length > 0 && (
        <div className="gantt-tt-row">
          <span className="gantt-tt-label">Demands</span>
          <span className="gantt-tt-value">{blk.demand_ids.join(', ')}</span>
        </div>
      )}
      {blk.work_descriptions?.length > 0 && (
        <div className="gantt-tt-row">
          <span className="gantt-tt-label">Tasks</span>
          <span className="gantt-tt-value">{blk.work_descriptions.join(' / ')}</span>
        </div>
      )}
      {blk.is_frozen && (
        <div className="gantt-tt-row">
          <span className="gantt-tt-label">Status</span>
          <span className="gantt-tt-value text-slate-400">🔒 FROZEN HISTORY</span>
        </div>
      )}
    </>
  );
};

const TrainTooltip: React.FC<{ train: any }> = ({ train }) => {
  const cat = getTrainCategory(train.priority_class, train.name);
  const trav = train._trav;
  return (
    <>
      <div className="gantt-tt-header">
        <span className="gantt-tt-badge-train">TRAIN SERVICE</span>
        <span className="gantt-tt-id">{train.train_id}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Name</span>
        <span className="gantt-tt-value">{train.name}</span>
      </div>
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Class</span>
        <span className="gantt-tt-value">{TRAIN_COLORS[cat]?.label || cat}</span>
      </div>
      {trav && (
        <>
          <div className="gantt-tt-row">
            <span className="gantt-tt-label">Section</span>
            <span className="gantt-tt-value">{trav.section_id}</span>
          </div>
          <div className="gantt-tt-row">
            <span className="gantt-tt-label">Entry</span>
            <span className="gantt-tt-value">{formatTime(trav.entry_min)}</span>
          </div>
          <div className="gantt-tt-row">
            <span className="gantt-tt-label">Exit</span>
            <span className="gantt-tt-value">{formatTime(trav.exit_min)}</span>
          </div>
          {trav.delay_mins > 0 && (
            <div className="gantt-tt-row gantt-tt-highlight">
              <span className="gantt-tt-label">Delay</span>
              <span className="gantt-tt-value text-red-400 font-bold">+{trav.delay_mins} mins</span>
            </div>
          )}
        </>
      )}
      <div className="gantt-tt-row">
        <span className="gantt-tt-label">Direction</span>
        <span className="gantt-tt-value">{train.direction}</span>
      </div>
    </>
  );
};
