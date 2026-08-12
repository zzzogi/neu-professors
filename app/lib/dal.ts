import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionToken } from "@/app/lib/session";

/**
 * Data Access Layer: the single source of truth for "is this request an
 * authenticated admin?". Called by every admin page and every mutating Server
 * Action. Memoized per-request with React `cache` to avoid re-verifying.
 */
export const verifySession = cache(async (): Promise<{ username: string }> => {
  const token = await getSessionToken();
  const session = await decrypt(token);

  if (!session?.username) {
    redirect("/admin/login");
  }

  return { username: session.username };
});

/** Non-redirecting variant for optional checks (e.g. login page). */
export const getOptionalSession = cache(
  async (): Promise<{ username: string } | null> => {
    const token = await getSessionToken();
    const session = await decrypt(token);
    return session?.username ? { username: session.username } : null;
  },
);
