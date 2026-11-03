# PollHub – Előadásvázlat és előadói jegyzetek

> **Projektvédés** · Szavazás- és kérdőívkezelő full-stack webalkalmazás
> Ajánlott időkeret: **12–15 perc** előadás + élő demó (`DEMO_FORGATOKONYV.md`) + kérdések

---

## Tartalom

| # | Fejezet | Idő |
|---|---|---|
| 1 | Bevezetés, projekt célja és fejlődése | ~1,5 perc |
| 2 | Technológiai stack és rendszerarchitektúra | ~2 perc |
| 3 | Domainmodell (Domain-Driven Design) és adatbázis | ~2 perc |
| 4 | Hitelesítés, jogosultság és biztonság | ~2 perc |
| 5 | Komplex funkciók: vizualizáció és valódi AI (Google Gemini) | ~2,5 perc |
| 6 | Kétnyelvűség (i18n) és felhasználói élmény | ~1 perc |
| 7 | Minőségbiztosítás (QA & Clean Code) | ~2 perc |
| 8 | Korlátok és a továbbfejlesztés iránya | ~1 perc |
| 9 | Melléklet: demó, várható kérdések | – |

---

## 1. Bevezetés, projekt célja és fejlődése

**A probléma**

- Csapatokban és szervezetekben gyakori igény a **gyors, strukturált véleménygyűjtés** (pl. prioritások, elégedettség, döntések).
- A meglévő eszközök sokszor túlméretezettek, vagy nem adnak **azonnal értelmezhető** eredményt.

**A megoldás: PollHub**

- Webalkalmazás szavazások **létrehozására, kitöltésére és kiértékelésére**, valódi felhasználói fiókokkal.
- Két szerepkör, amelyet a fiók hordoz (regisztrációkor választható):
  - **Résztvevő** – böngészi a szavazásokat és szavaz.
  - **Menedzser** – új szavazást hoz létre, és lezárja a meglévőket.
- Az eredmények **grafikonon, táblázatban, KPI-kártyákon** és egy **Google Gemini által írt AI-összefoglalóban** jelennek meg.

**Hatókör – tudatos szűkítés**

- **1 szavazás = 1 kérdés** a felületen, több válaszlehetőséggel (legalább 2 opció).
- Felhasználónként **egy szavazat** kérdésenként – ezt maga az adatbázis tartatja be.
- Időzített lezárás: minden szavazásnak van **lezárási ideje** (alapértelmezésként 7 nap).

**A projekt fejlődése – iteratív, „MVP-ből termék” megközelítés**

| Lépés | Mi történt? |
|---|---|
| 1. MVP | Csak frontend: React Context + localStorage, szimulált szerepkör-kapcsoló |
| 2. DDD-refaktor | `Poll` és `Question` szétválasztása, lezárási idő mint értékobjektum |
| 3. Eredmények | Recharts-diagram, KPI-kártyák, szabályalapú („szimulált”) AI-összefoglaló |
| 4. i18n | next-intl, `/hu` és `/en` útvonalak |
| 5. UI/UX | Design tokenek, világos/sötét/rendszertéma, WCAG AA kontraszt |
| 6. Full-stack | Prisma + SQLite, NextAuth, regisztráció, Server Actions |
| 7. Valódi AI | Google Gemini API a szimuláció helyére, szerveroldalon |

> 🎤 **Előadói jegyzet:** Hangsúlyozd, hogy az „1 szavazás = 1 kérdés” **tudatos döntés**: a domainmodell (3. fejezet) a kérdést már külön táblában tárolja, így a többkérdéses kérdőív bővítés, nem újraírás. A fejlődési táblázat azt mutatja, hogy minden lépés **a meglévőre épült** – a korai döntések (tiszta függvények, cserélhető adatréteg) kifizetődtek.

---

## 2. Technológiai stack és rendszerarchitektúra

