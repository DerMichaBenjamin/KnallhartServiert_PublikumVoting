'use client';

import { useMemo, useState } from 'react';
import { combineSongLine } from '@/lib/releaseVoting';

type PublicVotingFormProps = {
  roundId: string;
  roundTitle: string;
  placesCount: number;
  songs: string[];
};

type MessageState = { type: 'success' | 'error'; text: string } | null;

type DragPayload =
  | { kind: 'song'; song: string }
  | { kind: 'slot'; song: string; index: number };

export default function PublicVotingForm({
  roundId,
  roundTitle,
  placesCount,
  songs,
}: PublicVotingFormProps) {
  const [jurorName, setJurorName] = useState('');
  const [jurorEmail, setJurorEmail] = useState('');
  const [jurorInstagram, setJurorInstagram] = useState('');
  const [query, setQuery] = useState('');
  const [ranking, setRanking] = useState<(string | null)[]>(
    () => Array.from({ length: placesCount }, () => null)
  );
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pointValues = useMemo(
    () => Array.from({ length: placesCount }, (_, index) => placesCount - index),
    [placesCount]
  );

  const rankedSongs = useMemo(
    () => ranking.filter(Boolean) as string[],
    [ranking]
  );

  const firstFreeIndex = useMemo(
    () => ranking.findIndex((entry) => !entry),
    [ranking]
  );

  const availableSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return songs.filter((song) => {
      if (rankedSongs.includes(song)) return false;
      if (!normalizedQuery) return true;
      return song.toLowerCase().includes(normalizedQuery);
    });
  }, [songs, rankedSongs, query]);

  const filledSlots = rankedSongs.length;
  const isComplete = filledSlots === placesCount;

  function setSongAtIndex(song: string, targetIndex: number) {
    setRanking((prev) => {
      const next = [...prev];
      const sourceIndex = next.findIndex((entry) => entry === song);
      const targetSong = next[targetIndex];

      if (sourceIndex === targetIndex) {
        return next;
      }

      if (sourceIndex >= 0) {
        next[sourceIndex] = targetSong ?? null;
        next[targetIndex] = song;
        return next;
      }

      next[targetIndex] = song;
      return next;
    });
  }

  function addSongByClick(song: string) {
    if (firstFreeIndex < 0) return;
    setSongAtIndex(song, firstFreeIndex);
  }

  function removeFromSlot(index: number) {
    setRanking((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function moveSlot(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ranking.length) return;

    setRanking((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }

  function serializePayload(payload: DragPayload) {
    return JSON.stringify(payload);
  }

  function parsePayload(raw: string): DragPayload | null {
    try {
      const parsed = JSON.parse(raw) as DragPayload;

      if (parsed.kind === 'song' && typeof parsed.song === 'string') return parsed;
      if (
        parsed.kind === 'slot' &&
        typeof parsed.song === 'string' &&
        typeof parsed.index === 'number'
      ) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  function onDropOnSlot(
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) {
    event.preventDefault();
    const raw =
      event.dataTransfer.getData('application/json') ||
      event.dataTransfer.getData('text/plain');
    const payload = parsePayload(raw);
    if (!payload) return;

    setSongAtIndex(payload.song, targetIndex);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const rankingPayload = ranking
      .map((song, index) => (song ? { song, points: pointValues[index] } : null))
      .filter(Boolean) as { song: string; points: number }[];

    if (rankingPayload.length !== placesCount) {
      setMessage({
        type: 'error',
        text: `Bitte belege alle ${placesCount} Plätze.`,
      });
      return;
    }

    const uniqueSongs = new Set(rankingPayload.map((entry) => entry.song));
    if (uniqueSongs.size !== rankingPayload.length) {
      setMessage({
        type: 'error',
        text: 'Jeder Song darf nur einmal im Ranking vorkommen.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/release-voting/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          jurorName,
          jurorEmail,
          jurorInstagram,
          ranking: rankingPayload,
        }),
      });

      const result = await response
        .json()
        .catch(() => ({ ok: false, error: 'Ungültige Server-Antwort.' }));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Abstimmung konnte nicht gespeichert werden.');
      }

      setMessage({
        type: 'success',
        text: `Dein Voting für „${roundTitle}“ wurde gespeichert.`,
      });
      setJurorName('');
      setJurorEmail('');
      setJurorInstagram('');
      setQuery('');
      setRanking(Array.from({ length: placesCount }, () => null));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Abstimmung konnte nicht gespeichert werden.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-stack public-form-improved" onSubmit={onSubmit}>
      <div className="notice notice-light compact-instructions">
        <strong>So funktioniert’s:</strong> Mit <strong>+</strong> landet ein Song automatisch
        auf dem nächsten freien Platz. Per Drag & Drop oder mit ↑ / ↓ kannst du dein Ranking
        danach weiter verschieben.
      </div>

      <div className="grid-3 compact-user-grid">
        <div className="field">
          <label htmlFor="jurorName">Name</label>
          <input
            id="jurorName"
            value={jurorName}
            onChange={(event) => setJurorName(event.target.value)}
            placeholder="Dein Name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="jurorEmail">E-Mail</label>
          <input
            id="jurorEmail"
            type="email"
            value={jurorEmail}
            onChange={(event) => setJurorEmail(event.target.value)}
            placeholder="optional"
          />
        </div>

        <div className="field">
          <label htmlFor="jurorInstagram">Instagram</label>
          <input
            id="jurorInstagram"
            value={jurorInstagram}
            onChange={(event) => setJurorInstagram(event.target.value)}
            placeholder="optional"
          />
        </div>
      </div>

      {message && (
        <div
          className={
            message.type === 'success'
              ? 'notice success notice-light'
              : 'notice error notice-light'
          }
        >
          {message.text}
        </div>
      )}

      <div className="voting-layout voting-layout-simpler">
        <section className="table-card voting-panel public-card-soft ranking-panel-first">
          <div className="section-head compact-gap">
            <div>
              <h2 className="section-title compact-title">Deine Top 12</h2>
              <p className="section-subtitle">
                Oben gibt es die meisten Punkte. Sobald alle Plätze belegt sind, kannst du direkt absenden.
              </p>
            </div>
            <div className="progress-pill">
              {filledSlots}/{placesCount}
            </div>
          </div>

          <div className="panel-scroll ranking-panel-scroll">
            <div className="rank-slots compact-rank-slots improved-rank-slots">
              {pointValues.map((points, index) => {
                const song = ranking[index];

                return (
                  <div
                    key={points}
                    className={`rank-slot compact-rank-slot improved-rank-slot${song ? ' filled' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropOnSlot(event, index)}
                  >
                    <div className="rank-slot-topline">
                      <div className="rank-slot-points">{points} P</div>
                      <div className="rank-slot-position">Platz {index + 1}</div>
                    </div>

                    {!song && (
                      <div className="rank-slot-empty">
                        Ziehe einen Song hierhin oder füge ihn mit + hinzu.
                      </div>
                    )}

                    {song && (
                      <div
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            'application/json',
                            serializePayload({ kind: 'slot', song, index })
                          );
                        }}
                        className="rank-slot-song compact-rank-song"
                      >
                        <div className="song-line">{combineSongLine(song)}</div>

                        <div className="slot-actions">
                          <button
                            type="button"
                            className="button ghost tiny"
                            onClick={() => moveSlot(index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            className="button ghost tiny"
                            onClick={() => moveSlot(index, 1)}
                            disabled={index === ranking.length - 1}
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            className="button ghost tiny"
                            onClick={() => removeFromSlot(index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="table-card voting-panel public-card-soft available-panel-second">
          <div className="section-head compact-gap">
            <div>
              <h2 className="section-title compact-title">Songs zur Auswahl</h2>
              <p className="section-subtitle">
                Mit <strong>+</strong> wird der Song auf den nächsten freien Platz gesetzt.
              </p>
            </div>
            <div className="progress-pill neutral">{availableSongs.length}</div>
          </div>

          <div className="field compact-search-field">
            <label htmlFor="query">Suche</label>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titel oder Interpret"
            />
          </div>

          <div className="target-hint">
            {firstFreeIndex >= 0 ? (
              <>
                Nächster freier Platz:{' '}
                <strong>
                  #{firstFreeIndex + 1} · {pointValues[firstFreeIndex]} Punkte
                </strong>
              </>
            ) : (
              <>Alle Plätze sind belegt.</>
            )}
          </div>

          <div className="panel-scroll available-panel-scroll">
            <div className="available-list compact-available-list">
              {availableSongs.length === 0 && (
                <div className="empty-state public-empty-state">
                  Keine Songs mehr frei.
                </div>
              )}

              {availableSongs.map((song) => (
                <div
                  key={song}
                  className="available-card compact-available-card improved-available-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      'application/json',
                      serializePayload({ kind: 'song', song })
                    );
                  }}
                >
                  <div className="available-card-main static-song-card">
                    <span className="song-line">{combineSongLine(song)}</span>
                  </div>

                  <div className="available-actions">
                    <button
                      type="button"
                      className="button secondary small compact-add-button"
                      onClick={() => addSongByClick(song)}
                      disabled={firstFreeIndex < 0}
                      title="Zum nächsten freien Platz hinzufügen"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={`submit-bar${isComplete ? ' visible' : ''}`}>
        <div className="submit-bar-copy">
          {isComplete
            ? 'Alle 12 Plätze sind belegt.'
            : `Noch ${placesCount - filledSlots} Platz/Plätze offen.`}
        </div>

        <button
          className="button primary submit-bar-button"
          type="submit"
          disabled={isSubmitting || !isComplete}
        >
          {isSubmitting ? 'Speichert…' : 'Voting absenden'}
        </button>
      </div>
    </form>
  );
}
