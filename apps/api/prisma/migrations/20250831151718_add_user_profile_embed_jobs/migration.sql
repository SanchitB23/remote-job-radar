-- DropForeignKey
ALTER TABLE "public"."bookmarks" DROP CONSTRAINT "fk_bookmarks_user";

-- DropForeignKey
ALTER TABLE "public"."pipeline_items" DROP CONSTRAINT "fk_pipeline_items_user";

-- DropIndex
DROP INDEX "public"."idx_jobs_vector";

-- DropIndex
DROP INDEX "public"."idx_user_profiles_updated_at";

-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."user_profile_embed_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skills" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_embed_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_embed_jobs_user_id_key" ON "public"."user_profile_embed_jobs"("user_id");

-- CreateIndex
CREATE INDEX "user_profile_embed_jobs_status_next_run_at_idx" ON "public"."user_profile_embed_jobs"("status", "next_run_at");
