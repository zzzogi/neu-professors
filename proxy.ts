import { NextRequest, NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/app/lib/session";

/**
 * Optimistic auth gate for the admin area. This is a first line of defense only
 * — real enforcement happens in the Data Access Layer (verifySession) inside
 * every admin page and Server Action. Here we just read/verify the cookie.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  const isAuthed = Boolean(session?.username);

  if (!isLoginPage && !isAuthed) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }

  if (isLoginPage && isAuthed) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
