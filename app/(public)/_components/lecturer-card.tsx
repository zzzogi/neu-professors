import Link from "next/link";

export interface LecturerCardData {
  slug: string;
  fullName: string;
  title: string | null;
  photoUrl: string | null;
  facultyName?: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts[0]?.[0] ?? "";
  return (last + first).toUpperCase();
}

export function LecturerCard({ lecturer }: { lecturer: LecturerCardData }) {
  return (
    <Link
      href={`/giang-vien/${lecturer.slug}`}
      className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
    >
      {lecturer.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lecturer.photoUrl}
          alt={lecturer.fullName}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {initials(lecturer.fullName)}
        </div>
      )}
      <div className="min-w-0">
        {lecturer.title && (
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {lecturer.title}
          </p>
        )}
        <h3 className="truncate font-semibold group-hover:text-primary">
          {lecturer.fullName}
        </h3>
        {lecturer.facultyName && (
          <p className="truncate text-sm text-muted">{lecturer.facultyName}</p>
        )}
      </div>
    </Link>
  );
}
