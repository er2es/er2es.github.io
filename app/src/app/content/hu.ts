import type { SiteContent } from './model';

export const hu: SiteContent = {
  lang: 'hu',
  meta: {
    title: 'Szabó József – Full-stack fejlesztő (PHP, Symfony, Angular)',
    description: 'Budapesti full-stack fejlesztő, PHP (Symfony, WordPress) és Angular alapú rendszerekkel. Remote vagy hybrid pozíciókra elérhető.',
    ogLocale: 'hu_HU',
  },
  ui: {
    skip: 'Ugrás a tartalomra',
    navLabel: 'Szekciók',
    tabsLabel: 'Gyors navigáció',
    sections: { profile: 'Profil', experience: 'Tapasztalat', skills: 'Kompetenciák', projects: 'Projektek', about: 'Rólam', contact: 'Kapcsolat' },
    otherLanguage: 'English',
    usedIn: 'Használva',
    theme: { label: 'Téma', auto: 'Auto', light: 'Világos', dark: 'Sötét' },
    graph: { seeProject: 'Lásd a Projektek között' },
    palette: {
      open: 'Keresés és parancsok',
      short: 'Keresés',
      placeholder: 'Keress a CV-ben, vagy írj be egy parancsot',
      empty: 'Nincs találat',
      close: 'Bezár',
      ask: 'Kérdés',
      thinking: 'Dolgozom rajta',
      onDevice: 'A válasz ezen az eszközön készült. A böngészőből nem megy ki semmi.',
      askFailed: 'Nincs elérhető válasz. Helyette a találatok jelennek meg.',
      switchLanguage: 'Váltás angolra',
      changeTheme: 'Téma váltása',
      email: 'Email küldése',
    },
  },
  hero: {
    name: 'Szabó József',
    role: 'Full-stack fejlesztő · PHP (Symfony) & Angular',
    location: 'Budapest',
    status: 'Remote vagy hybrid pozíciókra elérhető',
    cta: 'Email küldése',
    portraitAlt: 'Szabó József fekete-fehér portréja',
  },
  profile: {
    paragraphs: [
      'Full-stack fejlesztőként PHP (Symfony, WordPress) és Angular alapú webes rendszerek fejlesztésével foglalkozom. Jól működöm többszereplős környezetben, ahol a feladatokat az üzleti igények egyeztetésétől a fejlesztésen és a CI/CD folyamatokon át az élesítésig, majd az azt követő terméktámogatásig végigkísérem.',
      'A minőségbiztosítási (QA) hátterem sokat segít a mindennapokban: a tesztelést támogató szemlélet és a minőség fókuszban tartása alapvető számomra a munkavégzés során.',
    ],
  },
  experience: {
    intro: 'A főállások a fővonalon futnak, a párhuzamos munkák mellékágként. Nyiss meg egy csomópontot a részletekért. A munkahelyek általános leírással szerepelnek, a részletes CV kérésre elérhető.',
  },
  skills: {
    intro: 'Területenként csoportosítva. Minden kompetencia alatt: hol használtam.',
    groups: {
      backend: 'Backend',
      frontend: 'Frontend',
      database: 'Adatbázis',
      devops: 'DevOps és infrastruktúra',
      quality: 'Minőségbiztosítás',
      other: 'Egyéb',
    },
  },
  projects: { intro: 'Válogatott projektek.', open: 'Megnyitás a GitHubon' },
  about: {
    education: {
      heading: 'Tanulmányok',
      items: ['Számítástechnikai szoftverüzemeltető (OKJ középfokú szakképzés), 2002–2007'],
    },
    languages: {
      heading: 'Nyelvtudás',
      items: [
        'Magyar: anyanyelv',
        'Angol, fejlesztési dokumentációk megértése és feldolgozása: középszint',
        'Angol, beszéd és írás: alapszint',
      ],
    },
    award: {
      heading: 'Elismerés',
      text: '„A tanév embere” elismerő oklevél, 2016/17, egy állami egyetemtől, kutatói pályázati és monitoring IT rendszer bevezetéséért.',
    },
  },
  contact: {
    text: 'A legjobb elérhetőség az email.',
    workMode: 'Remote vagy hybrid (Budapest)',
  },
  items: {
    chamber: {
      short: 'Szakmai köztestület',
      title: 'PHP fejlesztő',
      org: 'Országos szakmai köztestület',
      points: [
        'Egy webes platform technikai és fejlesztési koordinációja (Angular front end, Symfony back end) egy több mint három éves projektben.',
        'Kapcsolattartás a külső fejlesztőcsapattal, a belső tesztelés szervezése, hibajavítás és új funkciók fejlesztése back end és front end oldalon.',
        'Belső munkatársak koordinációja adatbázis-tervezésben és infrastruktúra-igényekben; PostgreSQL triggerek és tárolt eljárások fejlesztése, karbantartása.',
        'A platform support oldalának önálló fejlesztése (Angular, Symfony).',
        'A szervezet WordPress honlapcsaládjának és intranetének fejlesztése, karbantartása; online alkalmazások és API végpontok készítése a társszerveknek.',
        'Futó fejlesztési projektek szakértői támogatása.',
      ],
    },
    'uni-med': {
      short: 'Orvosi egyetem',
      title: 'PHP fejlesztő',
      org: 'Állami orvosi egyetem',
      points: [
        'Az egyetem WordPress multisite rendszerének fejlesztése: 200+ oldal és körülbelül 800 adminisztratív felhasználó.',
        'A kezdőlap és a hírek rovat teljes megújítása, front end és back end.',
        'Témafejlesztés (SASS, Node, Bootstrap 4) és Laravel micro appok.',
      ],
    },
    welfare: {
      short: 'Szociális intézmény',
      title: 'PHP fejlesztő, részmunkaidő',
      org: 'Állami szociális igazgatóság',
      points: [
        'Egy nyílt forráskódú dokumentumkezelő rendszer (SeedDMS, Ubuntu) működési és jogosultságkezelési igényekhez igazítása.',
      ],
    },
    'uni-admin': {
      short: 'Közigazgatási egyetem',
      title: 'Informatikai szakértő',
      org: 'Állami egyetem (közigazgatási képzés)',
      points: [
        'Két webes rendszer fejlesztési koordinációja és tesztelése.',
        'Kapcsolattartási és minőségbiztosítási feladatok a beszállító eredménytermékei kapcsán.',
        'Az egyik az egyetem belső kutatásfinanszírozási pályázati rendszere volt, a másik kormányzati mutatók monitoring rendszere, az egyetem által egy EU-s projektben ellátott szakértői feladat keretében.',
      ],
    },
    'health-inst': {
      short: 'Egészségfejlesztési intézet',
      title: 'Junior elemző',
      org: 'Állami egészségfejlesztési intézet',
      points: ['Szakértői munka háttértámogatása egy EU-s társfinanszírozású projekt keretében: kimutatások, lekérdezések és adattisztítás.'],
    },
    'edu-authority': {
      short: 'Oktatási hatóság',
      title: 'Szoftvertesztelő (QA)',
      org: 'Országos oktatási hatóság',
      points: ['Oktatási rendszerfejlesztések tesztelése.'],
    },
    'pricing-co': {
      short: 'Árösszehasonlító cég',
      title: 'Szoftvertesztelő (QA)',
      org: 'Online árösszehasonlító cég',
      points: ['Szoftvertesztelés egy 10+ fős IT csapatban.'],
    },
    'edu-nonprofit': {
      short: 'Oktatási nonprofit',
      title: 'IT asszisztens',
      org: 'Oktatási nonprofit cég',
      points: ['Elemzési adatelőkészítés; adatfelvételi lapok és adatbázisok programozása VBA-ban.'],
    },
    fuzzphony: {
      short: 'Fuzzphony',
      title: 'Fuzzphony',
      summary: 'PostgreSQL-natív keresőréteg PHP-hoz és Symfonyhoz: elírás- és ékezettűrő, rangsorolt teljes szöveges keresés szűrőkkel és valódi lekérdezőnyelvvel, Elasticsearch, Meilisearch vagy bármilyen más szolgáltatás nélkül. A táblákat nem módosítja, mellettük egy külön index tábla áll.',
      points: [],
    },
    audit: {
      short: 'Audit rendszerek',
      title: 'Audit- és adminisztrációs rendszerek',
      summary: 'Jogszerűségi audit vizsgálati rendszerek jogosultság- és felhasználókezeléssel, dinamikus űrlapokkal komplex validációval (~400 kérdés, többféle típus), dinamikus DOCX generálással és válaszértékelő rendszerrel. Ugyanezen modell alapján egy egyszerűbb audit CodeIgniterben (~300 kérdés), eltérő számítási és összesítési módszerekkel.',
      points: ['Projekttervező és nyilvántartó rendszer (Laravel 7, Bootstrap).', 'EU támogatás nyilvántartó rendszer (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      short: 'Kormányzati jelentésoldal',
      title: 'Kormányzati mutatókat bemutató oldal',
      summary: 'Egy WordPress tájékoztató oldal tervezése, fejlesztése és általános üzemeltetése 2020-ig. Technológiai közreműködés egy mutató elkészítésében, amely a fővároson kívüli legközelebbi kormányablaktól mért átlagos közúti távolságot méri (2015–2019), valamint a 2019-es jelentés nyomdakész generálása PHP TCPDF-fel.',
      points: [],
    },
    wordpress: {
      short: 'WordPress projektek',
      title: 'WordPress projektek',
      summary: 'WordPress oldalak fejlesztése, optimalizálása és üzemeltetése több megbízónak: cache, PHP 7 migráció, szerverköltöztetés, CDN és kisebb front end módosítások. Emellett role-based tudástár és dokumentumtár, további ügyfélfelületek, valamint landing és bemutatkozó oldalak.',
      points: [],
    },
    'sport-programme': {
      short: 'Sportprogram',
      title: 'Országos sportnépszerűsítő program',
      summary: 'Országos felsőoktatási sportnépszerűsítő program online rendszerének fejlesztése és üzemeltetése. Körülbelül 17 000 regisztrált felhasználó. A program 2016-ban lezárult.',
      points: [],
    },
    surveys: {
      short: 'Kérdőíves kutatások',
      title: 'Kérdőíves kutatások',
      summary: 'Teljes körű kérdőíves adatfelvételi rendszerek fejlesztése, lekérdezések és statisztikai feldolgozás. IBM SPSS alapszinten.',
      points: [],
    },
    'admissions-map': {
      short: 'Felvételi térkép',
      title: 'Felvételi adatok vizualizációja',
      summary: 'A 2009–2013 közötti felsőoktatási felvételi adatok többdimenziós, interaktív térképes megjelenítése.',
      points: [],
    },
  },
};
