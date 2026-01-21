import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import pseudo from './locales/pseudo.json';

export type DotNestedKeys<T> = T extends
  | string
  | number
  | boolean
  | null
  | undefined
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown>
        ? `${K}` | `${K}.${DotNestedKeys<T[K]>}`
        : `${K}`;
    }[Extract<keyof T, string>];

export type Messages = typeof ptBR;
export type I18nKey = DotNestedKeys<Messages>;

const locales = {
  'pt-BR': ptBR,
  'en-US': enUS,
  pseudo,
} as const;

export type Locale = keyof typeof locales;

let currentLocale: Locale = 'pt-BR';

export const getLocale = (): Locale => currentLocale;
export const setLocale = (locale: Locale) => {
  currentLocale = locale;
};

const getByPath = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (
      acc &&
      typeof acc === 'object' &&
      part in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

const interpolate = (
  template: string,
  params?: Record<string, string | number>,
) => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
};

export const t = (
  key: I18nKey,
  params?: Record<string, string | number>,
): string => {
  const candidate = getByPath(locales[currentLocale], key);
  if (typeof candidate === 'string') return interpolate(candidate, params);
  const fallback = getByPath(locales['pt-BR'], key);
  if (typeof fallback === 'string') return interpolate(fallback, params);
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.MODE !== 'production'
  ) {
    // Surface missing key during development
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing key: ${key}`);
  }
  return key; // last-resort echo of the key
};

// Formatters (pt-BR default but locale-aware if set)
export const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);

const currencyByLocale: Record<Locale, string> = {
  'pt-BR': 'BRL',
  'en-US': 'USD',
  pseudo: 'BRL',
};

export const formatCurrency = (
  value: number,
  opts?: { locale?: Locale; currency?: string; maximumFractionDigits?: number },
): string => {
  const locale = opts?.locale ?? getLocale();
  const currency = opts?.currency ?? currencyByLocale[locale] ?? 'BRL';
  const maximumFractionDigits = opts?.maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(value);
};

export const formatNumber = (
  value: number,
  opts?: {
    locale?: Locale;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  },
): string => {
  const locale = opts?.locale ?? getLocale();
  const maximumFractionDigits = opts?.maximumFractionDigits ?? 0;
  const useGrouping = opts?.useGrouping ?? true;
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    useGrouping,
  }).format(value);
};

export const formatPercent = (
  value: number,
  options?: { maximumFractionDigits?: number },
): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);

export const formatDuration = (months: number): string => {
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (remMonths > 0)
    parts.push(`${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`);
  return parts.join(' ');
};

// eslint-disable-next-line import/no-default-export
export default {
  t,
  setLocale,
  getLocale,
  formatCurrencyBRL,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDuration,
};