| Réteg | Technológia | Miért? |
|---|---|---|
| Keretrendszer | **Next.js 16 (App Router)** | Szerverkomponensek, Server Actions, fájlalapú routing |
| UI | **React 19** | Komponensalapú, deklaratív felület |
| Nyelv | **TypeScript** (szigorú mód) | Típusbiztonság az adatbázistól a felületig |
| Adatbázis | **Prisma 7 + SQLite** | Típusos ORM, relációs séma, nulla üzemeltetés |
| Hitelesítés | **NextAuth 4** (Credentials) + **bcrypt** | Bejelentkezés, JWT-munkamenet szerepkörrel |
| AI | **Google Gemini API** (`@google/genai`) | Valódi LLM-összefoglaló az összesített eredményekből |
| Stílus | **Tailwind CSS 4** | Egységes design tokenek, világos/sötét téma |
| Vizualizáció | **Recharts** | Deklaratív, reszponzív diagramok |
| i18n | **next-intl** | App Router-kompatibilis lokalizáció |
| Tesztelés | **Playwright** | Valódi böngészős E2E tesztek valódi adatbázison |

**A kérés útja – rétegzett architektúra**

```
Böngésző
   │  kérés (süti: JWT-munkamenet)
   ▼
proxy.ts ─────────── nyelvi útválasztás (/hu, /en) + optimista munkamenet-ellenőrzés
   │
   ▼
Szerverkomponens (oldal) ──► Data Access Layer (lib/dal.ts) ──► Prisma ──► SQLite
   │                              ▲   requireUser / requireRole
   │ HTML + adatok                │   getPollSummaries / getPollDetail
   ▼                              │
Kliens komponens ──► Server Action (actions/*.ts) ── jogosultság + validáció + írás
                           │
                           └──► lib/gemini.ts ──► Google Gemini API  (csak szerveren)
```

- **Szerverkomponensek** olvasnak: az oldalak a szerveren, az adatbázisból renderelnek – a böngésző kész HTML-t kap.
- **Server Actions** írnak: szavazás, létrehozás, lezárás, regisztráció, AI-összefoglaló. Minden action **maga ellenőrzi** a felhasználót és a szerepkört, majd `refresh()`-sel frissíti a nézetet.
- **Data Access Layer (DAL):** az egyetlen hely, amely munkamenetet és adatbázist olvas a rendereléshez → egy jogosultsági ellenőrzést nem lehet „elfelejteni” egy belépési ponton.
- **`server-only` modulok:** az adatbázis-kliens, a hitelesítés és a Gemini-kliens importja a böngészőoldali kódba **fordítási hibát** okoz.

**A régi localStorage-megoldásból mi maradt?**

- Az MVP-ben a perzisztencia egy külön modulba volt zárva – ezért a backendre váltás **a réteg cseréje** volt, nem a felület újraírása.
- A tiszta domainfüggvények (`closingTime`, `results`, `validation`) **változtatás nélkül** átkerültek a szerverre is: ugyanaz a validáció fut az űrlapon (azonnali visszajelzés) és a Server Actionben (hiteles ellenőrzés).

> 🎤 **Előadói jegyzet:** Ha rákérdeznek, miért nincs külön REST API: a Server Actions a Next.js beépített, típusos RPC-mechanizmusa – a kliens egy függvényt hív, a keretrendszer intézi a hálózati kérést. Kevesebb kód, ugyanaz a biztonsági modell (minden actiont nyilvános végpontként kezelünk, és ellenőrzünk).

---

## 3. Domainmodell (Domain-Driven Design) és adatbázis

**Entitások és kapcsolatok** (`prisma/schema.prisma`)

```
User (Felhasználó)       Poll (Kérdőív)        Question (Kérdés)      Option (Opció)
──────────────────       ──────────────        ─────────────────      ──────────────
id                       id                    id                     id
email   (egyedi)         title                 text                   text
password (bcrypt)        closesAt              pollId ──► Poll        position
role  MANAGER |          createdAt                                    questionId ──► Question
      PARTICIPANT

                         Vote (Szavazat)
                         ───────────────
                         userId ──► User      questionId ──► Question
                         pollId ──► Poll      optionId   ──► Option
                         @@unique([userId, questionId])
```

- A **Poll** az aggregátumgyökér: cím és életciklus (lezárási idő).
- A **Question** hordozza a tartalmat, az **Option** a válaszlehetőségeket (megjelenítési sorrenddel).
- A **Vote** minden szintre hivatkozik → az eredmények kérdésszinten aggregálhatók.
- **Kaszkádolt törlés:** egy kérdőív törlése a kérdéseit, opcióit és szavazatait is törli – nincs „árva” rekord.
- Jövőálló: több kérdés per kérdőív **sémamódosítás nélkül** támogatható.

