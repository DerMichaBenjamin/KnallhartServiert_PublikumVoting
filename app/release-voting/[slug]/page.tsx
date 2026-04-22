import { notFound } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import {
  formatDateTime,
  getPublicRoundState,
  getRoundBySlug,
  getVotesForRound,
  leaderboardFromVotes,
  publicStatusLabel,
  shuffleSongs,
  splitSong,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function ReleaseVotingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: round } = await getRoundBySlug(slug);

  if (!round) {
    notFound();
  }

  const { data: allVotes } = await getVotesForRound(round.id);
  const verifiedVotes = (allVotes ?? []).filter((vote: any) => vote?.is_verified === true);
  const publicState = getPublicRoundState(round);
  const leaderboard =
    publicState === 'ended'
      ? leaderboardFromVotes(round.songs_json, verifiedVotes as any)
      : [];

  return (
    <main className="public-shell public-shell-super-compact">
      <section className="public-top-strip">
        <div className="public-top-strip-left">
          <BrandLogo />
          <div className="public-top-strip-copy">
            <h1 className="public-top-title">Knallhart serviert Publikums-Voting</h1>
            <div className="public-top-sub">{round.title}</div>
          </div>
        </div>

        <div className="public-top-meta compact-meta-group">
          <span className={`status-chip ${publicState === 'upcoming' ? 'draft' : publicState}`}>
            {publicStatusLabel(publicState)}
          </span>
          <span className="meta-pill">Start: {formatDateTime(round.start_at)}</span>
          <span className="meta-pill">Ende: {formatDateTime(round.end_at)}</span>
        </div>
      </section>

      {publicState === 'upcoming' && (
        <div className="notice warn compact-page-notice">
          Diese Abstimmung ist angelegt, startet aber noch nicht.
        </div>
      )}

      {publicState === 'draft' && (
        <div className="notice warn compact-page-notice">
          Diese Abstimmung ist noch nicht freigeschaltet.
        </div>
      )}

      {publicState === 'live' && (
        <section className="table-card public-card-soft public-vote-main-card">
          <PublicVotingForm
            roundId={round.id}
            roundTitle={round.title}
            placesCount={round.places_count}
            songs={shuffleSongs(round.songs_json)}
          />
        </section>
      )}

      {publicState === 'ended' && (
        <section className="table-card public-card-soft public-results-card">
          <div className="section-head compact-gap">
            <div>
              <h2 className="section-title compact-title">Endstand User-Voting</h2>
              <p className="section-subtitle compact-subtitle">
                Gezählt werden nur per E-Mail bestätigte Stimmen.
              </p>
            </div>
            <div className="progress-pill neutral">
              {verifiedVotes.length} bestätigt
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Song</th>
                  <th>Gesamt</th>
                  <th>Ø Punkte</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">Noch keine bestätigten Stimmen vorhanden.</div>
                    </td>
                  </tr>
                )}

                {leaderboard.map((row) => {
                  const parts = splitSong(row.song);
                  return (
                    <tr key={row.song}>
                      <td>{row.rank}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{parts.title}</div>
                        <div className="small-text">{parts.artist}</div>
                      </td>
                      <td>{row.totalPoints}</td>
                      <td>{row.averagePoints.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
