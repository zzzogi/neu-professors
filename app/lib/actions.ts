"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/app/lib/db";
import {
  faculties,
  lecturerMajors,
  lecturers,
  majors,
} from "@/app/lib/db/schema";
import { verifySession } from "@/app/lib/dal";
import { uploadFacultyLogo, uploadPdf, uploadPhoto } from "@/app/lib/blob";
import { normalizeVietnamese, slugify } from "@/app/lib/text";
import {
  EducationEntrySchema,
  EvaluationEntrySchema,
  FacultySchema,
  InfoEntrySchema,
  LecturerSchema,
  MajorSchema,
  PhdEntrySchema,
  PublicationEntrySchema,
  formToObject,
  parseEntries,
} from "@/app/lib/validation";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

/** Ensure a unique slug within `lecturers`, optionally excluding one row. */
async function uniqueLecturerSlug(
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = slugify(base) || "giang-vien";
  let candidate = root;
  let n = 1;
  while (true) {
    const rows = await db
      .select({ id: lecturers.id })
      .from(lecturers)
      .where(
        excludeId
          ? and(eq(lecturers.slug, candidate), ne(lecturers.id, excludeId))
          : eq(lecturers.slug, candidate),
      )
      .limit(1);
    if (rows.length === 0) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/** Parse the selected major ids from the checkbox group. */
function parseMajorIds(formData: FormData): number[] {
  const ids = formData
    .getAll("majors")
    .map((v) => parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(ids));
}

/** Replace a lecturer's major links with the given set. */
async function syncLecturerMajors(
  lecturerId: number,
  majorIds: number[],
): Promise<void> {
  await db
    .delete(lecturerMajors)
    .where(eq(lecturerMajors.lecturerId, lecturerId));
  if (majorIds.length > 0) {
    await db
      .insert(lecturerMajors)
      .values(majorIds.map((majorId) => ({ lecturerId, majorId })));
  }
}

/** Parse the five repeatable jsonb sections from their hidden JSON inputs. */
function parseSections(formData: FormData) {
  return {
    phdSupervision: parseEntries(
      formData.get("phdSupervision"),
      PhdEntrySchema,
      "title",
    ),
    education: parseEntries(
      formData.get("education"),
      EducationEntrySchema,
      "title",
    ),
    publications: parseEntries(
      formData.get("publications"),
      PublicationEntrySchema,
      "title",
    ),
    evaluations: parseEntries(
      formData.get("evaluations"),
      EvaluationEntrySchema,
      "content",
    ),
    additionalInfo: parseEntries(
      formData.get("additionalInfo"),
      InfoEntrySchema,
      "title",
    ),
  };
}

// ── Lecturers ──────────────────────────────────────────────────────────────

export async function createLecturer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifySession();

  const parsed = LecturerSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  let photoUrl: string | null = null;
  let pdfUrl: string | null = null;
  try {
    photoUrl = await uploadPhoto(formData.get("photo") as File | null, data.fullName);
    pdfUrl = await uploadPdf(formData.get("researchPdf") as File | null, data.fullName);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi tải tệp." };
  }

  const slug = await uniqueLecturerSlug(data.fullName);

  const inserted = await db
    .insert(lecturers)
    .values({
      ...data,
      slug,
      nameNormalized: normalizeVietnamese(data.fullName),
      photoUrl,
      researchBackgroundPdfUrl: pdfUrl,
      ...parseSections(formData),
    })
    .returning({ id: lecturers.id });

  await syncLecturerMajors(inserted[0].id, parseMajorIds(formData));

  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  redirect("/admin/giang-vien");
}

export async function updateLecturer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifySession();

  const id = parseInt(String(formData.get("id")), 10);
  if (!Number.isFinite(id)) return { error: "Không tìm thấy giảng viên." };

  const parsed = LecturerSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await db
    .select({
      slug: lecturers.slug,
      photoUrl: lecturers.photoUrl,
      researchBackgroundPdfUrl: lecturers.researchBackgroundPdfUrl,
    })
    .from(lecturers)
    .where(eq(lecturers.id, id))
    .limit(1);
  if (existing.length === 0) return { error: "Không tìm thấy giảng viên." };

  let photoUrl = existing[0].photoUrl;
  let pdfUrl = existing[0].researchBackgroundPdfUrl;
  try {
    const uploadedPhoto = await uploadPhoto(
      formData.get("photo") as File | null,
      data.fullName,
    );
    if (uploadedPhoto) photoUrl = uploadedPhoto;
    const uploadedPdf = await uploadPdf(
      formData.get("researchPdf") as File | null,
      data.fullName,
    );
    if (uploadedPdf) pdfUrl = uploadedPdf;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi tải tệp." };
  }

  await db
    .update(lecturers)
    .set({
      ...data,
      nameNormalized: normalizeVietnamese(data.fullName),
      photoUrl,
      researchBackgroundPdfUrl: pdfUrl,
      ...parseSections(formData),
      updatedAt: new Date(),
    })
    .where(eq(lecturers.id, id));

  await syncLecturerMajors(id, parseMajorIds(formData));

  revalidatePath("/admin/giang-vien");
  revalidatePath(`/giang-vien/${existing[0].slug}`);
  revalidatePath("/");
  redirect("/admin/giang-vien");
}

