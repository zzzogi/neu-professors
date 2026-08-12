import { SearchAutocomplete } from "./search-autocomplete";

const selectClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

export interface FilterBarProps {
  faculties: { slug: string; name: string }[];
  majors: { slug: string; name: string; facultyName: string }[];
  titles: string[];
  current: { q: string; khoa: string; nganh: string; hocHam: string };
}

/**
 * A plain GET form so filtering works without client JS. Submits to /tim-kiem
 * with slug-based faculty & major params and a title param.
 */
export function FilterBar({
  faculties,
  majors,
  titles,
  current,
}: FilterBarProps) {
  return (
    <form
      action="/tim-kiem"
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <SearchAutocomplete
        defaultValue={current.q}
        placeholder="Tên giảng viên..."
        containerClassName="lg:col-span-2"
        className={`w-full ${selectClass}`}
      />
      <select name="khoa" defaultValue={current.khoa} className={selectClass}>
        <option value="">Tất cả khoa/viện</option>
        {faculties.map((f) => (
          <option key={f.slug} value={f.slug}>
            {f.name}
          </option>
        ))}
      </select>
      <select name="nganh" defaultValue={current.nganh} className={selectClass}>
        <option value="">Tất cả ngành</option>
        {majors.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.name} · {m.facultyName}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
          name="hoc-ham"
          defaultValue={current.hocHam}
          className={`${selectClass} flex-1`}
        >
          <option value="">Học hàm/vị</option>
          {titles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Lọc
        </button>
      </div>
    </form>
  );
}
