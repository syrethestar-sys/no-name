export type PortfolioLink = { label: string; href: string };
export type PortfolioFocus = { title: string; description: string };

export type PortfolioContent = {
  name: string;
  tagline: string;
  bio: string[];
  focus: PortfolioFocus[];
  links: PortfolioLink[];
};

// Public text. PLACEHOLDERS: replace with the real name, bio, focus areas and links.
export const portfolioContent: PortfolioContent = {
  name: 'Your name',
  tagline: 'Write your one-line tagline here.',
  bio: ['Write 2–4 short sentences about who you are.', 'Say what you share on this site and why.'],
  focus: [
    { title: 'Trading', description: 'Replace with one line about your trading.' },
    { title: 'Coding', description: 'Replace with one line about your coding.' },
    { title: 'Sharing', description: 'Replace with one line about sharing experiences.' },
  ],
  links: [{ label: 'GitHub', href: 'https://github.com/' }],
};
