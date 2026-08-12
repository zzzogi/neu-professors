/**
 * Pure text utilities shared by the app and standalone scripts.
 * Keep this module free of `server-only` and database imports so it can run
 * in seed/CLI scripts as well as in the Next.js runtime.
 */

/**
 * Strip Vietnamese diacritics and lowercase a string so names can be compared
 * and searched accent-insensitively. `đ`/`Đ` are handled explicitly because
 * NFD normalization does not decompose them.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[đ]/g, "d")
    .replace(/[Đ]/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Build a URL-safe slug from a Vietnamese string.
 * e.g. "Khoa Kế toán - Kiểm toán" -> "khoa-ke-toan-kiem-toan"
 */
export function slugify(input: string): string {
  return normalizeVietnamese(input)
    .replace(/[^a-z0-9\s-]/g, "") // drop punctuation
    .replace(/[\s-]+/g, "-") // collapse whitespace/dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