**Lezárási idő mint „könnyűsúlyú” értékobjektum (Closing Time)**

- A lezárási idő **egyetlen érték** (`closesAt`), a viselkedés **tiszta függvényekben** él (`lib/closingTime.ts`):
  - `isClosed(closesAt, now)` – nyitott vagy lezárt?
  - `defaultClosingTime(now)` – alapértelmezés: +7 nap.
  - `getTimeRemaining(closesAt, now)` – hátralévő idő a legnagyobb értelmes egységben (perc / óra / nap).
- **Kulcsgondolat: az állapot származtatott, nem tárolt.**
  - Nincs `status` oszlop → **nem kerülhet ellentmondásba** a tárolt állapot és a valós idő.
  - A menedzseri lezárás egyszerűen `closesAt = most` – ugyanaz a szabály érvényes rá, mint a lejáratra. Egy már korábbi lezárási időt a lezárás nem módosít, így lezárással **nem lehet újranyitni vagy meghosszabbítani** egy szavazást.
  - Lejáratkor a nézet **újratöltés nélkül**, magától frissül (időzítő a következő lezárásra).
  - **Hidratálásbiztos idő** (`lib/clock.tsx`): a szerver renderelési idejét kapja meg a kliens kezdőértéknek, így a szerveren és a böngészőben renderelt állapot nem tér el.

**Üzleti szabályok – a szerveren és az adatbázisban**

| Szabály | Hol érvényesül? |
|---|---|
| Kérdésenként egy szavazat felhasználónként | `Vote` tábla **egyedi indexe** `(userId, questionId)` – két egyidejű kérés esetén is |
| Lezárt szavazásra nincs szavazat | `castVote` Server Action, a beküldés pillanatában, az adatbázisból olvasott `closesAt` alapján |
| Az opció a szavazás saját kérdéséhez tartozik | `castVote` ellenőrzi az opció → kérdés → szavazás láncot |
| Csak résztvevő szavaz, csak menedzser hoz létre / zár le | Szerepkör-ellenőrzés minden Server Actionben |
| Érvényes kérdőív (cím, kérdés, ≥ 2 opció, jövőbeli lezárás, max. 200 karakter) | `lib/validation.ts` – az űrlap **és** a szerver is futtatja |

> 🎤 **Előadói jegyzet:** A DDD célja a **domain kifejezőereje**, nem az osztályok száma. A legerősebb pont: az „egy szavazat” szabályt már nem csak a kód, hanem az **adatbázis-megszorítás** garantálja – versenyhelyzetben (két lap, két kattintás egyszerre) is. A felület elrejti a szavazógombot, de ez csak kényelem: a döntés a szerveren születik.

---

## 4. Hitelesítés, jogosultság és biztonság

**Regisztráció és bejelentkezés**

- **Regisztráció** (`/register`): e-mail, jelszó (min. 8 karakter), jelszó megerősítése, fióktípus (Résztvevő / Menedzser). Sikeres regisztráció után a felhasználó **azonnal be van jelentkezve**.
- **Bejelentkezés** (`/login`): NextAuth Credentials provider → a `User` táblában keres, és `bcrypt.compare`-rel ellenőrzi a jelszót.
- **JWT-munkamenet:** a tokenbe a felhasználó `id`-ja és `role`-ja kerül; a tokent a szerver írja alá (`NEXTAUTH_SECRET`).
- A navigációs sáv mutatja az e-mail-címet, a **szerepkör-jelvényt** és a **Kijelentkezés** gombot.

**Kétszintű védelem**

1. **Proxy (`proxy.ts`) – optimista ellenőrzés:** minden kérésnél, adatbázis nélkül, csak a munkamenet-sütit nézi. Bejelentkezés nélkül a védett oldalak a `/{nyelv}/login?callbackUrl=...` címre irányítanak.
2. **DAL és Server Actions – hiteles ellenőrzés:** a felhasználót az **adatbázisból is visszaolvassa** (egy törölt felhasználó régi tokenje sem működik), és szerepkört ellenőriz (`requireRole("MANAGER")`).

