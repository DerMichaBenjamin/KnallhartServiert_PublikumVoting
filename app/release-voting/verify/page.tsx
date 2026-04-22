import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export const dynamic = 'force-dynamic';

export default async function VerifyVotePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    result?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === 'string' ? params.token : '';
  const result = typeof params?.result === 'string' ? params.result : '';
  const message =
    typeof params?.message === 'string' ? decodeURIComponent(params.message) : '';

  const isFinished = result === 'success' || result === 'error';
  const isSuccess = result === 'success';

  return (
    <main className="public-shell vote-public-shell">
      <section className="table-card public-card-soft verify-card-center vote-verify-card">
        <div className="vote-verify-header">
          <BrandLogo compact />
          <div className="vote-verify-header-copy">
            <div className="pill">Knallhart serviert Publikums-Voting</div>

            {!isFinished && (
              <>
                <h1 className="hero-title vote-verify-title">Stimme bestätigen</h1>
                <p className="hero-copy vote-verify-copy">
                  Bitte bestätige dein Voting jetzt mit einem Klick auf den Button.
                  Erst danach wird deine Stimme gezählt.
                </p>
              </>
            )}

            {isFinished && (
              <>
                <h1 className="hero-title vote-verify-title">
                  {isSuccess ? 'Voting bestätigt' : 'Bestätigung fehlgeschlagen'}
                </h1>
                <p className="hero-copy vote-verify-copy">
                  {message || (isSuccess
                    ? 'Deine Stimme wurde erfolgreich bestätigt.'
                    : 'Der Bestätigungslink ist ungültig oder wurde bereits verwendet.')}
                </p>
              </>
            )}
          </div>
        </div>

        {!isFinished && token && (
          <form action="/api/release-voting/verify" method="post" className="vote-verify-actions">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="button primary">
              Stimme jetzt bestätigen
            </button>
          </form>
        )}

        {!isFinished && !token && (
          <div className="notice error notice-light">
            Der Bestätigungslink ist unvollständig.
          </div>
        )}

        {isFinished && (
          <div className="vote-verify-actions">
            <Link className="button primary" href="/release-voting">
              Zur Voting-Seite
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
