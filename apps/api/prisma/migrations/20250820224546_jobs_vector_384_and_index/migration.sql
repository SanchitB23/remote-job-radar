-- AlterTable
ALTER TABLE
    "public"."user_profiles"
ALTER COLUMN
    "updated_at" DROP DEFAULT,
ALTER COLUMN
    "updated_at"
SET
    DATA TYPE TIMESTAMP(3);

-- Ensure jobs.vector is the same dimension as your embedder (384)
ALTER TABLE
    "jobs"
ALTER COLUMN
    "vector" TYPE vector(384);

-- Create an ANN index for cosine similarity (tune lists later if needed)
CREATE INDEX IF NOT EXISTS "idx_jobs_vector" ON "jobs" USING ivfflat ("vector" vector_cosine_ops) WITH (lists = 100);

-- Help the planner
ANALYZE "jobs";