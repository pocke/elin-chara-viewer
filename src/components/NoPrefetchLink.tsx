import Link from 'next/link';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export function NoPrefetchLink(props: LinkProps) {
  return <Link {...props} prefetch={false} />;
}
