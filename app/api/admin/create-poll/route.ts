import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeSlug, parseSongList, PollStatus } from "@/lib/releaseVoting";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? "").trim());
  const description = String(formData.get("description") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "live").trim() as PollStatus;
  const startAt = String(formData.get("start_at") ?? "").trim();
  const endAt = String(formData.get("end_at") ?? "").trim();
  const placesCount = Number(formData.get("places_count") ?? 12);
  const songs = parseSongList(String(formData.get("songs") ?? ""));

  if (!title || !slug || !startAt || !endAt || songs.length === 0) {
    return NextResponse.redirect(new URL("/admin/release-voting", request.url));
  }

  if (songs.length < placesCount) {
    return NextResponse.redirect(new URL("/admin/release-voting", request.url));
  }

  const supabase = getSupabaseAdmin();

  if (status === "live") {
    await supabase.from("release_polls").update({ is_current: false }).eq("is_current", true);
  }

  await supabase.from("release_polls").insert({
    title,
    slug,
    description,
    status,
    start_at: startAt,
    end_at: endAt,
    places_count: placesCount,
    is_current: status === "live",
    songs_json: songs,
    ended_at: status === "ended" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null
  });

  revalidatePath("/admin/release-voting");
  revalidatePath("/release-voting");

  return NextResponse.redirect(new URL("/admin/release-voting", request.url));
}
