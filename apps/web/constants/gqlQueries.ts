export const JOBS_QUERY = `#graphql
  query($minFit: Float, $first: Int, $search: String, $minSalary: Int, $location: String, $sources: [JobSource!], $sortBy: String, $after: String) {
    jobs(minFit: $minFit, first: $first, search: $search, minSalary: $minSalary, location: $location, sources: $sources, sortBy: $sortBy, after: $after) {
      edges {
        id
        title
        company
        location
        salaryMin
        salaryMax
        fitScore
        url
        publishedAt
        bookmarked
        source
        isTracked
      }
      endCursor
      hasNextPage
    }
  }
`;

export const BOOKMARK_MUTATION = `#graphql
  mutation($id: ID!) {
    bookmark(id: $id)
  }
`;

export const PIPELINE_QUERY = `#graphql
  query {
    pipeline {
      id
      column
      position
      job {
        id
        title
        company
        url
      }
    }
  }
`;

export const PIPELINE_UPSERT_MUTATION = `#graphql
  mutation($jobId: ID!, $column: String!, $position: Int!) {
    pipelineUpsert(jobId: $jobId, column: $column, position: $position)
  }
`;

// Subscription query for new jobs
export const NEW_JOB_SUBSCRIPTION = `#graphql
  subscription NewJob($minFit: Float) {
    newJob(minFit: $minFit) {
      id
      title
      company
      url
      fitScore
    }
  }
`;
