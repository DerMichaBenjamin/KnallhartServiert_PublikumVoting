'use client';

import { useMemo, useRef, useState } from 'react';
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
  const confirmationRef = useRef<HTMLDivElement | null>(null);

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

  function addSongToNextFree(song: string) {
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
        text:
          'Fast fertig: Bitte bestätige deine Stimme jetzt per Klick auf den Link in deiner E-Mail. Erst danach zählt dein Voting.',
      });

      setJurorName('');
      setJurorEmail('');
      setJurorInstagram('');
      setQuery('');
      setRanking(Array.from({ length: placesCount }, () => null));

      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
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
    <form className="form-stack public-form-compact" onSubmit={onSubmit}>
      <div className="notice notice-light compact-instructions compact-instructions-tight">
        <strong>So geht’s:</strong> Song antippen oder <strong>+</strong> drücken =
        nächster freier Platz. Danach bei Bedarf per Drag & Drop oder mit
        <strong> ↑ / ↓ </strong> nachjustieren.
      </div>

      {message?.type === 'success' && (
        <div ref={confirmationRef} className="vote-confirm-banner">
          <div className="vote-confirm-banner-title">Stimme fast bestätigt</div>
          <div className="vote-confirm-banner-text">{message.text}</div>
        </div>
      )}

      {message?.type === 'error' && (
        <div className="notice error notice-light">{message.text}</div>
      )}

      <div className="vote-user-grid">
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
            placeholder="für die Bestätigung"
            required
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

      <div className="voting-layout voting-layout-mobile-2col improved-mobile-voting">
        <section className="table-card voting-panel public-card-soft ranking-panel-first compact-panel">
          <div className="section-head compact-gap compact-section-head">
            <div>
              <h2 className="section-title compact-title">Deine Top 12</h2>
              <p className="section-subtitle compact-subtitle">
                Oben gibt es die meisten Punkte.
              </p>
            </div>
            <div className="progress-pill">{filledSlots}/{placesCount}</div>
          </div>

          <div className="panel-scroll ranking-panel-scroll mobile-tight-scroll">
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
                      <div className="rank-slot-position">#{index + 1}</div>
                    </div>

                    {!song && (
                      <div className="rank-slot-empty">
                        Song hier ablegen oder rechts antippen.
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

        <section className="table-card voting-panel public-card-soft available-panel-second compact-panel">
          <div className="section-head compact-gap compact-section-head">
            <div>
              <h2 className="section-title compact-title">Songs</h2>
              <p className="section-subtitle compact-subtitle">
                Tippen, <strong>+</strong> oder Drag & Drop.
              </p>
            </div>
            <div className="progress-pill neutral">{availableSongs.length}</div>
          </div>

          <div className="field compact-search-field compact-search-field-tight">
            <label htmlFor="query">Suche</label>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titel oder Interpret"
            />
          </div>

          <div className="target-hint compact-target-hint">
            {firstFreeIndex >= 0 ? (
              <>
                Nächster freier Platz: <strong>#{firstFreeIndex + 1}</strong>
              </>
            ) : (
              <>Alle Plätze sind belegt.</>
            )}
          </div>

          <div className="panel-scroll available-panel-scroll mobile-tight-scroll">
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
                  <button
                    type="button"
                    className="available-card-main available-card-main-clickable"
                    onClick={() => addSongToNextFree(song)}
                    disabled={firstFreeIndex < 0}
                    title="Zum nächsten freien Platz hinzufügen"
                  >
                    <span className="song-line">{combineSongLine(song)}</span>
                  </button>

                  <div className="available-actions">
                    <button
                      type="button"
                      className="button secondary small compact-add-button"
                      onClick={() => addSongToNextFree(song)}
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
