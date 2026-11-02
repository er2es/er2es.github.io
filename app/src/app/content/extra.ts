import type { Locale } from './model';

/** Interface strings added with the interaction layer (kept apart from the CV copy in en.ts / hu.ts). */
export interface ExtraText {
  /** Spoken on the button that clears the chosen skill family in the career graph. */
  clearFilter: string;
  /** Spoken after the address on the copy button. */
  copy: string;
  /** Spoken after copying the address, and what the bubble over the button says (the short one). */
  copied: string;
  copiedShort: string;
  copyFailed: string;
  /** What a node of the career line says: on the main line, or a branch of it. */
  fullTime: string;
  partTime: string;
  /** The line under the career graph on a touch screen, until a year is touched. */
  touch: string;
  /** Appended (visually hidden) to links that open in a new tab. */
  newTab: string;
  /** Unfold / fold a long project description on narrow screens (spoken only). */
  more: string;
  less: string;
}

export const EXTRA: Record<Locale, ExtraText> = {
  en: {
    clearFilter: 'Clear the filter',
    copy: 'copy',
    copied: 'Email address copied to clipboard',
    copiedShort: 'Copied',
    copyFailed: 'Could not copy. The address is shown below.',
    fullTime: 'Full-time',
    partTime: 'Part-time',
    touch: 'Touch or drag across a year for the details',
    newTab: '(opens in a new tab)',
    more: 'Show the whole description',
    less: 'Show less',
  },
  hu: {
    clearFilter: 'Szűrő törlése',
    copy: 'másolás',
    copied: 'Az email cím a vágólapra másolva',
    copiedShort: 'Másolva',
    copyFailed: 'Nem sikerült a másolás. A cím lent olvasható.',
    fullTime: 'Teljes munkaidő',
    partTime: 'Részmunkaidő',
    touch: 'Érints meg egy évet, vagy húzd rajta az ujjad',
    newTab: '(új lapon nyílik)',
    more: 'A teljes leírás megjelenítése',
    less: 'Kevesebb megjelenítése',
  },
};
