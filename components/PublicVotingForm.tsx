'use client';

import { useMemo, useState } from 'react';
import { combineSongLine, splitSong } from '@/lib/releaseVoting';

type PublicVotingFormProps = {
  roundId: string;
  roundTitle: string;
  placesCount: number;
  songs: string[];
};

type MessageState = {
  type: 'success' | 'error';
  text: string;
} | null;

type DragPayload =
  | { kind: 'song'; song: string }
  | { kind: 'slot'; song: string; index: number };

export default function PublicVotingForm({ roundId, roundTitle, placesCount, songs }: PublicVotingFormProps) {
  const [jurorName, setJurorName] = useState('');
  const [jurorEmail, setJurorEmail] = useState('');
  const [jurorInstagram, setJurorInstagram] = useState('');
  const [query, setQuery] = useState('');
  const [ranking, setRanking] = useState<(string | null)[]>(() => Array.from({ length: placesCount }, () => null));
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pointValues = useMemo(
    () => Array.from({ length: placesCount }, (_, index) => placesCount - index),
    [placesCount],
  );

  const rankedSongs = useMemo(() => ranking.filter(Boolean) as string[], [ranking]);
  const availableSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (rankedSongs.includes(song)) return false;
      if (!normalizedQuery) return true;
      return song.toLowerCase().includes(normalizedQuery);
    });
  }, [songs, rankedSongs, query]);

  const filledSlots = rankedSongs.length;
  const allDone = filledSlots === placesCount;
  const nextFreeIndex = ranking.findIndex((entry) => !entry);

  function assignSongToSlot(song: string, targetIndex: number) {
    setRanking((prev) => {
      const next = [...prev];
      const sourceIndex = next.findIndex((entry) => entry === song);
      const targetSong = next[targetIndex];

      if (sourceIndex === targetIndex) return next;

      if (sourceIndex >= 0) {
        next[sourceIndex] = targetSong ?? null;
        next[targetIndex] = song;
        return next;
      }

      next[targetIndex] = song;
      return next;
    });
  }

  function removeFromSlot(index: number) {
    setRanking((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function addToNextFree(song: string) {
    const freeIndex = ranking.findIndex((entry) => !entry);
    if (freeIndex < 0) return;
    assignSongToSlot(song, freeIndex);
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
      if (parsed.kind === 'slot' && typeof parsed.song === 'string' && typeof parsed.index === 'number') return parsed;
      return null;
    } catch {
      return null;
    }
  }

  function onDropOnSlot(event: React.DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
    const payload = parsePayload(raw);
    if (!payload) return;
    assignSongToSlot(payload.song, targetIndex);
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
        text: `Bitte belege alle ${placesCount} Plätze deiner Top-Liste.`,
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

      const result = await response.json().catch(() => ({ ok: false, error: 'Ungültige Server-Antwort.' }));
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
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Abstimmung konnte nicht gespeichert werden.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-stack public-voting-form" onSubmit={onSubmit}>
      <div className="notice notice-light feature-box soft-info">
        <div>
          <strong>So geht’s am schnellsten:</strong> Songs links in dein Ranking ziehen oder direkt auf den nächsten freien Platz setzen.
        </div>
        <div>
          Sobald alle <strong>{placesCount}</strong> Plätze belegt sind, erscheint unten ein deutlich hervorgehobener Absende-Bereich.
        </div>
      </div>

      <div className="grid-3 public-user-grid">
        <div className="field">
          <label htmlFor="jurorName">Name</label>
          <input id="jurorName" value={jurorName} onChange={(event) => setJurorName(event.target.value)} placeholder="z. B. Micha" required />
        </div>
        <div className="field">
          <label htmlFor="jurorEmail">E-Mail</label>
          <input id="jurorEmail" type="email" value={jurorEmail} onChange={(event) => setJurorEmail(event.target.value)} placeholder="name@mail.de" />
        </div>
        <div className="field">
          <label htmlFor="jurorInstagram">Instagram</label>
          <input id="jurorInstagram" value={jurorInstagram} onChange={(event) => setJurorInstagram(event.target.value)} placeholder="@deinname" />
        </div>
      </div>

      {message && <div className={message.type === 'success' ? 'notice success notice-light' : 'notice error notice-light'}>{message.text}</div>}

      <div className="voting-layout voting-layout-friendly">
        <section className="table-card voting-panel public-card-soft">
          <div className="section-head compact-gap public-section-head">
            <div>
              <h2 className="section-title public-section-title">Dein Ranking</h2>
              <p className="section-subtitle">Platz 1 bekommt die meisten Punkte. Jeder Platz ist automatisch eindeutig.</p>
            </div>
            <div className={`progress-pill ${allDone ? 'ready-pill' : 'neutral'}`}>
              {filledSlots} / {placesCount} Plätze belegt
            </div>
          </div>

          <div className="rank-slots compact-rank-slots">
            {pointValues.map((points, index) => {
              const song = ranking[index];
              return (
                <div
                  key={points}
                  className={`rank-slot compact-rank-slot${song ? ' filled' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropOnSlot(event, index)}
                >
                  <div className="rank-slot-points compact-points-badge">{points} Punkte</div>
                  {!song && <div className="rank-slot-empty">Song hier ablegen</div>}
                  {song && (
                    <div
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/json', serializePayload({ kind: 'slot', song, index }));
                      }}
                      className="rank-slot-song compact-slot-song"
                    >
                      <div className="slot-main-line">
                        <div className="song-line compact-song-line">{combineSongLine(song)}</div>
                      </div>
                      <div className="slot-actions compact-slot-actions">
                        <button type="button" className="button ghost tiny" onClick={() => moveSlot(index, -1)} disabled={index === 0}>
                          ↑
                        </button>
                        <button type="button" className="button ghost tiny" onClick={() => moveSlot(index, 1)} disabled={index === ranking.length - 1}>
                          ↓
                        </button>
                        <button type="button" className="button ghost tiny" onClick={() => removeFromSlot(index)}>
                          Entfernen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="table-card voting-panel public-card-soft">
          <div className="section-head compact-gap public-section-head">
            <div>
              <h2 className="section-title public-section-title">Verfügbare Songs</h2>
              <p className="section-subtitle">Kompakt gelistet, damit du weniger scrollen musst.</p>
            </div>
            <div className="progress-pill neutral">{availableSongs.length} verfügbar</div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="query">Suche</label>
            <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel oder Interpret filtern" />
          </div>

          <div className="available-list compact-available-list">
            {availableSongs.length === 0 && <div className="empty-state public-empty-state">Keine weiteren Songs verfügbar.</div>}
            {availableSongs.map((song) => {
              const parts = splitSong(song);
              return (
                <div
                  key={song}
                  className="available-card compact-available-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/json', serializePayload({ kind: 'song', song }));
                  }}
                >
                  <div className="available-main-line">
                    <div className="song-line compact-song-line">{parts.title} — {parts.artist}</div>
                  </div>
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() => addToNextFree(song)}
                    disabled={nextFreeIndex < 0}
                  >
                    Auf nächsten freien Platz
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className={`submit-dock ${allDone ? 'ready' : ''}`}>
        <div className="submit-dock-text">
          <strong>{allDone ? 'Fertig zum Absenden.' : 'Noch nicht vollständig.'}</strong>
          <span>
            {allDone
              ? 'Alle 12 Plätze sind belegt. Du kannst dein Voting jetzt direkt abschicken.'
              : `Es fehlen noch ${placesCount - filledSlots} Platzierungen.`}
          </span>
        </div>
        <button type="submit" className="button primary submit-dock-button" disabled={isSubmitting || !allDone}>
          {isSubmitting ? 'Wird gespeichert ...' : 'Voting absenden'}
        </button>
      </div>
    </form>
  );
}
