import type { JSX } from "react";

import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  company: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-sm",
};

// Extract initials from company name
function getCompanyInitials(company: string): string {
  return company
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate a consistent color based on company name
function getCompanyColor(company: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-red-500",
  ] as const;

  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length] ?? "bg-blue-500";
}

export function CompanyLogo({ company, size = "md", className }: CompanyLogoProps): JSX.Element {
  const initials = getCompanyInitials(company);
  const colorClass = getCompanyColor(company);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg font-semibold text-white shadow-sm border border-white/20",
        colorClass,
        sizeClass,
        className,
      )}
      title={company}
    >
      {initials}
    </div>
  );
}
