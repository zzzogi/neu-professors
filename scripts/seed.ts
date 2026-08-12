import { config } from "dotenv";
config({ path: ".env.local" }); // Next.js convention; loaded first
config(); // fallback to .env (does not override already-set vars)
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { faculties } from "../app/lib/db/schema";
import { slugify } from "../app/lib/text";

/**
 * Teaching faculties/institutes (khoa & viện đào tạo) of the National Economics
 * University, sourced from https://neu.edu.vn/cac-don-vi-thuoc-truong/.
 * Grouped by member school for readability; grouping is not persisted (v1).
 * Departments (bộ môn) are added by admins after seeding.
 */
const NEU_FACULTIES: string[] = [
  // Trường Kinh tế và Quản lý công
  "Khoa Đầu tư",
  "Khoa Kinh tế học",
  "Khoa Khoa học quản lý",
  "Khoa Kế hoạch và Phát triển",
  "Khoa Luật",
  "Khoa Lý luận chính trị",
  "Khoa Môi trường, Biến đổi khí hậu và Đô thị",
  "Khoa Ngoại ngữ kinh tế",
  // Trường Kinh doanh
  "Khoa Bảo hiểm",
  "Khoa Bất động sản và Kinh tế tài nguyên",
  "Khoa Du lịch và Khách sạn",
  "Khoa Kinh tế và Quản lý nguồn nhân lực",
  "Khoa Marketing",
  "Khoa Quản trị kinh doanh",
  "Viện Quản trị kinh doanh",
  "Viện Thương mại và Kinh tế Quốc tế",
  // Trường Công nghệ
  "Khoa Công nghệ thông tin",
  "Khoa Hệ thống thông tin quản lý",
  "Khoa Khoa học cơ sở",
  "Khoa Khoa học dữ liệu và Trí tuệ nhân tạo",
  "Khoa Thống kê",
  "Khoa Toán kinh tế",
  // Viện chuyên ngành
  "Viện Kế toán - Kiểm toán",
  "Viện Ngân hàng - Tài chính",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa được cấu hình.");

  const sql = neon(url);
  const db = drizzle(sql);

  console.log(`Đang seed ${NEU_FACULTIES.length} khoa/viện...`);
  const rows = NEU_FACULTIES.map((name) => ({ name, slug: slugify(name) }));

  await db.insert(faculties).values(rows).onConflictDoNothing({
    target: faculties.slug,
  });

  console.log("Hoàn tất seed khoa/viện.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
