/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PipelineItem` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `PipelineItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PipelineItem` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PipelineItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,job_id]` on the table `PipelineItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `job_id` to the `PipelineItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `PipelineItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `PipelineItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."PipelineItem" DROP CONSTRAINT "PipelineItem_jobId_fkey";

-- DropIndex
DROP INDEX "public"."PipelineItem_userId_column_position_idx";

-- DropIndex
DROP INDEX "public"."PipelineItem_userId_jobId_key";

-- AlterTable
ALTER TABLE "public"."PipelineItem" DROP COLUMN "createdAt",
DROP COLUMN "jobId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "job_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PipelineItem_user_id_column_position_idx" ON "public"."PipelineItem"("user_id", "column", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineItem_user_id_job_id_key" ON "public"."PipelineItem"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "public"."PipelineItem" ADD CONSTRAINT "PipelineItem_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
