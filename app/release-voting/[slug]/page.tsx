import { notFound } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import { formatDateTime, getRoundBySlug, getVotesForRound, leaderboardFromVotes, statusLabel } from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function VotingBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roundResult = await getRoundBySlug(slug);
  const round = roundResult.data;

  if (!round) {
    notFound();
  }

  const votesResult = await getVotesForRound(round.id);
  const leaderboard = leaderboardFromVotes(round.songs_json ?? [], votesResult.data);

  return (
    <main className="public-shell">
      <div className="public-stack page-width">
        <section className="hero-card public-hero compact-hero">
          <BrandLogo compact />
          <div className="pill">Direktlink zur Umfrage</div>
          <h1 className="hero-title">{round.title}</h1>
          <p className="hero-copy">{round.description || 'Bewerte die Songs dieser Runde.'}</p>
        </section>

        <div className="public-grid">
          <section className="table-card elevated-card">
            <div className="meta-grid public-meta-grid">
              <div className="notice">
                <div className="small-text">Status</div>
                <div>{statusLabel(round.status)}</div>
              </div>
              <div className="notice">
                <div className="small-text">Start</div>
                <div>{formatDateTime(round.start_at)}</div>
              </div>
              <div className="notice">
                <div className="small-text">Ende</div>
                <div>{formatDateTime(round.end_at)}</div>
              </div>
            </div>

            <PublicVotingForm roundId={round.id} roundTitle={round.title} placesCount={round.places_count} songs={round.songs_json ?? []} />
          </section>

          <aside className="table-card elevated-card">
            <div className="section-head compact-gap">
              <div>
                <h2 className="section-title">Zwischenstand</h2>
                <p className="section-subtitle">Aktualisiert nach jeder abgegebenen Stimme.</p>
              </div>
            </div>

            {leaderboard.length === 0 && <div className="empty-state">Noch keine Stimmen abgegeben.</div>}
            {leaderboard.length > 0 && (
              <div className="results-list">
                {leaderboard.map((row) => (
                  <div className="result-row" key={row.song}>
                    <div className="rank-badge">{row.rank}</div>
                    <div>
                      <div className="song-name">{row.title}</div>
                      <div className="song-artist">{row.artist}</div>
                    </div>
                    <div>
                      <div className="small-text">Ø Punkte</div>
                      <div>{row.averagePoints.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="small-text">Gesamt</div>
                      <div>{row.totalPoints}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
