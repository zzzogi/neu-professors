import { type NextRequest } from "next/server";
import { suggestLecturers } from "@/app/lib/search";

// Search suggestions must reflect current data on every keystroke.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const items = await suggestLecturers(q);
  return Response.json(items);
}