export async function deleteLecturer(formData: FormData): Promise<void> {
  await verifySession();
  const id = parseInt(String(formData.get("id")), 10);
  if (Number.isFinite(id)) {
    await db.delete(lecturers).where(eq(lecturers.id, id));
    revalidatePath("/admin/giang-vien");
    revalidatePath("/");
  }
}

// ── Faculties ────────────────────────────────────────────────────────────────

export async function createFaculty(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifySession();
  const parsed = FacultySchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const name = parsed.data.name;
  await db
    .insert(faculties)
    .values({ name, slug: slugify(name) })
    .onConflictDoNothing({ target: faculties.slug });

  revalidatePath("/admin/khoa");
  return {};
}

export async function updateFaculty(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifySession();

  const id = parseInt(String(formData.get("id")), 10);
  if (!Number.isFinite(id)) return { error: "Không tìm thấy khoa/viện." };

  const parsed = FacultySchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, description } = parsed.data;

  const existing = await db
    .select({ slug: faculties.slug, logoUrl: faculties.logoUrl })
    .from(faculties)
    .where(eq(faculties.id, id))
    .limit(1);
  if (existing.length === 0) return { error: "Không tìm thấy khoa/viện." };

  let logoUrl = existing[0].logoUrl;
  try {
    const uploaded = await uploadFacultyLogo(
      formData.get("logo") as File | null,
      name,
    );
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi tải tệp." };
  }

  await db
    .update(faculties)
    .set({ name, description: description ?? null, logoUrl })
    .where(eq(faculties.id, id));

  revalidatePath("/admin/khoa");
  revalidatePath("/");
  revalidatePath(`/khoa/${existing[0].slug}`);
  return { success: true };
}

export async function deleteFaculty(formData: FormData): Promise<void> {
  await verifySession();
  const id = parseInt(String(formData.get("id")), 10);
  if (Number.isFinite(id)) {
    await db.delete(faculties).where(eq(faculties.id, id));
    revalidatePath("/admin/khoa");
  }
}

// ── Majors (Ngành) ───────────────────────────────────────────────────────────

export async function createMajor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await verifySession();
  const parsed = MajorSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, facultyId } = parsed.data;
  // Scope the slug by faculty so the same major name can exist under different
  // faculties without colliding on the globally-unique slug column.
  const slug = `${slugify(name)}-k${facultyId}`;
  await db
    .insert(majors)
    .values({ name, facultyId, slug })
    .onConflictDoNothing({ target: majors.slug });

  revalidatePath("/admin/khoa");
  return {};
}

export async function deleteMajor(formData: FormData): Promise<void> {
  await verifySession();
  const id = parseInt(String(formData.get("id")), 10);
  if (Number.isFinite(id)) {
    await db.delete(majors).where(eq(majors.id, id));
    revalidatePath("/admin/khoa");
  }
}
