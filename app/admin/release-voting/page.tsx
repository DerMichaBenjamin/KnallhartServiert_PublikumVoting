import AdminDashboard from '@/components/AdminDashboard';
import { getConfigState } from '@/lib/supabaseAdmin';
import {
  filterVerifiedVotes,
  getCurrentRound,
  getImprintSettings,
  getVoteStats,
  getVotesForRound,
  leaderboardFromVotes,
  listRounds,
  zonkLeaderboardFromVotes,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function AdminReleaseVotingPage() {
  const configState = getConfigState();
  const roundsResult = await listRounds();
  const currentRoundResult = await getCurrentRound();
  const currentRound = currentRoundResult.data;
  const votesResult = currentRound ? await getVotesForRound(currentRound.id) : { data: [], error: null as string | null };
  const currentVotes = votesResult.data ?? [];
  const verifiedVotes = filterVerifiedVotes(currentVotes);
  const voteStats = getVoteStats(currentVotes);
  const leaderboard = currentRound ? leaderboardFromVotes(currentRound.songs_json, verifiedVotes) : [];
  const zonkLeaderboard = currentRound ? zonkLeaderboardFromVotes(currentRound.songs_json, verifiedVotes) : [];
  const imprintResult = await getImprintSettings();
  const loadError = roundsResult.error || currentRoundResult.error || votesResult.error || imprintResult.error || null;

  return (
    <AdminDashboard
      configState={configState}
      rounds={roundsResult.data ?? []}
      currentRound={currentRound}
      currentVotes={currentVotes}
      voteStats={voteStats}
      leaderboard={leaderboard}
      zonkLeaderboard={zonkLeaderboard}
      imprintSettings={imprintResult.data}
      loadError={loadError}
    />
  );
}
