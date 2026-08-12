import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import {
  faculties,
  lecturerMajors,
  lecturers,
  majors,
  type Faculty,
  type Lecturer,
} from "@/app/lib/db/schema";

export async function getAllFaculties(): Promise<Faculty[]> {
  return db.select().from(faculties).orderBy(asc(faculties.name));
}

export interface MajorWithFaculty {
  id: number;
  name: string;
  slug: string;
  facultyId: number;
  facultyName: string;
}

export async function getAllMajors(): Promise<MajorWithFaculty[]> {
  return db
    .select({
      id: majors.id,
      name: majors.name,
      slug: majors.slug,
      facultyId: majors.facultyId,
      facultyName: faculties.name,
    })
    .from(majors)
    .innerJoin(faculties, eq(majors.facultyId, faculties.id))
    .orderBy(asc(faculties.name), asc(majors.name));
}

/** Ids of the majors a lecturer is associated with (for the edit form). */
export async function getLecturerMajorIds(
  lecturerId: number,
): Promise<number[]> {
  const rows = await db
    .select({ majorId: lecturerMajors.majorId })
    .from(lecturerMajors)
    .where(eq(lecturerMajors.lecturerId, lecturerId));
  return rows.map((r) => r.majorId);
}

export async function getFacultyBySlug(
  slug: string,
): Promise<Faculty | undefined> {
  const rows = await db
    .select()
    .from(faculties)
    .where(eq(faculties.slug, slug))
    .limit(1);
  return rows[0];
}

export interface LecturerMajor {
  name: string;
  slug: string;
}

export interface LecturerWithRelations extends Lecturer {
  facultyName: string | null;
  facultySlug: string | null;
  majors: LecturerMajor[];
}

export async function getLecturerBySlug(
  slug: string,
): Promise<LecturerWithRelations | undefined> {
  const rows = await db
    .select({
      lecturer: lecturers,
      facultyName: faculties.name,
      facultySlug: faculties.slug,
    })
    .from(lecturers)
    .leftJoin(faculties, eq(lecturers.facultyId, faculties.id))
    .where(eq(lecturers.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;

  const majorRows = await db
    .select({ name: majors.name, slug: majors.slug })
    .from(lecturerMajors)
    .innerJoin(majors, eq(lecturerMajors.majorId, majors.id))
    .where(eq(lecturerMajors.lecturerId, row.lecturer.id))
    .orderBy(asc(majors.name));

  return {
    ...row.lecturer,
    facultyName: row.facultyName,
    facultySlug: row.facultySlug,
    majors: majorRows,
  };
}

export async function getLecturerById(
  id: number,
): Promise<Lecturer | undefined> {
  const rows = await db
    .select()
    .from(lecturers)
    .where(eq(lecturers.id, id))
    .limit(1);
  return rows[0];
}

export interface FacultyLecturer {
  id: number;
  slug: string;
  fullName: string;
  title: string | null;
  photoUrl: string | null;
}

export async function getLecturersByFaculty(
  facultyId: number,
): Promise<FacultyLecturer[]> {
  return db
    .select({
      id: lecturers.id,
      slug: lecturers.slug,
      fullName: lecturers.fullName,
      title: lecturers.title,
      photoUrl: lecturers.photoUrl,
    })
    .from(lecturers)
    .where(eq(lecturers.facultyId, facultyId))
    .orderBy(asc(lecturers.fullName));
}
