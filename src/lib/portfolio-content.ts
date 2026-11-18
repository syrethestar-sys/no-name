export type PortfolioLink = { label: string; href: string };
export type PortfolioFocus = { title: string; description: string };

export type PortfolioContent = {
  siteName: string;
  name: string;
  tagline: string;
  bio: string[];
  focus: PortfolioFocus[];
  links: PortfolioLink[];
};

// Public text. PLACEHOLDERS except the two roles: replace the name, bio, focus lines and links.
export const portfolioContent: PortfolioContent = {
  siteName: 'Backroom',
  name: 'Your name',
  tagline: 'Graphic designer & software engineer',
  bio: [
    'Write 2–4 short sentences about who you are.',
    'Say what you make and what you share on this site.',
  ],
  focus: [
    { title: 'Graphic design', description: 'Replace with one line about your design work.' },
    { title: 'Software engineering', description: 'Replace with one line about your engineering.' },
  ],
  links: [{ label: 'GitHub', href: 'https://github.com/' }],
};
