import Link from "next/link";
import { searchLecturers, PAGE_SIZE } from "@/app/lib/search";
import { deleteLecturer } from "@/app/lib/actions";
import { Pagination } from "@/app/(public)/_components/pagination";

export default async function AdminLecturersPage(
  props: PageProps<"/admin/giang-vien">,
) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) || 1 : 1;

  const { items, total } = await searchLecturers({ q, page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/giang-vien?${qs}` : "/admin/giang-vien";
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Giảng viên</h1>
          <p className="text-sm text-muted">{total} hồ sơ</p>
        </div>
        <Link
          href="/admin/giang-vien/moi"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          + Thêm giảng viên
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên giảng viên..."
          className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-muted">Chưa có giảng viên nào.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Học hàm/vị</th>
                <th className="px-4 py-3 font-medium">Khoa/Viện</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{l.fullName}</td>
                  <td className="px-4 py-3 text-muted">{l.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {l.facultyName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/giang-vien/${l.id}`}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-background"
                      >
                        Sửa
                      </Link>
                      <form action={deleteLecturer}>
                        <input type="hidden" name="id" value={l.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/5"
                        >
                          Xóa
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={buildPageHref}
      />
    </div>
  );
}
