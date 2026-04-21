"use client";

import { useMemo, useState } from "react";

type Props = {
  pollId: string;
  pollTitle: string;
  placesCount: number;
  songs: string[];
};

export default function PublicVotingForm({ pollId, pollTitle, placesCount, songs }: Props) {
  const [jurorName, setJurorName] = useState("");
  const [jurorInstagram, setJurorInstagram] = useState("");
  const [pointsBySong, setPointsBySong] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pointOptions = useMemo(() => {
    return Array.from({ length: placesCount }, (_, index) => placesCount - index);
  }, [placesCount]);

  function updateSong(song: string, value: number) {
    setPointsBySong((current) => ({ ...current, [song]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const entries = Object.entries(pointsBySong)
      .filter(([, points]) => Number(points) > 0)
      .map(([song, points]) => ({ song, points: Number(points) }))
      .sort((a, b) => b.points - a.points);

    if (!jurorName.trim()) {
      setIsError(true);
      setMessage("Bitte trage einen Namen ein.");
      return;
    }

    if (entries.length !== placesCount) {
      setIsError(true);
      setMessage(`Bitte vergebe genau ${placesCount} unterschiedliche Punktewerte.`);
      return;
    }

    const uniquePoints = new Set(entries.map((entry) => entry.points));
    if (uniquePoints.size !== placesCount) {
      setIsError(true);
      setMessage("Jeder Punktwert darf nur einmal vergeben werden.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/release-voting/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pollId,
          jurorName: jurorName.trim(),
          jurorInstagram: jurorInstagram.trim(),
          ranking: entries
        })
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Speichern fehlgeschlagen.");
      }

      setIsError(false);
      setMessage(data.message || `Deine Wertung für ${pollTitle} wurde gespeichert.`);
      setJurorInstagram("");
      setPointsBySong({});
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unbekannter Fehler.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Jetzt abstimmen</h2>
      <p className="muted">
        Vergib jeden Punktwert genau einmal. Du musst nicht alle Songs bewerten, aber genau die
        Top-{placesCount} mit {placesCount} bis 1 Punkt.
      </p>

      {message ? (
        <div className={isError ? "notice notice-error" : "notice notice-success"}>{message}</div>
      ) : null}

      <div className="form-row">
        <div className="field">
          <label htmlFor="jurorName">Dein Name</label>
          <input
            id="jurorName"
            value={jurorName}
            onChange={(event) => setJurorName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="jurorInstagram">Instagram (optional)</label>
          <input
            id="jurorInstagram"
            value={jurorInstagram}
            onChange={(event) => setJurorInstagram(event.target.value)}
            placeholder="@deinname"
          />
        </div>
      </div>

      <div className="song-list" style={{ marginBottom: 16 }}>
        {songs.map((song) => (
          <div className="song-row" key={song}>
            <div className="song-title">{song}</div>
            <select
              value={pointsBySong[song] ?? 0}
              onChange={(event) => updateSong(song, Number(event.target.value))}
            >
              <option value={0}>keine Punkte</option>
              {pointOptions.map((points) => (
                <option key={points} value={points}>
                  {points} Punkte
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" type="submit" disabled={isSaving}>
        {isSaving ? "Wird gespeichert ..." : "Wertung speichern"}
      </button>
    </form>
  );
}
