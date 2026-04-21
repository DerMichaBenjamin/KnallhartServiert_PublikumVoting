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
  await supabase.from("release_polls").update({ is_current: false }).eq("is_current", true);
  await supabase
    .from("release_polls")
    .update({ status: "live", is_current: true })
    .eq("id", pollId);

  revalidatePath("/admin/release-voting");
  revalidatePath("/release-voting");

  return NextResponse.redirect(new URL("/admin/release-voting", request.url));
}
