import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import {
  formatDateTime,
  getCurrentRound,
  getPublicRoundState,
  getVotesForRound,
  leaderboardFromVotes,
  publicStatusLabel,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function CurrentVotingPage() {
  const roundResult = await getCurrentRound();
  const round = roundResult.data;
  const publicState = getPublicRoundState(round);
  const votesResult = round ? await getVotesForRound(round.id) : { data: [], error: null as string | null };
  const leaderboard = round && publicState === 'ended' ? leaderboardFromVotes(round.songs_json ?? [], votesResult.data) : [];

  return (
    <main className="public-shell light-surface">
      <div className="public-stack page-width public-friendly-gap">
        <section className="hero-card public-hero public-hero-light">
          <BrandLogo />
          <div className="pill pill-soft">Publikums- & Jury-Voting</div>
          <h1 className="hero-title public-hero-title">Aktuelle Knallhart-Serviert-Abstimmung</h1>
          <p className="hero-copy public-hero-copy">
            Stimme einfach, fair und übersichtlich ab. Deine 12 Plätze vergeben automatisch 12 bis 1 Punkte – dadurch kann jede Punktzahl nur einmal vorkommen.
          </p>
        </section>

        {!round && (
          <section className="table-card elevated-card public-card-light">
            <div className="empty-state public-empty-state">
              Aktuell ist keine Umfrage live. Bitte später noch einmal auf dieser Seite nachsehen.
            </div>
          </section>
        )}

        {round && (
          <section className="public-single-column">
            <section className="table-card elevated-card public-card-light">
              <div className="section-head public-header-block">
                <div>
                  <h2 className="section-title">{round.title}</h2>
                  <p className="section-subtitle">{round.description || 'Bewerte die stärksten neuen Releases der Woche.'}</p>
                </div>
              </div>

              <div className="meta-grid public-meta-grid public-meta-light">
                <div className="notice notice-light">
                  <div className="small-text">Status</div>
                  <div>{publicStatusLabel(publicState)}</div>
                </div>
                <div className="notice notice-light">
                  <div className="small-text">Zeitraum</div>
                  <div>{formatDateTime(round.start_at)} bis {formatDateTime(round.end_at)}</div>
                </div>
                <div className="notice notice-light">
                  <div className="small-text">Teilnahme</div>
                  <div>{round.places_count} Songs ranken</div>
                </div>
              </div>

              {publicState === 'upcoming' && (
                <div className="notice warn notice-light soft-warning">
                  Die Abstimmung startet am <strong>{formatDateTime(round.start_at)}</strong>.
                </div>
              )}

              {publicState === 'live' && (
                <PublicVotingForm
                  roundId={round.id}
                  roundTitle={round.title}
                  placesCount={round.places_count}
                  songs={round.songs_json ?? []}
                />
              )}

              {publicState === 'ended' && (
                <div className="form-stack">
                  <div className="notice success notice-light">
                    Die Abstimmung ist beendet. Unten siehst du den finalen Endstand des User-Votings.
                  </div>
                  <section className="table-card result-card-light">
                    <div className="section-head compact-gap">
                      <div>
                        <h3 className="section-title">Endstand User-Voting</h3>
                        <p className="section-subtitle">Sortiert nach Durchschnittspunkten, danach Gesamtpunkten und Anzahl der Wertungen.</p>
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
        )}
      </div>
    </main>
  );
}
