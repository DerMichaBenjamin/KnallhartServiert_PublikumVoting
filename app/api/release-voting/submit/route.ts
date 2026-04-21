import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PollRow, RankingItem } from "@/lib/releaseVoting";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pollId?: string;
      jurorName?: string;
      jurorInstagram?: string;
      ranking?: RankingItem[];
    };

    const pollId = String(body.pollId ?? "").trim();
    const jurorName = String(body.jurorName ?? "").trim();
    const jurorInstagram = String(body.jurorInstagram ?? "").trim() || null;
    const ranking = Array.isArray(body.ranking) ? body.ranking : [];

    if (!pollId || !jurorName || ranking.length === 0) {
      return NextResponse.json({ ok: false, error: "Fehlende Daten." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const pollResult = await supabase
      .from("release_polls")
      .select("*")
      .eq("id", pollId)
      .maybeSingle();

    if (pollResult.error || !pollResult.data) {
      return NextResponse.json({ ok: false, error: "Umfrage nicht gefunden." }, { status: 404 });
    }

    const poll = pollResult.data as PollRow;

    if (poll.status !== "live") {
      return NextResponse.json({ ok: false, error: "Diese Umfrage ist nicht live." }, { status: 400 });
    }

    const validSongs = new Set(poll.songs_json);
    const uniquePoints = new Set<number>();

    for (const item of ranking) {
      if (!validSongs.has(item.song)) {
        return NextResponse.json({ ok: false, error: `Unbekannter Song: ${item.song}` }, { status: 400 });
      }
      if (!Number.isInteger(item.points) || item.points < 1 || item.points > poll.places_count) {
        return NextResponse.json({ ok: false, error: "Ungültige Punktzahl." }, { status: 400 });
      }
      uniquePoints.add(item.points);
    }

    if (uniquePoints.size !== poll.places_count || ranking.length !== poll.places_count) {
      return NextResponse.json(
        { ok: false, error: `Bitte genau ${poll.places_count} eindeutige Punktewerte vergeben.` },
        { status: 400 }
      );
    }

    const insertResult = await supabase.from("release_votes").insert({
      poll_id: pollId,
      juror_name: jurorName,
      juror_instagram: jurorInstagram,
      ranking_json: ranking
    });

    if (insertResult.error) {
      return NextResponse.json({ ok: false, error: insertResult.error.message }, { status: 500 });
    }

    revalidatePath("/admin/release-voting");
    revalidatePath("/release-voting");
    revalidatePath(`/release-voting/${poll.slug}`);

    return NextResponse.json({ ok: true, message: "Deine Wertung wurde gespeichert." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler."
      },
      { status: 500 }
    );
  }
}
