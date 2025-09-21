import type { JSX } from "react";

import JobListingComponent from "@/components/smoothui/ui/JobListingComponent";
import type { Job } from "@/types/gql";

import { CompanyLogo } from "./CompanyLogo";

interface JobCardProps {
  job: Job;
}

function formatSalary(salaryMin?: number, salaryMax?: number): string {
  if (!salaryMin && !salaryMax) return "Salary not specified";

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (salaryMin && salaryMax) {
    return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)}`;
  }
  if (salaryMin) {
    return `${formatAmount(salaryMin)}+`;
  }
  if (salaryMax) {
    return `Up to ${formatAmount(salaryMax)}`;
  }
  return "Salary not specified";
}

function determineRemoteStatus(workType?: string, location?: string): string {
  if (!workType && !location) return "No";
  if (workType?.toLowerCase().includes("remote") || location?.toLowerCase().includes("remote")) {
    return "Yes";
  }
  if (workType?.toLowerCase().includes("hybrid")) {
    return "Hybrid";
  }
  return "No";
}

function formatJobTime(workType?: string): string {
  if (!workType) return "Not specified";

  const normalized = workType.toLowerCase();
  if (normalized.includes("full")) return "Full-time";
  if (normalized.includes("part")) return "Part-time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("freelance")) return "Freelance";
  if (normalized.includes("intern")) return "Internship";

  return workType; // Return as-is if no match
}

// Convert our Job type to SmoothUI Job format
function convertToSmoothUIJob(job: Job) {
  return {
    company: job.company,
    title: job.title,
    logo: <CompanyLogo company={job.company} size="md" />,
    job_description:
      job.description ||
      `Join ${job.company} as a ${job.title}. This is an exciting opportunity to work with a great team and make an impact.`,
    salary: formatSalary(job.salaryMin, job.salaryMax),
    location: job.location || "Location not specified",
    remote: determineRemoteStatus(job.workType, job.location),
    job_time: formatJobTime(job.workType),
  };
}

export function JobCard({ job }: JobCardProps): JSX.Element {
  const smoothUIJob = convertToSmoothUIJob(job);

  return (
    <JobListingComponent
      jobs={[smoothUIJob]}
      onJobClick={() => {
        // Open the job in a new tab when clicked
        window.open(job.url, "_blank", "noopener");
      }}
    />
  );
}
