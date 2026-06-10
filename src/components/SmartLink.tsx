'use client';

import { Link } from '../navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children: ReactNode;
};

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export default function SmartLink({ href, children, target, rel, ...props }: Props) {
  if (isInternalHref(href) && target !== '_blank') {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
}
