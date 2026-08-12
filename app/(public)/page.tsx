import Link from "next/link";
import { getAllFaculties } from "@/app/lib/data";
import { SearchAutocomplete } from "./_components/search-autocomplete";

export const dynamic = "force-dynamic";

/** Initials from a faculty name, used when no logo is set. */
function facultyInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(khoa|viện|bộ|môn|và|-)$/i.test(w));
  return (words[0]?.[0] ?? name[0] ?? "K").toUpperCase();
}

export default async function HomePage() {
  const faculties = await getAllFaculties();

  return (
    <main>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Đại học Kinh tế Quốc dân
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Tra cứu thông tin giảng viên
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Tìm hiểu về giảng viên NEU — hồ sơ, khoa/viện, bộ môn, hướng nghiên
            cứu và thông tin liên hệ, tất cả ở một nơi.
          </p>

          <form action="/tim-kiem" className="mx-auto mt-8 flex max-w-xl gap-2">
            <SearchAutocomplete
              placeholder="Nhập tên giảng viên..."
              containerClassName="flex-1"
              className="w-full rounded-full border border-border bg-surface px-5 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-6 text-lg font-semibold">Duyệt theo khoa / viện</h2>
        {faculties.length === 0 ? (
          <p className="text-sm text-muted">
            Chưa có dữ liệu khoa/viện. Vui lòng seed dữ liệu.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faculties.map((f) => (
              <Link
                key={f.id}
                href={`/khoa/${f.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40"
              >
                {f.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.logoUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg border border-border bg-surface object-contain"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {facultyInitials(f.name)}
                  </span>
                )}
                <span className="min-w-0 break-words text-sm font-medium group-hover:text-primary">
                  {f.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
