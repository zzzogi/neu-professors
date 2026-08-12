"use client";

import { useActionState } from "react";
import {
  createFaculty,
  createMajor,
  updateFaculty,
  type FormState,
} from "@/app/lib/actions";

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";
const btnClass =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";

export interface FacultyEditData {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
}

export function FacultyEditForm({ faculty }: { faculty: FacultyEditData }) {
  const [state, action, pending] = useActionState(
    updateFaculty,
    {} as FormState,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={faculty.id} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Tên khoa/viện</span>
        <input
          name="name"
          defaultValue={faculty.name}
          className={inputClass}
        />
        {state.fieldErrors?.name?.[0] && (
          <span className="text-xs text-accent">
            {state.fieldErrors.name[0]}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Giới thiệu ngắn (hiển thị ở trang khoa)
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={faculty.description ?? ""}
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3">
        {faculty.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faculty.logoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg border border-border object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
            Logo
          </div>
        )}
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            Logo (JPG, PNG, WEBP · tối đa 5MB · để trống nếu giữ nguyên)
          </span>
          <input
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm"
          />
        </label>
      </div>

      {state.error && <span className="text-xs text-accent">{state.error}</span>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={btnClass}>
          {pending ? "Đang lưu..." : "Lưu"}
        </button>
        {state.success && (
          <span className="text-xs text-muted">Đã lưu thay đổi.</span>
        )}
      </div>
    </form>
  );
}

export function FacultyForm() {
  const [state, action, pending] = useActionState(
    createFaculty,
    {} as FormState,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Tên khoa/viện mới"
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" disabled={pending} className={btnClass}>
          Thêm
        </button>
      </div>
      {state.fieldErrors?.name?.[0] && (
        <span className="text-xs text-accent">
          {state.fieldErrors.name[0]}
        </span>
      )}
    </form>
  );
}

export function MajorForm({
  faculties,
}: {
  faculties: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState(createMajor, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <select name="facultyId" defaultValue="" className={inputClass}>
          <option value="">— Chọn khoa/viện —</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          name="name"
          placeholder="Tên ngành mới"
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" disabled={pending} className={btnClass}>
          Thêm
        </button>
      </div>
      {(state.fieldErrors?.facultyId?.[0] || state.fieldErrors?.name?.[0]) && (
        <span className="text-xs text-accent">
          {state.fieldErrors?.facultyId?.[0] ?? state.fieldErrors?.name?.[0]}
        </span>
      )}
    </form>
  );
}
