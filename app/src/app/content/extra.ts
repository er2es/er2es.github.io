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
  /** The prizes under the scratch card on the portrait (an easter egg): a title, a line, the small print. */
  prizes: readonly { title: string; text: string; small: string }[];
  /** The line above the button under the prize. */
  claim: string;
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
    prizes: [
      { title: 'A Nigerian prince wrote to you', text: 'He wants to leave you $4.5M. Send bank details.', small: 'Zero typos in the email. Now that’s suspicious.' },
      { title: 'Your computer has 3,412 viruses!', text: 'Call tech support immediately!', small: 'A guy named "John" in Mumbai is popping champagne.' },
      { title: 'Free Bitcoin!', text: 'You mined 0.00000001 BTC. Minimum payout: 1 BTC.', small: 'Your power bill could have bought a real car.' },
      { title: 'Congratulations: 404', text: 'Your prize was not found.', small: 'Relax, it worked on staging.' },
      { title: 'Root access granted', text: 'sudo make me a sandwich', small: 'User is not in the sudoers file. This incident will be reported.' },
      { title: 'Parcel delivery failed', text: 'Pay a €1.99 fee to reschedule.', small: 'You ordered nothing, but curiosity wins anyway.' },
      { title: 'Hot singles in your area!', text: '3 pods nearby, all stuck in CrashLoopBackOff.', small: 'Missing env variables, that’s why they’re throwing a fit.' },
      { title: 'Direct push to main!', text: 'Merged on a Friday at 4:59 PM without tests.', small: 'DevOps is currently tracking your location with torches.' },
      { title: 'Chrome memory leak', text: 'You just opened a 5th tab.', small: 'Your RAM is actively writing its final will.' },
      { title: 'SQL Injection successful!', text: 'SELECT * FROM salaries WHERE user = "me";', small: 'Access denied. Try again from the CEO’s laptop.' },
        ],
    claim: 'Collect the real prize 😁',
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
    prizes: [
      { title: 'Egy nigériai herceg írt neked', text: 'Rád hagyna 4,5 millió dollárt, csak a banki adataid kellenek.', small: 'Nincs elgépelés a levélben. Ez már gyanús.' },
      { title: '3412 vírus van a gépeden!', text: 'Hívd azonnal a képernyőn látható számot!', small: 'Egy "John" nevű kolléga már bontja a pezsgőt Mumbai-ban.' },
      { title: 'Ingyen Bitcoin!', text: 'Kibányásztál 0,00000001 BTC-t. Kifizetés: 1 BTC-től.', small: 'A villanyszámládból pont kijött volna egy igazi autó.' },
      { title: 'Congratulations: 404', text: 'A nyereményed nem található.', small: 'Nyugalom, stagingen még tökéletesen működött.' },
      { title: 'Root hozzáférés megadva', text: 'sudo make me a sandwich', small: 'User is not in the sudoers file. This incident will be reported.' },
      { title: 'A csomagod kézbesítése sikertelen', text: 'Fizess 490 Ft-ot az újraküldéshez.', small: 'Nem rendeltél semmit, de a kíváncsiság úgyis győz.' },
      { title: 'Forró szinglik a közelben!', text: '3 pod van a környékeden, mind CrashLoopBackOffban.', small: 'Hiányoznak az env variable-ök, azért hisztiznek.' },
      { title: 'PR merged straight to main!', text: 'Péntek 16:59-kor pusholtál tesztelés nélkül.', small: 'A DevOps már elindult a házadhoz fáklyákkal.' },
      { title: 'Chrome memória-éhség', text: 'Megnyitottál egy 5. fület is a böngészőben.', small: 'A RAM-od épp végrendeletet ír.' },
      { title: 'Sikeres SQL Injection!', text: 'SELECT * FROM fizetesek WHERE ember = "én";', small: 'Access denied. Próbáld meg a CEO gépéről.' },
    ],
    claim: 'Az igazi nyeremény átvétele 😁',
    fullTime: 'Teljes munkaidő',
    partTime: 'Részmunkaidő',
    touch: 'Érints meg egy évet, vagy húzd rajta az ujjad',
    newTab: '(új lapon nyílik)',
    more: 'A teljes leírás megjelenítése',
    less: 'Kevesebb megjelenítése',
  },
};
