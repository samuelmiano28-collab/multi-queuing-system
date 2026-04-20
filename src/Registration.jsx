import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import { getStudents, getPrograms, addToQueue, getQueue, removeFromQueue } from "./mockDatabase";

// ─── Priority Number Generator ──────────────────────────────────────────────

function getSundayWeekNumber(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const jan1Day = jan1.getDay();
  const dayOfYear = Math.floor((d - jan1) / 86400000);
  return Math.floor((dayOfYear + jan1Day) / 7) + 1;
}
const getISOWeekNumber = getSundayWeekNumber;

function getDayCode(date) {
  const codes = ["Su", "M", "T", "W", "Th", "F", "Sa"];
  return codes[date.getDay()];
}

function generatePriorityNumber(sequenceCount) {
  const now = new Date();
  const week = getISOWeekNumber(now);
  const day = getDayCode(now);
  const count = String(sequenceCount).padStart(3, "0");
  return `W${week}-${day}-${count}`;
}

/**
 * FIX: Always query the DB for the real max priority_number for today.
 * This prevents duplicate key errors when localStorage drifts out of sync
 * across devices/sessions/tabs.
 */
async function getTodayMaxSequence() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const { data, error } = await supabase
    .from("mqs_queue")
    .select("priority_number")
    .gte("created_at", `${todayStr}T00:00:00`)
    .lte("created_at", `${todayStr}T23:59:59`);

  if (error) {
    console.error("getTodayMaxSequence error:", error.message);
    return 0;
  }

  if (!data || data.length === 0) return 0;
  // Parse sequence numbers and find the maximum
  const sequences = data.map(item => parseInt(item.priority_number.split('-')[2], 10) || 0);
  return Math.max(...sequences);
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ entry, onClose }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => {
      setLeaving(true);
      setTimeout(onClose, 400);
    }, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: leaving ? "rgba(0,0,0,0)" : visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        transition: "background 0.35s ease",
        pointerEvents: leaving ? "none" : "auto",
        backdropFilter: visible && !leaving ? "blur(4px)" : "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0f2a1e 0%, #0c1e30 100%)",
          border: "1px solid rgba(52,211,153,0.35)",
          borderRadius: "20px",
          padding: "36px 44px",
          minWidth: "340px",
          boxShadow: "0 0 60px rgba(52,211,153,0.18), 0 24px 64px rgba(0,0,0,0.5)",
          transform: leaving ? "scale(0.88) translateY(-12px)" : visible ? "scale(1) translateY(0)" : "scale(0.88) translateY(-12px)",
          opacity: leaving ? 0 : visible ? 1 : 0,
          transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
          textAlign: "center",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg,#059669,#10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 0 24px rgba(16,185,129,0.45)",
        }}>
          <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ color: "#34d399", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
          Successfully Registered!
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 16 }}>
          {entry.studentName}
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(201,168,76,0.15)", border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 10, padding: "8px 18px",
        }}>
          <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600 }}>Priority:</span>
          <span style={{ color: "#fff", fontFamily: "monospace", fontWeight: 700, fontSize: 15, letterSpacing: "0.1em" }}>
            {entry.priorityNumber}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ entry, students, programs, onSave, onClose }) {
  const [studentId, setStudentId] = useState(String(entry.studentId));
  const [programId, setProgramId] = useState(String(entry.programId));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    const student = students.find((s) => s.id === parseInt(studentId));
    const program = programs.find((p) => p.id === parseInt(programId));
    onSave({
      ...entry,
      studentId: student.id,
      studentName: student.name,
      programId: program.id,
      programCode: program.code,
      programName: program.name,
    });
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "none",
        transition: "background 0.3s, backdrop-filter 0.3s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #0d1f35 0%, #0a1628 100%)",
          border: "1px solid rgba(99,179,237,0.25)",
          borderRadius: 20,
          padding: "24px 20px",
          width: "calc(100% - 32px)", maxWidth: 420,
          boxShadow: "0 0 60px rgba(201,168,76,0.15), 0 24px 64px rgba(0,0,0,0.5)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.36,0.64,1), opacity 0.3s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Edit Queue Entry</h3>
          <button
            onClick={handleClose}
            style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          >✕</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Priority #
          </span>
          <div style={{
            marginTop: 6, padding: "8px 12px",
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 10, color: "#93c5fd", fontFamily: "monospace", fontWeight: 700, fontSize: 13,
          }}>
            {entry.priorityNumber}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Student Name
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id} style={{ background: "#0f172a" }}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Program
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id} style={{ background: "#0f172a" }}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
            }}
          >
            Save Changes
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

