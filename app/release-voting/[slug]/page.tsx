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
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function VotingBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roundResult = await getRoundBySlug(slug);
  const round = roundResult.data;

  if (!round) {
    notFound();
  }

  const publicState = getPublicRoundState(round);
  const votesResult = await getVotesForRound(round.id);
  const leaderboard = publicState === 'ended' ? leaderboardFromVotes(round.songs_json ?? [], votesResult.data) : [];

  return (
    <main className="public-shell light-surface">
      <div className="public-stack page-width public-friendly-gap">
        <section className="hero-card public-hero public-hero-light compact-hero-light">
          <BrandLogo compact />
          <div className="pill pill-soft">Direktlink zur Umfrage</div>
          <h1 className="hero-title public-hero-title">{round.title}</h1>
          <p className="hero-copy public-hero-copy">{round.description || 'Bewerte die Songs dieser Runde.'}</p>
        </section>

        <section className="public-single-column">
          <section className="table-card elevated-card public-card-light">
            <div className="meta-grid public-meta-grid public-meta-light">
              <div className="notice notice-light">
                <div className="small-text">Status</div>
                <div>{publicStatusLabel(publicState)}</div>
              </div>
              <div className="notice notice-light">
                <div className="small-text">Start</div>
                <div>{formatDateTime(round.start_at)}</div>
              </div>
              <div className="notice notice-light">
                <div className="small-text">Ende</div>
                <div>{formatDateTime(round.end_at)}</div>
              </div>
            </div>

            {publicState === 'upcoming' && (
              <div className="notice warn notice-light soft-warning">
                Die Abstimmung startet am <strong>{formatDateTime(round.start_at)}</strong>.
              </div>
            )}

            {publicState === 'live' && (
              <PublicVotingForm roundId={round.id} roundTitle={round.title} placesCount={round.places_count} songs={round.songs_json ?? []} />
            )}

            {publicState === 'ended' && (
              <div className="form-stack">
                <div className="notice success notice-light">
                  Die Abstimmung ist beendet. Hier siehst du den finalen Endstand des User-Votings.
                </div>
                <section className="table-card result-card-light">
                  <div className="section-head compact-gap">
                    <div>
                      <h3 className="section-title">Endstand User-Voting</h3>
                      <p className="section-subtitle">Keine Zwischenstände während der laufenden Abstimmung – nur der finale Endstand.</p>
                    </div>
                  </div>

                  {leaderboard.length === 0 && <div className="empty-state public-empty-state">Noch keine Stimmen abgegeben.</div>}
                  {leaderboard.length > 0 && (
                    <div className="results-list results-list-light">
                      {leaderboard.map((row) => (
                        <div className="result-row result-row-light" key={row.song}>
                          <div className="rank-badge rank-badge-light">{row.rank}</div>
                          <div className="result-main-line">
                            <div className="song-line compact-song-line">{row.title} — {row.artist}</div>
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
                </section>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
