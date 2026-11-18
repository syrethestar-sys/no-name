import Link from 'next/link';
import { RevealText } from '@/components/motion/reveal-text';
import { PortfolioLinks } from '@/components/portfolio-links';
import { portfolioContent } from '@/lib/portfolio-content';

export const metadata = {
  title: 'Portfolio · Backroom',
  description: 'Who I am and what I make.',
};

// A simple page while the full scroll site is built (NOTES/PLAN.md); the hero replaces this.
export default function PortfolioPage() {
  const { name, tagline, bio, focus, links } = portfolioContent;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-6xl leading-[0.95] font-bold uppercase sm:text-8xl">
        <RevealText text={name} />
      </h1>
      <p className="mt-4 text-lg">{tagline}</p>

      <section aria-labelledby="about" className="mt-14 max-w-xl space-y-4">
        <h2 id="about" className="text-xs uppercase text-pf-ink-muted">
          about
        </h2>
        {bio.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="focus" className="mt-14">
        <h2 id="focus" className="text-xs uppercase text-pf-ink-muted">
          what I do
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {focus.map((item) => (
            <li key={item.title} className="glass-panel p-5">
              <h3 className="font-display text-2xl font-bold uppercase">{item.title}</h3>
              <p className="mt-2 text-sm">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="links" className="mt-14">
        <h2 id="links" className="text-xs uppercase text-pf-ink-muted">
          links
        </h2>
        <div className="mt-3">
          <PortfolioLinks links={links} />
        </div>
      </section>

      <p className="mt-16 pb-6 text-sm">
        <Link href="/" className="underline decoration-pf-accent underline-offset-4">
          Watch the videos →
        </Link>
      </p>
    </main>
  );
}