// ─── Queue Summary with Edit ──────────────────────────────────────────────────

function QueueSummary({ refreshKey, students, programs }) {
  const [queue, setQueue] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterProgram, setFilterProgram] = useState("All");

  useEffect(() => {
    const loadQueue = async () => {
      const queueData = await getQueue();
      setQueue(queueData);
    };
    loadQueue();
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const queueData = await getQueue();
      setQueue(queueData);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // FIX: use priorityNumber (camelCase) consistently — not priority_number
  const handleSaveEdit = async (updated) => {
    const newQueue = queue.map((e) =>
      e.priorityNumber === updated.priorityNumber ? updated : e
    );
    setQueue(newQueue);
    setEditEntry(null);
  };

  const handleDelete = async (entry) => {
    setDeletingId(entry.priorityNumber);
    await removeFromQueue(entry.priorityNumber);
    setQueue((prev) => prev.filter((e) => e.priorityNumber !== entry.priorityNumber));
    setDeletingId(null);
  };

  const handleExportExcel = () => {
    if (queue.length === 0) return;
    const headers = ["Priority #", "Student Name", "Program Code", "Program Name", "Status"];
    const rows = filteredQueue.map((e) => [
      e.priorityNumber ?? "",
      e.studentName ?? "",
      e.programCode ?? "",
      e.programName ?? "",
      e.status ?? "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `queue_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uniqueStatuses = ["All", ...Array.from(new Set(queue.map((e) => e.status).filter(Boolean)))];
  const uniquePrograms = ["All", ...Array.from(new Set(queue.map((e) => e.programCode).filter(Boolean)))];

  const filteredQueue = queue.filter((e) => {
    const matchSearch = searchText === "" ||
      (e.studentName ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (e.priorityNumber ?? "").toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    const matchProgram = filterProgram === "All" || e.programCode === filterProgram;
    return matchSearch && matchStatus && matchProgram;
  });

  const statusColors = {
    Waiting:    { bg: "rgba(234,179,8,0.12)",  color: "#fbbf24", border: "rgba(234,179,8,0.3)" },
    Registered: { bg: "rgba(234,179,8,0.12)",  color: "#fbbf24", border: "rgba(234,179,8,0.3)" },
    Serving:    { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
    Done:       { bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)" },
    Cancelled:  { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)" },
  };
  const getStatusStyle = (status) =>
    statusColors[status] ?? { bg: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "rgba(234,179,8,0.25)" };

  const inputBase = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#e2e8f0", fontSize: 11, outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.35); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.65); }
        .qs-input:focus { border-color: rgba(201,168,76,0.55) !important; }
        @media (max-width: 640px) {
          .reg-table th:nth-child(4), .reg-table td:nth-child(4) { display: none; }
          .reg-table th:nth-child(5), .reg-table td:nth-child(5) { display: none; }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <svg width="16" height="16" fill="none" stroke="#e2c06a" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Current Queue</span>
        <span style={{
          background: "rgba(34,211,238,0.15)", color: "#e2c06a",
          borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 700,
        }}>{filteredQueue.length}{filteredQueue.length !== queue.length ? ` / ${queue.length}` : ""}</span>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleExportExcel}
            disabled={queue.length === 0}
            title="Export current queue to CSV"
            style={{
              padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
              cursor: queue.length === 0 ? "not-allowed" : "pointer",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80",
              opacity: queue.length === 0 ? 0.4 : 1, transition: "all 0.15s",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
            onMouseEnter={(e) => { if (queue.length > 0) { e.currentTarget.style.background = "rgba(34,197,94,0.2)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.55)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.1)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 130px", minWidth: 120 }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            className="qs-input"
            type="text"
            placeholder="Search name or priority…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ ...inputBase, width: "100%", padding: "5px 8px 5px 24px", boxSizing: "border-box" }}
          />
        </div>

        <select
          className="qs-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ ...inputBase, padding: "5px 8px", cursor: "pointer", flex: "0 0 auto" }}
        >
          {uniqueStatuses.map((s) => (
            <option key={s} value={s} style={{ background: "#0f172a" }}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>

        <select
          className="qs-input"
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          style={{ ...inputBase, padding: "5px 8px", cursor: "pointer", flex: "0 0 auto" }}
        >
          {uniquePrograms.map((p) => (
            <option key={p} value={p} style={{ background: "#0f172a" }}>{p === "All" ? "All Programs" : p}</option>
          ))}
        </select>

        {(searchText || filterStatus !== "All" || filterProgram !== "All") && (
          <button
            onClick={() => { setSearchText(""); setFilterStatus("All"); setFilterProgram("All"); }}
            style={{
              ...inputBase, padding: "5px 8px", cursor: "pointer", fontSize: 10,
              color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 3,
            }}
          >
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16, overflow: "hidden",
        display: "flex", flexDirection: "column",
        height: 340, overflowX: "auto",
      }}>
        <div style={{ flexShrink: 0 }}>
          <table className="reg-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["Priority #", "Student", "Program", "Status", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: "left",
                    color: "#64748b", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    background: "rgba(255,255,255,0.03)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="custom-scroll">
          <table className="reg-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", color: "#475569" }}>
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 8px", display: "block", opacity: 0.35 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p style={{ fontSize: 12, margin: 0 }}>{queue.length === 0 ? "No queue entries yet" : "No entries match your filters"}</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((entry, i) => {
                  const sc = getStatusStyle(entry.status);
                  return (
                    <tr
                      key={entry.priorityNumber}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.07)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"; }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 7,
                          background: "rgba(59,130,246,0.18)", color: "#93c5fd",
                          fontSize: 11, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}>
                          {entry.priorityNumber}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#e2e8f0", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.studentName}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: 12 }}>
                        {entry.programCode}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: 20,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {entry.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            onClick={() => setEditEntry(entry)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "4px 8px", borderRadius: 7,
                              background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.25)",
                              color: "#7dd3fc", fontSize: 11, fontWeight: 600, cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,179,237,0.22)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,179,237,0.1)"; }}
                          >
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry)}
                            disabled={deletingId === entry.priorityNumber}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "4px 8px", borderRadius: 7,
                              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                              color: "#f87171", fontSize: 11, fontWeight: 600,
                              cursor: deletingId === entry.priorityNumber ? "not-allowed" : "pointer",
                              opacity: deletingId === entry.priorityNumber ? 0.5 : 1,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (deletingId !== entry.priorityNumber) e.currentTarget.style.background = "rgba(239,68,68,0.22)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          >
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {deletingId === entry.priorityNumber ? "…" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editEntry && (
        <EditModal
          entry={editEntry}
          students={students}
          programs={programs}
          onSave={handleSaveEdit}
          onClose={() => setEditEntry(null)}
        />
      )}
    </>
  );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Registration({ user, onLogout, onSubmit, onTogaSubmit, onOJTSubmit, onProfileSubmit }) {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);
  const [activePage, setActivePage] = useState("Registration");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registeredStudentNames, setRegisteredStudentNames] = useState(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentSearchRef = useRef(null);

  // FIX: nextSequence is now state, synced from DB on mount
  const [nextSequence, setNextSequence] = useState(1);
  const previewPriority = generatePriorityNumber(nextSequence);

  // Sync sequence counter from DB on mount AND periodically so external
  // changes (e.g. DELETE FROM mqs_queue) are reflected without a page refresh
  useEffect(() => {
    const sync = () => getTodayMaxSequence().then((max) => setNextSequence(max + 1));
    sync();
    const interval = setInterval(sync, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load queue to know which students/programs are already registered
  useEffect(() => {
    const syncQueue = async () => {
      const queueData = await getQueue();
      setRegisteredStudentNames(new Set(queueData.map((e) => e.studentName)));
    };
    syncQueue();
    const interval = setInterval(syncQueue, 3000);
    return () => clearInterval(interval);
  }, [queueRefreshKey]);

  // Close student dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(e.target)) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const studentsData = await getStudents();
      const programsData = await getPrograms();
      setStudents(studentsData);
      const seen = new Set();
      const cleanedPrograms = programsData.filter((p) => {
        if (!p.code || /^\d+$/.test(String(p.code).trim())) return false;
        const key = p.code.trim().toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPrograms(cleanedPrograms);
    };
    loadData();
  }, []);

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    setStudentDropdownOpen(false);
    if (!studentId) {
      setStudentSearch("");
      setSelectedProgram("");
      return;
    }
    const student = students.find((s) => String(s.id) === String(studentId));
    if (student) {
      setStudentSearch(student.name);
      if (student?.course) {
        const matchedProgram = programs.find((p) => p.code === student.course);
        if (matchedProgram) setSelectedProgram(String(matchedProgram.id));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedStudent || !selectedProgram) {
      setError("Please select both a student and a program.");
      return;
    }
    setLoading(true);
    try {
      const student = students.find((s) => String(s.id) === String(selectedStudent));
      const program = programs.find((p) => String(p.id) === String(selectedProgram));

      if (!student) {
        setError("Selected student not found. Please try again.");
        setLoading(false);
        return;
      }
      if (!program) {
        setError("Selected program not found. Please try again.");
        setLoading(false);
        return;
      }

      // FIX: Always get the real max from DB right before inserting.
      // This guarantees no duplicate key even if multiple tabs/devices
      // are registering simultaneously or localStorage was stale.
      const currentMax = await getTodayMaxSequence();
      const sequence = currentMax + 1;
      const priorityNumber = generatePriorityNumber(sequence);

      const entry = await addToQueue({
        studentName:      student.name,
        programCode:      program.code,
        programName:      program.name,
        priorityNumber,           // formatted label "W17-Su-001"
        prioritySequence: sequence, // integer for priority_number column
      });

      // Update the preview counter to reflect new state
      setNextSequence(sequence + 1);

      setLoading(false);
      setSuccess(entry);
      setQueueRefreshKey((k) => k + 1);
      setSelectedStudent("");
      setSelectedProgram("");
      setStudentSearch("");
    } catch (err) {
      console.error("Error adding to queue:", err);
      // FIX: If we still somehow hit a duplicate (race condition between two
      // simultaneous submits), retry once with a fresh sequence from DB.
      if (err?.code === "23505") {
        setError("Sequence conflict — please try again.");
      } else {
        setError("Failed to add to queue. Please try again.");
      }
      setLoading(false);
    }
  };

  const navPages = ["Registration", "Glam", "Toga", "OJT"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04081a] via-[#0b1230] to-[#04081a] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1a2f6e] opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#c9a84c] opacity-10 rounded-full blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {success && <SuccessModal entry={success} onClose={() => setSuccess(null)} />}

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a2f6e] to-[#c9a84c] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-tight text-sm whitespace-nowrap">Ad Astra Queuing System</span>
          </div>
          <AvatarMenu user={user} onLogout={onLogout} onProfileSubmit={onProfileSubmit} />
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navPages.map((page) => (
              <NavLink
                key={page}
                label={page}
                active={activePage === page}
                onClick={() => {
                  if (page === "Glam") {
                    onSubmit(null);
                  } else if (page === "Toga") {
                    onTogaSubmit();
                  } else if (page === "OJT") {
                    onOJTSubmit();
                  } else if (page === "Profile") {
                    onProfileSubmit();
                  } else {
                    setActivePage(page);
                  }
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
                    if (page === "Glam") {
                      onSubmit(null);
                    } else if (page === "Toga") {
                      onTogaSubmit();
                    } else if (page === "OJT") {
                      onOJTSubmit();
                    } else if (page === "Profile") {
                      onProfileSubmit();
                    } else {
                      setActivePage(page);
                    }
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#e2c06a] text-xs font-semibold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-[#e2c06a] animate-pulse inline-block" />
            Student Registration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Queue Registration</h1>
          <p className="text-slate-400 mt-1">Register a student and assign a priority number for {activePage === "Registration" ? "Glam Studio" : activePage}.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* LEFT — Registration Form */}
          <div>
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl">
              <div className="space-y-6">

                {/* Priority Number Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Priority Number
                  </label>
                  <div className="flex items-center gap-4 px-4 py-3 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#1a3a7e] to-[#c9a84c] px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 flex-shrink-0">
                      <span className="text-white font-bold font-mono tracking-widest text-sm">{previewPriority}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <span className="text-[#e2c06a] font-semibold font-mono">W{getISOWeekNumber(new Date())}</span>
                        = Week {getISOWeekNumber(new Date())}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <span className="text-[#c9a84c] font-semibold font-mono">{getDayCode(new Date())}</span>
                        = {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <span className="text-white font-semibold font-mono">{String(nextSequence).padStart(3, "0")}</span>
                        = Queue #{nextSequence} today
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Name — Searchable Combobox */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                  <div className="relative" ref={studentSearchRef}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={studentSearch}
                      placeholder="Type to search student…"
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setSelectedStudent("");
                        setStudentDropdownOpen(true);
                      }}
                      onFocus={() => setStudentDropdownOpen(true)}
                      className="w-full pl-10 pr-9 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]/60 focus:bg-white/10 transition-all"
                      style={{ caretColor: "#e2c06a" }}
                    />
                    {/* Clear button */}
                    {studentSearch && (
                      <button
                        type="button"
                        onClick={() => { setStudentSearch(""); setSelectedStudent(""); setSelectedProgram(""); setStudentDropdownOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {/* Dropdown list */}
                    {studentDropdownOpen && (
                      <div
                        className="absolute z-50 w-full mt-1 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                        style={{ background: "#0f172a", maxHeight: 220, overflowY: "auto" }}
                      >
                        {(() => {
                          const filtered = students.filter((s) =>
                            s.name.toLowerCase().includes(studentSearch.toLowerCase())
                          );
                          if (filtered.length === 0) return (
                            <div className="px-4 py-3 text-slate-500 text-sm text-center">No students found</div>
                          );
                          return filtered.map((s) => {
                            const alreadyIn = registeredStudentNames.has(s.name);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                disabled={alreadyIn}
                                onClick={() => !alreadyIn && handleStudentChange(String(s.id))}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
                                style={{
                                  color: alreadyIn ? "#475569" : "#e2e8f0",
                                  background: String(selectedStudent) === String(s.id) ? "rgba(201,168,76,0.15)" : "transparent",
                                  cursor: alreadyIn ? "not-allowed" : "pointer",
                                  opacity: alreadyIn ? 0.55 : 1,
                                }}
                                onMouseEnter={(e) => { if (!alreadyIn) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = String(selectedStudent) === String(s.id) ? "rgba(201,168,76,0.15)" : "transparent"; }}
                              >
                                <span>{s.name}</span>
                                {alreadyIn && (
                                  <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}>
                                    Already registered
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Program */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Program</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </span>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]/60 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                    >
                      <option key="__placeholder_program" value="" className="bg-slate-900">-- Select Program --</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: "#0f172a" }}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#1a3a7e] to-[#c9a84c] hover:from-[#1e4494] hover:to-[#e2c06a] text-white font-semibold rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-[#c9a84c]/25 hover:shadow-[#c9a84c]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Registering...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Register
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Queue Summary Table */}
          <div>
            <QueueSummary refreshKey={queueRefreshKey} students={students} programs={programs} />
          </div>

        </div>
      </div>
    </div>
  );
}