import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import {
  formatDateTime,
  getCurrentRound,
  getPublicRoundState,
  getVotesForRound,
  leaderboardFromVotes,
  publicStatusLabel,
  shuffleSongs,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function CurrentVotingPage() {
  const roundResult = await getCurrentRound();
  const round = roundResult.data;
  const publicState = getPublicRoundState(round);
  const votesResult = round ? await getVotesForRound(round.id) : { data: [], error: null as string | null };
  const leaderboard = round && publicState === 'ended' ? leaderboardFromVotes(round.songs_json ?? [], votesResult.data) : [];
  const shuffledSongs = round ? shuffleSongs(round.songs_json ?? []) : [];

  return (
    <main className="public-shell light-surface">
      <div className="public-stack page-width public-friendly-gap">
        <section className="hero-card public-hero public-hero-light">
          <BrandLogo />
          <div className="pill pill-soft">Publikums-Voting</div>
          <h1 className="hero-title public-hero-title">Knallhart serviert Publikums-Voting</h1>
          <p className="hero-copy public-hero-copy">
            Wähle deine Top 12. Platz 1 gibt die meisten Punkte, Platz 12 noch einen Punkt.
          </p>
        </section>

        {!round && (
          <section className="table-card elevated-card public-card-light">
            <div className="empty-state public-empty-state">
              Aktuell ist keine Abstimmung aktiv.
            </div>
          </section>
        )}

        {round && (
          <section className="public-single-column">
            <div className="table-card elevated-card public-card-light">
              <div className="section-head compact-gap">
                <div>
                  <h2 className="section-title">{round.title}</h2>
                  <p className="section-subtitle">{round.description || 'Wähle einfach deine 12 stärksten Songs.'}</p>
                </div>
                <div className={`status-chip ${publicState === 'live' ? 'live' : publicState === 'ended' ? 'ended' : 'draft'}`}>
                  {publicStatusLabel(publicState)}
                </div>
              </div>

              <div className="meta-grid public-meta-grid compact-meta-grid">
                <div className="notice notice-light compact-notice">
                  <div className="small-text">Zeitraum</div>
                  <div>{formatDateTime(round.start_at)} bis {formatDateTime(round.end_at)}</div>
                </div>
                <div className="notice notice-light compact-notice">
                  <div className="small-text">Songs</div>
                  <div>{round.songs_json?.length ?? 0}</div>
                </div>
                <div className="notice notice-light compact-notice">
                  <div className="small-text">Plätze</div>
                  <div>{round.places_count}</div>
                </div>
              </div>

              {publicState === 'upcoming' && (
                <div className="notice warn notice-light">
                  Diese Abstimmung startet am {formatDateTime(round.start_at)}.
                </div>
              )}

              {publicState === 'live' && (
                <PublicVotingForm
                  roundId={round.id}
                  roundTitle={round.title}
                  placesCount={round.places_count}
                  songs={shuffledSongs}
                />
              )}

              {publicState === 'ended' && (
                <div className="results-block">
                  <div className="section-head compact-gap">
                    <div>
                      <h3 className="section-title results-title">Endstand User-Voting</h3>
                      <p className="section-subtitle">Sortiert nach Gesamtpunkten. Der Durchschnitt bleibt zur Einordnung sichtbar.</p>
                    </div>
                  </div>

                  <div className="results-list compact-results-list">
                    {leaderboard.length === 0 && <div className="empty-state public-empty-state">Noch keine Stimmen vorhanden.</div>}
                    {leaderboard.map((row) => (
                      <div key={row.song} className="result-row result-row-light compact-result-row">
                        <div className="rank-badge rank-badge-light">{row.rank}</div>
                        <div className="result-main-line">
                          <span className="result-song-line">{row.title}{row.artist !== '—' ? ` — ${row.artist}` : ''}</span>
                        </div>
                        <div className="result-metric">
                          <div className="metric-label">Gesamt</div>
                          <div className="metric-value">{row.totalPoints}</div>
                        </div>
                        <div className="result-metric">
                          <div className="metric-label">Ø</div>
                          <div className="metric-value">{row.averagePoints.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
