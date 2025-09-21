// Updated workflow stages for job application pipeline (4 columns)
export const KANBAN_COLUMNS = ["interested", "applied", "interviewing", "closed"] as const;

// Column display names for better UX
export const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  closed: "Closed",
};

// Column colors for visual distinction
export const COLUMN_COLORS: Record<string, string> = {
  interested: "bg-blue-50 border-blue-200",
  applied: "bg-yellow-50 border-yellow-200",
  interviewing: "bg-purple-50 border-purple-200",
  closed: "bg-gray-50 border-gray-200",
};
