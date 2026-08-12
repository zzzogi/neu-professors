import { getAllFaculties, getAllMajors } from "@/app/lib/data";
import { deleteFaculty, deleteMajor } from "@/app/lib/actions";
import { FacultyEditForm, FacultyForm, MajorForm } from "./khoa-forms";

export default async function KhoaPage() {
  const [faculties, majors] = await Promise.all([
    getAllFaculties(),
    getAllMajors(),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h1 className="mb-1 text-2xl font-bold">Khoa & Viện</h1>
        <p className="mb-4 text-sm text-muted">
          {faculties.length} khoa/viện. Xóa một khoa sẽ gỡ liên kết khỏi giảng
          viên và xóa các ngành thuộc khoa đó.
        </p>
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <FacultyForm />
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {faculties.map((f) => (
            <li key={f.id} className="px-4 py-3 text-sm">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {f.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.logoUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded border border-border object-contain"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted">
                        Logo
                      </span>
                    )}
                    <span className="font-medium">{f.name}</span>
                  </span>
                  <span className="text-xs text-muted">Chỉnh sửa ▾</span>
                </summary>
                <div className="mt-3 border-t border-border pt-3">
                  <FacultyEditForm
                    faculty={{
                      id: f.id,
                      name: f.name,
                      description: f.description,
                      logoUrl: f.logoUrl,
                    }}
                  />
                  <form action={deleteFaculty} className="mt-3">
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-accent hover:bg-accent/5"
                    >
                      Xóa khoa/viện
                    </button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-bold">Ngành</h2>
        <p className="mb-4 text-sm text-muted">{majors.length} ngành.</p>
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <MajorForm
            faculties={faculties.map((f) => ({ id: f.id, name: f.name }))}
          />
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {majors.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">Chưa có ngành nào.</li>
          ) : (
            majors.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted"> · {m.facultyName}</span>
                </span>
                <form action={deleteMajor}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-accent hover:bg-accent/5"
                  >
                    Xóa
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
