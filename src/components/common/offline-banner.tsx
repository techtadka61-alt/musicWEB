'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOffIcon } from './icons';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-200"
    >
      <WifiOffIcon className="shrink-0" />
      You&apos;re offline. Songs can&apos;t be streamed until the connection is back.
    </div>
  );
}
