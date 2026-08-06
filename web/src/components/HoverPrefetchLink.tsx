'use client';
import Link from 'next/link';
import { useState, ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export function HoverPrefetchLink({ children, ...props }: LinkProps) {
  const [active, setActive] = useState(false);
  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  );
}
