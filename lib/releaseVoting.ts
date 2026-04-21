import { getSupabaseAdmin } from "./supabaseAdmin";

export type PollStatus = "draft" | "live" | "ended";

export type RankingItem = {
  song: string;
  points: number;
};

export type PollRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: PollStatus;
  is_current: boolean;
  start_at: string;
  end_at: string;
  places_count: number;
  songs_json: string[];
  created_at: string;
  ended_at: string | null;
};

export type VoteRow = {
  id: string;
  poll_id: string;
  juror_name: string;
  juror_instagram: string | null;
  ranking_json: RankingItem[];
  created_at: string;
};

export function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function parseSongList(input: string) {
  const seen = new Set<string>();

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function badgeClass(status: PollStatus) {
  if (status === "live") return "badge badge-live";
  if (status === "ended") return "badge badge-ended";
  return "badge badge-draft";
}

export function badgeText(status: PollStatus) {
  if (status === "live") return "Live";
  if (status === "ended") return "Beendet";
  return "Entwurf";
}

export async function getAllPolls() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("release_polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PollRow[];
}

export async function getCurrentPoll() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("release_polls")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as PollRow;

  const fallback = await supabase
    .from("release_polls")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.error) throw fallback.error;

  return (fallback.data ?? null) as PollRow | null;
}

export async function getPollBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("release_polls")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as PollRow | null;
}

export async function getVotesByPollId(pollId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("release_votes")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VoteRow[];
}

export function buildResults(poll: PollRow, votes: VoteRow[]) {
  const map = new Map<string, { totalPoints: number; voteCount: number }>();

  for (const song of poll.songs_json) {
    map.set(song, { totalPoints: 0, voteCount: 0 });
  }

  for (const vote of votes) {
    for (const item of vote.ranking_json ?? []) {
      if (!map.has(item.song)) continue;
      const entry = map.get(item.song)!;
      entry.totalPoints += Number(item.points || 0);
      entry.voteCount += 1;
    }
  }

  return Array.from(map.entries())
    .map(([song, value]) => ({
      song,
      totalPoints: value.totalPoints,
      voteCount: value.voteCount,
      averagePoints: value.voteCount > 0 ? Number((value.totalPoints / value.voteCount).toFixed(2)) : 0
    }))
    .sort((a, b) => {
      if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.song.localeCompare(b.song, "de");
    })
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}
