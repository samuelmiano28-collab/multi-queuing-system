// ─── mockDatabase.js ──────────────────────────────────────────────────────────
// Live database layer — all data persisted in Supabase so every account
// and every device sees the same queue and activity log in real time.

import { supabase } from "./lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _todayDate() {
  const d    = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Normalises a raw mqs_queue row into the shape the UI expects.
 *
 * DB schema:
 *   priority_number  integer   — raw sequence counter (1, 2, 3 …)
 *   priority_label   text      — formatted label "W17-Su-001"  (add this column)
 *   student_name     varchar
 *   program          varchar   — stored as "CODE — Full Name"
 *   status           varchar
 *   remarks          text
 */
function _normaliseQueueRow(row) {
  const parts       = (row.program || "").split(" — ");
  const programCode = parts[0]?.trim() || "";
  const programName = parts.slice(1).join(" — ").trim() || "";
  const priorityLabel = row.priority_label || String(row.priority_number);

  return {
    // snake_case (DB-style)
    id:              row.id,
    priority_number: priorityLabel,
    student_name:    row.student_name,
    program:         row.program || "",
    programCode,
    programName,
    status:          row.status,
    remarks:         row.remarks || "",
    timestamp:       row.timestamp || row.created_at,

    // camelCase aliases used throughout the UI
    priorityNumber:  priorityLabel,
    studentName:     row.student_name,
  };
}

/**
 * Normalises a raw mqs_activities row.
 * DB column is "page" — exposed as both `page` and `module`.
 */
function _normaliseActivityRow(row) {
  return {
    id:        row.id,
    user_id:   row.user_id,
    username:  row.username,
    action:    row.action,
    page:      row.page,
    module:    row.page,
    details:   row.details || "",
    timestamp: row.timestamp || row.created_at,
  };
}

// ─── Students ─────────────────────────────────────────────────────────────────

/**
 * Returns students scheduled for TODAY from pictorial_schedule.
 * Shape: { id, name, course }
 */
export async function getStudents() {
  const today = _todayDate();

  const { data, error } = await supabase
    .from("pictorial_schedule")
    .select("id, last_name, first_name, middle_initial, course, student_id")
    .eq("schedule_date", today)
    .order("last_name", { ascending: true });

  if (error) {
    console.error("getStudents error:", error.message);
    return [];
  }

  return (data || []).map((s) => ({
    id:     s.id,
    name:   [s.last_name, s.first_name, s.middle_initial]
              .filter(Boolean)
              .join(", ")
              .replace(/,\s*$/, ""),
    course: s.course || "",
  }));
}

// ─── Programs ─────────────────────────────────────────────────────────────────

/**
 * Returns all programs from mqs_programs.
 * Shape: { id, code, name }
 */
export async function getPrograms() {
  const { data, error } = await supabase
    .from("mqs_programs")
    .select("id, code, name")
    .order("code", { ascending: true });

  if (error) {
    console.error("getPrograms error:", error.message);
    return [];
  }

  return data || [];
}

// ─── Queue ────────────────────────────────────────────────────────────────────

/**
 * Returns the full queue from Supabase, ordered by priority number.
 * All pages poll this every 2 s so they always see each other's changes.
 */
export async function getQueue() {
  const { data, error } = await supabase
    .from("mqs_queue")
    .select("*")
    .order("priority_number", { ascending: true });

  if (error) {
    console.error("getQueue error:", error.message);
    return [];
  }

  return (data || []).map(_normaliseQueueRow);
}

/**
 * Adds a new entry to mqs_queue.
 *
 * priorityNumber   — formatted label string, e.g. "W17-Su-001"
 * prioritySequence — raw integer for the priority_number column
 *
 * IMPORTANT: Run this once in Supabase SQL editor to add the label column
 * if it doesn't exist yet:
 *
 *   ALTER TABLE mqs_queue ADD COLUMN IF NOT EXISTS priority_label text;
 */
