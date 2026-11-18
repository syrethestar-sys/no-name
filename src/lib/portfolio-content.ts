export type PortfolioLink = { label: string; href: string };
export type MetaRow = { label: string; value: string };
export type PanelContent = { title: string; lines: string[] };

export type Milestone = { label: string; text: string };

export type PortfolioContent = {
  siteName: string;
  name: string;
  tagline: string;
  /** The small line above the name. */
  idLine: string;
  meta: MetaRow[];
  now: PanelContent;
  quickFacts: PanelContent;
  links: PortfolioLink[];
  season: { title: string; milestones: Milestone[] };
};

// Public text. Written from the owner's own words; the links are still a placeholder.
export const portfolioContent: PortfolioContent = {
  siteName: 'Backroom',
  name: 'Khuslen Syre',
  tagline: 'Graphic designer & software engineer',
  idLine: 'Portfolio — 2026 — Ulaanbaatar',
  meta: [
    { label: 'Based in', value: 'Ulaanbaatar, Mongolia' },
    {
      label: 'Works with',
      value: 'Photoshop, Illustrator, Premiere Pro, Figma, Next.js, TypeScript',
    },
    { label: 'Status', value: 'Building Backroom' },
  ],
  now: {
    title: 'Now',
    lines: [
      'Building Backroom, a video community with sign-in, ratings and search by meaning.',
      'Designing and coding this portfolio from scratch.',
      'Planning the next projects in Figma and Premiere Pro.',
    ],
  },
  quickFacts: {
    title: 'Quick facts',
    lines: [
      'Designer and developer in one person: from Figma file to shipped site.',
      'Moves between still design, video editing and code.',
      'Based in Ulaanbaatar, working with people anywhere.',
    ],
  },
  links: [{ label: 'GitHub', href: 'https://github.com/' }],
  season: {
    title: 'This year so far',
    milestones: [
      {
        label: 'Backroom built',
        text: 'A full video community: sign-in, likes, ratings, comments and search by meaning.',
      },
      {
        label: 'Portfolio in progress',
        text: 'This page: a scroll site with motion, drawn and coded in-house.',
      },
      { label: 'Backroom goes public', text: 'Planned: put the site online and share it.' },
      { label: 'First client project', text: 'Planned: take on the next piece of work.' },
    ],
  },
};
