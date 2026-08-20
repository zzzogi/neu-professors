import type {
  EducationEntry,
  EvaluationEntry,
  InfoEntry,
  LabeledEntry,
  PhdEntry,
  PublicationEntry,
} from "@/app/lib/db/schema";
import { normalizeVietnamese, slugify } from "@/app/lib/text";

/**
 * Values that drive the lecturer admin form. Shared by the form component and
 * the JSON auto-fill normalizer. Photo/PDF are uploaded as files and are not
 * part of the JSON contract.
 */
export interface LecturerFormValues {
  id?: number;
  fullName?: string;
  title?: string | null;
  facultyId?: number | null;
  majorIds?: number[];
  photoUrl?: string | null;
  researchBackgroundPdfUrl?: string | null;
  dateOfBirth?: string | null;
  hometown?: string | null;
  family?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  office?: string | null;
  bio?: string | null;
  researchInterests?: string | null;
  courses?: string | null;
  managementHistory?: string | null;
  phdSupervision?: PhdEntry[];
  education?: EducationEntry[];
  publications?: PublicationEntry[];
  evaluations?: EvaluationEntry[];
  additionalInfo?: InfoEntry[];
  otherPersonal?: LabeledEntry[];
  otherContacts?: LabeledEntry[];
  otherLinks?: LabeledEntry[];
  website?: string | null;
  googleScholar?: string | null;
  researchgate?: string | null;
  linkedin?: string | null;
  universityProfileUrl?: string | null;
}

export interface FacultyOption {
  id: number;
  name: string;
}

export interface MajorOption {
  id: number;
  name: string;
  slug: string;
}

/** Scalar keys accepted verbatim from JSON (string or number → string). */
const STRING_KEYS = [
  "fullName",
  "title",
  "dateOfBirth",
  "hometown",
  "family",
  "address",
  "email",
  "phone",
  "office",
  "bio",
  "researchInterests",
  "courses",
  "managementHistory",
  "website",
  "googleScholar",
  "researchgate",
  "linkedin",
  "universityProfileUrl",
  // Link to an externally-hosted CV file (set by the extraction pipeline).
  "researchBackgroundPdfUrl",
] as const;

function toStr(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

function mapEntries(
  value: unknown,
  keys: readonly string[],
): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const obj = (item ?? {}) as Record<string, unknown>;
      const row: Record<string, string> = {};
      for (const k of keys) {
        const s = toStr(obj[k]);
        if (s !== undefined) row[k] = s;
      }
      return row;
    })
    .filter((row) => Object.keys(row).length > 0);
}

/** Resolve a faculty by explicit id, or by name/slug against the known list. */
function resolveFacultyId(
  d: Record<string, unknown>,
  faculties: FacultyOption[],
): number | undefined {
  if (typeof d.facultyId === "number" && Number.isFinite(d.facultyId)) {
    return d.facultyId;
  }
  if (typeof d.facultyId === "string") {
    const n = parseInt(d.facultyId, 10);
    if (Number.isFinite(n)) return n;
  }
  const name = toStr(d.faculty);
  if (!name) return undefined;
  const normName = normalizeVietnamese(name);
  const slug = slugify(name);
  const match = faculties.find(
    (f) => normalizeVietnamese(f.name) === normName || slugify(f.name) === slug,
  );
  return match?.id;
}

/** Resolve an array of major names/slugs to known major ids. */
function resolveMajorIds(value: unknown, majors: MajorOption[]): number[] {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  for (const item of value) {
    const name = toStr(item);
    if (!name) continue;
    const normName = normalizeVietnamese(name);
    const slug = slugify(name);
    const match = majors.find(
      (m) =>
        normalizeVietnamese(m.name) === normName ||
        m.slug === slug ||
        slugify(m.name) === slug,
    );
    if (match && !ids.includes(match.id)) ids.push(match.id);
  }
  return ids;
}

/**
 * Convert an arbitrary parsed JSON object into a partial set of form values.
 * Unknown keys are ignored; missing keys are simply not returned. `faculty`
 * may be a faculty name or slug and is resolved to its id; `majors` is an array
 * of major names or slugs resolved to ids.
 */
export function jsonToLecturerValues(
  data: unknown,
  faculties: FacultyOption[],
  majors: MajorOption[] = [],
): Partial<LecturerFormValues> {
  const d = (data ?? {}) as Record<string, unknown>;
  const out: Partial<LecturerFormValues> = {};

  for (const key of STRING_KEYS) {
    const s = toStr(d[key]);
    if (s !== undefined) {
      (out as Record<string, unknown>)[key] = s;
    }
  }

  const facultyId = resolveFacultyId(d, faculties);
  if (facultyId != null) out.facultyId = facultyId;

  const majorIds = resolveMajorIds(d.majors, majors);
  if (majorIds.length) out.majorIds = majorIds;

  const phd = mapEntries(d.phdSupervision, ["title", "description", "reference"]);
  if (phd.length) out.phdSupervision = phd as unknown as PhdEntry[];

  const education = mapEntries(d.education, [
    "title",
    "period",
    "description",
    "reference",
  ]);
  if (education.length) out.education = education as unknown as EducationEntry[];

  const publications = mapEntries(d.publications, [
    "title",
    "description",
    "doi",
    "link",
  ]);
  if (publications.length) {
    out.publications = publications as unknown as PublicationEntry[];
  }

  const evaluations = mapEntries(d.evaluations, ["content", "source"]);
  if (evaluations.length) {
    out.evaluations = evaluations as unknown as EvaluationEntry[];
  }

  const additionalInfo = mapEntries(d.additionalInfo, [
    "title",
    "description",
    "reference",
  ]);
  if (additionalInfo.length) {
    out.additionalInfo = additionalInfo as unknown as InfoEntry[];
  }

  const otherPersonal = mapEntries(d.otherPersonal, ["label", "value"]);
  if (otherPersonal.length) {
    out.otherPersonal = otherPersonal as unknown as LabeledEntry[];
  }

  const otherContacts = mapEntries(d.otherContacts, ["label", "value"]);
  if (otherContacts.length) {
    out.otherContacts = otherContacts as unknown as LabeledEntry[];
  }

  const otherLinks = mapEntries(d.otherLinks, ["label", "value"]);
  if (otherLinks.length) {
    out.otherLinks = otherLinks as unknown as LabeledEntry[];
  }

  return out;
}
