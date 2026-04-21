export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'brand compact' : 'brand'}>
      <img src="/knallhart-serviert-logo.svg" alt="Knallhart Serviert" className="brand-logo" />
      <div>
        <div className="brand-kicker">Knallhart Serviert</div>
        <div className="brand-title">Release Voting</div>
      </div>
    </div>
  );
}
