export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
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
  sources?: string[];
  sortBy?: string;
  after?: string;
}
