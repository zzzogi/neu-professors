import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacultyBySlug, getLecturersByFaculty } from "@/app/lib/data";
import { LecturerCard } from "../../_components/lecturer-card";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/khoa/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const faculty = await getFacultyBySlug(slug);
  if (!faculty) return { title: "Không tìm thấy khoa/viện" };
  return {
    title: faculty.name,
    description: faculty.description?.slice(0, 160) ?? undefined,
  };
}

function facultyInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(khoa|viện|bộ|môn|và|-)$/i.test(w));
  return (words[0]?.[0] ?? name[0] ?? "K").toUpperCase();
}

export default async function FacultyPage(props: PageProps<"/khoa/[slug]">) {
  const { slug } = await props.params;
  const faculty = await getFacultyBySlug(slug);
  if (!faculty) notFound();

  const lecturers = await getLecturersByFaculty(faculty.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Trang chủ
      </Link>

      <div className="mt-3 flex items-start gap-4">
        {faculty.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faculty.logoUrl}
            alt={faculty.name}
            className="h-20 w-20 shrink-0 rounded-xl border border-border bg-surface object-contain"
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
            {facultyInitials(faculty.name)}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold">{faculty.name}</h1>
          <p className="mt-1 text-sm text-muted">{lecturers.length} giảng viên</p>
        </div>
      </div>

      {faculty.description && (
        <p className="mt-4 max-w-3xl whitespace-pre-line break-words text-sm leading-relaxed text-foreground/80">
          {faculty.description}
        </p>
      )}

      <div className="mb-8" />

      {lecturers.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có giảng viên nào thuộc khoa/viện này.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lecturers.map((l) => (
            <LecturerCard
              key={l.id}
              lecturer={{
                slug: l.slug,
                fullName: l.fullName,
                title: l.title,
                photoUrl: l.photoUrl,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