**Biztonsági részletek**

- **Jelszavak:** csak bcrypt-hash kerül az adatbázisba, sosem a jelszó.
- **Felhasználó-felderítés elleni védelem:** nem létező e-mail-címnél is lefut egy bcrypt-összehasonlítás (egy „ál-hash”-sel), így a válaszidő és az üzenet (`Hibás e-mail-cím vagy jelszó.`) sem árulja el, kinek van fiókja.
- **Nyílt átirányítás elleni védelem:** a `callbackUrl` csak saját oldalon belüli útvonal lehet (`lib/callbackUrl.ts`) – egy hamisított link nem küldi a felhasználót idegen oldalra.
- **Titkok:** a `.env` nincs Gitben; a Gemini-kulcs és a munkamenet-kulcs csak a szerveren él.
- **Bemenet:** minden szövegmező hossza korlátozott, a validációt a szerver újra elvégzi.

> 🎤 **Előadói jegyzet:** A kétszintű ellenőrzés a Next.js hivatalos ajánlása: a proxy gyors, de csak „előszűrő”; a valódi döntés az adatokhoz legközelebb, a DAL-ban születik. Így egy közvetlenül meghívott Server Action sem kerülheti meg a jogosultságot.

---

## 5. Komplex funkciók: vizualizáció és valódi AI

### 5.1 Eredményvizualizáció (Recharts)

- **Vízszintes oszlopdiagram**, szavazatszám szerint **rangsorolva**.
- **Dinamikus skálázás:** a tengely maximuma a **legnagyobb részarány**, így a vezető opció kitölti a teljes szélességet, a többi arányosan rövidebb (50% → kétszer olyan hosszú, mint 25% – ezt teszt méri).
- **Döntetlenkezelés:** a `getLeaders()` **minden** holtversenyben lévő opciót vezetőként jelöl; ezek mind kiemelt színt kapnak, a KPI-kártya pedig „Holtverseny, egyenként 50%” formában jelzi.
- **Reszponzivitás:** az opciónevek a sávok fölött, teljes szélességben jelennek meg → mobilon sincs vízszintes görgetés.
- **Akadálymentesség:** ugyanaz az adat **táblázatos nézetben** is elérhető; a diagram mellett **KPI-kártyák** (összes szavazat, vezető opció, hátralévő idő).
- **Üres állapot:** szavazat nélkül nincs „üres” diagram, hanem informatív üzenet.

### 5.2 AI Insights – szimulációból valódi LLM (Google Gemini)

**A fejlődés:** az MVP-ben szabályalapú, „szimulált” összefoglaló készült, hogy olcsón validáljuk a termékélményt. Miután ez beváltotta a hozzá fűzött reményeket, a helyére a **Google Gemini** nyelvi modell került – a komponens felülete alig változott.

**Hogyan működik?**

1. A böngésző a `generatePollInsights` Server Actionnek **csak a szavazás azonosítóját és a nyelvet** küldi el.
2. A szerver ellenőrzi a bejelentkezést, majd **az adatbázisból** olvassa ki a kérdést és az **összesített szavazatszámokat**. Egyedi szavazat és személyes adat **nem jut el** a modellhez – csak az aggregátum (megfelel a „kizárólag összesített válaszokból” követelménynek).
3. A promptot a **szerver állítja össze** (`lib/gemini.ts`): kérdés, opciónkénti szavazatszám és százalék, valamint a kért nyelv (magyar / angol) és formátum (max. 4 mondatos, egyszerű bekezdés).
4. A választ a szerver megtisztítja az esetleges Markdown-jelölésektől, és visszaadja a felületnek.

**Mérnöki szempontok**

