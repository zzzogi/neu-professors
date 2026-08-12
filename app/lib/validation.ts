import { z } from "zod";

/** Trim a form value; return undefined for empty/missing so optionals work. */
function optionalText() {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional();
}

function optionalUrl(message = "Đường dẫn không hợp lệ.") {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .refine((v) => v === undefined || /^https?:\/\//i.test(v), { message });
}

function optionalId() {
  return z
    .union([z.string(), z.number()])
    .transform((v) => {
      const n = typeof v === "number" ? v : parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })
    .optional();
}

export const LecturerSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên giảng viên."),
  title: optionalText(),
  facultyId: optionalId(),
  dateOfBirth: optionalText(),
  hometown: optionalText(),
  family: optionalText(),
  address: optionalText(),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .refine((v) => v === undefined || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: "Email không hợp lệ.",
    }),
  phone: optionalText(),
  office: optionalText(),
  bio: optionalText(),
  researchInterests: optionalText(),
  courses: optionalText(),
  managementHistory: optionalText(),
  website: optionalUrl(),
  googleScholar: optionalUrl(),
  researchgate: optionalUrl(),
  linkedin: optionalUrl(),
  universityProfileUrl: optionalUrl(),
});

export type LecturerInput = z.infer<typeof LecturerSchema>;

export const FacultySchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên khoa/viện."),
  description: optionalText(),
});

export const MajorSchema = z.object({
  facultyId: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v : parseInt(v, 10)))
    .refine((v) => Number.isFinite(v) && v > 0, {
      message: "Vui lòng chọn khoa/viện.",
    }),
  name: z.string().trim().min(1, "Vui lòng nhập tên ngành."),
});

// ── Structured repeatable entries ────────────────────────────────────────────
// Each optional field is coerced to a trimmed string or undefined. Blank rows
// (missing the primary field) are dropped by `parseEntries`.

const str = () =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional();

export const PhdEntrySchema = z.object({
  title: z.string().trim().default(""),
  description: str(),
  reference: str(),
});

export const EducationEntrySchema = z.object({
  title: z.string().trim().default(""),
  period: str(),
  description: str(),
  reference: str(),
});

export const PublicationEntrySchema = z.object({
  title: z.string().trim().default(""),
  description: str(),
  doi: str(),
  link: str(),
});

export const EvaluationEntrySchema = z.object({
  content: z.string().trim().default(""),
  source: str(),
});

export const InfoEntrySchema = z.object({
  title: z.string().trim().default(""),
  description: str(),
  reference: str(),
});

/**
 * Parse a hidden JSON form field into a validated, cleaned array of entries.
 * Rows whose `primaryKey` is empty are dropped so empty "Thêm" rows don't
 * persist. Returns [] for missing/invalid input.
 */
export function parseEntries<T extends z.ZodTypeAny>(
  raw: FormDataEntryValue | null,
  schema: T,
  primaryKey: string,
): z.infer<T>[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const arr = z.array(schema).safeParse(data);
  if (!arr.success) return [];
  return (arr.data as Record<string, unknown>[]).filter((row) => {
    const v = row[primaryKey];
    return typeof v === "string" && v.trim() !== "";
  }) as z.infer<T>[];
}

/** Extract a plain object of string values from FormData for zod parsing. */
export function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}
