import type { SiteContent } from './model';

export const hu: SiteContent = {
  lang: 'hu',
  meta: {
    title: 'Szabó József – Full-stack fejlesztő (PHP, Symfony, Angular)',
    description: 'Budapesti full-stack fejlesztő: PHP (Symfony), Angular és PostgreSQL. Remote vagy hybrid pozíciókra elérhető.',
    ogLocale: 'hu_HU',
  },
  ui: {
    skip: 'Ugrás a tartalomra',
    navLabel: 'Szekciók',
    tabsLabel: 'Gyors navigáció',
    sections: { profile: 'Profil', experience: 'Tapasztalat', skills: 'Kompetenciák', projects: 'Projektek', about: 'Rólam', contact: 'Kapcsolat' },
    otherLanguage: 'English',
    tags: 'Címkék',
    theme: { label: 'Téma', auto: 'Auto', light: 'Világos', dark: 'Sötét' },
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
    egg: {
      title: 'A motorháztető alatt',
      intro: 'Élőben mérve, a böngésződben, éppen most.',
      requests: 'Kérések',
      thirdParty: 'Harmadik féltől',
      cookies: 'Sütik',
      transferred: 'Letöltött adat',
      scripts: 'JavaScript',
      dom: 'DOM-elemek',
      lcp: 'Legnagyobb tartalmi festés',
      cls: 'Elrendezés-eltolódás',
      note: 'Nincs követő, nincs analitika, nincs süti. Bezárás: Esc.',
      close: 'Bezár',
    },
  },
  hero: {
    name: 'Szabó József',
    role: 'Full-stack fejlesztő · PHP (Symfony), Angular, PostgreSQL',
    location: 'Budapest',
    status: 'Remote vagy hybrid pozíciókra elérhető',
    cta: 'Írj nekem',
    portraitAlt: 'Szabó József fekete-fehér portréja',
  },
  profile: {
    paragraphs: [
      'Full-stack fejlesztő vagyok. Mindennapi eszközöm a PHP (Symfony) és az Angular PostgreSQL alapokon: sématervezés, triggerek és tárolt eljárások, API, front end, és a mindezt RHEL-en szállító GitLab CI/CD pipeline.',
      'Legacy PHP kódot refaktorálok, és ha kell, egy WordPress-környezetet is rendben tartok, de a munkám lényege az alkalmazáskód és a mögötte álló adatbázis. A szoftvertesztelésben töltött évek megtanítottak arra, hogy már a fejlesztés előtt végiggondoljam, hogyan lesz ellenőrizve a változás.',
    ],
  },
  experience: {
    intro: 'A legfrissebb elöl. Egy tételre kattintva megnyílnak a részletek. A munkahelyeket általánosan írtam le, a teljes önéletrajzot kérésre elküldöm.',
  },
  skills: {
    intro: 'Amivel dolgozom, területenként csoportosítva.',
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
      text: '„A tanév embere” elismerés, 2016/17, egy állami egyetemtől, kutatói pályázati és monitoring IT rendszer bevezetéséért.',
    },
  },
  contact: {
    text: 'A legjobb elérhetőség az email.',
    workMode: 'Remote vagy hybrid (Budapest)',
  },
  items: {
    chamber: {
      title: 'PHP fejlesztő',
      org: 'Országos szakmai kamara',
      points: [
        'Egy webes platform technikai és fejlesztési koordinációja (Angular front end, Symfony back end) egy több mint három évig tartó projektben.',
        'Együttműködés a külső fejlesztőcsapattal, a belső tesztelés szervezése, hibajavítás és új funkciók fejlesztése back end és front end oldalon.',
        'Egyeztetés a belső munkatársakkal az adatbázis-tervezésről és az infrastruktúra-igényekről; PostgreSQL triggerek és tárolt eljárások írása és karbantartása.',
        'A platform support oldalának önálló fejlesztése (Angular, Symfony).',
        'A szervezet WordPress oldalainak és intranetének fejlesztése, karbantartása; webalkalmazások és API végpontok készítése a társszerveknek.',
        'Futó fejlesztési projektek szakértői támogatása.',
      ],
    },
    'uni-med': {
      title: 'PHP fejlesztő',
      org: 'Állami orvosi egyetem',
      points: [
        'Az egyetem WordPress multisite rendszerének fejlesztése: több mint 200 oldal és mintegy 800 adminisztratív felhasználó.',
        'A kezdőlap és a hírek rovat teljes megújítása, front end és back end.',
        'Témafejlesztés (SASS, Node, Bootstrap 4) és kisebb Laravel alkalmazások.',
      ],
    },
    welfare: {
      title: 'PHP fejlesztő, részmunkaidő',
      org: 'Állami szociális igazgatóság',
      points: [
        'Egy nyílt forráskódú dokumentumkezelő rendszer (SeedDMS, Ubuntu) igazítása a szervezet működéséhez és jogosultságkezeléséhez.',
      ],
    },
    'uni-admin': {
      title: 'Informatikai szakértő',
      org: 'Állami egyetem (közigazgatási képzés)',
      points: [
        'Két webes rendszer fejlesztésének koordinálása és tesztelése.',
        'Kapcsolattartás a beszállítóval és a leszállított eredmények minőségbiztosítása.',
        'Az egyik az egyetem belső kutatásfinanszírozási pályázati rendszere volt, a másik kormányzati mutatókat monitorozott, az egyetem EU-s projektben végzett szakértői munkájának részeként.',
      ],
    },
    'health-inst': {
      title: 'Junior elemző',
      org: 'Állami egészségfejlesztési intézet',
      points: ['Szakértői munka háttértámogatása egy EU-s projektben: kimutatások, lekérdezések, adattisztítás.'],
    },
    'edu-authority': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Országos oktatási hatóság',
      points: ['Oktatási rendszerfejlesztések tesztelése.'],
    },
    'pricing-co': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Online árösszehasonlító cég',
      points: ['Szoftvertesztelés egy tíznél több fős IT csapatban.'],
    },
    'edu-nonprofit': {
      title: 'IT asszisztens',
      org: 'Oktatási nonprofit cég',
      points: ['Adatok előkészítése elemzésekhez; adatfelvételi lapok és adatbázisok programozása VBA-ban.'],
    },
    fuzzphony: {
      title: 'Fuzzphony',
      summary: 'PostgreSQL-natív keresőréteg PHP-hoz és Symfonyhoz. Elírás- és ékezettűrő, rangsorolt teljes szöveges keresést ad szűrőkkel és valódi lekérdezőnyelvvel, Elasticsearch, Meilisearch vagy bármilyen más szolgáltatás nélkül. A táblákat sosem módosítja, mellettük egy külön index tábla áll.',
      points: [],
    },
    audit: {
      title: 'Audit- és adminisztrációs rendszerek',
      summary: 'Jogszerűségi audit rendszerek jogosultság- és felhasználókezeléssel, dinamikus űrlapokkal komplex validációval (~400 kérdés, többféle típus), dinamikus DOCX generálással és válaszértékelő rendszerrel. Ugyanezen modell alapján készült egy egyszerűbb audit CodeIgniterben (~300 kérdés), eltérő számítási és összesítési módszerekkel.',
      points: ['Projekttervező és nyilvántartó rendszer (Laravel 7, Bootstrap).', 'EU támogatás nyilvántartó rendszer (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      title: 'Kormányzati mutatók oldala',
      summary: 'Egy WordPress tájékoztató oldal tervezése, fejlesztése és üzemeltetése 2020-ig. Technológiai közreműködés egy mutatóban, amely a fővároson kívüli legközelebbi kormányablakig vezető átlagos közúti távolságot méri (2015–2019), és a 2019-es jelentés nyomdakész elkészítése PHP TCPDF-fel.',
      points: [],
    },
    wordpress: {
      title: 'WordPress projektek',
      summary: 'WordPress oldalak fejlesztése, hangolása és üzemeltetése több megbízónak: cache, PHP 7 migráció, szerverköltöztetés, CDN és kisebb front end módosítások. Emellett role-based tudástár és dokumentumtár, további ügyfélfelületek, valamint landing és bemutatkozó oldalak.',
      points: [],
    },
    'sport-programme': {
      title: 'Országos sportnépszerűsítő program',
      summary: 'Egy országos felsőoktatási sportnépszerűsítő program online rendszerének fejlesztése és üzemeltetése. Körülbelül 17 000 regisztrált felhasználó; a program 2016-ban lezárult.',
      points: [],
    },
    surveys: {
      title: 'Kérdőíves kutatások',
      summary: 'Teljes körű kérdőíves adatfelvételi rendszerek fejlesztése, a mögöttük álló lekérdezésekkel és statisztikai feldolgozással. IBM SPSS alapszinten.',
      points: [],
    },
    'admissions-map': {
      title: 'Felvételi adatok vizualizációja',
      summary: 'A 2009–2013 közötti felsőoktatási felvételi adatok többdimenziós, interaktív térképes megjelenítése.',
      points: [],
    },
  },
};
