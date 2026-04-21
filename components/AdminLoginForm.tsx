'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';

export default function AdminLoginForm({ passwordConfigured }: { passwordConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({ ok: false, error: 'Ungültige Server-Antwort.' }));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Login fehlgeschlagen.');
      }

      router.push(searchParams.get('from') || '/admin/release-voting');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <BrandLogo />
        <div className="pill" style={{ marginTop: 18 }}>Interner Zugang</div>
        <h1 className="section-title">Admin-Login</h1>
        <p className="section-subtitle">
          Der Verwaltungsbereich ist nicht öffentlich verlinkt. Zugang nur mit internem Passwort.
        </p>

        {!passwordConfigured && (
          <div className="notice error" style={{ marginBottom: 16 }}>
            ADMIN_PASSWORD fehlt in Vercel oder in deiner .env.local.
          </div>
        )}

        {message && <div className="notice error" style={{ marginBottom: 16 }}>{message}</div>}

        <form className="form-stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="password">Admin-Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort eingeben"
              required
            />
          </div>
          <button className="button primary full" type="submit" disabled={loading || !passwordConfigured}>
            {loading ? 'Prüft...' : 'Einloggen'}
          </button>
        </form>
      </section>
    </main>
  );
}
