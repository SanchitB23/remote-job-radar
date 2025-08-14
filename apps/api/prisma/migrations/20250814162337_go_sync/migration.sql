/*
  Warnings:

  - You are about to drop the `Bookmark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Bookmark" DROP CONSTRAINT "Bookmark_jobId_fkey";

-- DropTable
DROP TABLE "public"."Bookmark";

-- DropTable
DROP TABLE "public"."Job";

-- CreateTable
CREATE TABLE "public"."job" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "vector" vector,
    "fit_score" DOUBLE PRECISION,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookmark" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookmark_user_id_idx" ON "public"."bookmark"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmark_user_id_job_id_key" ON "public"."bookmark"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "public"."bookmark" ADD CONSTRAINT "bookmark_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
