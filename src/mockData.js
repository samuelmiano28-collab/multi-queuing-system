// ─── mockData.js ──────────────────────────────────────────────────────────────
// TESTING ONLY — Delete this file and revert mockDatabase.js imports when done.
// Provides predefined students, programs, and clubs for today's date.

// ─── Programs ─────────────────────────────────────────────────────────────────

export const MOCK_PROGRAMS = [
  { id: 1,  code: "BEED",      name: "Bachelor of Elementary Education" },
  { id: 2,  code: "BPE",       name: "Bachelor of Physical Education" },
  { id: 3,  code: "BSBAFM",    name: "Bachelor of Science in Business Administration - Financial Management" },
  { id: 4,  code: "BSBAHRM",   name: "Bachelor of Science in Business Administration - Human Resource Management" },
  { id: 5,  code: "BSBAMM",    name: "Bachelor of Science in Business Administration - Marketing Management" },
  { id: 6,  code: "BSCPE",     name: "Bachelor of Science in Computer Engineering" },
  { id: 7,  code: "BSCR",      name: "Bachelor of Science in Criminology" },
  { id: 8,  code: "BSED",      name: "Bachelor of Secondary Education" },
  { id: 9,  code: "BSGE",      name: "Bachelor of Science in Geodetic Engineering" },
  { id: 10, code: "BSHM",      name: "Bachelor of Science in Hospitality Management" },
  { id: 11, code: "BSIT",      name: "Bachelor of Science in Information Technology" },
  { id: 12, code: "BSN",       name: "Bachelor of Science in Nursing" },
  { id: 13, code: "BSNED",     name: "Bachelor of Science in Special Needs Education" },
  { id: 14, code: "BSTM",      name: "Bachelor of Science in Tourism Management" },
  { id: 15, code: "BSEDE",     name: "Bachelor of Science in Education - Elementary" },
  { id: 16, code: "BSEDM",     name: "Bachelor of Science in Education - Mathematics" },
];

// ─── Students (today's pictorial schedule) ────────────────────────────────────

export const MOCK_STUDENTS = [
  { id: "2021-00001", name: "DELA CRUZ, Juan",       course: "BSIT" },
  { id: "2021-00002", name: "SANTOS, Maria",          course: "BSN" },
  { id: "2021-00003", name: "REYES, Pedro",           course: "BSCR" },
  { id: "2021-00004", name: "GARCIA, Ana",            course: "BSBAFM" },
  { id: "2021-00005", name: "MENDOZA, Jose",          course: "BSCPE" },
  { id: "2021-00006", name: "TORRES, Luisa",          course: "BSHM" },
  { id: "2021-00007", name: "FLORES, Carlos",         course: "BSBAHRM" },
  { id: "2021-00008", name: "RAMOS, Elena",           course: "BEED" },
  { id: "2021-00009", name: "AQUINO, Miguel",         course: "BSTM" },
  { id: "2021-00010", name: "CASTILLO, Sofia",        course: "BSED" },
  { id: "2021-00011", name: "VILLANUEVA, Ramon",      course: "BSGE" },
  { id: "2021-00012", name: "CRUZ, Isabella",         course: "BSBAMM" },
  { id: "2021-00013", name: "MARTINEZ, Diego",        course: "BSIT" },
  { id: "2021-00014", name: "HERNANDEZ, Camila",      course: "BSN" },
  { id: "2021-00015", name: "LOPEZ, Andres",          course: "BSCPE" },
  { id: "2021-00016", name: "GONZALES, Patricia",     course: "BSHM" },
  { id: "2021-00017", name: "RIVERA, Marco",          course: "BSCR" },
  { id: "2021-00018", name: "DIAZ, Angela",           course: "BEED" },
  { id: "2021-00019", name: "PEREZ, Luis",            course: "BSBAHRM" },
  { id: "2021-00020", name: "MORALES, Kristina",      course: "BSTM" },
  { id: "2021-00021", name: "ROMERO, Francis",        course: "BSEDM" },
  { id: "2021-00022", name: "ALVARADO, Cynthia",      course: "BSEDE" },
  { id: "2021-00023", name: "NAVARRO, Jerome",        course: "BSIT" },
  { id: "2021-00024", name: "GUEVARRA, Stephanie",    course: "BSN" },
  { id: "2021-00025", name: "BAUTISTA, Kenneth",      course: "BSBAFM" },
  { id: "2021-00026", name: "SALAZAR, Maricel",       course: "BSCR" },
  { id: "2021-00027", name: "PASCUAL, Eduardo",       course: "BPE" },
  { id: "2021-00028", name: "AGUILAR, Rosario",       course: "BSNED" },
  { id: "2021-00029", name: "SANTIAGO, Renaldo",      course: "BSGE" },
  { id: "2021-00030", name: "FERNANDEZ, Lourdes",     course: "BSHM" },
  { id: "2021-00031", name: "DELA ROSA, Bernard",     course: "BSCPE" },
  { id: "2021-00032", name: "MAGNO, Clarissa",        course: "BSBAMM" },
  { id: "2021-00033", name: "VELASCO, Arnel",         course: "BSIT" },
  { id: "2021-00034", name: "LIM, Josephine",         course: "BSN" },
  { id: "2021-00035", name: "ONG, Raymond",           course: "BSBAHRM" },
  { id: "2021-00036", name: "TAN, Veronica",          course: "BEED" },
  { id: "2021-00037", name: "SY, Christopher",        course: "BSTM" },
  { id: "2021-00038", name: "CO, Maribel",            course: "BSEDM" },
  { id: "2021-00039", name: "CHUA, Jonathan",         course: "BSCR" },
  { id: "2021-00040", name: "GO, Annabelle",          course: "BSEDE" },
];

