import { BracketPanel } from '@/components/portfolio/bracket-panel';
import { ReadyRevealText, ReadyRise } from '@/components/portfolio/ready-motion';
import { PortfolioLinks } from '@/components/portfolio-links';
import { portfolioContent } from '@/lib/portfolio-content';

/** When each part starts, in ms after the loading veil lifts. */
const AT = { id: 100, name: 250, tagline: 650, meta: 800, panels: 950, foot: 1300 } as const;

/** The first screen: identity on the left, two bracket panels on the right, links along the foot. */
export function Hero() {
  const { name, tagline, idLine, meta, now, quickFacts, links } = portfolioContent;

  return (
    <main className="@container relative mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-7xl flex-col px-4 py-10 sm:px-8">
      <div className="grid flex-1 content-center gap-12 xl:grid-cols-[1fr_22rem] xl:items-end">
        <div>
          <ReadyRise delayIn={AT.id} offset={0.5} className="font-mono text-xs uppercase">
            {idLine}
          </ReadyRise>
          <h1 className="mt-4 font-display text-[min(14cqw,9rem)] leading-[0.85] font-bold uppercase">
            <ReadyRevealText text={name} by="letters" delayIn={AT.name} />
          </h1>
          <ReadyRise delayIn={AT.tagline} offset={0.5} className="mt-5 text-lg">
            {tagline}
          </ReadyRise>

          <dl className="mt-10 max-w-xl divide-y divide-pf-hairline border-y border-pf-hairline">
            {meta.map(({ label, value }, index) => (
              <ReadyRise
                key={label}
                delayIn={AT.meta + index * 80}
                offset={0.4}
                className="flex justify-between gap-6 py-3 text-sm"
              >
                <dt className="font-mono text-xs uppercase text-pf-ink-muted">{label}</dt>
                <dd>{value}</dd>
              </ReadyRise>
            ))}
          </dl>
        </div>

        <div className="space-y-6">
          <ReadyRise delayIn={AT.panels} offset={1}>
            <BracketPanel {...now} />
          </ReadyRise>
          <ReadyRise delayIn={AT.panels + 120} offset={1}>
            <BracketPanel {...quickFacts} />
          </ReadyRise>
        </div>
      </div>

      <ReadyRise delayIn={AT.foot} offset={0.5} className="mt-12 flex items-end justify-between">
        <PortfolioLinks links={links} />
        <span aria-hidden className="font-mono text-xs uppercase text-pf-ink-muted">
          Scroll ↓
        </span>
      </ReadyRise>
    </main>
  );
}
