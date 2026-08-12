/**
 * Batch-import lecturers (giảng viên) from a JSON array.
 *
 * Prepare an array of lecturer objects in `scripts/data/lecturers.json` (or pass
 * a path as the first argument), then run:
 *
 *   npm run import-lecturers                            # PREVIEW only (no writes)
 *   npx tsx scripts/import-lecturers.ts --commit        # actually insert
 *   npx tsx scripts/import-lecturers.ts ./my.json --commit
 *
 * SAFETY: the script previews by default and only writes when `--commit` is
 * passed. Prefer the direct `npx tsx …` form for a real import — Windows
 * PowerShell strips the `--` separator from `npm run … -- --flag`, so flags do
 * NOT reach the script through npm and would be silently ignored. You may also
 * set the env var IMPORT_COMMIT=1 instead of the flag.
 *
 * Each object accepts the same keys as the form's "auto-fill from JSON" feature
 * (see app/lib/lecturer-json.ts):
 *   - fullName (required), title, dateOfBirth, hometown, family, address, email,
 *     phone, office, bio, researchInterests, courses, managementHistory,
 *     website, googleScholar, researchgate, linkedin, universityProfileUrl
 *   - faculty: faculty name or slug (or facultyId: number) → resolved to an id
 *   - majors: array of major names/slugs → resolved to ids
 *   - education / publications / phdSupervision / evaluations / additionalInfo:
 *     arrays of structured entries ({ title|content, description, … })
 *
 * Photos and research PDFs are NOT imported here — add them per-lecturer via the
 * admin edit form afterward. Faculties must already exist (`npm run db:seed`)
 * for `faculty` names to resolve.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); // Next.js convention; loaded first
config(); // fallback to .env (does not override already-set vars)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  faculties,
  lecturerMajors,
  lecturers,
  majors,
  type NewLecturer,
} from "../app/lib/db/schema";
import {
  jsonToLecturerValues,
  type FacultyOption,
  type MajorOption,
} from "../app/lib/lecturer-json";
import { normalizeVietnamese, slugify } from "../app/lib/text";

type Db = ReturnType<typeof drizzle>;

const DEFAULT_DATA_FILE = "scripts/data/lecturers.json";

/** Ensure a slug is unique in the DB and within this batch, suffixing -2, -3… */
async function uniqueLecturerSlug(
  db: Db,
  base: string,
  used: Set<string>,
): Promise<string> {
  const root = slugify(base) || "giang-vien";
  let candidate = root;
  let n = 1;
  while (true) {
    const taken =
      used.has(candidate) ||
      (
        await db
          .select({ id: lecturers.id })
          .from(lecturers)
          .where(eq(lecturers.slug, candidate))
          .limit(1)
      ).length > 0;
    if (!taken) {
      used.add(candidate);
      return candidate;
    }
    n += 1;
    candidate = `${root}-${n}`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  // Safe by default: only write when explicitly asked via flag or env var.
  const commit = args.includes("--commit") || process.env.IMPORT_COMMIT === "1";
  const dryRun = !commit;
  const fileArg = args.find((a) => !a.startsWith("--"));
  const dataFile = resolve(process.cwd(), fileArg ?? DEFAULT_DATA_FILE);

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa được cấu hình.");

  let raw: string;
  try {
    raw = readFileSync(dataFile, "utf8");
  } catch {
    throw new Error(`Không đọc được tệp dữ liệu: ${dataFile}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Tệp không phải JSON hợp lệ (${dataFile}): ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Tệp dữ liệu phải là một mảng (array) các đối tượng giảng viên: ${dataFile}`,
    );
  }
  const records = parsed as Record<string, unknown>[];

  const sql = neon(url);
  const db = drizzle(sql);

  // Load lookup lists once so faculty/major names resolve to ids.
  const facultyList: FacultyOption[] = await db
    .select({ id: faculties.id, name: faculties.name })
    .from(faculties);
  const majorList: MajorOption[] = await db
    .select({ id: majors.id, name: majors.name, slug: majors.slug })
    .from(majors);

  console.log(
    `Đang xử lý ${records.length} bản ghi từ ${dataFile}${
      dryRun ? " (XEM TRƯỚC — không ghi vào CSDL)" : ""
    }...`,
  );

  const usedSlugs = new Set<string>();
  let inserted = 0;
  const skipped: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = i + 1; // human-friendly row number
    const obj = records[i] ?? {};
    const values = jsonToLecturerValues(obj, facultyList, majorList);

    const fullName = values.fullName?.trim();
    if (!fullName) {
      skipped.push(`Dòng ${row}: thiếu fullName — bỏ qua.`);
      continue;
    }

    // Warn (don't skip) when a requested faculty/major couldn't be resolved.
    if (typeof obj.faculty === "string" && obj.faculty.trim() && values.facultyId == null) {
      warnings.push(
        `Dòng ${row} (${fullName}): không tìm thấy khoa/viện "${obj.faculty}" — để trống facultyId.`,
      );
    }
    if (Array.isArray(obj.majors)) {
      const requested = obj.majors.filter(
        (m) => typeof m === "string" && m.trim(),
      ).length;
      const resolvedCount = values.majorIds?.length ?? 0;
      if (resolvedCount < requested) {
        warnings.push(
          `Dòng ${row} (${fullName}): chỉ khớp ${resolvedCount}/${requested} ngành — số còn lại bị bỏ qua.`,
        );
      }
    }

    // Assemble the insert row. Drop non-column keys; photo/PDF added later.
    const { majorIds, id: _id, ...rest } = values;
    void _id;
    const insertValues: NewLecturer = {
      ...rest,
      fullName,
      slug: dryRun ? slugify(fullName) : "", // real slug computed below
      nameNormalized: normalizeVietnamese(fullName),
    };

    if (dryRun) {
      console.log(
        `  [thử] Dòng ${row}: ${fullName}` +
          (values.facultyId != null ? ` · facultyId=${values.facultyId}` : "") +
          (majorIds?.length ? ` · ${majorIds.length} ngành` : ""),
      );
      inserted += 1;
      continue;
    }

    try {
      insertValues.slug = await uniqueLecturerSlug(db, fullName, usedSlugs);
      const [created] = await db
        .insert(lecturers)
        .values(insertValues)
        .returning({ id: lecturers.id });

      if (majorIds?.length) {
        await db
          .insert(lecturerMajors)
          .values(majorIds.map((majorId) => ({ lecturerId: created.id, majorId })));
      }
      inserted += 1;
      console.log(`  ✔ Dòng ${row}: ${fullName} (id=${created.id})`);
    } catch (e) {
      skipped.push(
        `Dòng ${row} (${fullName}): lỗi khi ghi — ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  console.log(
    `\n${dryRun ? "Xem trước xong. " : ""}✔ ${inserted} bản ghi${
      dryRun ? " sẽ được thêm" : " đã thêm"
    }, ${skipped.length} bị bỏ qua.`,
  );
  if (dryRun) {
    console.log(
      "\nĐây là bản xem trước — chưa ghi gì. Chạy lại với --commit để thêm thật:" +
        "\n  npx tsx scripts/import-lecturers.ts --commit",
    );
  }
  if (warnings.length) {
    console.log(`\nCảnh báo (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (skipped.length) {
    console.log(`\nBỏ qua (${skipped.length}):`);
    for (const s of skipped) console.log(`  - ${s}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