// ─── Clubs Schedule (April 30) ────────────────────────────────────────────────

export const MOCK_CLUBS = [
  { time_slot: "7:00 AM - 8:00 AM",   organization_name: "Supreme Student Council",                    president: "Juan dela Cruz",    moderator: "Prof. Santos" },
  { time_slot: "7:00 AM - 8:00 AM",   organization_name: "College of Engineering Student Council",     president: "Maria Reyes",       moderator: "Prof. Garcia" },
  { time_slot: "8:00 AM - 9:00 AM",   organization_name: "College of Nursing Student Council",         president: "Pedro Santos",      moderator: "Prof. Torres" },
  { time_slot: "8:00 AM - 9:00 AM",   organization_name: "College of Business Student Council",        president: "Ana Lopez",         moderator: "Prof. Flores" },
  { time_slot: "9:00 AM - 10:00 AM",  organization_name: "Junior Philippine Institute of Accountants", president: "Carlos Mendoza",    moderator: "Prof. Ramos" },
  { time_slot: "9:00 AM - 10:00 AM",  organization_name: "Computer Science Society",                   president: "Sofia Cruz",        moderator: "Prof. Aquino" },
  { time_slot: "10:00 AM - 11:00 AM", organization_name: "Criminology Society",                        president: "Miguel Castillo",   moderator: "Prof. Rivera" },
  { time_slot: "10:00 AM - 11:00 AM", organization_name: "Hospitality Management Club",               president: "Elena Villanueva",  moderator: "Prof. Diaz" },
  { time_slot: "11:00 AM - 12:00 PM", organization_name: "Tourism Management Society",                 president: "Ramon Martinez",    moderator: "Prof. Perez" },
  { time_slot: "11:00 AM - 12:00 PM", organization_name: "Geodetic Engineering Society",              president: "Isabella Hernandez", moderator: "Prof. Morales" },
  { time_slot: "1:00 PM - 2:00 PM",   organization_name: "Education Students Association",             president: "Diego Gonzales",    moderator: "Prof. Romero" },
  { time_slot: "1:00 PM - 2:00 PM",   organization_name: "Special Needs Education Club",              president: "Camila Rivera",     moderator: "Prof. Alvarado" },
  { time_slot: "2:00 PM - 3:00 PM",   organization_name: "Information Technology Society",            president: "Andres Lopez",      moderator: "Prof. Navarro" },
  { time_slot: "2:00 PM - 3:00 PM",   organization_name: "Nursing Students Association",              president: "Patricia Diaz",     moderator: "Prof. Guevarra" },
  { time_slot: "3:00 PM - 4:00 PM",   organization_name: "Physical Education Club",                   president: "Marco Perez",       moderator: "Prof. Bautista" },
];