export async function addToQueue({
  studentName,
  programCode,
  programName,
  priorityNumber,    // formatted string "W17-Su-001"
  prioritySequence,  // integer sequence number
}) {
  const programString =
    programCode && programName
      ? `${programCode} — ${programName}`
      : programCode || programName || "";

  const { data, error } = await supabase
    .from("mqs_queue")
    .insert({
      priority_number: prioritySequence,
      priority_label:  priorityNumber,
      student_name:    studentName,
      program:         programString,
      status:          "Registered",
      remarks:         "",
    })
    .select()
    .single();

  if (error) {
    console.error("addToQueue error:", error.message);
    throw error;
  }

  return _normaliseQueueRow(data);
}

/**
 * Updates the status (and optionally remarks) of a queue entry.
 * Looks up by priority_label first, then falls back to integer priority_number.
 */
export async function updateQueueEntryStatus(priorityNumber, newStatus, remarks) {
  const updatePayload = { status: newStatus };
  if (remarks !== undefined) updatePayload.remarks = remarks;

  // Try text label match first
  let { data, error } = await supabase
    .from("mqs_queue")
    .update(updatePayload)
    .eq("priority_label", String(priorityNumber))
    .select()
    .single();

  // Fall back to integer match
  if (!data) {
    const asInt = parseInt(priorityNumber, 10);
    if (!isNaN(asInt)) {
      ({ data, error } = await supabase
        .from("mqs_queue")
        .update(updatePayload)
        .eq("priority_number", asInt)
        .select()
        .single());
    }
  }

  if (error) {
    console.error("updateQueueEntryStatus error:", error.message);
    return null;
  }

  return data ? _normaliseQueueRow(data) : null;
}

/**
 * Removes a queue entry entirely.
 */
export async function removeFromQueue(priorityNumber) {
  let { error } = await supabase
    .from("mqs_queue")
    .delete()
    .eq("priority_label", String(priorityNumber));

  if (error) {
    const asInt = parseInt(priorityNumber, 10);
    if (!isNaN(asInt)) {
      ({ error } = await supabase
        .from("mqs_queue")
        .delete()
        .eq("priority_number", asInt));
    }
  }

  if (error) {
    console.error("removeFromQueue error:", error.message);
    return false;
  }
  return true;
}

/**
 * Clears ALL entries from mqs_queue.
 * Fetches all IDs first then deletes by ID array — works even with RLS policies
 * that block blanket deletes.
 */
export async function clearQueue() {
  const { data, error: fetchError } = await supabase
    .from("mqs_queue")
    .select("id");

  if (fetchError) {
    console.error("clearQueue fetch error:", fetchError.message);
    return false;
  }

  if (!data || data.length === 0) return true;

  const ids = data.map((row) => row.id);

  const { error: deleteError } = await supabase
    .from("mqs_queue")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("clearQueue delete error:", deleteError.message);
    return false;
  }

  return true;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

/**
 * Inserts an activity log entry into mqs_activities.
 * Note: the DB column is "page" (matches the schema), not "module".
 */
export async function logActivity(userId, username, action, module, details) {
  const { data, error } = await supabase
    .from("mqs_activities")
    .insert({
      user_id:  userId,
      username: username || "Unknown",
      action:   action   || "Action",
      page:     module   || "System",
      details:  details  || "",
    })
    .select()
    .single();

  if (error) {
    console.error("logActivity error:", error.message);
    return null;
  }

  return _normaliseActivityRow(data);
}

/**
 * Returns activity logs for a user, with optional { action, page } filters.
 */
export async function getActivities(userId, filters = {}) {
  let query = supabase
    .from("mqs_activities")
    .select("*")
    .order("timestamp", { ascending: false });

  if (userId !== undefined && userId !== null) {
    query = query.eq("user_id", userId);
  }

  if (filters?.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }

  if (filters?.page && filters.page !== "all") {
    query = query.eq("page", filters.page);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getActivities error:", error.message);
    return [];
  }

  return (data || []).map(_normaliseActivityRow);
}

// ─── Default export ───────────────────────────────────────────────────────────

export default {
  getStudents,
  getPrograms,
  getQueue,
  addToQueue,
  updateQueueEntryStatus,
  removeFromQueue,
  clearQueue,
  logActivity,
  getActivities,
};