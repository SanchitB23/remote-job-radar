/*
  Warnings:

  - You are about to drop the `PipelineItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PipelineItem" DROP CONSTRAINT "PipelineItem_job_id_fkey";

-- DropTable
DROP TABLE "public"."PipelineItem";

-- CreateTable
CREATE TABLE "public"."pipeline_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_items_user_id_column_position_idx" ON "public"."pipeline_items"("user_id", "column", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_items_user_id_job_id_key" ON "public"."pipeline_items"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "public"."pipeline_items" ADD CONSTRAINT "pipeline_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
