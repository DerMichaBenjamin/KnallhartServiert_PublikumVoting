import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const pollId = String(formData.get("poll_id") ?? "").trim();

  if (!pollId) {
    return NextResponse.redirect(new URL("/admin/release-voting", request.url));
  }

  const supabase = getSupabaseAdmin();
  await supabase
    .from("release_polls")
    .update({
      status: "ended",
      is_current: false,
      ended_at: new Date().toISOString().slice(0, 19).replace("T", " ")
    })
    .eq("id", pollId);

  revalidatePath("/admin/release-voting");
  revalidatePath("/release-voting");

  return NextResponse.redirect(new URL("/admin/release-voting", request.url));
}
