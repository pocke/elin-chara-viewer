'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// The past version shells are prerendered as /<lang>/archive/..., but the
// browser hydrates them under the real /<lang>/EA-.../... URL. Until the
// mount, those paths are reduced to /<lang> so that both sides render the same.
export function useSitePathname(): string {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [, lang, version] = pathname.split('/');
  const isShellPath = version === 'archive' || version?.startsWith('EA-');

  return !mounted && isShellPath ? `/${lang}` : pathname;
}
