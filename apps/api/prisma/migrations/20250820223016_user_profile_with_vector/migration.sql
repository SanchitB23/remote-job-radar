-- Enable pgvector once (safe if it already exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user profiles table (snake_case, plural, matches @@map)
CREATE TABLE IF NOT EXISTS public."user_profiles" (
    "user_id" TEXT NOT NULL,
    "skills" TEXT [] DEFAULT ARRAY [] :: TEXT [],
    "skill_vector" vector(384),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey (NOT VALID, then validate)
ALTER TABLE
    "public"."bookmarks"
ADD
    CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

ALTER TABLE
    "public"."pipeline_items"
ADD
    CONSTRAINT "pipeline_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

-- Validate constraints after creation
ALTER TABLE "public"."bookmarks" VALIDATE CONSTRAINT "bookmarks_user_id_fkey";
ALTER TABLE "public"."pipeline_items" VALIDATE CONSTRAINT "pipeline_items_user_id_fkey";
