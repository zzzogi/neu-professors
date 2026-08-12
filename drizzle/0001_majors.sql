CREATE TABLE "lecturer_majors" (
	"lecturer_id" integer NOT NULL,
	"major_id" integer NOT NULL,
	CONSTRAINT "lecturer_majors_lecturer_id_major_id_pk" PRIMARY KEY("lecturer_id","major_id")
);
--> statement-breakpoint
CREATE TABLE "majors" (
	"id" serial PRIMARY KEY NOT NULL,
	"faculty_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "majors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "lecturer_majors" ADD CONSTRAINT "lecturer_majors_lecturer_id_lecturers_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_majors" ADD CONSTRAINT "lecturer_majors_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "majors" ADD CONSTRAINT "majors_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lecturer_majors_major_id_idx" ON "lecturer_majors" USING btree ("major_id");--> statement-breakpoint
CREATE INDEX "majors_faculty_id_idx" ON "majors" USING btree ("faculty_id");