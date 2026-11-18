export type PortfolioLink = { label: string; href: string };
export type MetaRow = { label: string; value: string };
export type PanelContent = { title: string; lines: string[] };

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
};

// Public text. PLACEHOLDERS except the two roles: replace everything marked "replace".
export const portfolioContent: PortfolioContent = {
  siteName: 'Backroom',
  name: 'Your name',
  tagline: 'Graphic designer & software engineer',
  idLine: 'Id line: replace me',
  meta: [
    { label: 'Based in', value: 'Your city' },
    { label: 'Works with', value: 'Your tools' },
    { label: 'Status', value: 'Your status' },
  ],
  now: { title: 'Now', lines: ['Replace with what you are working on right now.'] },
  quickFacts: {
    title: 'Quick facts',
    lines: ['Fact one: replace me.', 'Fact two: replace me.', 'Fact three: replace me.'],
  },
  links: [{ label: 'GitHub', href: 'https://github.com/' }],
};
