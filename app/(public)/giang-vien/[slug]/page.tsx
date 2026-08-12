import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLecturerBySlug } from "@/app/lib/data";
import type {
  EducationEntry,
  EvaluationEntry,
  InfoEntry,
  PhdEntry,
  PublicationEntry,
} from "@/app/lib/db/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/giang-vien/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const lecturer = await getLecturerBySlug(slug);
  if (!lecturer) return { title: "Không tìm thấy giảng viên" };
  const titlePrefix = lecturer.title ? `${lecturer.title} ` : "";
  return {
    title: `${titlePrefix}${lecturer.fullName}`,
    description:
      lecturer.bio?.slice(0, 160) ??
      `Thông tin giảng viên ${lecturer.fullName}${
        lecturer.facultyName ? ` - ${lecturer.facultyName}` : ""
      }.`,
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[parts.length - 1]?.[0] ?? "") + (parts[0]?.[0] ?? "")
  ).toUpperCase();
}

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}

/** Render a reference/source value as a link when it looks like a URL. */
function Ref({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="mt-1 break-words text-xs text-muted">
      {label}:{" "}
      {isUrl(value) ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary hover:underline"
        >
          {value} ↗
        </a>
      ) : (
        <span className="break-words">{value}</span>
      )}
    </p>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className="break-words text-sm leading-relaxed">{children}</div>
    </section>
  );
}

/** A single structured entry rendered as a bordered block. */
function EntryBlock({
  heading,
  sub,
  body,
  children,
}: {
  heading?: string;
  sub?: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 break-words rounded-xl border border-border bg-surface p-4">
      {heading && <p className="font-semibold">{heading}</p>}
      {sub && <p className="text-xs text-muted">{sub}</p>}
      {body && <p className="mt-1 whitespace-pre-line break-words">{body}</p>}
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="whitespace-pre-line break-words">{value}</dd>
    </div>
  );
}

const LINKS: { key: keyof LinkFields; label: string }[] = [
  { key: "website", label: "Website cá nhân" },
  { key: "googleScholar", label: "Google Scholar" },
  { key: "researchgate", label: "ResearchGate" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "universityProfileUrl", label: "Hồ sơ trên website trường" },
];

interface LinkFields {
  website: string | null;
  googleScholar: string | null;
  researchgate: string | null;
  linkedin: string | null;
  universityProfileUrl: string | null;
}

