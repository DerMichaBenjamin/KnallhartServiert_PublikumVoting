export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-logo public-brand-logo" aria-label="Knallhart serviert Logo">
      <div className="brand-logo-mark">
        <img
          src="/knallhart-serviert-logo.svg"
          alt="Knallhart serviert Logo"
        />
      </div>
    </div>
  );
}