| Szempont | Megoldás |
|---|---|
| **Kulcsvédelem** | Az API-kulcs csak a szerveren (`server-only`), a böngészőbe sosem kerül |
| **Visszaélés ellen** | A böngésző nem küldhet saját szöveget → a végpont nem használható ingyenes chatbotként |
| **Prompt injection** | Rendszerutasítás: a kérdés és az opciók szövege **adat, nem utasítás** |
| **Költség** | Gyorsítótár (nyelv + kérdés + szavazatszámok szerint): azonos eredményre nincs új, fizetős hívás; új szavazatnál új összefoglaló |
| **Megbízhatóság** | 12 mp-es időkorlát, rövid újrapróbálás túlterhelésnél (429/503), majd **tartalék modell** (két Flash modell sorban) |
| **Hibatűrés** | Hiba esetén érthető üzenet + **Újrapróbálás** gomb; a diagram és a KPI-k tovább működnek |
| **Felhasználói élmény** | Skeleton-animáció töltés közben; nyelvváltáskor az összefoglaló az új nyelven készül |
| **Tesztelhetőség** | `AI_INSIGHTS_MODE=mock`: determinisztikus, szabályalapú szöveg, Gemini-hívás nélkül (lásd 7. fejezet) |

- A korábbi szabályalapú generátor **nem veszett el**: ez adja a teszt- és offline módot, illetve a 0 szavazatos esetet (ilyenkor nincs értelme modellt hívni).

> 🎤 **Előadói jegyzet:** Ez a fejezet mutatja meg legjobban a „szimulálj olcsón, majd cseréld le valódira” stratégiát. Ha rákérdeznek az adatvédelemre: a modell **soha nem lát** felhasználói azonosítót vagy egyedi szavazatot, csak számokat és a szavazás saját szövegét.

---

## 6. Kétnyelvűség (i18n) és felhasználói élmény

**i18n (next-intl)**

- **Lokalizált útvonalak:** `/hu/...` és `/en/...` (alapértelmezett: **magyar**).
- **Automatikus nyelvfelismerés** a böngésző beállítása alapján; nem támogatott nyelvnél magyar a tartalék.
- A nyelvválasztó **ugyanazon az oldalon** marad (pl. `/hu/polls/1` → `/en/polls/1`), és **megjegyzi** a választást.
- Minden felületi szöveg **üzenetfájlokban** (`messages/hu.json`, `messages/en.json`) – a kódban nincs beégetett szöveg. A hiányzó fordítási kulcs **fordítási hibát** okoz.
- **ICU formátum:** többes szám, `select`, lokalizált dátum- és számformázás (pl. „2026. szept. 17.” vs. „Sep 17, 2026”).
- A validációs és szerverhibák **kódként** érkeznek, és a felület fordítja őket.
- Az **AI-összefoglaló** is az aktív nyelven készül: a szerver a nyelvet a modellnek is átadja.
- Next.js 16-specifikus megoldás: a nyelvfelismerés és a hitelesítési előszűrés a **`proxy.ts`**-ben fut (a korábbi `middleware.ts` utódja).

**Felhasználói élmény**

- **Világos / sötét / rendszertéma**, betöltéskor **villanás nélkül** (a téma még az első festés előtt beáll).
- **WCAG AA kontraszt** mindkét témában, egységes design tokenekkel.
- Informatív **üres állapotok** (szerepkörtől függő tippel), billentyűzetes fókuszjelzés, mobilbarát elrendezés.

> 🎤 **Előadói jegyzet:** Demóban érdemes egy szavazás oldalán nyelvet váltani: az URL, a felület **és az AI-összefoglaló** is átvált.

---

## 7. Minőségbiztosítás (QA & Clean Code)

**Playwright E2E tesztcsomag**

- **42 forgatókönyv**, amelyek valódi böngészőben, valódi bejelentkezéssel és **valódi adatbázison** ellenőrzik a működést.
- Minden teszt **mindkét nyelven** lefut (magyar és angol böngészőprofillal) → **84 tesztfuttatás**, éles (production) buildre, kb. 5 perc.

| Terület | Forgatókönyvek |
|---|---|
| Hitelesítés | 9 – átirányítás és vissza, hibás jelszó, regisztráció, kijelentkezés, külső `callbackUrl` elutasítása |
| Kezdőlap | 2 – lista státuszokkal, üres állapot |
| Résztvevő | 6 – szavazás, **szerveroldali elutasítás** (második szavazat régi lapról, szavazat lezárás után), 404 |
| Menedzser | 6 – létrehozás, validáció, alapértelmezett/egyéni lezárás, lezárás |
| Eredmények és AI | 9 – KPI-k, holtverseny, diagram, táblázat, AI betöltés / hiba / újrapróbálás, mobilnézet |
| Automatikus lezárás | 1 – a szavazás interakció nélkül lezárul |
| i18n | 4 – nyelvfelismerés, tartaléknyelv, nyelvváltó, lokalizált 404 |
| Téma | 5 – rendszertéma, választás megőrzése, villanásmentes betöltés |

