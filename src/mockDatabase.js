// ─── mockDatabase.js ──────────────────────────────────────────────────────────
// Live database layer for the Multi-Queuing System.
// Students and programs are fetched from Supabase.
// Queue and activity log are kept in-memory per session.

import { supabase } from "./lib/supabase";
import { MOCK_STUDENTS, MOCK_PROGRAMS } from "./mockData";

export async function getStudents() {
  return MOCK_STUDENTS;
}

export async function getPrograms() {
  return MOCK_PROGRAMS;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

let _queue      = [];
let _activities = [];
const _counters = { Glam: 0, OJT: 0, Toga: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _pad(n)  { return String(n).padStart(3, "0"); }
function _now()   { return new Date().toISOString(); }

function _todayDate() {
  // Returns "YYYY-MM-DD" in local time
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Students ─────────────────────────────────────────────────────────────────

/**
 * Returns students scheduled for TODAY only (from pictorial_schedule).
 * The Registration dropdown will only show students whose pictorial date is today.
 * @returns {Promise<Array<{ id: string, name: string, course: string }>>}
 */


// ─── Programs ─────────────────────────────────────────────────────────────────

/**
 * Returns all programs from mqs_programs table.
 * @returns {Promise<Array<{ id: number, code: string, name: string }>>}
 */


// ─── Queue ────────────────────────────────────────────────────────────────────

/**
 * Returns the current in-memory queue.
 * @param {string} [serviceType] - "Glam" | "OJT" | "Toga"
 * @returns {Promise<Array>}
 */
export async function getQueue(serviceType) {
  if (serviceType) {
    return _queue.filter((e) => e.service_type === serviceType);
  }
  return [..._queue];
}

/**
 * Adds a new entry to the queue.
 */
export async function addToQueue({
  studentId,
  studentName,
  programId,
  programCode,
  programName,
  registeredBy,
  priorityNumber,
}) {
  const entry = {
    id:              `Q-${Date.now()}`,
    priority_number: priorityNumber,
    priorityNumber,
    student_id:      studentId,
    student_name:    studentName,
    studentName,
    program_id:      programId,
    program:         `${programCode} — ${programName}`,
    programCode,
    programName,
    registered_by:   registeredBy || "Staff",
    status:          "Registered",
    registered_at:   _now(),
    remarks:         "",
  };

  _queue.push(entry);
  return { ...entry };
}

/**
 * Updates the status of a queue entry by priority number.
 */
export async function updateQueueEntryStatus(priorityNumber, newStatus) {
  const idx = _queue.findIndex(
    (e) => e.priority_number === priorityNumber || e.priorityNumber === priorityNumber
  );
  if (idx === -1) return null;

  _queue[idx] = { ..._queue[idx], status: newStatus, updated_at: _now() };
  return { ..._queue[idx] };
}

/**
 * Removes an entry from the queue entirely.
 */
export async function removeFromQueue(priorityNumber) {
  const before = _queue.length;
  _queue = _queue.filter(
    (e) => e.priority_number !== priorityNumber && e.priorityNumber !== priorityNumber
  );
  return _queue.length < before;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

/**
 * Logs an activity entry to in-memory log.
 */
export async function logActivity(userId, username, action, module, details) {
  const activity = {
    id:        _activities.length + 1,
    user_id:   userId,
    username:  username || "Unknown",
    action:    action   || "Action",
    module:    module   || "System",
    details:   details  || "",
    timestamp: _now(),
  };
  _activities.unshift(activity);
  return { ...activity };
}

/**
 * Returns the activity log, optionally filtered by userId.
 */
export async function getActivities(userId) {
  if (userId !== undefined && userId !== null) {
    return _activities.filter((a) => String(a.user_id) === String(userId));
  }
  return [..._activities];
}

// ─── Default export ───────────────────────────────────────────────────────────

export default {
  getStudents,
  getPrograms,
  getQueue,
  addToQueue,
  updateQueueEntryStatus,
  removeFromQueue,
  logActivity,
  getActivities,
};