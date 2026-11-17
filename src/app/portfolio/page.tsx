import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';
import { PortfolioLinks } from '@/components/portfolio-links';
import { portfolioContent } from '@/lib/portfolio-content';

export const metadata = {
  title: 'Portfolio · Experience Community',
  description: 'Who I am and what I share on Experience Community.',
};

export default function PortfolioPage() {
  const { name, tagline, bio, focus, links } = portfolioContent;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading title={name} eyebrow="portfolio">
        {tagline}
      </PageHeading>

      <section aria-labelledby="about-heading" className="glass-panel mt-10 space-y-4 p-6">
        <h2 id="about-heading" className="font-mono text-xs text-muted-foreground">
          about
        </h2>
        {bio.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="focus-heading" className="mt-10">
        <h2 id="focus-heading" className="font-mono text-xs text-muted-foreground">
          what I do
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-3">
          {focus.map((item) => (
            <li key={item.title} className="glass-panel p-5">
              <h3 className="display-title text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="links-heading" className="mt-10">
        <h2 id="links-heading" className="font-mono text-xs text-muted-foreground">
          links
        </h2>
        <div className="mt-3">
          <PortfolioLinks links={links} />
        </div>
      </section>

      <p className="mt-12 text-sm">
        <Link href="/" className="text-primary hover:underline">
          Watch the videos →
        </Link>
      </p>
    </main>
  );
}
