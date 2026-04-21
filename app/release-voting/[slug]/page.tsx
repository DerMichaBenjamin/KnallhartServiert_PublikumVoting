export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import PublicVotingForm from "@/components/PublicVotingForm";
import { badgeClass, badgeText, formatDateTime, getPollBySlug } from "@/lib/releaseVoting";

export default async function ReleaseVotingSlugPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await getPollBySlug(slug);

  if (!poll) {
    notFound();
  }

  return (
    <main className="page">
      <div className="hero">
        <div>
          <div className="small-label">Direkter Umfrage-Link</div>
          <h1>{poll.title}</h1>
          <p>{poll.description || "Keine Beschreibung eingetragen."}</p>
        </div>
        <Link className="topbar-link" href="/release-voting">
          Zur aktuellen Umfrage
        </Link>
      </div>

      <section className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="small-label">Status</div>
          <div style={{ marginTop: 10 }}>
            <span className={badgeClass(poll.status)}>{badgeText(poll.status)}</span>
          </div>
        </div>
        <div className="card">
          <div className="small-label">Start</div>
          <div className="metric">{formatDateTime(poll.start_at)}</div>
        </div>
        <div className="card">
          <div className="small-label">Ende</div>
          <div className="metric">{formatDateTime(poll.end_at)}</div>
        </div>
      </section>

      <PublicVotingForm
        pollId={poll.id}
        pollTitle={poll.title}
        placesCount={poll.places_count}
        songs={poll.songs_json}
      />
    </main>
  );
}
