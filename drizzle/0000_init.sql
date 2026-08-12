CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faculties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lecturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"name_normalized" varchar(255) DEFAULT '' NOT NULL,
	"title" varchar(100),
	"faculty_id" integer,
	"photo_url" text,
	"research_background_pdf_url" text,
	"date_of_birth" text,
	"hometown" text,
	"family_info" text,
	"address" text,
	"email" varchar(255),
	"phone" varchar(50),
	"office" varchar(255),
	"bio" text,
	"research_interests" text,
	"courses" text,
	"management_history" text,
	"phd_supervision" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"education" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"publications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evaluations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"additional_info" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website" text,
	"google_scholar" text,
	"researchgate" text,
	"linkedin" text,
	"university_profile_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lecturers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lecturers_faculty_id_idx" ON "lecturers" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "lecturers_title_idx" ON "lecturers" USING btree ("title");--> statement-breakpoint
CREATE INDEX "lecturers_name_normalized_trgm_idx" ON "lecturers" USING gin ("name_normalized" gin_trgm_ops);