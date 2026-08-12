import "server-only";
import { put } from "@vercel/blob";
import { slugify } from "@/app/lib/text";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PDF_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function uploadFile(
  file: File | null,
  {
    folder,
    nameHint,
    allowed,
    maxBytes,
    typeError,
    sizeError,
  }: {
    folder: string;
    nameHint: string;
    allowed: string[];
    maxBytes: number;
    typeError: string;
    sizeError: string;
  },
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!allowed.includes(file.type)) throw new Error(typeError);
  if (file.size > maxBytes) throw new Error(sizeError);

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const base = slugify(nameHint) || "file";
  const pathname = `${folder}/${base}-${Date.now()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

/** Upload a lecturer photo. Returns null if no file was provided. */
export function uploadPhoto(
  file: File | null,
  nameHint: string,
): Promise<string | null> {
  return uploadFile(file, {
    folder: "lecturers",
    nameHint,
    allowed: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
    typeError: "Ảnh phải có định dạng JPG, PNG hoặc WEBP.",
    sizeError: "Ảnh vượt quá dung lượng tối đa 5MB.",
  });
}

/** Upload a faculty/department logo. Returns null if no file was provided. */
export function uploadFacultyLogo(
  file: File | null,
  nameHint: string,
): Promise<string | null> {
  return uploadFile(file, {
    folder: "faculties",
    nameHint,
    allowed: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
    typeError: "Logo phải có định dạng JPG, PNG hoặc WEBP.",
    sizeError: "Logo vượt quá dung lượng tối đa 5MB.",
  });
}

/** Upload a research-background PDF. Returns null if no file was provided. */
export function uploadPdf(
  file: File | null,
  nameHint: string,
): Promise<string | null> {
  return uploadFile(file, {
    folder: "research",
    nameHint,
    allowed: ["application/pdf"],
    maxBytes: PDF_MAX_BYTES,
    typeError: "Tệp lý lịch khoa học phải có định dạng PDF.",
    sizeError: "Tệp PDF vượt quá dung lượng tối đa 10MB.",
  });
}
