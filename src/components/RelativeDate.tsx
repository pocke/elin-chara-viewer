'use client';

import { useSyncExternalStore } from 'react';
import { Language, useTranslation } from '@/lib/simple-i18n';

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.4375;
const DAYS_PER_YEAR = 365.25;
const TICK_MS = 30000;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const startOfLocalDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const relative = (
  date: string,
  locale: Language,
  now: number
): string | null => {
  const dateOnly = DATE_ONLY.test(date);
  const at = Date.parse(dateOnly ? `${date}T00:00:00` : date);
  if (Number.isNaN(at)) return null;

  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = at - now;

  if (!dateOnly) {
    if (Math.abs(diff) < MS_PER_HOUR) {
      return format.format(Math.trunc(diff / MS_PER_MINUTE), 'minute');
    }
    if (Math.abs(diff) < MS_PER_DAY) {
      return format.format(Math.trunc(diff / MS_PER_HOUR), 'hour');
    }
  }

  // 両端がローカル深夜なので、DST で生まれる 23 / 25 時間の日は round が吸収する。
  const days = dateOnly
    ? Math.round((at - startOfLocalDay(now)) / MS_PER_DAY)
    : Math.trunc(diff / MS_PER_DAY);
  if (Math.abs(days) < DAYS_PER_MONTH) {
    return format.format(days, 'day');
  }
  // 月と年は平均日数で割るので、日までと同じ trunc にすると 365 日前が
  // 11.99 か月となり「11 か月前」と出る。近い方に寄せる。
  const months = Math.round(days / DAYS_PER_MONTH);
  if (Math.abs(months) < 12) {
    return format.format(months, 'month');
  }
  return format.format(Math.round(days / DAYS_PER_YEAR), 'year');
};

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let clientNow = 0;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (timer === undefined) {
    clientNow = Date.now();
    timer = setInterval(() => {
      clientNow = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
};

/**
 * How long ago is measured against the reader's clock, and a statically
 * rendered page carries the clock of whenever it was built, so the relative
 * part is left out of the HTML and appears once the page is running.
 */
export default function RelativeDate({ date }: { date: string }) {
  const { language } = useTranslation();
  const now = useSyncExternalStore(
    subscribe,
    () => clientNow,
    () => 0
  );

  const ago = now === 0 ? null : relative(date, language, now);

  return (
    <>
      {date}
      {ago && ` (${ago})`}
    </>
  );
}
