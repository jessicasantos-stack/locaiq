export const C = {
  bg: "#050a14", bgCard: "#0d1829", bgHover: "#111f38",
  border: "#1e3a5f", blue: "#3b82f6", cyan: "#06b6d4",
  text: "#e2e8f0", textMuted: "#64748b", textDim: "#94a3b8",
  green: "#10b981", yellow: "#f59e0b", red: "#ef4444",
  purple: "#8b5cf6", orange: "#f97316",
  accent: "#3b82f6", subtle: "#0d1829", panel: "#0d1829", muted: "#64748b",
};

export const sc = s => s >= 80 ? C.green : s >= 50 ? C.yellow : C.red;

export const tagColors = {
  "Top Client": C.yellow, "Active": C.green, "Needs Work": C.orange,
  "Urgent": C.red, "High Performer": C.cyan, "Agency": C.purple,
};
