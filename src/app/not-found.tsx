import { NotFoundMessage } from '@/components/not-found-message';
import { SiteChrome } from '@/components/site-chrome';

// An address that matches no page renders at the root, outside the (site) layout, so it brings
// the chrome itself.
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundMessage />
    </SiteChrome>
  );
}