**Tesztinfrastruktúra**

- **Külön tesztadatbázis** (`e2e.db`): a futtatás törli és a sémából újra létrehozza → a fejlesztői `dev.db` érintetlen.
- **Minden teszt előtt** visszaáll a demóállapot; a tesztek az **adatbázist is ellenőrzik** (pl. a szavazat a bejelentkezett felhasználóé, a jelszó bcrypt-hash).
- **Nincs Gemini-hívás:** a tesztszerver `AI_INSIGHTS_MODE=mock` módban fut, üres API-kulccsal → nincs kvótafogyasztás, a szöveg minden futásnál azonos.
- A betöltési és hibaállapotot a teszt a hálózati kérés **feltartásával**, illetve **500-as hibára cserélésével** vizsgálja.

**Tesztelési elvek**

- **Stabil szelektorok:** `data-testid` és akadálymentes szerepkörök (`getByRole`, `getByLabel`) a CSS-osztályok helyett → a vizuális átdolgozás és a backendre váltás sem tört el feleslegesen teszteket.
- Az elvárt szövegeket a tesztek **ugyanazokból az üzenetfájlokból** fordítják, mint az alkalmazás.
- Hidratációs hibák figyelése (konzolhibák gyűjtése).

**Clean Code**

- **Tiszta függvények** a domainlogikára (`closingTime`, `results`, `insights`, `validation`) – a komponensek vékonyak.
- **Egyirányú adatáramlás:** szerverkomponens olvas, Server Action ír, a DAL az egyetlen adatkapu.
- Szigorú **TypeScript** és **ESLint**, tiszta `next build`; a Prisma típusai a sémából generálódnak.

> 🎤 **Előadói jegyzet:** Kulcsüzenet: a tesztek **üzleti szabályokat** írnak le, nem implementációs részleteket – ezért élték túl a DDD-refaktort, az i18n-migrációt, a UI-átdolgozást, a localStorage → adatbázis váltást és a valódi AI bekötését is.

---

## 8. Korlátok és a továbbfejlesztés iránya

**Őszinte korlátok**

- **SQLite:** egyetlen fájl, egy szerverpéldányra; nagy terheléshez és több példányhoz nem ideális.
- **Szabadon választható szerepkör:** regisztrációkor bárki menedzserfiókot hozhat létre – demóra kényelmes, élesben meghívásos vagy admin által kiosztott szerepkör kell.
- **Hiányzó fiókfunkciók:** nincs e-mail-megerősítés, elfelejtett jelszó, sem bejelentkezési kísérletek korlátozása.
- **AI-függőség:** a Gemini válasza nem determinisztikus, a szolgáltatás lehet túlterhelt, és költsége van; a gyorsítótár memóriában él, szerver-újraindításkor elvész.
- **Egy kérdés szavazásonként a felületen:** a modell felkészült a bővítésre, az űrlap még nem.
- **Csak E2E tesztek:** egységtesztek és CI-pipeline még nincsenek; a tesztek a közös adatbázis miatt sorban futnak.

**Következő lépések**

1. **PostgreSQL** és felhős üzemeltetés – a Prisma miatt elsősorban konfigurációs csere.
2. **Szerepkör-kezelés:** meghívásos menedzserfiókok, adminfelület.
3. **Fiókbiztonság:** e-mail-megerősítés, jelszó-visszaállítás, rate limiting, opcionálisan OAuth-bejelentkezés.
4. **Többkérdéses kérdőívek** a meglévő Poll ↔ Question ↔ Option modellre építve.
5. **AI:** tartós (adatbázis- vagy Redis-alapú) gyorsítótár, kérésszám-korlát, az összefoglaló minőségének mérése.
6. **Egységtesztek** a tiszta domainfüggvényekre, **CI-pipeline** (lint, típusellenőrzés, E2E minden commitnál).

