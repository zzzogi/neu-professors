import Link from "next/link";
import { ThemeToggle } from "@/app/_components/theme-toggle";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">NEU</span>
            <span className="text-sm font-medium text-muted">
              Tra cứu giảng viên
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/tim-kiem"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Tìm kiếm
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
          <p>
            Cổng tra cứu thông tin giảng viên Đại học Kinh tế Quốc dân. Dữ liệu
            được tổng hợp và biên tập thủ công.
          </p>
        </div>
      </footer>
    </div>
  );
}
