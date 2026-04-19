import { useState, useEffect } from "react";
import { getStudents, getPrograms, addToQueue, getQueue } from "./mockDatabase";

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

function getDailyCount() {
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem("mqs_daily_count") || "{}");
  if (stored.date !== today) {
    const reset = { date: today, count: 0 };
    localStorage.setItem("mqs_daily_count", JSON.stringify(reset));
    return 0;
  }
  return stored.count;
}

function incrementDailyCount() {
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyCount();
  const next = current + 1;
  localStorage.setItem("mqs_daily_count", JSON.stringify({ date: today, count: next }));
  return next;
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ entry, onClose }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-close after 1 second
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
        {/* Checkmark icon */}
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

  // Reload when a new registration happens
  useEffect(() => {
    const loadQueue = async () => {
      const queueData = await getQueue();
      setQueue(queueData);
    };
    loadQueue();
  }, [refreshKey]);

  // Poll every 2 s so status changes from Glam/OJT/Toga reflect here live
  useEffect(() => {
    const interval = setInterval(async () => {
      const queueData = await getQueue();
      setQueue(queueData);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveEdit = async (updated) => {
    const newQueue = queue.map((e) => (e.priority_number === updated.priority_number ? updated : e));
    setQueue(newQueue);
    setEditEntry(null);
  };

  if (queue.length === 0) return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#475569" }}>
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p style={{ fontSize: 13 }}>No queue entries yet</p>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" fill="none" stroke="#e2c06a" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Current Queue</span>
        <span style={{
          background: "rgba(34,211,238,0.15)", color: "#e2c06a",
          borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 700,
        }}>{queue.length}</span>
      </div>

      {/* Fixed-height scrollable table container */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16, overflow: "hidden",
        display: "flex", flexDirection: "column",
        height: 340, overflowX: "auto", // fixed height
      }}>
        {/* Sticky header */}
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

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
          className="custom-scroll"
        >
          <style>{`
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.35); border-radius: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.65); }
            @media (min-width: 480px) { .xs\:block { display: block !important; } }
            @media (max-width: 640px) {
              .reg-table th:nth-child(4), .reg-table td:nth-child(4) { display: none; }
              .reg-table th:nth-child(5), .reg-table td:nth-child(5) { display: none; }
            }
          `}</style>
          <table className="reg-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <tbody>
              {queue.map((entry, i) => (
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
                      background: "rgba(234,179,8,0.1)", color: "#fbbf24",
                      border: "1px solid rgba(234,179,8,0.25)",
                      fontSize: 10, fontWeight: 600,
                    }}>
                      {entry.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => setEditEntry(entry)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 7,
                        background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.25)",
                        color: "#7dd3fc", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,179,237,0.22)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,179,237,0.1)"; }}
                    >
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
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

  const nextSequence = getDailyCount() + 1;
  const previewPriority = generatePriorityNumber(nextSequence);

  useEffect(() => {
    const loadData = async () => {
      const studentsData = await getStudents();
      const programsData = await getPrograms();
      setStudents(studentsData);
      // Remove entries with numeric-only codes (e.g. "4") and deduplicate by code
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

  // When a student is selected, auto-select their program based on course code
  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    if (!studentId) { setSelectedProgram(""); return; }
    const student = students.find((s) => String(s.id) === String(studentId));
    if (student?.course) {
      const matchedProgram = programs.find((p) => p.code === student.course);
      if (matchedProgram) setSelectedProgram(String(matchedProgram.id));
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
      // Compare as strings to avoid int/string mismatch from getStudents()
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

      const sequence = incrementDailyCount();
      const priorityNumber = generatePriorityNumber(sequence);
      const entry = await addToQueue({
        studentName:      student.name,
        programCode:      program.code,
        programName:      program.name,
        priorityNumber,          // formatted label "W17-Su-001"
        prioritySequence: sequence, // raw integer for DB
      });
      setLoading(false);
      setSuccess(entry);
      setQueueRefreshKey((k) => k + 1);
      setSelectedStudent("");
      setSelectedProgram("");
    } catch (err) {
      console.error("Error adding to queue:", err);
      setError("Failed to add to queue. Please try again.");
      setLoading(false);
    }
  };

  const navPages = ["Registration", "Glam", "OJT", "Toga"];

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

      {/* Success Modal */}
      {success && (
        <SuccessModal entry={success} onClose={() => setSuccess(null)} />
      )}

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Row 1: Logo + Avatar */}
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
        {/* Row 2: Nav Links */}
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
          {/* Hamburger Menu for Mobile */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {/* Mobile Menu */}
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#e2c06a] text-xs font-semibold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-[#e2c06a] animate-pulse inline-block" />
            Student Registration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Queue Registration</h1>
          <p className="text-slate-400 mt-1">Register a student and assign a priority number for {activePage === "Registration" ? "Glam Studio" : activePage}.</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* LEFT — Registration Form */}
          <div>
            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* Form Card */}
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

                {/* Student Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <select
                      value={selectedStudent}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-[#c9a84c]/60 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                    >
                      <option key="__placeholder_student" value="" className="bg-slate-900">-- Select Student --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
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
                        <option key={p.id} value={p.id} className="bg-slate-900">{p.code} — {p.name}</option>
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