> 🎤 **Előadói jegyzet:** Zárásként: az alkalmazás egy validált MVP-ből lépésről lépésre vált **full-stack rendszerré** – valódi adatbázissal, hitelesítéssel és AI-val –, és minden lépést automatizált tesztek fedeztek. A rétegzett felépítés miatt az éles üzem felé vezető út is **bővítés, nem újraírás**.

---

## 9. Melléklet

### 9.1 Élő demó – rövid forgatókönyv (~10 perc)

> A részletes, kattintásról kattintásra leírt változat (telepítés, `.env`, demófiókok, vészhelyzeti teendők): **`DEMO_FORGATOKONYV.md`**.

Előkészület: `npm run db:reset`, szerver indítása, **A ablak** (normál) = Menedzser, **B ablak** (inkognitó) = Résztvevő, AI-összefoglaló előmelegítve.

1. **Védett oldalak** – bejelentkezés nélkül a `/hu` a bejelentkezési oldalra irányít; hibás jelszó → általános hibaüzenet.
2. **Bejelentkezés** – A: `manager@pollhub.local`, B: `participant@pollhub.local`; szerepkör-jelvények a navigációs sávban.
3. **Kezdőlap és nyelvváltás** – HU ↔ EN ugyanazon az oldalon; opcionálisan sötét téma.
4. **Kérdőív létrehozása** (A) – validációs hiba, majd sikeres mentés.
5. **Szavazás** (B) – az új szavazás a másik felhasználónál is megjelenik (közös adatbázis); szavazás → F5 → újra szavazni nem lehet.
6. **Eredmények és Gemini** – KPI-k, diagram, táblázat, AI-összefoglaló; nyelvváltás → angol összefoglaló.
7. **Lezárás két ablakkal** – B kiválaszt egy opciót, A lezárja a szavazást, B beküldi → **a szerver elutasítja**.
8. **Tesztek** – `npm run test:e2e` (vagy előre rögzített eredmény: 84/84 sikeres).

### 9.2 Várható kérdések és rövid válaszok

- **„Miért SQLite és nem PostgreSQL?”** → Nulla üzemeltetés, egyetlen fájl, könnyű demózni és tesztelni. A Prisma miatt a váltás elsősorban a `provider` és a kapcsolati cím cseréje.
- **„Biztonságos a szavazás?”** → Igen, az alkalmazás szintjén: a szerver hitelesít, szerepkört és lezárási időt ellenőriz, az „egy szavazat” szabályt pedig egyedi index garantálja – két egyidejű kérésnél is. Nyitott pont a szabadon választható menedzserszerepkör (8. fejezet).
- **„Mi akadályozza meg, hogy valaki a Server Actiont közvetlenül hívja?”** → Semmi – ezért minden action maga ellenőrzi a felhasználót és a jogosultságot, nem bízik a felületben.
- **„Lát a Gemini személyes adatot?”** → Nem. Csak a kérdés szövegét, az opciókat és az összesített számokat kapja; felhasználói azonosítót vagy egyedi szavazatot soha.
- **„Mi történik, ha a Gemini nem elérhető?”** → Rövid újrapróbálás, majd tartalék modell; ha az sem sikerül, hibaüzenet és Újrapróbálás gomb – az oldal többi része működik tovább.
- **„Hogyan tesztelitek a nem determinisztikus AI-t?”** → A tesztek mock módban futnak (determinisztikus, szabályalapú szöveg), a betöltési és hibaállapotot pedig a hálózati kérés manipulálásával vizsgálják. Így a tesztek ingyenesek és megbízhatók.
- **„Miért JWT-munkamenet, és miért NextAuth 4?”** → A Credentials provider a NextAuth 4-ben JWT-munkamenetet igényel; a tokenbe a szerepkör is bekerül, a szerver mégis minden kérésnél visszaolvassa a felhasználót az adatbázisból.
- **„Mitől DDD ez, ha nincsenek osztályok?”** → A DDD a domain fogalmainak és szabályainak pontos modellezése; ezt explicit entitáshatárokkal, származtatott állapottal és tiszta függvényekkel értük el, a szabályokat pedig az adatbázis-séma is kifejezi.
- **„Hogyan garantálható, hogy a refaktorok nem törtek el semmit?”** → Az üzleti szabályokat leíró E2E tesztek minden lépés után, mindkét nyelven, valódi adatbázison lefutottak.
