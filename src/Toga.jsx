import { useState, useEffect, useRef } from "react";
import { getQueue, updateQueueEntryStatus, logActivity } from "./mockDatabase";

// ─── Sunday-based Week Number ──────────────────────────────────────────────────
function getSundayWeekNumber(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const jan1Day = jan1.getDay();
  const dayOfYear = Math.floor((d - jan1) / 86400000);
  return Math.floor((dayOfYear + jan1Day) / 7) + 1;
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_ORDER = ["Done Glam", "Arrived_Toga", "Entered_Toga", "Now Serving_Toga", "Done Toga"];

const STATUS_STYLES = {
  "Done Glam":        "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Arrived_Toga:       "bg-blue-500/20 text-[#e2c06a] border-blue-500/30",
  Entered_Toga:       "bg-[#c9a84c]/20 text-[#e2c06a] border-[#c9a84c]/30",
  "Now Serving_Toga": "bg-green-500/20 text-green-300 border-green-500/30",
  "Done Toga":        "bg-[#c9a84c]/20 text-[#e2c06a] border-[#c9a84c]/30",
};

const COLUMN_CONFIG = [
  {
    key: "Done Glam",
    label: "Done Glam",
    sourceStatus: "Done Glam",
    color: "#94a3b8",
    accent: "rgba(148,163,184,0.15)",
    border: "rgba(148,163,184,0.25)",
    btnLabel: "Arrived",
    btnColor: "linear-gradient(135deg,#3b82f6,#06b6d4)",
    btnShadow: "rgba(201,168,76,0.35)",
    nextStatus: "Arrived_Toga",
  },
  {
    key: "Arrived_Toga",
    label: "Arrived",
    color: "#e2c06a",
    accent: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    btnLabel: "Enter Room",
    btnColor: "linear-gradient(135deg,#1a2f6e,#c9a84c)",
    btnShadow: "rgba(245,158,11,0.35)",
    nextStatus: "Entered_Toga",
  },
  {
    key: "Entered_Toga",
    label: "Entered",
    color: "#fbbf24",
    accent: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.25)",
    btnLabel: "Serving",
    btnColor: "linear-gradient(135deg,#10b981,#059669)",
    btnShadow: "rgba(16,185,129,0.35)",
    nextStatus: "Now Serving_Toga",
  },
  {
    key: "Now Serving_Toga",
    label: "Now Serving",
    color: "#34d399",
    accent: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.25)",
    btnLabel: "Done Toga",
    btnColor: "linear-gradient(135deg,#10b981,#059669)",
    btnShadow: "rgba(249,115,22,0.35)",
    nextStatus: "Done Toga",
    requiresRemarks: true,
  },
  {
    key: "Done Toga",
    label: "Done Toga",
    color: "#e2c06a",
    accent: "rgba(201,168,76,0.10)",
    border: "rgba(201,168,76,0.25)",
    btnLabel: null,
    nextStatus: null,
  },
];

// ─── Remarks Modal ─────────────────────────────────────────────────────────────
function RemarksModal({ entry, onDone, onSkip }) {
  const [remarks, setRemarks] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDone = () => {
    setVisible(false);
    setTimeout(() => onDone(remarks.trim()), 300);
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(() => onSkip(), 300);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
      backdropFilter: visible ? "blur(6px)" : "none",
      transition: "background 0.3s, backdrop-filter 0.3s",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#070d24,#0b1535)",
        border: "1px solid rgba(201,168,76,0.4)",
        borderRadius: 20,
        padding: "24px 20px",
        width: "calc(100% - 32px)", maxWidth: 420,
        boxShadow: "0 0 60px rgba(201,168,76,0.15), 0 24px 64px rgba(0,0,0,0.5)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.9) translateY(-16px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.36,0.64,1), opacity 0.3s ease",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg,#c9a84c,#1a2f6e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 0 24px rgba(201,168,76,0.4)",
        }}>
          <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>

        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 17, textAlign: "center", marginBottom: 4 }}>
          Add Remarks
        </h3>
        <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
          {entry.studentName} — <span style={{ color: "#e2c06a", fontFamily: "monospace", fontWeight: 600 }}>{entry.priorityNumber}</span>
        </p>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter remarks here (optional)..."
          rows={4}
          style={{
            width: "100%", padding: "12px 14px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, color: "#fff", fontSize: 13, outline: "none",
            resize: "none", fontFamily: "inherit", lineHeight: 1.6,
            boxSizing: "border-box", transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            Skip
          </button>
          <button
            onClick={handleDone}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              background: "linear-gradient(135deg,#c9a84c,#1a2f6e)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Menu ─────────────────────────────────────────────────────────────────
function AvatarMenu({ user, onLogout, onProfileSubmit }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onProfileSubmit}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#cbd5e1", fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
        title="View Profile"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline">Profile</span>
      </button>
      <button
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8,
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
          color: "#f87171", fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.35)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
        title="Logout"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}

