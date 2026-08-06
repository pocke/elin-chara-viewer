'use client';

import { useSyncExternalStore } from 'react';
import { Language, useTranslation } from '@/lib/simple-i18n';

const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.4375;
const DAYS_PER_YEAR = 365.25;

const relative = (date: string, locale: Language): string | null => {
  const at = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(at)) return null;

  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const days = Math.round((at - Date.now()) / MS_PER_DAY);

  if (Math.abs(days) < DAYS_PER_MONTH) {
    return format.format(days, 'day');
  }
  const months = Math.round(days / DAYS_PER_MONTH);
  if (Math.abs(months) < 12) {
    return format.format(months, 'month');
  }
  return format.format(Math.round(days / DAYS_PER_YEAR), 'year');
};

const noop = () => () => {};

/**
 * How long ago is measured against the reader's clock, and a statically
 * rendered page carries the clock of whenever it was built, so the relative
 * part is left out of the HTML and appears once the page is running.
 */
export default function RelativeDate({ date }: { date: string }) {
  const { language } = useTranslation();
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );

  const ago = hydrated ? relative(date, language) : null;

  return (
    <>
      {date}
      {ago && ` (${ago})`}
    </>
  );
}
