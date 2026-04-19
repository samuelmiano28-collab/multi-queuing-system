/**
 * useSchedule.js — React hooks for querying pictorial schedule data from Supabase
 *
 * This integrates with the pictorial_schedule table containing data from sched.xlsx
 * for Week 1 (April 20-25, 2026) and Week 2 (April 27-29, 2026) schedules.
 *
 * SETUP:
 *   Place this file in: src/hooks/useSchedule.js
 *   Make sure you have a supabaseClient set up, e.g. src/lib/supabase.js:
 *
 *     import { createClient } from '@supabase/supabase-js'
 *     export const supabase = createClient(
 *       import.meta.env.VITE_SUPABASE_URL,
 *       import.meta.env.VITE_SUPABASE_ANON_KEY
 *     )
 *
 * USAGE EXAMPLES:
 *   const { data, loading, error } = useScheduleByDate('2026-04-20')
 *   const { data, loading, error } = useScheduleByStudent('20222135')
 *   const { data, loading, error } = useScheduleByCourse('BSN')
 *   const { data, loading, error } = useScheduleSearch('abal')
 *   const { data, loading, error } = useScheduleDates()
 *   const { data, loading, error } = useClubsSchedule()
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // adjust path as needed

// ── Generic fetch hook ─────────────────────────────────────────────────────

function useFetch(queryFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    queryFn()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setData(data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Get all students scheduled on a specific date.
 * @param {string} date - Format: 'YYYY-MM-DD', e.g. '2026-04-20'
 */
export function useScheduleByDate(date) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("schedule_date", date)
        .order("schedule_time")
        .order("no"),
    [date]
  );
}

/**
 * Get the schedule entry for a specific student ID.
 * @param {string} studentId - e.g. '20222135'
 */
export function useScheduleByStudent(studentId) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("student_id", studentId),
    [studentId]
  );
}

/**
 * Get all schedule entries for a specific course.
 * @param {string} course - e.g. 'BSN', 'BSCR', 'BSBA-SP'
 */
export function useScheduleByCourse(course) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("course", course)
        .order("schedule_date")
        .order("schedule_time"),
    [course]
  );
}

/**
 * Search students by last name (case-insensitive partial match).
 * @param {string} search - e.g. 'aba'
 */
export function useScheduleSearch(search) {
  return useFetch(
    () => {
      if (!search || search.trim().length < 2) {
        return Promise.resolve({ data: [], error: null });
      }
      return supabase
        .from("pictorial_schedule")
        .select("*")
        .ilike("last_name", `%${search.trim()}%`)
        .order("schedule_date")
        .order("last_name")
        .limit(50);
    },
    [search]
  );
}

/**
 * Get all available schedule dates (Week 1 and Week 2).
 */
export function useScheduleDates() {
  return useFetch(() =>
    supabase
      .from("pictorial_schedule")
      .select("schedule_date")
      .order("schedule_date")
  );
}

/**
 * Get the full clubs & organizations schedule (April 30, 2026).
 */
export function useClubsSchedule() {
  return useFetch(() =>
    supabase
      .from("clubs_schedule")
      .select("*")
      .order("time_slot")
  );
}

/**
 * Get schedule statistics for dashboard
 */
export function useScheduleStats() {
  return useFetch(() =>
    supabase
      .rpc('get_schedule_stats')
      .then(result => {
        if (result.error) {
          // Fallback if RPC doesn't exist
          return supabase
            .from("pictorial_schedule")
            .select("schedule_date, course, count")
            .then(({ data, error }) => {
              if (error) return { data: [], error };
              return { data, error: null };
            });
        }
        return result;
      })
  );
}/**
 * useSchedule.js — React hooks for querying pictorial schedule data
 *
 * SETUP:
 *   Place this file in: src/hooks/useSchedule.js
 *   Make sure you have a supabaseClient set up, e.g. src/lib/supabase.js:
 *
 *     import { createClient } from '@supabase/supabase-js'
 *     export const supabase = createClient(
 *       import.meta.env.VITE_SUPABASE_URL,
 *       import.meta.env.VITE_SUPABASE_ANON_KEY
 *     )
 *
 * USAGE EXAMPLES:
 *   const { data, loading, error } = useScheduleByDate('2026-04-20')
 *   const { data, loading, error } = useScheduleByStudent('20222135')
 *   const { data, loading, error } = useScheduleByCourse('BSN')
 *   const { data, loading, error } = useClubsSchedule()
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // adjust path as needed

// ── Generic fetch hook ─────────────────────────────────────────────────────

function useFetch(queryFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    queryFn()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setData(data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Get all students scheduled on a specific date.
 * @param {string} date - Format: 'YYYY-MM-DD', e.g. '2026-04-20'
 */
export function useScheduleByDate(date) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("schedule_date", date)
        .order("schedule_time")
        .order("no"),
    [date]
  );
}

/**
 * Get the schedule entry for a specific student ID.
 * @param {string} studentId - e.g. '20222135'
 */
export function useScheduleByStudent(studentId) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("student_id", studentId),
    [studentId]
  );
}

/**
 * Get all schedule entries for a specific course.
 * @param {string} course - e.g. 'BSN', 'BSCR', 'BSBA-SP'
 */
export function useScheduleByCourse(course) {
  return useFetch(
    () =>
      supabase
        .from("pictorial_schedule")
        .select("*")
        .eq("course", course)
        .order("schedule_date")
        .order("schedule_time"),
    [course]
  );
}

/**
 * Search students by last name (case-insensitive partial match).
 * @param {string} search - e.g. 'aba'
 */
export function useScheduleSearch(search) {
  return useFetch(
    () => {
      if (!search || search.trim().length < 2) {
        return Promise.resolve({ data: [], error: null });
      }
      return supabase
        .from("pictorial_schedule")
        .select("*")
        .ilike("last_name", `%${search.trim()}%`)
        .order("schedule_date")
        .order("last_name")
        .limit(50);
    },
    [search]
  );
}

/**
 * Get all available schedule dates.
 */
export function useScheduleDates() {
  return useFetch(() =>
    supabase
      .from("pictorial_schedule")
      .select("schedule_date")
      .order("schedule_date")
  );
}

/**
 * Get the full clubs & organizations schedule (April 30, 2026).
 */
export function useClubsSchedule() {
  return useFetch(() =>
    supabase
      .from("clubs_schedule")
      .select("*")
      .order("time_slot")
  );
}