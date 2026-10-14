import type { SiteContent } from './model';

export const hu: SiteContent = {
  lang: 'hu',
  meta: {
    title: 'Szabó József – full-stack PHP-fejlesztő (Symfony, Angular, PostgreSQL)',
    description: 'Szabó József budapesti full-stack PHP-fejlesztő: Symfony, Angular, TypeScript, PostgreSQL-triggerek és tárolt eljárások, REST API-k. Remote / hybrid.',
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
    role: 'Full-stack PHP-fejlesztő · Symfony, Angular, PostgreSQL',
    location: 'Budapest',
    status: 'REMOTE / HYBRID',
    cta: 'Írj nekem',
    portraitAlt: 'Szabó József fekete-fehér portréja',
  },
  profile: {
    paragraphs: [
      'Budapesti full-stack PHP-fejlesztő vagyok. Webalkalmazásokat készítek, a szerveroldalon Symfonyval, a böngészőben Angularral és TypeScripttel, de a munka nálam nem áll meg az alkalmazás kódjánál: a PostgreSQL-ben triggereket és tárolt eljárásokat írok, és az adatbázis tervezésében is részt veszek.',
      'Az adatokhoz tartozó szabályokat szívesebben bízom az adatbázisra, mint arra, hogy az alkalmazás minden pontja emlékezzen rájuk. Mielőtt bármihez hozzányúlok, eldöntöm, hogyan fogom ellenőrizni a változtatást, és amikor élesbe kerül, újra megnézem. Jól ismerem a GitLab CI/CD-re és RHEL-szerverekre épülő környezetet, és sokat dolgoztam külső fejlesztőcsapatokkal is: én szerveztem a leszállított verzióik belső tesztelését.',
      'A fejlesztéshez a minőségbiztosítás felől érkeztem. 2008-ban adat-előkészítéssel és VBA-val kezdtem az informatikában, aztán több évig szoftvertesztelő voltam: Selenium WebDriverrel írtam automatizált teszteket, emellett felhasználói elfogadási (UAT) és felfedező tesztelésben vettem részt. Innen hozom azt a szokást, hogy mindent kétszer nézek meg. Azóta refaktoráltam legacy PHP-kódot, Laravelben és CodeIgniterben is készítettem alkalmazásokat, néhány évig pedig WordPresszel foglalkoztam: egy több mint 200 oldalas multisite-ot gondoztam, és témákat is fejlesztettem hozzá.',
    ],
  },
  experience: {
    intro: 'A legfrissebb van elöl. A munkahelyeket név helyett csak a jellegükkel írom le; a részletekért nyiss meg egy tételt, a teljes önéletrajzot pedig emailben kérheted.',
  },
  skills: {
    intro: 'A technológiák, amelyekkel dolgozom, és a tesztelési módszerek, amelyeket a QA-s évekből hoztam magammal, területek szerint.',
    groups: {
      backend: 'Backend',
      frontend: 'Frontend',
      database: 'Adatbázis',
      devops: 'DevOps és infrastruktúra',
      quality: 'Tesztelés és minőségbiztosítás',
      other: 'Egyéb',
    },
  },
  projects: { intro: 'Munkahelyi és saját projektek, mindegyiknél néhány sor arról, mire való.', open: 'Megnyitás a GitHubon' },
  about: {
    education: {
      heading: 'Tanulmányok',
      items: ['Számítástechnikai szoftverüzemeltető (OKJ középfokú szakképzés), 2002–2007'],
    },
    languages: {
      heading: 'Nyelvtudás',
      items: [
        'Magyar: anyanyelv',
        'Angol (fejlesztési dokumentáció olvasása): középszint',
        'Angol (beszéd és írás): alapszint',
      ],
    },
    award: {
      heading: 'Elismerés',
      text: 'Egy állami egyetemtől „A tanév embere” elismerést kaptam (2016/17) a kutatási pályázatok kezelésére és monitorozására szolgáló informatikai rendszer bevezetéséért.',
    },
  },
  contact: {
    text: 'Emailben érsz el a leggyorsabban.',
    workMode: 'REMOTE / HYBRID · Budapest',
  },
  items: {
    chamber: {
      title: 'PHP-fejlesztő',
      org: 'Országos szakmai kamara',
      points: [
        'Egy több mint hároméves projektben koordináltam egy Symfony-backendre és Angular-frontendre épülő webes platform technikai és fejlesztési munkáit; a külső fejlesztőcsapat által szállított verziók belső tesztelését is én szerveztem.',
        'Hibákat javítottam és új funkciókat készítettem a Symfony-backendben és az Angular-frontendben, GitLab CI/CD-re és RHEL-re épülő környezetben.',
        'PostgreSQL-triggereket és tárolt eljárásokat írtam és bővítettem; az adatbázis-tervezésről és az infrastruktúra-igényekről a belső kollégákkal egyeztettem.',
        'A platform support oldalát egyedül építettem fel, Symfonyban és Angularban.',
        'Partnerszervezeteknek webalkalmazások és API-végpontok is kikerültek a kezem alól.',
        'Gondoztam és bővítettem a szervezet WordPress-oldalait és intranetét, refaktoráltam legacy PHP-kódot, és technikai szakértőként más fejlesztési projekteket is támogattam.',
      ],
    },
    'uni-med': {
      title: 'PHP-fejlesztő',
      org: 'Állami orvosi egyetem',
      points: [
        'Az egyetem WordPress multisite-rendszerén dolgoztam, amely több mint 200 oldalt és mintegy 800 adminisztrátort szolgált ki.',
        'Újraépítettem az alapoktól a kezdőlapot és a hírrovatot, frontend- és backendoldalon egyaránt.',
        'WordPress-témákat készítettem SASS-szal, Node-dal és Bootstrap 4-gyel, emellett kisebb Laravel-alkalmazásokat is írtam.',
      ],
    },
    welfare: {
      title: 'PHP-fejlesztő (részmunkaidő)',
      org: 'Állami szociális igazgatóság',
      points: [
        'A nyílt forráskódú, Ubuntun futó SeedDMS dokumentumkezelőt a szervezet ügymenetéhez és jogosultsági rendjéhez igazítottam.',
      ],
    },
    'uni-admin': {
      title: 'Informatikai szakértő',
      org: 'Állami egyetem (közigazgatási képzés)',
      points: [
        'Két webes rendszer fejlesztését és tesztelését koordináltam; mindkettőt külső beszállító készítette.',
        'Én tartottam a kapcsolatot a beszállítóval, és ellenőriztem a leszállított verziók minőségét.',
        'Bevezettem az egyetem belső kutatási pályázati rendszerét és egy kormányzati mutatókat követő monitoringrendszert; utóbbi az egyetem egyik EU-s projektjében végzett szakértői munkát támogatta.',
      ],
    },
    'health-inst': {
      title: 'Junior elemző',
      org: 'Állami egészségfejlesztési intézet',
      points: ['Kimutatásokat készítettem, adatbázis-lekérdezéseket írtam és adatokat tisztítottam egy EU-s projekt szakértői munkájához.'],
    },
    'edu-authority': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Országos oktatási hatóság',
      points: ['Oktatási informatikai rendszerek új verzióit teszteltem, részben Selenium WebDriverrel írt automatizált tesztekkel.'],
    },
    'pricing-co': {
      title: 'Szoftvertesztelő (QA)',
      org: 'Online árösszehasonlító cég',
      points: ['Webes szoftvereket teszteltem egy több mint tízfős informatikai csapatban, többek között Selenium WebDriverrel.'],
    },
    'edu-nonprofit': {
      title: 'IT-asszisztens',
      org: 'Oktatási nonprofit cég',
      points: ['Adatokat készítettem elő elemzésekhez, és VBA-val automatizált adatfelvételi lapokat, adatbázisokat építettem Excelben és Accessben.'],
    },
    fuzzphony: {
      title: 'Fuzzphony',
      summary: 'Saját, nyílt forráskódú keresőkönyvtáram PHP-hoz és Symfonyhoz, amely csak a PostgreSQL-re támaszkodik. Rangsorolt teljes szöveges keresést ad, amely elnézi az elírásokat és figyelmen kívül hagyja az ékezeteket, szűrőkkel és lekérdezőnyelvvel; Elasticsearch, Meilisearch vagy más külső szolgáltatás nem kell hozzá. A meglévő táblákhoz nem nyúl: az index mellettük, egy külön táblában él.',
      points: [],
    },
    audit: {
      title: 'Audit- és adminisztrációs rendszerek',
      summary: 'Webalkalmazások jogszerűségi auditokhoz, felhasználó- és jogosultságkezeléssel. Az űrlapok dinamikusan épülnek fel mintegy 400, többféle típusú kérdésből, összetett validációval; a válaszokat a rendszer kiértékeli, és DOCX-dokumentumot generál belőlük. Ugyanerre a modellre épül egy egyszerűbb, CodeIgniterben írt audit is, körülbelül 300 kérdéssel és saját számítási, összesítési szabályokkal.',
      points: ['Projekttervező és -nyilvántartó rendszer (Laravel 7, Bootstrap).', 'EU-s támogatások nyilvántartása (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      title: 'Kormányzati mutatók oldala',
      summary: 'Kormányzati mutatókat bemutató WordPress-oldal, amelyet 2020-ig én terveztem, fejlesztettem és üzemeltettem. Az egyik mutató technikai hátterén is dolgoztam: ez a fővároson kívül a legközelebbi kormányablak átlagos közúti távolságát követte 2015 és 2019 között. A 2019-es jelentés nyomdakész változatát PHP-ban, TCPDF-fel állítottam elő.',
      points: [],
    },
    wordpress: {
      title: 'WordPress-projektek',
      summary: 'WordPress-oldalak több megbízónak, amelyeket felépítettem, hangoltam és üzemeltettem: gyorsítótárazás, átállás PHP 7-re, szerverköltöztetés, CDN-beállítás, kisebb frontend-módosítások. Mellettük szerepköralapú tudás- és dokumentumtár, további ügyfélfelületek, valamint landing- és bemutatkozó oldalak is készültek.',
      points: [],
    },
    'sport-programme': {
      title: 'Országos sportnépszerűsítő program',
      summary: 'Egy országos felsőoktatási sportprogram online rendszere, amelyet én fejlesztettem és üzemeltettem. A program 2016-os zárásáig mintegy 17 000 felhasználó regisztrált benne.',
      points: [],
    },
    surveys: {
      title: 'Kérdőíves kutatások',
      summary: 'Kérdőíves adatfelvételi rendszerek a teljes folyamatra, az űrlapoktól a mögöttük álló lekérdezésekig és statisztikai feldolgozásig; IBM SPSS alapszinten.',
      points: [],
    },
    'admissions-map': {
      title: 'Felvételi adatok vizualizációja',
      summary: 'Interaktív térkép a 2009 és 2013 közötti felsőoktatási felvételi adatokról, több dimenzió mentén bejárható.',
      points: [],
    },
  },
};
