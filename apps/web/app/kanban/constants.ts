// Updated workflow stages for job application pipeline
export const KANBAN_COLUMNS = [
  "interested",
  "applied",
  "phone_screen",
  "technical",
  "final_interview",
  "offer",
  "rejected",
] as const;

// Column display names for better UX
export const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  interested: "Interested",
  applied: "Applied",
  phone_screen: "Phone/Initial Screen",
  technical: "Technical Interview",
  final_interview: "Final Interview",
  offer: "Offer",
  rejected: "Rejected",
};

// Column colors for visual distinction
export const COLUMN_COLORS: Record<string, string> = {
  interested: "bg-blue-50 border-blue-200",
  applied: "bg-yellow-50 border-yellow-200",
  phone_screen: "bg-purple-50 border-purple-200",
  technical: "bg-orange-50 border-orange-200",
  final_interview: "bg-green-50 border-green-200",
  offer: "bg-emerald-50 border-emerald-200",
  rejected: "bg-gray-50 border-gray-200",
};
