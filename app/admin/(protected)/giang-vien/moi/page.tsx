import { createLecturer } from "@/app/lib/actions";
import { getAllFaculties, getAllMajors } from "@/app/lib/data";
import { LecturerForm } from "../lecturer-form";

export default async function NewLecturerPage() {
  const [faculties, majors] = await Promise.all([
    getAllFaculties(),
    getAllMajors(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Thêm giảng viên</h1>
      <LecturerForm
        action={createLecturer}
        faculties={faculties.map((f) => ({ id: f.id, name: f.name }))}
        majors={majors}
        submitLabel="Tạo hồ sơ"
      />
    </div>
  );
}
