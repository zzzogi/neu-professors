ALTER TABLE "lecturers" ADD COLUMN "other_personal" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lecturers" ADD COLUMN "other_contacts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lecturers" ADD COLUMN "other_links" jsonb DEFAULT '[]'::jsonb NOT NULL;