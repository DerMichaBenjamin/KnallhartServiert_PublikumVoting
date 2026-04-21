import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import { createPublicRoundPath, formatDateTime, getCurrentRound, getVotesForRound, leaderboardFromVotes, statusLabel } from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function CurrentVotingPage() {
  const roundResult = await getCurrentRound();
  const round = roundResult.data;
  const votesResult = round ? await getVotesForRound(round.id) : { data: [], error: null as string | null };
  const leaderboard = round ? leaderboardFromVotes(round.songs_json ?? [], votesResult.data) : [];

  return (
    <main className="public-shell">
      <div className="public-stack page-width">
        <section className="hero-card public-hero">
          <BrandLogo />
          <div className="pill">Publikum & Jury Voting</div>
          <h1 className="hero-title">Aktuelle Knallhart-Serviert-Abstimmung</h1>
          <p className="hero-copy">
            Stimme übersichtlich und fair ab. Die Punktzahlen sind bereits fest an die Plätze gebunden – so kann jede Wertung nur einmal vergeben werden.
          </p>
        </section>

        {!round && (
          <section className="table-card elevated-card">
            <div className="empty-state">
              Aktuell ist keine Umfrage live. Bitte später noch einmal auf dieser Seite nachsehen.
            </div>
          </section>
        )}

        {round && (
          <div className="public-grid">
            <section className="table-card elevated-card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">{round.title}</h2>
                  <p className="section-subtitle">{round.description || 'Bewerte deine persönlichen Favoriten dieser Runde.'}</p>
                </div>
              </div>

              <div className="meta-grid public-meta-grid">
                <div className="notice">
                  <div className="small-text">Status</div>
                  <div>{statusLabel(round.status)}</div>
                </div>
                <div className="notice">
                  <div className="small-text">Zeitraum</div>
                  <div>{formatDateTime(round.start_at)} bis {formatDateTime(round.end_at)}</div>
                </div>
                <div className="notice">
                  <div className="small-text">Direktlink</div>
                  <div className="mono">{createPublicRoundPath(round.slug)}</div>
                </div>
              </div>

              <PublicVotingForm roundId={round.id} roundTitle={round.title} placesCount={round.places_count} songs={round.songs_json ?? []} />
            </section>

            <aside className="table-card elevated-card">
              <div className="section-head compact-gap">
                <div>
                  <h2 className="section-title">Zwischenstand</h2>
                  <p className="section-subtitle">Sortiert nach Durchschnittspunkten.</p>
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
        )}
      </div>
    </main>
  );
}
