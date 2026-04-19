import { useState, useEffect } from "react";
import { getActivities, logActivity } from "./mockDatabase";

export default function Profile({ user, onBack, onLogout, onGlamSubmit, onTogaSubmit, onOJTSubmit }) {
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [filters, setFilters] = useState({
    action: "all",
    page: "all",
  });

  useEffect(() => {
    if (user?.id) {
      const loadActivities = async () => {
        const logs = await getActivities(user.id, filters);
        setActivities(logs);
      };
      loadActivities();
    }
  }, [user, filters]);

  useEffect(() => {
    if (user?.id) {
      const loadAllActivities = async () => {
        const allLogs = await getActivities(user.id, {});
        setAllActivities(allLogs);
      };
      loadAllActivities();
    }
  }, [user]);

  const handleFilterChange = (key, value) => {
    logActivity(user?.id, user?.username, "Filter Applied", "Profile", `Filtered by ${key}: ${value}`);
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    logActivity(user?.id, user?.username, "Filter Reset", "Profile", "Cleared all activity filters");
    setFilters({
      action: "all",
      page: "all",
    });
  };

  const uniqueActions = Array.from(new Set([
    "Login",
    "Logout",
    "Registration",
    "Status Update",
    "Remarks",
    "Filter Applied",
    "Filter Reset",
    "Page Visit",
    ...allActivities.map((log) => log.action)
  ])).sort();

  const uniquePages = Array.from(new Set([
    "Registration",
    "Glam",
    "OJT",
    "Toga",
    "Profile",
    "Login",
    ...allActivities.map((log) => log.page)
  ])).sort();

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      "Login": "bg-blue-500/20 text-[#e2c06a]",
      "Registration": "bg-green-500/20 text-green-300",
      "Status Update": "bg-purple-500/20 text-purple-300",
      "Remarks": "bg-orange-500/20 text-orange-300",
      "Page Visit": "bg-cyan-500/20 text-cyan-300",
      "Logout": "bg-red-500/20 text-red-300",
    };
    return colors[action] || "bg-slate-500/20 text-slate-300";
  };

  // ─── Nav Link ──────────────────────────────────────────────────────────────────
  function NavLink({ label, active, onClick }) {
    return (
      <button
        onClick={onClick}
        style={{
          background: active ? "rgba(201,168,76,0.15)" : "none",
          border: active ? "1px solid rgba(201,168,76,0.35)" : "1px solid transparent",
          borderRadius: 8, padding: "4px 8px",
          color: active ? "#e2c06a" : "#94a3b8",
          fontSize: 13, fontWeight: active ? 600 : 500,
          cursor: "pointer", transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#cbd5e1"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "none"; } }}
      >
        {label}
      </button>
    );
  }

  // ─── User Menu ─────────────────────────────────────────────────────────────────
  function AvatarMenu({ user, onLogout }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => logActivity(user?.id, user?.username, "Page Visit", "Profile", "Viewed Profile")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#cbd5e1", fontSize: 12, fontWeight: 500, cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          title="Profile"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
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
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04081a] via-[#0b1230] to-[#04081a] relative overflow-hidden">
      <style>{`
        .activity-table::-webkit-scrollbar { width: 6px; }
        .activity-table::-webkit-scrollbar-track { background: transparent; }
        .activity-table::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 3px; }
        .activity-table::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.7); }
        
        select { background-color: rgba(15, 23, 42, 0.8); }
        select option { background-color: #0f172a; color: #e2e8f0; }
        select option:checked { background: linear-gradient(#3b82f6, #3b82f6); color: #fff; }
      `}</style>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1a2f6e] opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#c9a84c] opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1a2f6e] opacity-10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a2f6e] to-[#c9a84c] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="hidden xs:block text-white font-bold tracking-tight text-sm whitespace-nowrap">Ad Astra Queuing System</span>
          </div>

          {/* Nav Pages */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
            {["Registration", "Glam", "OJT", "Toga"].map((page) => (
              <NavLink
                key={page}
                label={page}
                active={false}
                onClick={() => {
                  if (page === "Registration") {
                    onBack();
                  } else if (page === "Glam") {
                    onGlamSubmit();
                  } else if (page === "OJT") {
                    onOJTSubmit();
                  } else if (page === "Toga") {
                    onTogaSubmit();
                  }
                }}
              />
            ))}
          </div>

          {/* Right side: Avatar Menu */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <AvatarMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #64748b 0%, #475569 100%)",
              }}
            >
              <span className="text-white font-bold text-2xl">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </span>
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-white text-2xl font-bold">{user?.name}</h2>
              <p className="text-slate-400 text-sm mt-1">
                @{user?.username} • {user?.role}
              </p>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Total Activities</span>
                  <p className="text-slate-200 font-semibold text-lg">
                    {allActivities.length}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">First Activity</span>
                  <p className="text-slate-200 font-semibold text-lg">
                    {allActivities.length > 0
                      ? new Date(allActivities[allActivities.length - 1].timestamp).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Section Header */}
          <div className="px-8 py-6 border-b border-white/10">
            <h3 className="text-white text-xl font-bold">Activity Logs</h3>
            <p className="text-slate-400 text-sm mt-1">
              Track all your actions across the system
            </p>
          </div>

          {/* Filters */}
          <div className="px-8 py-6 border-b border-white/10 bg-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action Filter */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => {
                    const newAction = e.target.value;
                    logActivity(user?.id, user?.username, "Filter Applied", "Profile", `Filtered by Action: ${newAction}`);
                    handleFilterChange("action", newAction);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-white text-sm focus:outline-none focus:border-[#c9a84c]/60 focus:bg-slate-900 transition-colors relative z-20 appearance-none cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Filter */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Page
                </label>
                <select
                  value={filters.page}
                  onChange={(e) => {
                    const newPage = e.target.value;
                    logActivity(user?.id, user?.username, "Filter Applied", "Profile", `Filtered by Page: ${newPage}`);
                    handleFilterChange("page", newPage);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-white text-sm focus:outline-none focus:border-[#c9a84c]/60 focus:bg-slate-900 transition-colors relative z-20 appearance-none cursor-pointer"
                >
                  <option value="all">All Pages</option>
                  {uniquePages.map((page) => (
                    <option key={page} value={page}>
                      {page}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 rounded-lg bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto activity-table">
            {activities.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-slate-400 text-sm">No activities found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5 sticky top-0">
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activities.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {log.page}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {log.details || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary */}
          <div className="px-8 py-4 border-t border-white/10 bg-white/5">
            <p className="text-slate-400 text-sm">
              Showing {activities.length} of {allActivities.length} total activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}