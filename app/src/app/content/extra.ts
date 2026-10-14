import type { Locale } from './model';

/** Interface strings added with the interaction layer (kept apart from the CV copy in en.ts / hu.ts). */
export interface ExtraText {
  /** Label of the panel that lists where a skill was used; `{skill}` is replaced with its name. */
  usedIn: string;
  /** Accessible name of the skill list's arrow-key toolbar. */
  skillsToolbar: string;
  /** Spoken with a job or project link inside the skill panel. */
  job: string;
  project: string;
  /** Spoken after the address on the copy button. */
  copy: string;
  /** Toasts after copying the address. */
  copied: string;
  copyFailed: string;
  /** Appended (visually hidden) to links that open in a new tab. */
  newTab: string;
}

export const EXTRA: Record<Locale, ExtraText> = {
  en: {
    usedIn: 'Where I used {skill}',
    skillsToolbar: 'Skills: choose one to see where I used it',
    job: 'Job',
    project: 'Project',
    copy: 'copy',
    copied: 'Email address copied to clipboard',
    copyFailed: 'Could not copy. The address is shown below.',
    newTab: '(opens in a new tab)',
  },
  hu: {
    usedIn: 'Hol használtam: {skill}',
    skillsToolbar: 'Kompetenciák: válassz egyet, és megmutatom, hol használtam',
    job: 'Munkahely',
    project: 'Projekt',
    copy: 'másolás',
    copied: 'Az email cím a vágólapra másolva',
    copyFailed: 'Nem sikerült a másolás. A cím lent olvasható.',
    newTab: '(új lapon nyílik)',
  },
};

/**
 * Shown in the panel of a skill that no job or project in the CV mentions. The owner's own line, deliberately
 * untranslated (it only lands in English), so both pages show it as is.
 */
export const NO_USES = "Trust me bro' :)";
