export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  badgeClass,
  badgeText,
  buildResults,
  formatDateTime,
  getAllPolls,
  getCurrentPoll,
  getVotesByPollId
} from "@/lib/releaseVoting";

export default async function AdminReleaseVotingPage() {
  const polls = await getAllPolls();
  const currentPoll = await getCurrentPoll();
  const currentVotes = currentPoll ? await getVotesByPollId(currentPoll.id) : [];
  const results = currentPoll ? buildResults(currentPoll, currentVotes) : [];

  return (
    <main className="page">
      <div className="hero">
        <div>
          <div className="small-label">Neustart-Version ohne Altlasten</div>
          <h1>Release Voting Admin</h1>
          <p>
            Hier legst du neue Umfragen an, setzt eine Runde live, beendest sie wieder und öffnest
            direkt den Link zur jeweiligen Umfrage. Diese Version nutzt nur eine saubere, kleine
            Tabellenstruktur und keine alten API-Routen mehr.
          </p>
        </div>
        <Link className="topbar-link" href="/release-voting">
          Öffentliche Voting-Seite öffnen
        </Link>
      </div>

      <section className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="small-label">Aktuelle Umfrage</div>
          <div className="metric">{currentPoll?.title ?? "Keine"}</div>
        </div>
        <div className="card">
          <div className="small-label">Status</div>
          <div className="metric">{currentPoll ? badgeText(currentPoll.status) : "—"}</div>
        </div>
        <div className="card">
          <div className="small-label">Stimmen in aktueller Runde</div>
          <div className="metric">{currentVotes.length}</div>
        </div>
        <div className="card">
          <div className="small-label">Songs in aktueller Runde</div>
          <div className="metric">{currentPoll?.songs_json.length ?? 0}</div>
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h2>Neue Umfrage anlegen</h2>
          <p className="muted">
            Songliste: pro Zeile <strong>Songtitel – Interpret</strong>. Wenn du den Status auf
            <strong> Live</strong> setzt, wird die Runde sofort öffentlich als aktuelle Umfrage
            angezeigt.
          </p>

          <form action="/api/admin/create-poll" method="post">
            <div className="field">
              <label htmlFor="title">Titel</label>
              <input id="title" name="title" defaultValue="Neue Releases der Woche" required />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="slug">Slug / Link-Kürzel</label>
                <input id="slug" name="slug" placeholder="neue-releases-25-04-2026" required />
              </div>
              <div className="field">
                <label htmlFor="places_count">Wie viele Punkteplätze?</label>
                <input id="places_count" name="places_count" type="number" min="1" max="20" defaultValue="12" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">Beschreibung</label>
              <input id="description" name="description" defaultValue="Vergib deine Top-12-Punkte an die Songs dieser Woche." />
            </div>

            <div className="form-row-3">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue="live">
                  <option value="live">Live</option>
                  <option value="draft">Entwurf</option>
                  <option value="ended">Beendet</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="start_at">Start</label>
                <input id="start_at" name="start_at" type="datetime-local" required />
              </div>
              <div className="field">
                <label htmlFor="end_at">Ende</label>
                <input id="end_at" name="end_at" type="datetime-local" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="songs">Songliste</label>
              <textarea
                id="songs"
                name="songs"
                placeholder={"Songtitel – Interpret\nSongtitel – Interpret\nSongtitel – Interpret"}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Umfrage anlegen
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Ergebnisse der aktuellen Umfrage</h2>
          {!currentPoll ? (
            <p className="muted">Noch keine aktuelle Umfrage vorhanden.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Song</th>
                    <th>Ø Punkte</th>
                    <th>Gesamt</th>
                    <th>Wertungen</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.song}>
                      <td>{row.rank}</td>
                      <td>{row.song}</td>
                      <td>{row.averagePoints.toFixed(2)}</td>
                      <td>{row.totalPoints}</td>
                      <td>{row.voteCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <h2>Erstellte Umfragen</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Status</th>
                <th>Start</th>
                <th>Ende</th>
                <th>Link</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{poll.title}</div>
                    <div className="muted">{poll.slug}</div>
                  </td>
                  <td>
                    <span className={badgeClass(poll.status)}>{badgeText(poll.status)}</span>
                    {poll.is_current ? <div className="muted" style={{ marginTop: 6 }}>Aktuelle Runde</div> : null}
                  </td>
                  <td>{formatDateTime(poll.start_at)}</td>
                  <td>{formatDateTime(poll.end_at)}</td>
                  <td>
                    <div className="muted">/release-voting/{poll.slug}</div>
                    <div style={{ marginTop: 8 }}>
                      <Link className="btn btn-ghost" href={`/release-voting/${poll.slug}`}>
                        Umfrage öffnen
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      {!poll.is_current ? (
                        <form action="/api/admin/set-current" method="post">
                          <input type="hidden" name="poll_id" value={poll.id} />
                          <button className="btn btn-secondary" type="submit">
                            Als aktuell setzen
                          </button>
                        </form>
                      ) : null}

                      {poll.status !== "ended" ? (
                        <form action="/api/admin/end-poll" method="post">
                          <input type="hidden" name="poll_id" value={poll.id} />
                          <button className="btn btn-danger" type="submit">
                            Beenden
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Letzte abgegebene Stimmen</h2>
        {currentVotes.length === 0 ? (
          <p className="muted">Noch keine Stimmen vorhanden.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Instagram</th>
                  <th>Zeitpunkt</th>
                  <th>Top 3</th>
                </tr>
              </thead>
              <tbody>
                {currentVotes.slice(0, 20).map((vote) => {
                  const top3 = [...vote.ranking_json]
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 3)
                    .map((item) => `${item.points}: ${item.song}`)
                    .join(" | ");

                  return (
                    <tr key={vote.id}>
                      <td>{vote.juror_name}</td>
                      <td>{vote.juror_instagram || "—"}</td>
                      <td>{formatDateTime(vote.created_at)}</td>
                      <td>{top3 || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
