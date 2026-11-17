import { SiteChrome } from '@/components/site-chrome';

/** Pages in this group sit inside the site's header and viewfinder frame. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
