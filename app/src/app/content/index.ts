import { en } from './en';
import { hu } from './hu';
import type { Locale, SiteContent } from './model';

const BY_LOCALE: Record<Locale, SiteContent> = { en, hu };

export const getContent = (locale: Locale): SiteContent => BY_LOCALE[locale];
