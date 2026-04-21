export const dynamic = "force-dynamic";

import Link from "next/link";
import PublicVotingForm from "@/components/PublicVotingForm";
import { badgeClass, badgeText, formatDateTime, getCurrentPoll } from "@/lib/releaseVoting";

export default async function ReleaseVotingPage() {
  const poll = await getCurrentPoll();

  return (
    <main className="page">
      <div className="hero">
        <div>
          <div className="small-label">Öffentliche Seite</div>
          <h1>Release Voting</h1>
          <p>
            Hier sehen alle Juroren sofort die aktuell gesetzte Runde. Es gibt keine zweite,
            abweichende Status-Logik. Was im Admin als aktuelle Live-Runde gesetzt wird, erscheint
            genau hier.
          </p>
        </div>
        <Link className="topbar-link" href="/admin/release-voting">
          Zum Admin-Bereich
        </Link>
      </div>

      {!poll ? (
        <div className="card">
          <h2>Momentan keine aktive Umfrage</h2>
          <p className="muted">Im Admin wurde noch keine aktuelle Live-Runde gesetzt.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-3" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="small-label">Aktuelle Runde</div>
              <div className="metric">{poll.title}</div>
            </div>
            <div className="card">
              <div className="small-label">Status</div>
              <div style={{ marginTop: 10 }}>
                <span className={badgeClass(poll.status)}>{badgeText(poll.status)}</span>
              </div>
            </div>
            <div className="card">
              <div className="small-label">Voting läuft bis</div>
              <div className="metric">{formatDateTime(poll.end_at)}</div>
            </div>
          </section>

          <section className="grid grid-2">
            <div className="card">
              <h2>{poll.title}</h2>
              <p className="muted">{poll.description || "Keine Beschreibung eingetragen."}</p>
              <div style={{ marginTop: 16 }}>
                <div className="small-label">Direkter Link zu dieser Runde</div>
                <div style={{ fontWeight: 700 }}>/release-voting/{poll.slug}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="small-label">Start</div>
                <div>{formatDateTime(poll.start_at)}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="small-label">Ende</div>
                <div>{formatDateTime(poll.end_at)}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="small-label">Songs</div>
                <div>{poll.songs_json.length}</div>
              </div>
            </div>

            <PublicVotingForm
              pollId={poll.id}
              pollTitle={poll.title}
              placesCount={poll.places_count}
              songs={poll.songs_json}
            />
          </section>
        </>
      )}
      <div className="footer-space" />
    </main>
  );
}
