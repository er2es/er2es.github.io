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
  /** The footer's link to the code and its licence. */
  source: string;
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
      { title: 'Your computer has 3,412 viruses!', text: 'Call the number on the screen right now.', small: 'There is no number. There never was.' },
      { title: 'Free Bitcoin!', text: 'You mined 0.00000001 BTC. Minimum payout: 1 BTC.', small: 'Your power bill could have bought a real car.' },
      { title: 'Congratulations: 404', text: 'Your prize was not found.', small: 'Relax, it worked on staging.' },
      { title: 'Root access granted', text: 'sudo make me a sandwich', small: 'User is not in the sudoers file. This incident will be reported.' },
      { title: 'Parcel delivery failed', text: 'Pay a €1.99 fee to reschedule.', small: 'You ordered nothing, but curiosity wins anyway.' },
      { title: 'Hot singles in your area!', text: '3 pods nearby, all stuck in CrashLoopBackOff.', small: 'Missing env variables, that’s why they’re throwing a fit.' },
      { title: 'Direct push to main!', text: 'Merged on a Friday at 4:59 PM without tests.', small: 'DevOps is on its way to your house with torches.' },
      { title: 'Chrome memory leak', text: 'You just opened a 5th tab.', small: 'Your RAM is actively writing its final will.' },
      { title: 'SQL Injection successful!', text: 'SELECT * FROM salaries WHERE user = "me";', small: 'Access denied. Try again from the CEO’s laptop.' },
        ],
    claim: 'Collect the real prize 😁',
    fullTime: 'Full-time',
    partTime: 'Part-time',
    touch: 'Touch or drag across a year for the details',
    source: 'Source',
    newTab: '(opens in a new tab)',
    more: 'Read more',
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
      { title: '3412 vírus van a gépeden!', text: 'Hívd azonnal a képernyőn látható számot!', small: 'Nincs ott szám. Soha nem is volt.' },
      { title: 'Ingyen Bitcoin!', text: 'Kibányásztál 0,00000001 BTC-t. Kifizetés 1 BTC-tól.', small: 'A villanyszámládból már vehettél volna egy autót.' },
      { title: 'Gratulálunk: 404', text: 'A nyereményed nem található.', small: 'Nyugi, stagingen még működött.' },
      { title: 'Root hozzáférés megadva', text: 'sudo csinálj nekem egy szendvicset', small: 'A felhasználó nincs a sudoers fájlban. Az esetet jelenteni fogjuk.' },
      { title: 'A csomagod kézbesítése sikertelen', text: 'Fizess 490 Ft-ot az újraküldéshez.', small: 'Nem rendeltél semmit, de a kíváncsiság úgyis győz.' },
      { title: 'Forró szinglik a környéken!', text: '3 pod van a közeledben, mind CrashLoopBackOffban.', small: 'Hiányzik egy környezeti változó, azért hisztiznek.' },
      { title: 'Közvetlenül a mainre pusholtál!', text: 'Péntek 16:59-kor, tesztelés nélkül.', small: 'A DevOps már úton van hozzád, fáklyákkal.' },
      { title: 'Chrome-memóriaszivárgás', text: 'Megnyitottál egy 5. fület.', small: 'A RAM-od épp a végrendeletét írja.' },
      { title: 'Sikeres SQL injection!', text: 'SELECT * FROM fizetesek WHERE ember = "én";', small: 'Hozzáférés megtagadva. Próbáld meg a vezérigazgató gépéről.' },
    ],
    claim: 'Az igazi nyeremény átvétele 😁',
    fullTime: 'Teljes munkaidő',
    partTime: 'Részmunkaidő',
    touch: 'Érints meg egy évet, vagy húzd végig az ujjad a sávon.',
    source: 'Forráskód',
    newTab: '(új lapon nyílik)',
    more: 'Teljes leírás',
    less: 'Kevesebb',
  },
};
