import { getConfigState, getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export type VoteItem = {
  song: string;
  points: number;
};

export type RoundRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'live' | 'ended';
  start_at: string;
  end_at: string;
  places_count: number;
  is_current: boolean;
  songs_json: string[];
  created_at: string;
  updated_at: string;
  ended_at: string | null;
};

export type VoteRow = {
  id: string;
  round_id: string;
  juror_name: string | null;
  juror_email: string | null;
  juror_instagram: string | null;
  ranking_json: VoteItem[];
  created_at: string;
  updated_at: string;
};

export type LeaderboardRow = {
  rank: number;
  song: string;
  title: string;
  artist: string;
  totalPoints: number;
  voteCount: number;
  averagePoints: number;
};

export type PublicRoundState = 'draft' | 'upcoming' | 'live' | 'ended';

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function parseSongList(raw: string) {
  const seen = new Set<string>();

  return raw
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

export function splitSong(entry: string) {
  const normalized = entry.trim();
  const separatorMatch = normalized.match(/\s[–-]\s/);

  if (!separatorMatch) {
    return { full: normalized, title: normalized, artist: '—' };
  }

  const separator = separatorMatch[0];
  const [title, ...rest] = normalized.split(separator);

  return {
    full: normalized,
    title: title.trim(),
    artist: rest.join(separator).trim() || '—',
  };
}

export function combineSongLine(entry: string) {
  const parts = splitSong(entry);
  return parts.artist === '—' ? parts.title : `${parts.title} — ${parts.artist}`;
}

export function normalizeDateTimeValue(value: string | null | undefined) {
  if (!value) return '';
  return value.trim().replace(' ', 'T').slice(0, 16);
}

export function formatDateTime(value: string | null | undefined) {
  const normalized = normalizeDateTimeValue(value);
  if (!normalized) return '—';

  const [datePart, timePart = '00:00'] = normalized.split('T');
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return value ?? '—';

  return `${day}.${month}.${year}, ${timePart}`;
}

export function statusLabel(status: RoundRow['status']) {
  if (status === 'live') return 'Live';
  if (status === 'ended') return 'Beendet';
  return 'Entwurf';
}

export function publicStatusLabel(state: PublicRoundState) {
  if (state === 'live') return 'Live';
  if (state === 'ended') return 'Beendet';
  if (state === 'upcoming') return 'Startet bald';
  return 'Entwurf';
}

export function createPublicRoundPath(slug: string) {
  return `/release-voting/${slug}`;
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createRoundDatePreset(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const displayDate = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  const title = `Neue Songs der Woche ${displayDate}`;
  const slug = `neue-songs-${isoDate}`;
  return { title, slug, displayDate, isoDate };
}

export function getBerlinNowLocalValue() {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date()).replace(' ', 'T');
}

export function getPublicRoundState(round: RoundRow | null | undefined): PublicRoundState {
  if (!round) return 'draft';
  if (round.status === 'ended') return 'ended';
  if (round.status === 'draft') return 'draft';

  const now = getBerlinNowLocalValue();
  const start = normalizeDateTimeValue(round.start_at);
  const end = normalizeDateTimeValue(round.end_at);

  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  return 'live';
}

export function shuffleSongs(songs: string[]) {
  const next = [...songs];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }
  return next;
}

export function leaderboardFromVotes(songs: string[], votes: VoteRow[]): LeaderboardRow[] {
  const map = new Map<string, { totalPoints: number; voteCount: number }>();
  songs.forEach((song) => map.set(song, { totalPoints: 0, voteCount: 0 }));

  for (const vote of votes) {
    const ranking = Array.isArray(vote.ranking_json) ? vote.ranking_json : [];
    for (const item of ranking) {
      const song = typeof item.song === 'string' ? item.song.trim() : '';
      const points = Number(item.points);
      if (!song || !map.has(song) || !Number.isFinite(points)) continue;
      const current = map.get(song)!;
      current.totalPoints += points;
      current.voteCount += 1;
    }
  }

  return Array.from(map.entries())
    .map(([song, value]) => {
      const parts = splitSong(song);
      return {
        song,
        title: parts.title,
        artist: parts.artist,
        totalPoints: value.totalPoints,
        voteCount: value.voteCount,
        averagePoints: value.voteCount > 0 ? Number((value.totalPoints / value.voteCount).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.song.localeCompare(b.song, 'de');
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function listRounds(limit = 100) {
  const configState = getConfigState();
  if (!configState.ok) return { data: [] as RoundRow[], error: configState.message };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as RoundRow[], error: 'Supabase-Client konnte nicht erstellt werden.' };

  const { data, error } = await supabase
    .from('release_voting_rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [] as RoundRow[], error: error.message };
  return { data: (data ?? []) as RoundRow[], error: null as string | null };
}

export async function getCurrentRound() {
  const configState = getConfigState();
  if (!configState.ok) return { data: null as RoundRow | null, error: configState.message };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: null as RoundRow | null, error: 'Supabase-Client konnte nicht erstellt werden.' };

  const first = await supabase
    .from('release_voting_rounds')
    .select('*')
    .eq('is_current', true)
    .maybeSingle();

  if (first.error) return { data: null as RoundRow | null, error: first.error.message };
  if (first.data) return { data: first.data as RoundRow, error: null as string | null };

  const second = await supabase
    .from('release_voting_rounds')
    .select('*')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (second.error) return { data: null as RoundRow | null, error: second.error.message };
  return { data: (second.data as RoundRow | null) ?? null, error: null as string | null };
}

export async function getRoundBySlug(slug: string) {
  const configState = getConfigState();
  if (!configState.ok) return { data: null as RoundRow | null, error: configState.message };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: null as RoundRow | null, error: 'Supabase-Client konnte nicht erstellt werden.' };

  const { data, error } = await supabase
    .from('release_voting_rounds')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return { data: null as RoundRow | null, error: error.message };
  return { data: (data as RoundRow | null) ?? null, error: null as string | null };
}

export async function getVotesForRound(roundId: string) {
  const configState = getConfigState();
  if (!configState.ok) return { data: [] as VoteRow[], error: configState.message };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as VoteRow[], error: 'Supabase-Client konnte nicht erstellt werden.' };

  const { data, error } = await supabase
    .from('release_voting_votes')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: false });

  if (error) return { data: [] as VoteRow[], error: error.message };
  return { data: (data ?? []) as VoteRow[], error: null as string | null };
}
