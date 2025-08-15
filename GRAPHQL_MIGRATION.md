# GraphQL to Next.js API Routes Migration

This document summarizes the migration from direct GraphQL calls to Next.js API routes.

## Changes Made

### 1. New API Routes Created

#### `/app/api/jobs/route.ts`

- **Method**: GET
- **Purpose**: Fetch jobs with filtering and pagination
- **Parameters**: All FetchJobsParams via query parameters
- **Authentication**: Server-side using Clerk auth
- **Returns**: JobsConnection object

#### `/app/api/bookmarks/route.ts`

- **Method**: POST
- **Purpose**: Toggle bookmark status for a job
- **Body**: `{ jobId: string }`
- **Authentication**: Server-side using Clerk auth
- **Returns**: `{ bookmark: boolean }`

#### `/app/api/pipeline/route.ts`

- **Methods**: GET, POST
- **GET Purpose**: Fetch user's pipeline data
- **POST Purpose**: Add/update pipeline items
- **POST Body**: `{ jobId: string, column: string, position: number }`
- **Authentication**: Server-side using Clerk auth
- **Returns**: PipelineItem[] (GET) or { pipelineUpsert: boolean } (POST)

### 2. New API Client Functions

Created `/lib/api-client.ts` with these functions:

- `fetchJobsApi(params: FetchJobsParams)` - Replaces direct GraphQL job fetching
- `toggleBookmarkApi(jobId: string)` - Replaces direct GraphQL bookmark mutation
- `fetchPipelineApi()` - Replaces direct GraphQL pipeline fetching
- `upsertPipelineItemApi(jobId, column, position)` - Replaces direct GraphQL pipeline mutation

### 3. Updated React Hooks

Modified `/lib/hooks.ts` to use the new API client functions:

- `useInfiniteJobs()` - Now calls `fetchJobsApi()` instead of GraphQL
- `useBookmarkMutation()` - Now calls `toggleBookmarkApi()` instead of GraphQL
- `usePipeline()` - Now calls `fetchPipelineApi()` instead of GraphQL
- `usePipelineUpsertMutation()` - Now calls `upsertPipelineItemApi()` instead of GraphQL

## Benefits of This Migration

### 1. **Security & Authentication**

- Authentication tokens are now handled server-side
- No client-side exposure of GraphQL endpoints
- Centralized authentication logic in API routes

### 2. **Better Error Handling**

- Standardized error responses across all API routes
- Better error logging on the server side
- Cleaner error messages for the frontend

### 3. **Performance**

- Reduced client bundle size (no direct GraphQL client dependencies needed in components)
- Better caching control at the API route level
- Server-side parameter validation

### 4. **Maintainability**

- Clear separation between frontend and backend concerns
- Easier to add middleware, validation, or rate limiting
- Type safety between API routes and client code

### 5. **Scalability**

- API routes can be easily extended with additional logic
- Better suited for future API versioning
- Easier to add monitoring and analytics

## Files That Can Now Be Removed

The following files are no longer needed (but keep them temporarily for reference):

- `/lib/gqlClient.client.ts` - Direct GraphQL client functions
- `/lib/gqlClient.ssr.ts` - Server-side GraphQL client (if not used elsewhere)

## Migration Verification

### Components That Were Updated Automatically

- All React components using the hooks continue to work without changes
- `JobsPageClient.tsx` - Uses `useInfiniteJobs()` and `useBookmarkMutation()`
- `BookmarkButton.tsx` - Uses `useBookmarkMutation()`
- `AddToPipelineButton.tsx` - Uses `usePipelineUpsertMutation()`
- `kanban/page.tsx` - Uses `usePipeline()` and `usePipelineUpsertMutation()`

### What Stayed the Same

- All React component interfaces remain unchanged
- GraphQL queries and mutations are still used (but called from API routes)
- The `shared-gql.ts` file with GraphQL operations is still used by API routes
- All TypeScript interfaces and types remain the same

## Testing Checklist

To verify the migration is working correctly:

1. **Jobs Page**:
   - [ ] Jobs load correctly with filters
   - [ ] Infinite scroll pagination works
   - [ ] Bookmark toggle functionality works
   - [ ] Add to Pipeline button works

2. **Kanban Page**:
   - [ ] Pipeline data loads correctly
   - [ ] Drag and drop functionality works
   - [ ] Items move between columns correctly

3. **Authentication**:
   - [ ] All operations work when logged in
   - [ ] Proper error handling when not authenticated

4. **Error Handling**:
   - [ ] Network errors are handled gracefully
   - [ ] Server errors show appropriate messages

## Future Enhancements

With this new architecture, you can easily add:

1. **Rate Limiting**: Add rate limiting middleware to API routes
2. **Caching**: Implement Redis or other caching strategies
3. **Analytics**: Add logging and monitoring to API routes
4. **Validation**: Add request/response validation schemas
5. **API Versioning**: Create versioned API routes (/api/v1/, /api/v2/)
6. **Middleware**: Add authentication, logging, or other middleware
