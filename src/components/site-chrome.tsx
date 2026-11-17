import { SiteHeader } from '@/components/site-header';
import { ViewfinderFrame } from '@/components/viewfinder-frame';

/** The site's header and the fixed viewfinder frame, around a page. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Everything sits inside the viewfinder frame, so pad past its line. */}
      <div className="px-2 pb-6 sm:px-5 sm:pb-8">
        <SiteHeader />
        {children}
      </div>
      <ViewfinderFrame />
    </>
  );
}
