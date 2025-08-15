-- CreateTable
CREATE TABLE "public"."PipelineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineItem_userId_column_position_idx" ON "public"."PipelineItem"("userId", "column", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineItem_userId_jobId_key" ON "public"."PipelineItem"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "public"."PipelineItem" ADD CONSTRAINT "PipelineItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
