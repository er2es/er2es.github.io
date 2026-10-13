import type { SiteContent } from './model';

export const hu: SiteContent = {
  lang: 'hu',
  meta: {
    title: 'Szabó József – Full-stack PHP fejlesztő (Symfony, Angular, PostgreSQL)',
    description: 'Budapesti full-stack PHP fejlesztő: Symfony backend, Angular frontend, PostgreSQL triggerekkel és tárolt eljárásokkal, GitLab CI/CD RHEL-en. Több év szoftvertesztelői tapasztalattal. Remote vagy hibrid munkát keresek.',
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
    role: 'Full-stack PHP fejlesztő · Symfony, Angular, PostgreSQL',
    location: 'Budapest',
    status: 'Remote vagy hibrid munkát keresek',
    cta: 'Írj nekem',
    portraitAlt: 'Szabó József fekete-fehér portréja',
  },
  profile: {
    paragraphs: [
      'Budapesti full-stack PHP fejlesztő vagyok. Webalkalmazásokat fejlesztek Symfony backenddel és Angular frontenddel. Az adatbázisban PostgreSQL triggereket és tárolt eljárásokat írok és tartok karban. Az alkalmazások GitLab CI/CD-vel kerülnek ki RHEL szerverekre.',
      '2008 óta dolgozom az informatikában. Adatfeldolgozással kezdtem, utána több évig szoftvertesztelő voltam: Selenium WebDriver, felhasználói elfogadási tesztek (UAT), felfedező tesztelés. Ezért fejlesztés előtt mindig átgondolom, hogyan lehet majd tesztelni a változtatást.',
      'Refaktoráltam legacy PHP kódot, és nagy WordPress rendszereket is karbantartottam, köztük egy több mint 200 oldalas multisite-ot. Elsősorban mégis alkalmazásfejlesztéssel és a mögötte álló adatbázissal foglalkozom.',
    ],
  },
  experience: {
    intro: 'Elöl a legfrissebb. A részletek egy tételre kattintva nyílnak meg. A munkahelyeket általánosan írtam le, a teljes önéletrajzot kérésre elküldöm.',
  },
  skills: {
    intro: 'Technológiák és módszerek, amelyekkel dolgozom, területenként.',
    groups: {
      backend: 'Backend',
      frontend: 'Frontend',
      database: 'Adatbázis',
      devops: 'DevOps és infrastruktúra',
      quality: 'Tesztelés és minőségbiztosítás',
      other: 'Egyéb',
    },
  },
  projects: { intro: 'Válogatott projektek, röviden arról, mire valók.', open: 'Megnyitás a GitHubon' },
  about: {
    education: {
      heading: 'Tanulmányok',
      items: ['Számítástechnikai szoftverüzemeltető (OKJ középfokú szakképzés), 2002–2007'],
    },
    languages: {
      heading: 'Nyelvtudás',
      items: [
        'Magyar: anyanyelv',
        'Angol, fejlesztési dokumentáció olvasása és megértése: középszint',
        'Angol, beszéd és írás: alapszint',
      ],
    },
    award: {
      heading: 'Elismerés',
      text: '„A tanév embere” elismerés (2016/17) egy állami egyetemtől, egy kutatási pályázatkezelő és monitoring informatikai rendszer bevezetéséért.',
    },
  },
  contact: {
    text: 'Emailben érsz el a legbiztosabban.',
    workMode: 'Remote vagy hibrid, Budapesten',
  },
  items: {
    chamber: {
      title: 'PHP fejlesztő',
      org: 'Országos szakmai kamara',
      points: [
        'Egy webes platform (Angular frontend, Symfony backend) technikai és fejlesztési koordinációja egy több mint három évig tartó projektben.',
        'Együttműködés a külső fejlesztőcsapattal, a belső tesztelés megszervezése.',
        'Hibajavítás és új funkciók fejlesztése a Symfony backendben és az Angular frontendben; kiadás GitLab CI/CD-vel RHEL szerverekre.',
        'PostgreSQL triggerek és tárolt eljárások írása és karbantartása; egyeztetés a belső kollégákkal az adatbázis-tervezésről és az infrastruktúra-igényekről.',
        'A platform support oldalának önálló fejlesztése (Angular, Symfony); webalkalmazások és API végpontok készítése társszervezeteknek.',
        'A szervezet WordPress oldalainak és intranetének fejlesztése és karbantartása; szakértői támogatás más fejlesztési projektekben.',
      ],
    },
    'uni-med': {
      title: 'PHP fejlesztő',
      org: 'Állami orvosi egyetem',
      points: [
        'Az egyetem WordPress multisite rendszerének fejlesztése: több mint 200 oldal, mintegy 800 adminisztrátor felhasználó.',
        'A kezdőlap és a hírek rovat újraépítése az alapoktól, frontend és backend oldalon.',
        'WordPress témák készítése (SASS, Node, Bootstrap 4) és kisebb Laravel alkalmazások fejlesztése.',
      ],
    },
    welfare: {
      title: 'PHP fejlesztő (részmunkaidő)',
      org: 'Állami szociális igazgatóság',
      points: [
        'A SeedDMS nyílt forráskódú dokumentumkezelő rendszer (Ubuntu) testreszabása a szervezet ügymenetéhez és jogosultsági rendjéhez.',
      ],
    },
    'uni-admin': {
      title: 'Informatikai szakértő',
      org: 'Állami egyetem (közigazgatási képzés)',
      points: [
        'Két webes rendszer fejlesztésének és tesztelésének koordinálása; a fejlesztést külső beszállító végezte.',
        'Kapcsolattartás a beszállítóval, a leszállított verziók minőségellenőrzése.',
        'Az egyik az egyetem belső kutatási pályázati rendszere volt, a másik kormányzati mutatókat monitorozott az egyetem egyik EU-s projektjében végzett szakértői munkához.',
      ],
    },
    'health-inst': {
      title: 'Junior elemző',
      org: 'Állami egészségfejlesztési intézet',
      points: ['Egy EU-s projekt szakértői munkájának támogatása: kimutatások, adatbázis-lekérdezések, adattisztítás.'],
    },
    'edu-authority': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Országos oktatási hatóság',
      points: ['Oktatási informatikai rendszerek fejlesztéseinek tesztelése, részben Selenium WebDriverrel írt automatizált tesztekkel.'],
    },
    'pricing-co': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Online árösszehasonlító cég',
      points: ['Webes szoftverek tesztelése egy tíznél több fős IT csapatban, többek között Selenium WebDriverrel.'],
    },
    'edu-nonprofit': {
      title: 'IT asszisztens',
      org: 'Oktatási nonprofit cég',
      points: ['Adatok előkészítése elemzésekhez; adatfelvételi lapok és adatbázisok fejlesztése Excelben és Accessben, VBA-val.'],
    },
    fuzzphony: {
      title: 'Fuzzphony',
      summary: 'Saját nyílt forráskódú keresőkönyvtáram PHP-hoz és Symfonyhoz, amely kizárólag PostgreSQL-re épül. Elírástűrő, ékezetfüggetlen, rangsorolt teljes szöveges keresést ad szűrőkkel és lekérdezőnyelvvel, Elasticsearch, Meilisearch vagy más külső szolgáltatás nélkül. A meglévő táblákat nem módosítja, az indexet egy mellettük álló külön táblában tartja.',
      points: [],
    },
    audit: {
      title: 'Audit- és adminisztrációs rendszerek',
      summary: 'Webalkalmazások jogszerűségi auditokhoz: felhasználó- és jogosultságkezelés, mintegy 400 többféle típusú kérdésből álló dinamikus űrlapok komplex validációval, dinamikus DOCX generálás és a válaszok kiértékelése. Ugyanerre a modellre épül egy egyszerűbb, CodeIgniterben készült audit körülbelül 300 kérdéssel, saját számítási és összesítési szabályokkal.',
      points: ['Projekttervező és nyilvántartó rendszer (Laravel 7, Bootstrap).', 'EU-s támogatások nyilvántartó rendszere (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      title: 'Kormányzati mutatók oldala',
      summary: 'WordPress alapú tájékoztató oldal, amelyet 2020-ig terveztem, fejlesztettem és üzemeltettem. Technikai oldalról közreműködtem egy mutatóban, amely a fővároson kívül a legközelebbi kormányablakig mért átlagos közúti távolságot mutatja (2015–2019), és PHP-ban, TCPDF-fel készítettem el a 2019-es jelentés nyomdakész változatát.',
      points: [],
    },
    wordpress: {
      title: 'WordPress projektek',
      summary: 'WordPress oldalak fejlesztése, hangolása és üzemeltetése több megbízónak: gyorsítótárazás, átállás PHP 7-re, szerverköltöztetés, CDN beállítása és kisebb frontend módosítások. Emellett szerepkör-alapú tudás- és dokumentumtár, további ügyfélfelületek, valamint landing és bemutatkozó oldalak.',
      points: [],
    },
    'sport-programme': {
      title: 'Országos sportnépszerűsítő program',
      summary: 'Egy országos felsőoktatási sportprogram online rendszerének fejlesztése és üzemeltetése, mintegy 17 000 regisztrált felhasználóval. A program 2016-ban zárult le.',
      points: [],
    },
    surveys: {
      title: 'Kérdőíves kutatások',
      summary: 'Kérdőíves adatfelvételi rendszerek fejlesztése a teljes folyamatra, a mögöttük álló lekérdezésekkel és statisztikai feldolgozással. IBM SPSS alapszinten.',
      points: [],
    },
    'admissions-map': {
      title: 'Felvételi adatok vizualizációja',
      summary: 'Interaktív, többdimenziós térkép a 2009–2013 közötti felsőoktatási felvételi adatokról.',
      points: [],
    },
  },
};
