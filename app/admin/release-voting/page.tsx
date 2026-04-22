import AdminDashboard from '@/components/AdminDashboard';
import { getConfigState } from '@/lib/supabaseAdmin';
import {
  filterVerifiedVotes,
  getCurrentRound,
  getVoteStats,
  getVotesForRound,
  leaderboardFromVotes,
  listRounds,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function AdminReleaseVotingPage() {
  const configState = getConfigState();
  const roundsResult = await listRounds(100);
  const currentRoundResult = await getCurrentRound();
  const currentVotesResult = currentRoundResult.data
    ? await getVotesForRound(currentRoundResult.data.id)
    : { data: [], error: null as string | null };

  const verifiedVotes = filterVerifiedVotes(currentVotesResult.data);
  const leaderboard = currentRoundResult.data
    ? leaderboardFromVotes(currentRoundResult.data.songs_json ?? [], verifiedVotes)
    : [];

  const combinedError = [roundsResult.error, currentRoundResult.error, currentVotesResult.error]
    .filter(Boolean)
    .join(' · ');

  return (
    <AdminDashboard
      configState={configState}
      rounds={roundsResult.data}
      currentRound={currentRoundResult.data}
      currentVotes={currentVotesResult.data}
      voteStats={getVoteStats(currentVotesResult.data)}
      leaderboard={leaderboard}
      loadError={combinedError || null}
    />
  );
}
