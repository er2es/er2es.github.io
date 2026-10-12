import type { Locale } from '../content/model';

export function prefersHungarian(languages: readonly string[] | undefined): boolean {
  return !!languages?.length && languages[0].toLowerCase().startsWith('hu');
}

export function shouldOfferHungarian(o: {
  locale: Locale;
  languages: readonly string[] | undefined;
  chosen: string | null;
  dismissed: string | null;
}): boolean {
  return o.locale === 'en' && prefersHungarian(o.languages) && !o.chosen && !o.dismissed;
}
