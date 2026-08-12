"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession } from "@/app/lib/session";

const LoginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export interface LoginState {
  error?: string;
}

/**
 * Read the admin bcrypt hash from the environment. The hash is stored
 * base64-encoded because Next.js (@next/env) performs `$`-variable expansion on
 * `.env` values, which would otherwise mangle a raw bcrypt hash like
 * `$2b$10$...`. For resilience we also accept a raw (or `\$`-escaped) bcrypt
 * hash if one is provided.
 */
function readPasswordHash(): string | undefined {
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (!raw) return undefined;
  if (/^\$2[aby]\$/.test(raw)) return raw; // already a raw bcrypt hash
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (/^\$2[aby]\$/.test(decoded)) return decoded;
  } catch {
    // fall through
  }
  return raw;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Thông tin đăng nhập không hợp lệ." };
  }

  const { username, password } = parsed.data;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = readPasswordHash();

  if (!expectedUsername || !passwordHash) {
    return { error: "Hệ thống chưa được cấu hình tài khoản quản trị." };
  }

  const usernameOk = username === expectedUsername;
  // Always run bcrypt.compare to reduce timing side-channels.
  const passwordOk = await bcrypt.compare(password, passwordHash);

  if (!usernameOk || !passwordOk) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng." };
  }

  await createSession(username);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
