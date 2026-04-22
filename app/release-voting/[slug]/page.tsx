import { notFound } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import PublicVotingForm from '@/components/PublicVotingForm';
import {
  filterVerifiedVotes,
  formatDateTime,
  getPublicRoundState,
  getRoundBySlug,
  getVotesForRound,
  leaderboardFromVotes,
  publicStatusLabel,
  shuffleSongs,
} from '@/lib/releaseVoting';

export const dynamic = 'force-dynamic';

export default async function VotingBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const roundResult = await getRoundBySlug(slug);
  const round = roundResult.data;

  if (!round) {
    notFound();
  }

  const votesResult = await getVotesForRound(round.id);
  const verifiedVotes = filterVerifiedVotes(votesResult.data);
  const leaderboard = leaderboardFromVotes(round.songs_json ?? [], verifiedVotes);
  const publicState = getPublicRoundState(round);
  const shuffledSongs = shuffleSongs(round.songs_json ?? []);

  return (
    <main className="public-shell">
      <div className="public-stack page-width">
        <section className="hero-card public-hero public-hero-flat">
          <div className="public-hero-row">
            <BrandLogo compact />

            <div className="hero-main">
              <h1 className="hero-title hero-title-single-line">
                Knallhart serviert – Publikums Voting
              </h1>

              <p className="hero-copy public-hero-copy">
                Wähle deine Top 12. Deine Stimme zählt erst nach Bestätigung per E-Mail-Link.
              </p>

              <div className="public-inline-meta">
                <div className="meta-chip meta-chip-round">
                  <span className="small-text">Aktuelle Runde</span>
                  <strong>{round.title}</strong>
                </div>

                <div className="meta-chip">
                  <span className="small-text">Status</span>
                  <strong>{publicStatusLabel(publicState)}</strong>
                </div>

                <div className="meta-chip">
                  <span className="small-text">Zeitraum</span>
                  <strong>
                    {formatDateTime(round.start_at)} bis {formatDateTime(round.end_at)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {publicState === 'upcoming' && (
          <section className="table-card elevated-card public-live-card">
            <div className="empty-state">
              Die Abstimmung hat noch nicht begonnen. Bitte später noch einmal auf dieser Seite nachsehen.
            </div>
          </section>
        )}

        {publicState === 'live' && (
          <section className="table-card elevated-card public-live-card">
            <PublicVotingForm
              roundId={round.id}
              roundTitle={round.title}
              placesCount={round.places_count}
              songs={shuffledSongs}
            />
          </section>
        )}

        {publicState === 'ended' && (
          <section className="table-card elevated-card public-live-card">
            <div className="section-head compact-gap">
              <div>
                <h2 className="section-title">Endstand User-Voting</h2>
                <p className="section-subtitle">
                  Nur per Mail bestätigte Stimmen wurden gezählt.
                </p>
              </div>
            </div>

            {leaderboard.length === 0 && (
              <div className="empty-state">
                Noch keine bestätigten Stimmen vorhanden.
              </div>
            )}

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
