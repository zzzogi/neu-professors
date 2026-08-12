import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Structured entry types (stored as jsonb arrays on `lecturers`) ───────────

export interface PhdEntry {
  title: string;
  description?: string;
  reference?: string;
}

export interface EducationEntry {
  title: string;
  period?: string;
  description?: string;
  reference?: string;
}

export interface PublicationEntry {
  title: string;
  description?: string;
  doi?: string;
  link?: string;
}

export interface EvaluationEntry {
  content: string;
  source?: string;
}

export interface InfoEntry {
  title: string;
  description?: string;
  reference?: string;
}

/**
 * Khoa — faculties of the university.
 */
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  // Logo shown on the homepage cards and department page (Vercel Blob URL).
  logoUrl: text("logo_url"),
  // Short overview shown on the department detail page.
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Giảng viên — lecturers. The `nameNormalized` column holds a lowercased,
 * diacritic-stripped copy of the name so search is accent-insensitive; it is
 * populated by the app (see app/lib/search.ts) on every write. A pg_trgm GIN
 * index over it powers fast ILIKE '%...%' matching. Richer academic detail is
 * stored in jsonb arrays edited through repeatable admin form sections.
 */
export const lecturers = pgTable(
  "lecturers",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    nameNormalized: varchar("name_normalized", { length: 255 })
      .notNull()
      .default(""),
    // Học hàm / học vị, e.g. "GS.TS", "PGS.TS", "TS", "ThS".
    title: varchar("title", { length: 100 }),
    facultyId: integer("faculty_id").references(() => faculties.id, {
      onDelete: "set null",
    }),
    photoUrl: text("photo_url"),
    researchBackgroundPdfUrl: text("research_background_pdf_url"),

    // Personal
    dateOfBirth: text("date_of_birth"),
    hometown: text("hometown"),
    family: text("family_info"),
    address: text("address"),

    // Contact
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    office: varchar("office", { length: 255 }),

    // Academic detail (free text)
    bio: text("bio"),
    researchInterests: text("research_interests"),
    courses: text("courses"),
    // Chức vụ quản lý tại NEU / quá trình công tác
    managementHistory: text("management_history"),

    // Structured, repeatable sections
    phdSupervision: jsonb("phd_supervision")
      .$type<PhdEntry[]>()
      .notNull()
      .default([]),
    education: jsonb("education").$type<EducationEntry[]>().notNull().default([]),
    publications: jsonb("publications")
      .$type<PublicationEntry[]>()
      .notNull()
      .default([]),
    evaluations: jsonb("evaluations")
      .$type<EvaluationEntry[]>()
      .notNull()
      .default([]),
    additionalInfo: jsonb("additional_info")
      .$type<InfoEntry[]>()
      .notNull()
      .default([]),

    // External links
    website: text("website"),
    googleScholar: text("google_scholar"),
    researchgate: text("researchgate"),
    linkedin: text("linkedin"),
    universityProfileUrl: text("university_profile_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("lecturers_faculty_id_idx").on(t.facultyId),
    index("lecturers_title_idx").on(t.title),
    // GIN trigram index for accent-insensitive substring search.
    index("lecturers_name_normalized_trgm_idx").using(
      "gin",
      t.nameNormalized.op("gin_trgm_ops"),
    ),
  ],
);

/**
 * Ngành — majors, each belonging to a faculty. A faculty has many majors; a
 * lecturer can be associated with several majors (see `lecturerMajors`).
 */
export const majors = pgTable(
  "majors",
  {
    id: serial("id").primaryKey(),
    facultyId: integer("faculty_id")
      .notNull()
      .references(() => faculties.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("majors_faculty_id_idx").on(t.facultyId)],
);

/**
 * Join table for the lecturer ↔ major many-to-many relationship.
 */
export const lecturerMajors = pgTable(
  "lecturer_majors",
  {
    lecturerId: integer("lecturer_id")
      .notNull()
      .references(() => lecturers.id, { onDelete: "cascade" }),
    majorId: integer("major_id")
      .notNull()
      .references(() => majors.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.lecturerId, t.majorId] }),
    index("lecturer_majors_major_id_idx").on(t.majorId),
  ],
);

export const facultiesRelations = relations(faculties, ({ many }) => ({
  lecturers: many(lecturers),
  majors: many(majors),
}));

export const lecturersRelations = relations(lecturers, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [lecturers.facultyId],
    references: [faculties.id],
  }),
  lecturerMajors: many(lecturerMajors),
}));

export const majorsRelations = relations(majors, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [majors.facultyId],
    references: [faculties.id],
  }),
  lecturerMajors: many(lecturerMajors),
}));

export const lecturerMajorsRelations = relations(lecturerMajors, ({ one }) => ({
  lecturer: one(lecturers, {
    fields: [lecturerMajors.lecturerId],
    references: [lecturers.id],
  }),
  major: one(majors, {
    fields: [lecturerMajors.majorId],
    references: [majors.id],
  }),
}));

export type Faculty = typeof faculties.$inferSelect;
export type Lecturer = typeof lecturers.$inferSelect;
export type NewLecturer = typeof lecturers.$inferInsert;
export type Major = typeof majors.$inferSelect;
export type NewMajor = typeof majors.$inferInsert;
