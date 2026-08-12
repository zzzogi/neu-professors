import type { Metadata } from "next";
import { getAllFaculties, getAllMajors } from "@/app/lib/data";
import { getDistinctTitles, searchLecturers, PAGE_SIZE } from "@/app/lib/search";
import { FilterBar } from "../_components/filter-bar";
import { LecturerCard } from "../_components/lecturer-card";
import { Pagination } from "../_components/pagination";

export const metadata: Metadata = { title: "Tìm kiếm giảng viên" };

function firstString(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function SearchPage(props: PageProps<"/tim-kiem">) {
  const sp = await props.searchParams;
  const q = firstString(sp.q);
  const khoa = firstString(sp.khoa);
  const nganh = firstString(sp.nganh);
  const hocHam = firstString(sp["hoc-ham"]);
  const page = parseInt(firstString(sp.page), 10) || 1;

  const [faculties, majors, titles] = await Promise.all([
    getAllFaculties(),
    getAllMajors(),
    getDistinctTitles(),
  ]);

  const faculty = faculties.find((f) => f.slug === khoa);
  const major = majors.find((m) => m.slug === nganh);

  const { items, total } = await searchLecturers({
    q,
    facultyId: faculty?.id,
    majorId: major?.id,
    title: hocHam || undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (khoa) params.set("khoa", khoa);
    if (nganh) params.set("nganh", nganh);
    if (hocHam) params.set("hoc-ham", hocHam);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/tim-kiem?${qs}` : "/tim-kiem";
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Tìm kiếm giảng viên</h1>

      <FilterBar
        faculties={faculties.map((f) => ({ slug: f.slug, name: f.name }))}
        majors={majors.map((m) => ({
          slug: m.slug,
          name: m.name,
          facultyName: m.facultyName,
        }))}
        titles={titles}
        current={{ q, khoa, nganh, hocHam }}
      />

      <p className="mb-4 mt-6 text-sm text-muted">
        {total > 0
          ? `Tìm thấy ${total} giảng viên`
          : "Không tìm thấy giảng viên phù hợp."}
      </p>

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((l) => (
            <LecturerCard
              key={l.id}
              lecturer={{
                slug: l.slug,
                fullName: l.fullName,
                title: l.title,
                photoUrl: l.photoUrl,
                facultyName: l.facultyName,
              }}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={buildPageHref}
      />
    </main>
  );
}
