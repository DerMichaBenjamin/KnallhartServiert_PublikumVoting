import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import {
  createPublicRoundPath,
  filterVerifiedVotes,
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
  const votesResult = round
    ? await getVotesForRound(round.id)
    : { data: [], error: null as string | null };
  const verifiedVotes = filterVerifiedVotes(votesResult.data);
  const leaderboard = round ? leaderboardFromVotes(round.songs_json ?? [], verifiedVotes) : [];

  if (!round) {
    return (
      <main className="public-shell">
        <section className="hero-card public-hero">
          <BrandLogo />
          <div className="pill">Knallhart serviert Publikums-Voting</div>
          <h1 className="hero-title">Aktuell keine Umfrage live</h1>
          <p className="hero-copy">Sobald die nächste Runde startet, erscheint sie automatisch hier.</p>
        </section>
      </main>
    );
  }

  const publicState = getPublicRoundState(round);
  const shuffledSongs = shuffleSongs(round.songs_json ?? []);

  return (
    <main className="public-shell">
      <div className="public-stack page-width">
        <section className="hero-card public-hero">
          <BrandLogo />
          <div className="pill">Knallhart serviert Publikums-Voting</div>
          <h1 className="hero-title">Knallhart serviert Publikums-Voting</h1>
          <p className="hero-copy">
            Wähle deine Top 12. Deine Stimme zählt erst nach Bestätigung per E-Mail-Link.
          </p>
        </section>

        <section className="table-card elevated-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">{round.title}</h2>
              <p className="section-subtitle">
                {round.description || 'Wähle deine Favoriten dieser Runde.'}
              </p>
            </div>
          </div>

          <div className="meta-grid public-meta-grid">
            <div className="notice">
              <div className="small-text">Status</div>
              <div>{publicStatusLabel(publicState)}</div>
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
        </section>

        {publicState === 'upcoming' && (
          <section className="table-card elevated-card">
            <div className="empty-state">Die Abstimmung startet bald. Bitte schau später noch einmal vorbei.</div>
          </section>
        )}

        {publicState === 'live' && (
          <section className="table-card elevated-card">
            <PublicVotingForm
              roundId={round.id}
              roundTitle={round.title}
              placesCount={round.places_count}
              songs={shuffledSongs}
            />
          </section>
        )}

        {publicState === 'ended' && (
          <section className="table-card elevated-card">
            <div className="section-head compact-gap">
              <div>
                <h2 className="section-title">Endstand User-Voting</h2>
                <p className="section-subtitle">
                  Berücksichtigt werden nur per E-Mail bestätigte Stimmen.
                </p>
              </div>
            </div>

            {leaderboard.length === 0 && <div className="empty-state">Noch keine bestätigten Stimmen vorhanden.</div>}
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
                      <div className="small-text">Gesamt</div>
                      <div>{row.totalPoints}</div>
                    </div>
                    <div>
                      <div className="small-text">Ø Punkte</div>
                      <div>{row.averagePoints.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
