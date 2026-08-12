import "server-only";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { faculties, lecturerMajors, lecturers } from "@/app/lib/db/schema";
import { normalizeVietnamese } from "@/app/lib/text";

export { normalizeVietnamese };

export const PAGE_SIZE = 12;

export interface LecturerSearchParams {
  q?: string;
  facultyId?: number;
  majorId?: number;
  title?: string;
  page?: number;
}

export interface LecturerListItem {
  id: number;
  slug: string;
  fullName: string;
  title: string | null;
  photoUrl: string | null;
  facultyName: string | null;
}

/**
 * Search lecturers by (accent-insensitive) name plus optional faculty and
 * title filters. Returns a page of results and the total count.
 */
export async function searchLecturers(
  params: LecturerSearchParams,
): Promise<{ items: LecturerListItem[]; total: number; page: number }> {
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];
  if (params.q && params.q.trim()) {
    const needle = `%${normalizeVietnamese(params.q)}%`;
    conditions.push(ilike(lecturers.nameNormalized, needle));
  }
  if (params.facultyId) {
    conditions.push(eq(lecturers.facultyId, params.facultyId));
  }
  if (params.majorId) {
    // Match lecturers linked to this major via the join table, without a join
    // that would duplicate rows and break pagination/count.
    conditions.push(
      inArray(
        lecturers.id,
        db
          .select({ id: lecturerMajors.lecturerId })
          .from(lecturerMajors)
          .where(eq(lecturerMajors.majorId, params.majorId)),
      ),
    );
  }
  if (params.title && params.title.trim()) {
    conditions.push(eq(lecturers.title, params.title));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: lecturers.id,
        slug: lecturers.slug,
        fullName: lecturers.fullName,
        title: lecturers.title,
        photoUrl: lecturers.photoUrl,
        facultyName: faculties.name,
      })
      .from(lecturers)
      .leftJoin(faculties, eq(lecturers.facultyId, faculties.id))
      .where(where)
      .orderBy(desc(lecturers.updatedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(lecturers)
      .where(where),
  ]);

  return { items: rows, total: countRows[0]?.count ?? 0, page };
}

export interface LecturerSuggestion {
  slug: string;
  fullName: string;
  title: string | null;
  photoUrl: string | null;
}

/**
 * Lightweight typeahead lookup for the search box: up to 8 lecturers whose
 * (accent-insensitive) name matches the prefix/substring. Returns [] for blank
 * input. Reuses the trigram index over `nameNormalized`.
 */
export async function suggestLecturers(
  q: string,
): Promise<LecturerSuggestion[]> {
  const needle = normalizeVietnamese(q ?? "");
  if (!needle) return [];
  return db
    .select({
      slug: lecturers.slug,
      fullName: lecturers.fullName,
      title: lecturers.title,
      photoUrl: lecturers.photoUrl,
    })
    .from(lecturers)
    .where(ilike(lecturers.nameNormalized, `%${needle}%`))
    .orderBy(lecturers.fullName)
    .limit(8);
}

/** Distinct titles currently in use, for the title filter dropdown. */
export async function getDistinctTitles(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ title: lecturers.title })
    .from(lecturers)
    .where(sql`${lecturers.title} is not null and ${lecturers.title} <> ''`)
    .orderBy(lecturers.title);
  return rows.map((r) => r.title).filter((t): t is string => Boolean(t));
}
