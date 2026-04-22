'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import type { LeaderboardRow, RoundRow, VoteRow } from '@/lib/releaseVoting';
import {
  createPublicRoundPath,
  createRoundDatePreset,
  formatDateTime,
  normalizeSlug,
  splitSong,
  statusLabel,
  toDatetimeLocalValue,
} from '@/lib/releaseVoting';
import type { SupabaseConfigState } from '@/lib/supabaseAdmin';

type AdminDashboardProps = {
  configState: SupabaseConfigState;
  rounds: RoundRow[];
  currentRound: RoundRow | null;
  currentVotes: VoteRow[];
  voteStats: { submitted: number; verified: number; pending: number };
  leaderboard: LeaderboardRow[];
  loadError: string | null;
};

type MessageState =
  | {
      type: 'success' | 'error';
      text: string;
    }
  | null;

function createInitialFormState() {
  const now = new Date();
  const preset = createRoundDatePreset(now);
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    title: preset.title,
    slug: preset.slug,
    description: 'Bewerte die stärksten neuen Releases der Woche.',
    status: 'live',
    start_at: toDatetimeLocalValue(now),
    end_at: toDatetimeLocalValue(end),
    places_count: '12',
    songlist: '',
  };
}

export default function AdminDashboard({
  configState,
  rounds,
  currentRound,
  currentVotes,
  voteStats,
  leaderboard,
  loadError,
}: AdminDashboardProps) {
  const router = useRouter();
  const [message, setMessage] = useState<MessageState>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState(createInitialFormState);
  const [slugTouched, setSlugTouched] = useState(false);
  const recentVotes = useMemo(() => currentVotes.slice(0, 10), [currentVotes]);

  async function sendJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response
      .json()
      .catch(() => ({ ok: false, error: 'Ungültige Server-Antwort.' }));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Aktion fehlgeschlagen.');
    }

    return result;
  }

  function refreshWithMessage(nextMessage: MessageState) {
    setMessage(nextMessage);
    startTransition(() => {
      router.refresh();
    });
  }

  async function onCreateRound(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await sendJson('/api/admin/create-round', {
        ...formState,
        places_count: Number(formState.places_count),
      });

      setFormState(createInitialFormState());
      setSlugTouched(false);

      refreshWithMessage({
        type: 'success',
        text: `Umfrage wurde angelegt: ${result.round?.title ?? 'Neue Runde'}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Umfrage konnte nicht angelegt werden.',
      });
    }
  }

  async function onSetCurrent(roundId: string) {
    setMessage(null);

    try {
      const result = await sendJson('/api/admin/set-current', { roundId });

      refreshWithMessage({
        type: 'success',
        text: `Aktive Umfrage gesetzt: ${result.round?.title ?? 'Runde aktiviert'}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Aktivieren fehlgeschlagen.',
      });
    }
  }

  async function onEndRound(roundId: string) {
    setMessage(null);

    try {
      const result = await sendJson('/api/admin/end-round', { roundId });

      refreshWithMessage({
        type: 'success',
        text: `Umfrage beendet: ${result.round?.title ?? 'Runde beendet'}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Beenden fehlgeschlagen.',
      });
    }
  }

  async function onLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <main className="dashboard-shell">
      <header className="hero-card dashboard-hero">
        <div className="hero-main">
          <BrandLogo />
          <div className="pill">Interner Verwaltungsbereich</div>
          <h1 className="hero-title">Release Voting professionell verwalten</h1>
          <p className="hero-copy">
            Neue Umfragen anlegen, Live-Runden steuern und bei der Auswertung nur bestätigte Stimmen zählen.
          </p>
        </div>

        <div className="hero-actions">
          <div className="hero-stat-card">
            <div className="small-text">Aktive Umfrage</div>
            <div className="hero-stat-value">{currentRound?.title ?? 'Keine'}</div>
          </div>

          <button type="button" className="button ghost" onClick={onLogout}>
            Ausloggen
          </button>
        </div>
      </header>

      {!configState.ok && <div className="notice error">{configState.message}</div>}
      {loadError && <div className="notice error">Fehler beim Laden: {loadError}</div>}
      {message && (
        <div className={message.type === 'success' ? 'notice success' : 'notice error'}>
          {message.text}
        </div>
      )}

      <section className="stats-grid stats-grid-5">
        <article className="info-card">
          <div className="stat-label">Aktuelle Runde</div>
          <div className="stat-value">{currentRound?.title || '—'}</div>
          <div className="stat-sub">
            {currentRound ? statusLabel(currentRound.status) : 'Keine Runde live gesetzt'}
          </div>
        </article>

        <article className="info-card">
          <div className="stat-label">Angelegte Umfragen</div>
          <div className="stat-value">{rounds.length}</div>
          <div className="stat-sub">inklusive Entwürfe und beendete Runden</div>
        </article>

        <article className="info-card">
          <div className="stat-label">Abgegeben</div>
          <div className="stat-value">{voteStats.submitted}</div>
          <div className="stat-sub">alle abgeschickten Stimmen</div>
        </article>

        <article className="info-card">
          <div className="stat-label">Bestätigt</div>
          <div className="stat-value">{voteStats.verified}</div>
          <div className="stat-sub">zählen in der Wertung</div>
        </article>

        <article className="info-card">
          <div className="stat-label">Unbestätigt</div>
          <div className="stat-value">{voteStats.pending}</div>
          <div className="stat-sub">warte auf Klick in der Mail</div>
        </article>
      </section>

      <section className="two-col admin-columns">
        <article className="table-card elevated-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Neue Umfrage anlegen</h2>
              <p className="section-subtitle">
                Titel, Zeitraum, Songs und Slug sind bereits vorbefüllt. Der Slug enthält automatisch das Datum.
              </p>
            </div>
          </div>

          <form className="form-stack" onSubmit={onCreateRound}>
            <div className="field">
              <label htmlFor="title">Titel</label>
              <input
                id="title"
                value={formState.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    title,
                    slug: slugTouched ? prev.slug : normalizeSlug(title),
                  }));
                }}
                required
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="slug">Slug / URL-Kürzel</label>
                <input
                  id="slug"
                  value={formState.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setFormState((prev) => ({ ...prev, slug: event.target.value }));
                  }}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="places">Platzanzahl</label>
                <input
                  id="places"
                  type="number"
                  min={1}
                  max={50}
                  value={formState.places_count}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      places_count: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">Beschreibung</label>
              <input
                id="description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid-3">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="live">Live</option>
                  <option value="draft">Entwurf</option>
                  <option value="ended">Beendet</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="startAt">Start</label>
                <input
                  id="startAt"
                  type="datetime-local"
                  value={formState.start_at}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      start_at: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="endAt">Ende</label>
                <input
                  id="endAt"
                  type="datetime-local"
                  value={formState.end_at}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      end_at: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="songlist">Songliste</label>
              <textarea
                id="songlist"
                value={formState.songlist}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    songlist: event.target.value,
                  }))
                }
                placeholder={'Songtitel – Interpret\nSongtitel – Interpret\nSongtitel – Interpret'}
                required
              />
            </div>

            <button
              className="button primary full"
              type="submit"
              disabled={isPending || !configState.ok}
            >
              {isPending ? 'Speichert...' : 'Umfrage anlegen'}
            </button>
          </form>
        </article>

        <article className="table-card elevated-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Kurzübersicht</h2>
              <p className="section-subtitle">
                Bestätigte Stimmen zählen. Unbestätigte Stimmen erscheinen nur als Info im Backend.
              </p>
            </div>
          </div>

          <div className="meta-grid single-column-mobile">
            <div className="notice">
              <div className="small-text">1. Songs einfügen</div>
              <div>
                Jede Zeile im Format <strong>Songtitel – Interpret</strong>.
              </div>
            </div>

            <div className="notice">
              <div className="small-text">2. Live starten</div>
              <div>
                Wenn die Runde direkt sichtbar sein soll, Startzeit auf jetzt oder früher setzen.
              </div>
            </div>

            <div className="notice">
              <div className="small-text">3. E-Mail-Bestätigung</div>
              <div>
                Erst nach Klick auf den Mail-Link zählt eine Stimme in der Auswertung.
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="table-card elevated-card">
        <div className="section-head">
          <div>
            <h2 className="section-title">Alle Umfragen</h2>
            <p className="section-subtitle">
              Mit Direktlink, Zeitraum und schnellen Aktionen pro Runde.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titel</th>
                <th>Status</th>
                <th>Zeitraum</th>
                <th>Link</th>
                <th>Aktionen</th>
              </tr>
            </thead>

            <tbody>
              {rounds.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Noch keine Umfragen vorhanden.</div>
                  </td>
                </tr>
              )}

              {rounds.map((round) => {
                const publicPath = createPublicRoundPath(round.slug);

                return (
                  <tr key={round.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{round.title}</div>
                      <div className="mono">{round.slug}</div>
                    </td>

                    <td>
                      <span className={`status-chip ${round.status}`}>
                        {statusLabel(round.status)}
                      </span>
                      {round.is_current && (
                        <div className="small-text" style={{ marginTop: 8 }}>
                          aktuelle Runde
                        </div>
                      )}
                    </td>

                    <td>
                      <div>{formatDateTime(round.start_at)}</div>
                      <div className="small-text">bis {formatDateTime(round.end_at)}</div>
                    </td>

                    <td>
                      <div className="link-list">
                        <a
                          href={publicPath}
                          target="_blank"
                          rel="noreferrer"
                          className="button secondary small"
                        >
                          Umfrage öffnen
                        </a>
                        <div className="mono">{publicPath}</div>
                      </div>
                    </td>

                    <td>
                      <div className="inline-actions">
                        {!round.is_current && round.status !== 'ended' && (
                          <button
                            className="button success small"
                            type="button"
                            onClick={() => onSetCurrent(round.id)}
                          >
                            Live setzen
                          </button>
                        )}

                        {round.status !== 'ended' && (
                          <button
                            className="button danger small"
                            type="button"
                            onClick={() => onEndRound(round.id)}
                          >
                            Beenden
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-col admin-columns">
        <article className="table-card elevated-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Ergebnisse der aktuellen Runde</h2>
              <p className="section-subtitle">
                Sortiert nach Gesamtpunkten. Gezählt werden nur per Mail bestätigte Stimmen.
              </p>
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
                  <th>Gewählt</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={5}>
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
                      <td>{row.voteCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="table-card elevated-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">Letzte Stimmen</h2>
              <p className="section-subtitle">
                Die letzten 10 abgegebenen Votes der aktuellen Runde.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Status</th>
                  <th>Zeitpunkt</th>
                </tr>
              </thead>

              <tbody>
                {recentVotes.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">Noch keine Stimmen vorhanden.</div>
                    </td>
                  </tr>
                )}

                {recentVotes.map((vote) => (
                  <tr key={vote.id}>
                    <td>{vote.juror_name || '—'}</td>
                    <td>{vote.juror_email || '—'}</td>
                    <td>
                      <span className={`status-chip ${vote.is_verified ? 'live' : 'draft'}`}>
                        {vote.is_verified ? 'Bestätigt' : 'Unbestätigt'}
                      </span>
                    </td>
                    <td>{formatDateTime(vote.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
