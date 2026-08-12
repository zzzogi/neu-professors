import Link from "next/link";

/**
 * Reusable Prev/Next pagination control. Server-safe (no client state):
 * the caller builds each page's href so query params (search, filters) are
 * preserved. Renders nothing when there is only a single page.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
        >
          ← Trước
        </Link>
      )}
      <span className="px-2 text-muted">
        Trang {page}/{totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
        >
          Sau →
        </Link>
      )}
    </nav>
  );
}
