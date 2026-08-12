import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { logout } from "@/app/lib/auth-actions";
import { ThemeToggle } from "@/app/_components/theme-toggle";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const { username } = await verifySession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold">
              <span className="text-accent">NEU</span> Quản trị
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link
                href="/admin/giang-vien"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Giảng viên
              </Link>
              <Link
                href="/admin/khoa"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Khoa & Bộ môn
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-muted hover:text-foreground sm:inline"
            >
              Xem trang công khai
            </Link>
            <span className="hidden text-sm text-muted md:inline">
              {username}
            </span>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
