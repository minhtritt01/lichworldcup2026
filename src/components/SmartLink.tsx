'use client';

import { Link } from '../navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { Locale } from '../config';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  popover?: never;
  href: string;
  locale?: Locale;
  children: ReactNode;
};

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export default function SmartLink({ href, locale, children, target, rel, ...props }: Props) {
  const { popover: _popover, ...rest } = props;

  if (isInternalHref(href) && target !== '_blank') {
    return (
      <Link href={href} locale={locale} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target={target} rel={rel} {...rest}>
      {children}
    </a>
  );
}
