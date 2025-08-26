export const JOBS_QUERY = /* GraphQL */ `
  query (
    $minFit: Float
    $first: Int
    $search: String
    $minSalary: Int
    $location: String
    $workType: String
    $sources: [JobSource!]
    $sortBy: SortBy
    $after: String
    $bookmarked: Boolean
    $isTracked: Boolean
  ) {
    jobs(
      minFit: $minFit
      first: $first
      search: $search
      minSalary: $minSalary
      location: $location
      workType: $workType
      sources: $sources
      sortBy: $sortBy
      after: $after
      bookmarked: $bookmarked
      isTracked: $isTracked
    ) {
      edges {
        id
        title
        company
        location
        workType
        salaryMin
        salaryMax
        fitScore
        url
        publishedAt
        bookmarked
        source
        isTracked
        description
      }
      endCursor
      hasNextPage
    }
  }
`;

export const BOOKMARK_MUTATION = /* GraphQL */ `
  mutation ($id: ID!) {
    bookmark(id: $id)
  }
`;

export const PIPELINE_QUERY = /* GraphQL */ `
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

export const PIPELINE_UPSERT_MUTATION = /* GraphQL */ `
  mutation ($jobId: ID!, $column: String!, $position: Int!) {
    pipelineUpsert(jobId: $jobId, column: $column, position: $position)
  }
`;

// Subscription query for new jobs
export const NEW_JOB_SUBSCRIPTION = /* GraphQL */ `
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

export const FILTER_METADATA_QUERY = /* GraphQL */ `
  query GetFilterMetadata {
    filterMetadata {
      fitScore {
        min
        max
      }
      salary {
        min
        max
      }
      sources
      locations
      workTypes
    }
  }
`;

export const USER_SKILLS_QUERY = /* GraphQL */ `
  query GetUserSkills {
    meProfile {
      skills
      updatedAt
      userId
    }
  }
`;

export const SET_USER_SKILLS_MUTATION = /* GraphQL */ `
  mutation SetSkills($skills: [String!]!) {
    setSkills(skills: $skills)
  }
`;
