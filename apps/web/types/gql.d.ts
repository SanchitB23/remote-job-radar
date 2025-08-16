export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  workType?: string;
  salaryMin?: number;
  salaryMax?: number;
  fitScore: number;
  url: string;
  publishedAt: string;
  bookmarked: boolean;
  source: string;
  isTracked?: boolean; // Whether the job is in the user's pipeline
}

export interface PipelineItem {
  id: string;
  column: string;
  position: number;
  job: Job;
}

export interface JobsConnection {
  edges: Job[];
  endCursor?: string;
  hasNextPage: boolean;
}

export interface FetchJobsParams {
  minFit?: number;
  first?: number;
  search?: string;
  minSalary?: number;
  location?: string;
  workType?: string;
  sources?: string[];
  sortBy?: string;
  after?: string;
  bookmarked?: boolean | null; // true = only bookmarked, false = only unbookmarked, null = all
  isTracked?: boolean | null; // true = only tracked, false = only untracked, null = all
}

export interface FilterMetadata {
  fitScore: {
    min: number;
    max: number;
  };
  salary: {
    min: number;
    max: number;
  };
  sources: string[];
  locations: string[];
  workTypes: string[];
}
