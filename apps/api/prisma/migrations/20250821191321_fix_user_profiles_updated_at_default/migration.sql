-- Ensure column is timestamptz, not null, with default now()
ALTER TABLE "user_profiles"
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" SET DEFAULT now(),
  ALTER COLUMN "updated_at" SET NOT NULL;