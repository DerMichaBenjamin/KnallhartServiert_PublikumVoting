import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { verifyVoteToken } from '@/lib/emailVerification';

export const dynamic = 'force-dynamic';

export default async function VerifyVotePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === 'string' ? params.token : '';

  const result = token
    ? await verifyVoteToken(token)
    : { ok: false as const, message: 'Der Bestätigungslink ist unvollständig.' };

  return (
    <main className="public-shell">
      <section className="hero-card public-hero compact-hero verify-card-center">
        <BrandLogo />
        <div className="pill">Knallhart serviert Publikums-Voting</div>
        <h1 className="hero-title">{result.ok ? 'Voting bestätigt' : 'Bestätigung fehlgeschlagen'}</h1>
        <p className="hero-copy">{result.message}</p>
        <div className="verify-actions">
          <Link className="button primary" href="/release-voting">
            Zur Voting-Seite
          </Link>
        </div>
      </section>
    </main>
  );
}
