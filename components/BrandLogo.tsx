export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`vote-brand-logo${compact ? ' compact' : ''}`} aria-label="Knallhart serviert Logo">
      <img
        src="/knallhart-serviert-logo.svg"
        alt="Knallhart serviert"
        className="vote-brand-logo-img"
      />
    </div>
  );
}
