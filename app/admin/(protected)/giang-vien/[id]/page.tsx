import { notFound } from "next/navigation";
import { updateLecturer } from "@/app/lib/actions";
import {
  getAllFaculties,
  getAllMajors,
  getLecturerById,
  getLecturerMajorIds,
} from "@/app/lib/data";
import { LecturerForm } from "../lecturer-form";

export default async function EditLecturerPage(
  props: PageProps<"/admin/giang-vien/[id]">,
) {
  const { id } = await props.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) notFound();

  const [lecturer, faculties, majors, majorIds] = await Promise.all([
    getLecturerById(numId),
    getAllFaculties(),
    getAllMajors(),
    getLecturerMajorIds(numId),
  ]);

  if (!lecturer) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Sửa hồ sơ: {lecturer.fullName}</h1>
      <LecturerForm
        action={updateLecturer}
        faculties={faculties.map((f) => ({ id: f.id, name: f.name }))}
        majors={majors}
        initial={{ ...lecturer, majorIds }}
        submitLabel="Lưu thay đổi"
      />
    </div>
  );
}
