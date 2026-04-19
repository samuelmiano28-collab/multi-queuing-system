/**
 * seed.js — One-time seed for Supabase
 *
 * Seeds:
 *   1. pictorial_schedule  — all daily student schedules from sched.xlsx
 *   2. clubs_schedule      — clubs & organizations (April 30)
 *   3. mqs_programs        — all 27 program codes
 *
 * SETUP:
 *   1. Place this file + sched.xlsx at your React project root
 *   2. npm install @supabase/supabase-js xlsx dotenv
 *   3. Your .env should have:
 *        VITE_SUPABASE_URL=https://your-project.supabase.co
 *        VITE_SUPABASE_ANON_KEY=your-anon-key
 *   4. node seed.js
 *
 *   Safe to re-run — uses upsert (no duplicates).
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load .env file — override: true ensures values are always picked up
dotenv.config({ override: true });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || process.env.SUPABASE_URL;

const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY
  || process.env.REACT_APP_SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  console.error("   Make sure your .env file contains:");
  console.error("     VITE_SUPABASE_URL=https://fqqncqurwzdearaxpjog.supabase.co");
  console.error("     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcW5jcXVyd3pkZWFyYXhwam9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDU4ODYsImV4cCI6MjA5MjAyMTg4Nn0.4wNkZpllbQ_EE6IivrqedX0d0RmArjeYUYeO5V2C_0Q");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH  = "./sched.xlsx";
const BATCH_SIZE = 100;

// ── Programs master list ───────────────────────────────────────────────────────

const PROGRAMS = [
  { id: 1,  code: "BEED",      name: "Bachelor of Elementary Education" },
  { id: 2,  code: "BEED-EC",   name: "Bachelor of Elementary Education - Early Childhood" },
  { id: 3,  code: "BEED-SP",   name: "Bachelor of Elementary Education - Special Education" },
  { id: 4,  code: "BPE",       name: "Bachelor of Physical Education" },
  { id: 5,  code: "BPE-SP",    name: "Bachelor of Physical Education - Special Program" },
  { id: 6,  code: "BSBA-EC",   name: "Bachelor of Science in Business Administration - Economics" },
  { id: 7,  code: "BSBA-SP",   name: "Bachelor of Science in Business Administration - Special Program" },
  { id: 8,  code: "BSBAFM",    name: "Bachelor of Science in Business Administration - Financial Management" },
  { id: 9,  code: "BSBAHRM",   name: "Bachelor of Science in Business Administration - Human Resource Management" },
  { id: 10, code: "BSBAMM",    name: "Bachelor of Science in Business Administration - Marketing Management" },
  { id: 11, code: "BSBAMM-EC", name: "Bachelor of Science in Business Administration - Marketing Management (Economics)" },
  { id: 12, code: "BSCPE",     name: "Bachelor of Science in Computer Engineering" },
  { id: 13, code: "BSCR",      name: "Bachelor of Science in Criminology" },
  { id: 14, code: "BSED",      name: "Bachelor of Secondary Education" },
  { id: 15, code: "BSEDE",     name: "Bachelor of Science in Education - Elementary" },
  { id: 16, code: "BSEDE-EC",  name: "Bachelor of Science in Education - Elementary (Early Childhood)" },
  { id: 17, code: "BSEDE-SP",  name: "Bachelor of Science in Education - Elementary (Special Program)" },
  { id: 18, code: "BSEDM",     name: "Bachelor of Science in Education - Mathematics" },
  { id: 19, code: "BSEDM-SP",  name: "Bachelor of Science in Education - Mathematics (Special Program)" },
  { id: 20, code: "BSGE",      name: "Bachelor of Science in Geodetic Engineering" },
  { id: 21, code: "BSHM",      name: "Bachelor of Science in Hospitality Management" },
  { id: 22, code: "BSIT",      name: "Bachelor of Science in Information Technology" },
  { id: 23, code: "BSIT-SP",   name: "Bachelor of Science in Information Technology - Special Program" },
  { id: 24, code: "BSN",       name: "Bachelor of Science in Nursing" },
  { id: 25, code: "BSNED",     name: "Bachelor of Science in Special Needs Education" },
  { id: 26, code: "BSNED-SP",  name: "Bachelor of Science in Special Needs Education - Special Program" },
  { id: 27, code: "BSTM",      name: "Bachelor of Science in Tourism Management" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function sheetToRows(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

function forwardFill(arr) {
  let last = null;
  return arr.map((v) => {
    if (v !== null && v !== undefined && String(v).trim() !== "") last = v;
    return last;
  });
}

function clean(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).replace(/\.0$/, "").trim();
  return s === "" || s === "NaN" ? null : s;
}

async function upsertBatches(table, rows, conflictCols) {
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflictCols, ignoreDuplicates: false });
    if (error) {
      console.error(`\n❌ Batch error (${table}):`, error.message);
      process.exit(1);
    }
    done += batch.length;
    process.stdout.write(`\r   ${done}/${rows.length} rows`);
  }
  console.log();
}

// ── Parse daily student sheets ─────────────────────────────────────────────────

function parseDailySheets(workbook) {
  const sheets = [
    "04-20-26", "04-21-26", "04-22-26", "04-23-26",
    "04-24-26", "04-25-26", "04-27-26", "04-28-26", "04-29-26",
  ];

  const allRows = [];

  for (const sheet of sheets) {
    const raw          = sheetToRows(workbook, sheet);
    const [mm, dd]     = sheet.split("-");
    const scheduleDate = `2026-${mm}-${dd}`;
    const filledTimes  = forwardFill(raw.map((r) => r[8]));

    let count = 0, skipped = 0;

    for (let i = 0; i < raw.length; i++) {
      const r         = raw[i];
      const lastName  = clean(r[1]);
      const studentId = clean(r[4]);

      if (!lastName && !studentId) { skipped++; continue; }

      allRows.push({
        schedule_date:  scheduleDate,
        no:             r[0] ? parseInt(r[0]) || null : null,
        last_name:      lastName,
        first_name:     clean(r[2]),
        middle_initial: clean(r[3]),
        student_id:     studentId,
        sex:            clean(r[5]),
        year_level:     r[6] ? parseInt(r[6]) || null : null,
        course:         clean(r[7]),
        schedule_time:  filledTimes[i] ? String(filledTimes[i]).trim() : null,
      });
      count++;
    }
    console.log(`  ✅ ${sheet}: ${count} students  (${skipped} blank rows skipped)`);
  }
  return allRows;
}

// ── Parse clubs sheet ──────────────────────────────────────────────────────────

function parseClubsSheet(workbook) {
  const raw  = sheetToRows(workbook, "04-30-26");
  const rows = [];

  for (let i = 2; i < raw.length; i++) {
    const r        = raw[i];
    const timeSlot = r[0] ? String(r[0]).trim() : "";
    if (!timeSlot.match(/AM|PM/)) continue;

    rows.push({
      schedule_date:     "2026-04-30",
      time_slot:         timeSlot,
      organization_name: r[1] ? String(r[1]).replace(/\n/g, " ").trim().slice(0, 100) : null,
      president:         r[2] ? String(r[2]).replace(/\n/g, " ").trim().slice(0, 100) : null,
      moderator:         r[3] ? String(r[3]).replace(/\n/g, " ").trim().slice(0, 100) : null,
    });
  }
  return rows;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📂 Reading sched.xlsx...\n");
  const workbook = XLSX.read(readFileSync(FILE_PATH), { type: "buffer" });

  // 1. Seed pictorial_schedule
  console.log("📅 Parsing daily student schedules...");
  const studentRows = parseDailySheets(workbook);
  console.log(`\n🚀 Upserting ${studentRows.length} rows → pictorial_schedule...`);
  await upsertBatches("pictorial_schedule", studentRows, "schedule_date,student_id");

  // 2. Seed clubs_schedule
  console.log("\n🏛️  Parsing clubs & organizations...");
  const clubRows = parseClubsSheet(workbook);
  console.log(`🚀 Upserting ${clubRows.length} rows → clubs_schedule...`);
  await upsertBatches("clubs_schedule", clubRows, "schedule_date,time_slot");

  // 3. Seed mqs_programs — truncate first to remove any old/duplicate rows
  console.log("\n📚 Clearing old programs from mqs_programs...");
  const { error: truncateError } = await supabase.rpc("truncate_mqs_programs");
  if (truncateError) {
    // Fallback: delete all rows manually if RPC not available
    const { error: deleteError } = await supabase
      .from("mqs_programs")
      .delete()
      .gte("id", 0);
    if (deleteError) {
      console.warn("   ⚠️  Could not clear mqs_programs:", deleteError.message);
      console.warn("   Continuing with upsert — old duplicates may remain.");
      console.warn("   To fully clean up, run in Supabase SQL editor:");
      console.warn("     TRUNCATE TABLE mqs_programs RESTART IDENTITY;");
    } else {
      console.log("   ✅ Cleared existing programs.");
    }
  } else {
    console.log("   ✅ Cleared existing programs.");
  }

  console.log(`📚 Upserting ${PROGRAMS.length} programs → mqs_programs...`);
  await upsertBatches("mqs_programs", PROGRAMS, "id");

  console.log("\n✅ All done!");
  console.log(`   • pictorial_schedule : ${studentRows.length} rows`);
  console.log(`   • clubs_schedule     : ${clubRows.length} rows`);
  console.log(`   • mqs_programs       : ${PROGRAMS.length} rows`);
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err.message);
  process.exit(1);
});