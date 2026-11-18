import { HalftoneMap } from '@/components/portfolio/halftone-map';
import { portfolioContent } from '@/lib/portfolio-content';

/** "This year so far": a dotted map of the site name with the year's milestones listed under it. */
export function SeasonBlock() {
  const { title, milestones } = portfolioContent.season;

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
      <h2 className="display-title text-5xl sm:text-7xl">{title}</h2>

      <div className="relative mt-10 aspect-[16/9] border border-dashed border-pf-hairline sm:aspect-[16/6]">
        <HalftoneMap className="absolute inset-0 size-full font-display" />
      </div>

      <ol className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {milestones.map(({ label, text }, index) => (
          <li key={label} className="border-t border-pf-hairline pt-4">
            <span className="font-mono text-xs uppercase text-pf-ink-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-2 font-mono text-sm uppercase">{label}</h3>
            <p className="mt-1 text-sm text-pf-ink-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