// ─── Nav Link ──────────────────────────────────────────────────────────────────
function NavLink({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(201,168,76,0.15)" : "none",
        border: active ? "1px solid rgba(201,168,76,0.35)" : "1px solid transparent",
        borderRadius: 8, padding: "5px 10px",
        color: active ? "#e2c06a" : "#94a3b8",
        fontSize: 12, fontWeight: active ? 600 : 500,
        cursor: "pointer", transition: "all 0.2s",
        whiteSpace: "nowrap", flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#cbd5e1"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "none"; } }}
    >
      {label}
    </button>
  );
}

// ─── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ entry, config, onAction, isDisabled }) {
  const isEnteredStatus = config.key === "Entered_Toga";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start",
      transition: "background 0.15s, border-color 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
        {/* Priority badge + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 6,
            background: "rgba(201,168,76,0.18)", color: "#e2c06a",
            fontSize: 10, fontWeight: 700, fontFamily: "monospace",
            letterSpacing: "0.05em", flexShrink: 0,
          }}>
            {entry.priorityNumber}
          </span>
          <span style={{
            color: "#e2e8f0", fontSize: 12, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.studentName}
          </span>
        </div>

        {/* Program */}
        <div style={{ color: "#64748b", fontSize: 11 }}>
          {entry.programCode} — <span style={{ color: "#94a3b8" }}>{entry.programName}</span>
        </div>

        {/* Remarks (only for Done Toga) */}
        {entry.status === "Done Toga" && entry.remarks && (
          <div style={{
            padding: "6px 10px",
            background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: 8, color: "#e2c06a", fontSize: 11, lineHeight: 1.5,
          }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Remarks: </span>
            {entry.remarks}
          </div>
        )}
        {entry.status === "Done Toga" && !entry.remarks && (
          <div style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>No remarks</div>
        )}
      </div>

      {/* Action buttons */}
      {isEnteredStatus ? (
        // Entered column: Call Again + Serving (Serving is NEVER disabled — multiple allowed)
        <div style={{ display: "flex", gap: 6, width: "100%", justifyContent: "space-between" }}>
          <button
            onClick={() => onAction(entry, "callAgain")}
            style={{
              flex: 1, padding: "7px 10px",
              background: "linear-gradient(135deg,#f59e0b,#f97316)",
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 10, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.04em",
              boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
              transition: "opacity 0.15s, transform 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            title="Send back to Arrived"
          >
            Call Again
          </button>
          <button
            onClick={() => onAction(entry, "serving")}
            title="Move to Now Serving"
            style={{
              flex: 1, padding: "7px 10px",
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 10, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.04em",
              boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
              transition: "opacity 0.15s, transform 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Serving
          </button>
        </div>
      ) : config.btnLabel && (
        <button
          onClick={() => !isDisabled && onAction(entry)}
          disabled={isDisabled}
          style={{
            width: "100%", padding: "7px 12px",
            background: isDisabled ? "rgba(148,163,184,0.3)" : config.btnColor,
            border: "none", borderRadius: 8,
            color: isDisabled ? "#64748b" : "#fff", fontSize: 11, fontWeight: 700,
            cursor: isDisabled ? "not-allowed" : "pointer", letterSpacing: "0.04em",
            boxShadow: isDisabled ? "none" : `0 4px 12px ${config.btnShadow}`,
            transition: "opacity 0.15s, transform 0.1s",
            whiteSpace: "nowrap", flexShrink: 0,
            opacity: isDisabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
          onMouseLeave={(e) => { if (!isDisabled) { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; } }}
        >
          {config.btnLabel}
        </button>
      )}
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({ config, entries, onAction, isDisabled, maxHeight = "550px" }) {
  return (
    <div style={{
      background: config.accent,
      border: `1px solid ${config.border}`,
      borderRadius: 16,
      display: "flex", flexDirection: "column",
      minHeight: 0, overflow: "hidden",
      height: maxHeight,
    }}>
      {/* Column Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: `1px solid ${config.border}`,
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: config.color, display: "inline-block", flexShrink: 0,
        }} />
        <span style={{ color: config.color, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {config.label}
        </span>
        <span style={{
          marginLeft: "auto",
          background: "rgba(255,255,255,0.08)", color: "#94a3b8",
          borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
        }}>
          {entries.length}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1, overflowY: "auto", padding: "10px 10px",
          display: "flex", flexDirection: "column", gap: 8,
        }}
        className="kanban-scroll"
      >
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 12px", color: "#334155", fontSize: 12, fontStyle: "italic" }}>
            Empty
          </div>
        ) : (
          entries.map((entry) => (
            <KanbanCard
              key={entry.priorityNumber}
              entry={entry}
              config={config}
              onAction={onAction}
              isDisabled={isDisabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Toga({ newEntry, onBack, onLogout, user, onGlamSubmit, onOJTSubmit, onProfileSubmit }) {
  const [queue, setQueue] = useState([]);
  const [activeTab, setActiveTab] = useState("display");
  const [activePage, setActivePage] = useState("Toga");
  const [remarksTarget, setRemarksTarget] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayRef = useRef(null);
  const pollingRef = useRef(null);

  const refreshQueue = async () => {
    const qData = await getQueue();
    setQueue(qData);
  };

  useEffect(() => { refreshQueue(); }, [newEntry]);

  useEffect(() => {
    refreshQueue();
    pollingRef.current = setInterval(refreshQueue, 2000);
    return () => clearInterval(pollingRef.current);
  }, []);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      displayRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleAction = async (entry, config, actionType = null) => {
    const priorityId = entry.priority_number || entry.priorityNumber;

    if (config.requiresRemarks) {
      setRemarksTarget(entry);
      return;
    }

    if (actionType === "callAgain") {
      await updateQueueEntryStatus(priorityId, "Entered_Toga");
      await logActivity(user?.id, user?.username, "Call Again", "Toga", `${entry.student_name || entry.studentName} (${priorityId}) called again`);
      refreshQueue();
      return;
    }

    if (actionType === "serving") {
      // FIX: No cap on simultaneous serving — just move to Now Serving
      await updateQueueEntryStatus(priorityId, "Now Serving_Toga");
      await logActivity(user?.id, user?.username, "Status Update", "Toga", `${entry.student_name || entry.studentName} (${priorityId}): Now Serving`);
      refreshQueue();
      return;
    }

    await updateQueueEntryStatus(priorityId, config.nextStatus);
    await logActivity(user?.id, user?.username, "Status Update", "Toga", `${entry.student_name || entry.studentName} (${priorityId}): ${config.btnLabel}`);
    refreshQueue();
  };

  const handleRemarksDone = async (remarks) => {
    if (!remarksTarget) return;
    const priorityId = remarksTarget.priority_number || remarksTarget.priorityNumber;
    await logActivity(user?.id, user?.username, "Remarks", "Toga", `Added remarks for ${remarksTarget.student_name || remarksTarget.studentName} (${priorityId}): ${remarks}`);
    await updateQueueEntryStatus(priorityId, "Done Toga", remarks);
    refreshQueue();
    setRemarksTarget(null);
  };

  const handleRemarksSkip = async () => {
    if (!remarksTarget) return;
    const priorityId = remarksTarget.priority_number || remarksTarget.priorityNumber;
    await updateQueueEntryStatus(priorityId, "Done Toga");
    refreshQueue();
    setRemarksTarget(null);
  };

  // Derived lists
  const nowServingList = queue.filter((e) => e.status === "Now Serving_Toga");
  const arrivedList    = queue.filter((e) => e.status === "Arrived_Toga");
  const enteredList    = queue.filter((e) => e.status === "Entered_Toga");

  // ── Enter Room display — 1 student at a time, cycles on queue ─────────────
  const [displayedEntered, setDisplayedEntered] = useState(null);
  const enterQueueRef  = useRef([]);
  const cycleTimerRef  = useRef(null);
  const seenEnteredRef = useRef(new Set());

  useEffect(() => {
    const newlyEntered = enteredList.filter(
      (s) => !seenEnteredRef.current.has(s.priorityNumber || s.priority_number)
    );
    if (newlyEntered.length === 0) return;

    newlyEntered.forEach((s) =>
      seenEnteredRef.current.add(s.priorityNumber || s.priority_number)
    );
    enterQueueRef.current = [...enterQueueRef.current, ...newlyEntered];

    if (enterQueueRef.current.length === 1 && !cycleTimerRef.current) {
      setDisplayedEntered(enterQueueRef.current[0]);
      enterQueueRef.current = [];
      return;
    }
    if (!cycleTimerRef.current) {
      setDisplayedEntered(enterQueueRef.current.shift());
      cycleTimerRef.current = setInterval(() => {
        if (enterQueueRef.current.length > 0) {
          setDisplayedEntered(enterQueueRef.current.shift());
        } else {
          clearInterval(cycleTimerRef.current);
          cycleTimerRef.current = null;
        }
      }, 3000);
    }
  }, [enteredList]);

  useEffect(() => {
    return () => { if (cycleTimerRef.current) clearInterval(cycleTimerRef.current); };
  }, []);

  const navPages = ["Registration", "Glam", "OJT", "Toga"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04081a] via-[#0b1230] to-[#04081a] relative overflow-hidden">
      <style>{`
        @media (min-width: 480px) { .xs\:block { display: block !important; } .xs\:inline { display: inline !important; } }
        @media (max-width: 640px) {
          .kanban-top-row { grid-template-columns: 1fr !important; }
          .kanban-bottom-row { grid-template-columns: 1fr !important; }
          .kanban-col { height: 300px !important; }
        }
        @media (min-width: 641px) {
          .kanban-top-row { grid-template-columns: repeat(3,1fr) !important; }
          .kanban-bottom-row { grid-template-columns: repeat(2,1fr) !important; }
        }
        .kanban-scroll::-webkit-scrollbar { width: 5px; }
        .kanban-scroll::-webkit-scrollbar-track { background: transparent; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 4px; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.7); }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.35); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.6); }
        select { background-color: rgba(7,13,36,0.95); }
        select option { background-color: #070d24; color: #e2e8f0; }
      `}</style>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1a2f6e] opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#c9a84c] opacity-10 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Remarks Modal */}
      {remarksTarget && (
        <RemarksModal
          entry={remarksTarget}
          onDone={handleRemarksDone}
          onSkip={handleRemarksSkip}
        />
      )}

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a2f6e] to-[#c9a84c] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-tight text-sm whitespace-nowrap">Ad Astra Queuing System</span>
          </div>
          <AvatarMenu user={user} onLogout={onLogout} onProfileSubmit={onProfileSubmit} />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2 flex items-center justify-between gap-2">
          <div className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
            {navPages.map((page) => (
              <NavLink
                key={page}
                label={page}
                active={activePage === page}
                onClick={() => {
                  if (page === "Registration") onBack();
                  else if (page === "Glam") onGlamSubmit();
                  else if (page === "OJT") onOJTSubmit();
                  else if (page === "Profile") onProfileSubmit();
                  else setActivePage(page);
                }}
              />
            ))}
          </div>
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          {/* Display / Controls toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, flexShrink: 0 }}>
            <button
              onClick={() => setActiveTab("display")}
              style={{
                padding: "4px 10px", borderRadius: 8,
                background: activeTab === "display" ? "linear-gradient(135deg,#1a2f6e,#c9a84c)" : "none",
                border: "none", color: activeTab === "display" ? "#fff" : "#94a3b8",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                boxShadow: activeTab === "display" ? "0 2px 8px rgba(201,168,76,0.3)" : "none",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>Display</button>
            <button
              onClick={() => setActiveTab("controls")}
              style={{
                padding: "4px 10px", borderRadius: 8,
                background: activeTab === "controls" ? "linear-gradient(135deg,#1a2f6e,#c9a84c)" : "none",
                border: "none", color: activeTab === "controls" ? "#fff" : "#94a3b8",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                boxShadow: activeTab === "controls" ? "0 2px 8px rgba(201,168,76,0.3)" : "none",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>Controls</button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col gap-1">
              {navPages.map((page) => (
                <button
                  key={page}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePage === page
                      ? "bg-[#c9a84c]/20 text-[#e2c06a] border border-[#c9a84c]/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (page === "Registration") onBack();
                    else if (page === "Glam") onGlamSubmit();
                    else if (page === "OJT") onOJTSubmit();
                    else if (page === "Profile") onProfileSubmit();
                    else setActivePage(page);
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ── DISPLAY TAB ─────────────────────────────────────────────────── */}
        {activeTab === "display" && (
          <div ref={displayRef} style={isFullscreen ? {
            position: "fixed", inset: 0, zIndex: 9999,
            background: "linear-gradient(135deg,#04081a,#0b1230,#04081a)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 40,
          } : {}}>
            {/* Fullscreen button */}
            <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#a0aec0", cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.2)"; e.currentTarget.style.color = "#e2c06a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#a0aec0"; }}
              >
                {isFullscreen ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l5 0M4 4v5M15 9l5-5m0 0l-5 0m5 0v5M9 15l-5 5m0 0l5 0m-5 0v-5M15 15l5 5m0 0l-5 0m5 0v-5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-6" style={{ width: "100%" }}>
              {/* Header label */}
              <div className="text-center">
                <span className="flex items-center justify-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#e2c06a] text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest w-fit mx-auto">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  Toga Display Screen
                </span>
              </div>

              {/* PLEASE ENTER THE ROOM */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-4 sm:px-8 py-6 shadow-2xl">
                <p className="text-[#e2c06a] text-xs font-bold uppercase tracking-[0.25em] mb-4 text-center">Please Enter the Room</p>
                {displayedEntered ? (
                  <div className="text-center py-2">
                    <h2 className="text-white font-extrabold leading-tight" style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>
                      {displayedEntered.studentName || displayedEntered.student_name}
                    </h2>
                    <p className="text-[#c9a84c] font-bold font-mono mt-2" style={{ fontSize: "clamp(0.9rem,2vw,1.25rem)" }}>
                      {displayedEntered.priorityNumber || displayedEntered.priority_number}
                    </p>
                    {enterQueueRef.current.length > 0 && (
                      <p className="text-slate-500 text-xs mt-3">+{enterQueueRef.current.length} more in queue</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm text-center">No one entering</p>
                )}
              </div>

              {/* BOTTOM ROW — Please Prepare | Now Serving */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Please Prepare */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-4 sm:px-6 py-5 shadow-xl">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 text-center">Please Prepare</p>
                  {arrivedList.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {arrivedList.map((student, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between">
                          <p className="text-white font-bold text-sm truncate">{student.studentName || student.student_name}</p>
                          <span className="text-[#c9a84c] font-bold font-mono text-xs ml-2 flex-shrink-0">{student.priorityNumber || student.priority_number}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm text-center">No one preparing</p>
                  )}
                </div>

                {/* Now Serving — supports MULTIPLE students */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-4 sm:px-6 py-5 shadow-xl overflow-hidden">
                  <p className="text-[#e2c06a] text-xs font-bold uppercase tracking-[0.25em] mb-4 text-center">
                    Now Serving
                    {nowServingList.length > 1 && (
                      <span style={{
                        marginLeft: 8,
                        background: "rgba(52,211,153,0.15)", color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.3)",
                        borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700,
                      }}>
                        {nowServingList.length}
                      </span>
                    )}
                  </p>
                  {nowServingList.length > 0 ? (
                    <div className="flex flex-col gap-3" style={{ maxHeight: 260, overflowY: "auto" }}>
                      {nowServingList.map((student, idx) => (
                        <div
                          key={idx}
                          className="text-center py-2 rounded-2xl"
                          style={{
                            background: nowServingList.length > 1 ? "rgba(52,211,153,0.06)" : "transparent",
                            border: nowServingList.length > 1 ? "1px solid rgba(52,211,153,0.12)" : "none",
                            padding: nowServingList.length > 1 ? "10px 14px" : "0",
                          }}
                        >
                          <h2 className="text-white font-extrabold leading-tight" style={{
                            fontSize: nowServingList.length === 1
                              ? "clamp(1.25rem,3vw,2rem)"
                              : "clamp(0.95rem,2vw,1.25rem)",
                          }}>
                            {student.studentName || student.student_name}
                          </h2>
                          <p className="text-[#c9a84c] font-bold font-mono mt-1" style={{
                            fontSize: nowServingList.length === 1
                              ? "clamp(0.85rem,2vw,1.25rem)"
                              : "clamp(0.75rem,1.5vw,0.95rem)",
                          }}>
                            {student.priorityNumber || student.priority_number}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <p className="text-sm text-slate-500">No one serving</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Newly arrived from Glam highlight */}
              {newEntry && (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1a2f6e]/30 to-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a2f6e] to-[#c9a84c] flex flex-col items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                    <span className="text-white/70 text-xs leading-none">No.</span>
                    <span className="text-white text-lg font-bold font-mono leading-tight">{newEntry.priorityNumber}</span>
                  </div>
                  <div>
                    <p className="text-[#e2c06a] text-xs font-semibold uppercase tracking-widest">✓ From Glam Ready for Toga</p>
                    <h2 className="text-white text-base font-bold mt-0.5">{newEntry.studentName}</h2>
                    <p className="text-slate-400 text-xs">{newEntry.programCode} — {newEntry.programName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTROLS TAB (Kanban) ─────────────────────────────────────────── */}
        {activeTab === "controls" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <span className="flex items-center justify-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#e2c06a] text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest w-fit mx-auto">
                <span className="w-2 h-2 rounded-full bg-[#e2c06a] animate-pulse inline-block" />
                Toga Controls
              </span>
            </div>

            {/* Top Row: Done Glam, Arrived, Entered */}
            <div
              className="kanban-top-row"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}
            >
              {COLUMN_CONFIG.map((config) => {
                if (config.key === "Now Serving_Toga" || config.key === "Done Toga") return null;
                const entries = queue.filter((e) => e.status === (config.sourceStatus || config.key));
                return (
                  <div key={config.key}>
                    <KanbanColumn
                      config={config}
                      entries={entries}
                      onAction={(entry, actionType) => handleAction(entry, config, actionType)}
                      isDisabled={false}
                      maxHeight="520px"
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: Now Serving (multiple), Done Toga */}
            <div
              className="kanban-bottom-row"
              style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}
            >
              {COLUMN_CONFIG.map((config) => {
                if (config.key !== "Now Serving_Toga" && config.key !== "Done Toga") return null;
                const entries = queue.filter((e) => e.status === config.key);
                return (
                  <div key={config.key}>
                    <KanbanColumn
                      config={config}
                      entries={entries}
                      onAction={(entry, actionType) => handleAction(entry, config, actionType)}
                      isDisabled={false}
                      maxHeight={config.key === "Now Serving_Toga" ? "320px" : "520px"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}