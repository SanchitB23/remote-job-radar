-- Add FKs as NOT VALID first to avoid immediate table scan/lock
ALTER TABLE "bookmarks"
  ADD CONSTRAINT "fk_bookmarks_user"
  FOREIGN KEY ("user_id")
  REFERENCES "user_profiles" ("user_id")
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE "pipeline_items"
  ADD CONSTRAINT "fk_pipeline_items_user"
  FOREIGN KEY ("user_id")
  REFERENCES "user_profiles" ("user_id")
  ON DELETE CASCADE
  NOT VALID;

-- Clean up orphaned rows before validating constraints
DELETE FROM "bookmarks"
WHERE "user_id" IS NOT NULL
  AND "user_id" NOT IN (SELECT "user_id" FROM "user_profiles");

DELETE FROM "pipeline_items"
WHERE "user_id" IS NOT NULL
  AND "user_id" NOT IN (SELECT "user_id" FROM "user_profiles");

-- After you have ensured there are no orphan rows:
ALTER TABLE "bookmarks" VALIDATE CONSTRAINT "fk_bookmarks_user";
ALTER TABLE "pipeline_items" VALIDATE CONSTRAINT "fk_pipeline_items_user";