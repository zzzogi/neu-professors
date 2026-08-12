import bcrypt from "bcryptjs";

/**
 * Generate a bcrypt hash for the admin password.
 * Usage: npm run hash-password -- "your-plaintext-password"
 */
async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Cách dùng: npm run hash-password -- "mat-khau-cua-ban"');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  // Base64-encode so the value is safe from Next.js `.env` `$`-expansion, which
  // would otherwise corrupt the bcrypt hash. The app decodes it at login time.
  const encoded = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nDán dòng sau vào .env.local:");
  console.log("ADMIN_PASSWORD_HASH=" + JSON.stringify(encoded) + "\n");
}

main();
