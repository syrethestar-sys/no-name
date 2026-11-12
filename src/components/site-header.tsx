import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Show } from '@clerk/nextjs';
import { AccountMenu } from '@/components/auth/account-menu';
import { SignInButton } from '@/components/auth/sign-in-button';
import { MobileNav, type NavLink } from '@/components/mobile-nav';
import { SegmentedNav } from '@/components/segmented-nav';
import { getViewer, type Viewer } from '@/lib/auth';
import { countPendingRequests } from '@/lib/members';

async function loadHeaderState(): Promise<{ viewer: Viewer | null; pendingCount: number }> {
  try {
    const viewer = await getViewer();
    const pendingCount = viewer.isOwner ? await countPendingRequests() : 0;
    return { viewer, pendingCount };
  } catch (error) {
    unstable_rethrow(error); // let Next's own signals (dynamic rendering, redirects) through
    // A DB hiccup must not take down every page: render the header without member info.
    console.error('header state failed', error);
    return { viewer: null, pendingCount: 0 };
  }
}

export async function SiteHeader() {
  const { viewer, pendingCount } = await loadHeaderState();
  const isOwner = viewer?.isOwner ?? false;
  const showJoin = viewer !== null && !viewer.isMember && viewer.memberStatus !== 'pending';
  const navLinks: NavLink[] = [
    { href: '/', label: 'Videos' },
    { href: '/search', label: 'Search' },
    ...(isOwner
      ? [
          { href: '/upload', label: 'Upload' },
          { href: '/admin/members', label: 'Members', badge: pendingCount },
        ]
      : []),
    ...(showJoin ? [{ href: '/join', label: 'Join', isAccent: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 -mx-2 bg-background/80 px-2 pt-3 backdrop-blur-md sm:-mx-5 sm:px-5 sm:pt-5">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-mono text-sm font-medium tracking-[0.2em] uppercase">
            Experience<span className="text-primary">.</span>
          </Link>
          <MobileNav links={navLinks} />
        </div>
        <SegmentedNav links={navLinks} />
        <div className="flex items-center justify-end gap-3">
          {viewer?.memberStatus === 'pending' && !viewer.isMember && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              request pending
            </span>
          )}
          <Show when="signed-out">
            <SignInButton />
          </Show>
          <Show when="signed-in">
            {isOwner && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary">
                owner
              </span>
            )}
            <AccountMenu />
          </Show>
        </div>
      </div>
    </header>
  );
}
