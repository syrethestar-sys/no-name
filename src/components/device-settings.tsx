'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession, useUser } from '@clerk/nextjs';
import { isReverificationCancelledError } from '@clerk/nextjs/errors';
import { Button } from '@/components/ui/button';
import { formatTimeAgo } from '@/lib/format';
import { useConfirmedAction } from '@/lib/use-confirmed-action';

type DeviceSession = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useUser>['user']>['getSessions']>
>[number];

function describe(session: DeviceSession): string {
  const { browserName, deviceType, city, country } = session.latestActivity;
  const what = [browserName, deviceType].filter(Boolean).join(' on ') || 'Unknown device';
  const where = [city, country].filter(Boolean).join(', ');
  return where ? `${what} · ${where}` : what;
}

/** The devices you are signed in on, with a way to sign any of them out. */
export function DeviceSettings() {
  const { user } = useUser();
  const { session: currentSession } = useSession();
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await user?.getSessions();
      setSessions((all ?? []).filter((item) => item.status === 'active'));
    } catch {
      setErrorMessage('Could not load your devices. Refresh to try again.');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // One after the other: the first one may ask for the code, the rest then go straight through.
  const { run: revokeAll, dialog } = useConfirmedAction(async (targets: DeviceSession[]) => {
    for (const target of targets) await target.revoke();
  });

  async function signOut(targets: DeviceSession[]) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await revokeAll(targets);
      await load();
    } catch (error) {
      if (!isReverificationCancelledError(error)) {
        setErrorMessage('Could not sign that device out. Try again.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  if (!sessions) {
    return <p className="text-sm text-muted-foreground">{errorMessage ?? 'Loading…'}</p>;
  }
  const others = sessions.filter((item) => item.id !== currentSession?.id);

  return (
    <div className="flex flex-col gap-4">
      {dialog}
      <ul className="flex flex-col gap-2">
        {sessions.map((item) => {
          const isCurrent = item.id === currentSession?.id;
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-glass px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{describe(item)}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {isCurrent ? 'this device · now' : `active ${formatTimeAgo(item.lastActiveAt)}`}
                </p>
              </div>
              {!isCurrent && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => signOut([item])}
                >
                  Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {others.length > 0 && (
        <Button
          variant="outline"
          className="self-start"
          disabled={isBusy}
          onClick={() => signOut(others)}
        >
          Sign out everywhere else
        </Button>
      )}
    </div>
  );
}