export default async function LecturerProfilePage(
  props: PageProps<"/giang-vien/[slug]">,
) {
  const { slug } = await props.params;
  const l = await getLecturerBySlug(slug);
  if (!l) notFound();

  const externalLinks = LINKS.filter((link) => l[link.key]);
  const phd = l.phdSupervision as PhdEntry[];
  const education = l.education as EducationEntry[];
  const publications = l.publications as PublicationEntry[];
  const evaluations = l.evaluations as EvaluationEntry[];
  const additionalInfo = l.additionalInfo as InfoEntry[];

  const hasMainContent =
    l.bio ||
    l.researchInterests ||
    l.managementHistory ||
    l.courses ||
    education.length ||
    phd.length ||
    publications.length ||
    evaluations.length ||
    additionalInfo.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/tim-kiem" className="text-sm text-muted hover:text-foreground">
        ← Quay lại tìm kiếm
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        {/* Sticky basic-info card */}
        <aside className="lg:sticky lg:top-8">
          <div className="rounded-2xl border border-border bg-surface p-6">
            {l.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={l.photoUrl}
                alt={l.fullName}
                className="mb-4 aspect-square w-full rounded-xl object-cover"
              />
            ) : (
              <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary">
                {initials(l.fullName)}
              </div>
            )}

            {l.title && (
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                {l.title}
              </p>
            )}
            <h1 className="text-2xl font-bold">{l.fullName}</h1>
            {l.facultyName && (
              <p className="mt-1 text-sm text-muted">
                {l.facultySlug ? (
                  <Link
                    href={`/khoa/${l.facultySlug}`}
                    className="hover:text-primary"
                  >
                    {l.facultyName}
                  </Link>
                ) : (
                  l.facultyName
                )}
              </p>
            )}

            {l.majors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.majors.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/tim-kiem?nganh=${m.slug}`}
                    className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {m.name}
                  </Link>
                ))}
              </div>
            )}

            <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
              <InfoRow label="Ngày sinh" value={l.dateOfBirth} />
              <InfoRow label="Quê quán" value={l.hometown} />
              <InfoRow label="Địa chỉ" value={l.address} />
              <InfoRow label="Gia đình" value={l.family} />
              {l.email && (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${l.email}`}
                      className="break-all text-primary hover:underline"
                    >
                      {l.email}
                    </a>
                  </dd>
                </div>
              )}
              <InfoRow label="Điện thoại" value={l.phone} />
              <InfoRow label="Phòng làm việc" value={l.office} />
            </dl>

            {l.researchBackgroundPdfUrl && (
              <a
                href={l.researchBackgroundPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg border border-border px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                Lý lịch khoa học (PDF) ↓
              </a>
            )}

            {externalLinks.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {externalLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      href={l[link.key] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-col gap-8">
          {!hasMainContent && (
            <p className="text-sm text-muted">
              Chưa có thông tin chi tiết cho giảng viên này.
            </p>
          )}

          {l.bio && (
            <Section title="Giới thiệu">
              <p className="whitespace-pre-line">{l.bio}</p>
            </Section>
          )}
          {l.researchInterests && (
            <Section title="Hướng nghiên cứu">
              <p className="whitespace-pre-line">{l.researchInterests}</p>
            </Section>
          )}
          {l.managementHistory && (
            <Section title="Chức vụ quản lý / Quá trình công tác">
              <p className="whitespace-pre-line">{l.managementHistory}</p>
            </Section>
          )}
          {l.courses && (
            <Section title="Học phần giảng dạy">
              <p className="whitespace-pre-line">{l.courses}</p>
            </Section>
          )}

          {education.length > 0 && (
            <Section title="Quá trình đào tạo">
              <div className="grid gap-3">
                {education.map((e, i) => (
                  <EntryBlock
                    key={i}
                    heading={e.title}
                    sub={e.period}
                    body={e.description}
                  >
                    <Ref label="Minh chứng" value={e.reference} />
                  </EntryBlock>
                ))}
              </div>
            </Section>
          )}

          {phd.length > 0 && (
            <Section title="Kinh nghiệm hướng dẫn NCS">
              <div className="grid gap-3">
                {phd.map((e, i) => (
                  <EntryBlock key={i} heading={e.title} body={e.description}>
                    <Ref label="Minh chứng" value={e.reference} />
                  </EntryBlock>
                ))}
              </div>
            </Section>
          )}

          {publications.length > 0 && (
            <Section title="Công bố khoa học">
              <div className="grid gap-3">
                {publications.map((e, i) => (
                  <EntryBlock key={i} heading={e.title} body={e.description}>
                    <Ref label="DOI" value={e.doi} />
                    <Ref label="Đường dẫn" value={e.link} />
                  </EntryBlock>
                ))}
              </div>
            </Section>
          )}

          {evaluations.length > 0 && (
            <Section title="Đánh giá giảng viên">
              <div className="grid gap-3">
                {evaluations.map((e, i) => (
                  <EntryBlock key={i} body={e.content}>
                    <Ref label="Nguồn" value={e.source} />
                  </EntryBlock>
                ))}
              </div>
            </Section>
          )}

          {additionalInfo.length > 0 && (
            <Section title="Thông tin thêm">
              <div className="grid gap-3">
                {additionalInfo.map((e, i) => (
                  <EntryBlock key={i} heading={e.title} body={e.description}>
                    <Ref label="Minh chứng" value={e.reference} />
                  </EntryBlock>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
