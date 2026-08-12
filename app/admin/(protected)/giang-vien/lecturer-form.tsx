"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { FormState } from "@/app/lib/actions";
import {
  jsonToLecturerValues,
  type FacultyOption,
  type LecturerFormValues,
  type MajorOption,
} from "@/app/lib/lecturer-json";

export type { LecturerFormValues };

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

function Field({
  label,
  name,
  defaultValue,
  errors,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  errors?: string[];
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputClass}
      />
      {errors?.[0] && <span className="text-xs text-accent">{errors[0]}</span>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  hint,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      />
    </label>
  );
}

// ── JSON auto-fill panel ─────────────────────────────────────────────────────

function JsonImportPanel({
  faculties,
  majors,
  onApply,
}: {
  faculties: FacultyOption[];
  majors: MajorOption[];
  onApply: (values: Partial<LecturerFormValues>) => void;
}) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(
    null,
  );

  function apply(raw: string) {
    if (!raw.trim()) {
      setMsg({ type: "error", text: "Vui lòng dán nội dung JSON." });
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      setMsg({ type: "error", text: "JSON không hợp lệ." });
      return;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      setMsg({ type: "error", text: "JSON phải là một đối tượng { ... }." });
      return;
    }
    const values = jsonToLecturerValues(data, faculties, majors);
    onApply(values);
    setMsg({
      type: "ok",
      text: `Đã điền ${Object.keys(values).length} trường vào biểu mẫu.`,
    });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    apply(content);
    e.target.value = "";
  }

  return (
    <details className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Tự động điền từ JSON
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-muted">
          Dán JSON do công cụ tổng hợp xuất ra, hoặc tải tệp .json. Thao tác này
          sẽ ghi đè các trường tương ứng (ảnh và tệp PDF vẫn tải lên thủ công).{" "}
          <a
            href="/lecturer-schema.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Cấu trúc JSON
          </a>
          {" · "}
          <a
            href="/lecturer-mau.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Tệp mẫu
          </a>
        </p>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "fullName": "Nguyễn Văn A", "title": "PGS.TS", ... }'
          className={`${inputClass} font-mono text-xs`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => apply(text)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Điền vào biểu mẫu
          </button>
          <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-background">
            Tải tệp JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              className="hidden"
            />
          </label>
          {msg && (
            <span
              className={`text-xs ${
                msg.type === "error" ? "text-accent" : "text-muted"
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </div>
    </details>
  );
}

// ── Repeatable "add stage-by-stage" section ──────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea";
  placeholder?: string;
}

type Row = Record<string, string>;

function RepeatableSection({
  title,
  name,
  fields,
  initial,
}: {
  title: string;
  name: string;
  fields: FieldDef[];
  initial: unknown[];
}) {
  const toRow = (r: unknown): Row => {
    const rec = (r ?? {}) as Record<string, unknown>;
    const row: Row = {};
    for (const f of fields) row[f.key] = String(rec[f.key] ?? "");
    return row;
  };
  const [rows, setRows] = useState<Row[]>((initial ?? []).map(toRow));

  const update = (i: number, key: string, value: string) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    );
  const remove = (i: number) =>
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((prev) => [
      ...prev,
      Object.fromEntries(fields.map((f) => [f.key, ""])) as Row,
    ]);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>

      {rows.length === 0 && (
        <p className="text-xs text-muted">
          Chưa có mục nào. Nhấn nút “+ Thêm mục” bên dưới.
        </p>
      )}

      {rows.map((row, i) => (
        <div
          key={i}
          className="grid gap-3 rounded-xl border border-border bg-background/40 p-3"
        >
          {fields.map((f) =>
            f.type === "textarea" ? (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">
                  {f.label}
                </span>
                <textarea
                  rows={3}
                  value={row[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            ) : (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">
                  {f.label}
                </span>
                <input
                  type="text"
                  value={row[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            ),
          )}
          <div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-accent hover:bg-accent/5"
            >
              Xóa mục
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border-2 border-dashed border-primary/40 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
      >
        + Thêm mục
      </button>

      {/* Serialized payload consumed by the Server Action. */}
      <input type="hidden" name={name} value={JSON.stringify(rows)} readOnly />
    </section>
  );
}

interface FormMajor {
  id: number;
  name: string;
  slug: string;
  facultyId: number;
  facultyName: string;
}

export function LecturerForm({
  action,
  faculties,
  majors,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  faculties: FacultyOption[];
  majors: FormMajor[];
  initial?: LecturerFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const fieldErrors = state.fieldErrors ?? {};

  // `seed` holds the current default values; bumping `seedVersion` remounts the
  // field block so uncontrolled inputs and repeatable sections pick up values
  // applied from an imported JSON payload.
  const [seed, setSeed] = useState<LecturerFormValues>(initial ?? {});
  const [seedVersion, setSeedVersion] = useState(0);

  // The faculty select is controlled so the Ngành checkboxes can filter to the
  // chosen faculty. Kept in component state (not the remounted block) so it
  // survives a JSON import; `applyJson` updates it when the JSON sets a faculty.
  const [facultyId, setFacultyId] = useState<string>(
    initial?.facultyId ? String(initial.facultyId) : "",
  );

  const applyJson = (values: Partial<LecturerFormValues>) => {
    setSeed((prev) => ({ ...prev, ...values }));
    if (values.facultyId != null) setFacultyId(String(values.facultyId));
    setSeedVersion((v) => v + 1);
  };

  const facultyMajors = facultyId
    ? majors.filter((m) => m.facultyId === Number(facultyId))
    : [];

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {seed.id != null && <input type="hidden" name="id" value={seed.id} />}

      {state.error && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}

      {initial?.id == null && (
        <JsonImportPanel
          faculties={faculties}
          majors={majors}
          onApply={applyJson}
        />
      )}

      <div key={seedVersion} className="flex flex-col gap-8">
        {/* Thông tin cơ bản */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Thông tin cơ bản
            </h2>
          </div>
          <Field
            label="Họ và tên *"
            name="fullName"
            defaultValue={seed.fullName}
            errors={fieldErrors.fullName}
          />
          <Field
            label="Học hàm / học vị"
            name="title"
            defaultValue={seed.title}
            placeholder="VD: PGS.TS"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Khoa / Viện</span>
            <select
              name="facultyId"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Chọn khoa/viện —</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Ngày sinh"
            name="dateOfBirth"
            defaultValue={seed.dateOfBirth}
            placeholder="VD: 12/05/1980"
          />
          <Field
            label="Quê quán"
            name="hometown"
            defaultValue={seed.hometown}
          />
          <Field label="Địa chỉ" name="address" defaultValue={seed.address} />
          <div className="sm:col-span-2">
            <TextArea
              label="Thông tin gia đình"
              name="family"
              rows={2}
              defaultValue={seed.family}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Ngành</span>
            {!facultyId ? (
              <p className="text-xs text-muted">
                Chọn khoa/viện để hiển thị danh sách ngành.
              </p>
            ) : facultyMajors.length === 0 ? (
              <p className="text-xs text-muted">
                Khoa/viện này chưa có ngành. Thêm ở mục “Khoa &amp; Ngành”.
              </p>
            ) : (
              <div className="grid gap-1 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
                {facultyMajors.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="majors"
                      value={m.id}
                      defaultChecked={seed.majorIds?.includes(m.id) ?? false}
                      className="accent-primary"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Ảnh đại diện</span>
            {seed.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seed.photoUrl}
                alt=""
                className="h-24 w-24 rounded-lg object-cover"
              />
            )}
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
            />
            <span className="text-xs text-muted">
              JPG, PNG hoặc WEBP, tối đa 5MB. Để trống nếu không thay đổi.
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lý lịch khoa học (PDF)</span>
            {seed.researchBackgroundPdfUrl && (
              <a
                href={seed.researchBackgroundPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Tệp hiện tại ↗
              </a>
            )}
            <input
              name="researchPdf"
              type="file"
              accept="application/pdf"
              className="text-sm"
            />
            <span className="text-xs text-muted">
              PDF, tối đa 10MB. Để trống nếu không thay đổi.
            </span>
          </label>
        </section>

        {/* Liên hệ */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Liên hệ
            </h2>
          </div>
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={seed.email}
            errors={fieldErrors.email}
          />
          <Field label="Điện thoại" name="phone" defaultValue={seed.phone} />
          <Field
            label="Phòng làm việc"
            name="office"
            defaultValue={seed.office}
          />
        </section>

        {/* Chuyên môn (text) */}
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Chuyên môn
          </h2>
          <TextArea label="Giới thiệu" name="bio" defaultValue={seed.bio} />
          <TextArea
            label="Hướng nghiên cứu"
            name="researchInterests"
            defaultValue={seed.researchInterests}
          />
          <TextArea
            label="Học phần giảng dạy"
            name="courses"
            hint="Mỗi học phần một dòng."
            defaultValue={seed.courses}
          />
          <TextArea
            label="Chức vụ quản lý tại NEU / Quá trình công tác"
            name="managementHistory"
            defaultValue={seed.managementHistory}
          />
        </section>

        <RepeatableSection
          title="Kinh nghiệm hướng dẫn NCS"
          name="phdSupervision"
          initial={seed.phdSupervision ?? []}
          fields={[
            { key: "title", label: "Tiêu đề" },
            { key: "description", label: "Mô tả", type: "textarea" },
            { key: "reference", label: "Nguồn / Minh chứng" },
          ]}
        />

        <RepeatableSection
          title="Quá trình đào tạo"
          name="education"
          initial={seed.education ?? []}
          fields={[
            { key: "title", label: "Tiêu đề / Bằng cấp" },
            {
              key: "period",
              label: "Thời gian",
              placeholder: "VD: 2010 - 2014",
            },
            { key: "description", label: "Mô tả", type: "textarea" },
            { key: "reference", label: "Nguồn / Minh chứng" },
          ]}
        />

        <RepeatableSection
          title="Công bố khoa học"
          name="publications"
          initial={seed.publications ?? []}
          fields={[
            { key: "title", label: "Tiêu đề" },
            { key: "description", label: "Mô tả", type: "textarea" },
            { key: "doi", label: "DOI" },
            { key: "link", label: "Đường dẫn" },
          ]}
        />

        <RepeatableSection
          title="Đánh giá giảng viên"
          name="evaluations"
          initial={seed.evaluations ?? []}
          fields={[
            { key: "content", label: "Nội dung đánh giá", type: "textarea" },
            { key: "source", label: "Nguồn trích dẫn" },
          ]}
        />

        <RepeatableSection
          title="Thông tin thêm"
          name="additionalInfo"
          initial={seed.additionalInfo ?? []}
          fields={[
            { key: "title", label: "Tiêu đề" },
            { key: "description", label: "Mô tả", type: "textarea" },
            { key: "reference", label: "Nguồn / Minh chứng" },
          ]}
        />

        {/* Liên kết ngoài */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Liên kết ngoài
            </h2>
          </div>
          <Field
            label="Website cá nhân"
            name="website"
            defaultValue={seed.website}
            errors={fieldErrors.website}
            placeholder="https://"
          />
          <Field
            label="Google Scholar"
            name="googleScholar"
            defaultValue={seed.googleScholar}
            errors={fieldErrors.googleScholar}
            placeholder="https://"
          />
          <Field
            label="ResearchGate"
            name="researchgate"
            defaultValue={seed.researchgate}
            errors={fieldErrors.researchgate}
            placeholder="https://"
          />
          <Field
            label="LinkedIn"
            name="linkedin"
            defaultValue={seed.linkedin}
            errors={fieldErrors.linkedin}
            placeholder="https://"
          />
          <Field
            label="Trang hồ sơ trên website trường"
            name="universityProfileUrl"
            defaultValue={seed.universityProfileUrl}
            errors={fieldErrors.universityProfileUrl}
            placeholder="https://"
          />
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : submitLabel}
        </button>
        <Link
          href="/admin/giang-vien"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background"
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
