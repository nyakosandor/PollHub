# PollHub

Kérdőívek és szavazások létrehozására, kitöltésére és kiértékelésére szolgáló webalkalmazás. Next.js, React, Prisma (SQLite), NextAuth, Google Gemini API, Tailwind CSS és Recharts alapokon készült, egyetemi beadandó feladatként.

## Projekt célja

A PollHub MVP (Minimum Viable Product) egy kérdőív teljes életciklusát mutatja be: a menedzser létrehozza és lezárja a kérdőívet, a résztvevő szavaz, az eredmények pedig diagramon és a Google Gemini által generált összefoglalóban jelennek meg.

Az alkalmazás teljes stackes: az adatok relációs adatbázisban (Prisma ORM + SQLite) tárolódnak, a felhasználók regisztrálnak és bejelentkeznek (NextAuth, Credentials provider, bcrypt jelszó-hash), az üzleti szabályokat pedig Server Actionök érvényesítik a szerveren. A korábbi `localStorage`-alapú MVP-t és a szerepkörkapcsolót ez váltotta fel.

## Funkciók

- **Kérdőívlista:** az összes kérdőív megjelenítése címmel, állapottal (nyitott vagy lezárt), szavazatszámmal és opciószámmal.
- **Regisztráció és bejelentkezés:** a `/register` oldalon e-mail-címmel, jelszóval és szerepkörrel (Résztvevő vagy Menedzser) lehet fiókot létrehozni, a `/login` oldalon bejelentkezni. A navigációs sáv a bejelentkezett felhasználó e-mail-címét, szerepkör-jelvényét és a Kijelentkezés gombot mutatja.
- **Védett oldalak és jogosultságok:** minden kérdőívoldal bejelentkezést igényel; a vendég a bejelentkezési oldalra kerül, majd onnan vissza az eredetileg kért oldalra. A `/manager` oldalról a Résztvevő a főoldalra kerül, szavazni pedig csak Résztvevő tud.
- **Kétnyelvű felület:** magyar és angol (next-intl), `/hu/...` és `/en/...` útvonalakkal.
- **Kérdőív létrehozása (Menedzser):** cím, egy kérdés, legalább két válaszopció és lezárási idő megadása, validációval. A lezárási idő alapértéke a létrehozástól számított 7 nap.
- **Kérdőív azonnali lezárása (Menedzser):** a nyitott kérdőív egy gombbal lezárható.
- **Szavazás (Résztvevő):** egy opció kiválasztása és beküldése, a szabályokat lásd az [Üzleti szabályok](#üzleti-szabályok) fejezetben.
- **Automatikus lezárás:** a lezárási idő elérésekor a megnyitott oldal újratöltés nélkül lezárt állapotba vált.
- **Eredmények és adatvizualizáció:**
  - KPI-kártyák: összes szavazat, vezető opció (holtversenyt is kezelve) és hátralévő idő (például „Closes in 2 days”, illetve „Closed”).
  - Reszponzív, rangsorolt sávdiagram Recharts könyvtárral: százalékos feliratok, kiemelt vezető opció és tooltip.
  - Táblázatos nézet, amely a diagram értékeit szövegesen is elérhetővé teszi.
- **AI Insights:** valódi LLM-összefoglaló (Google Gemini) az összesített eredményekből, az aktív nyelven, betöltési és hibaállapottal (újrapróbálás gombbal).


## Architektúra és DDD

### Tartományi modell és adatbázis

Az adatmodell a Domain-Driven Design (DDD) szemléletét követi: a fogalmak külön entitásokba kerültek, és azonosítóval hivatkoznak egymásra. Az adatbázisséma helye: `prisma/schema.prisma`; a kliensnek átadott típusok (DTO-k): `src/types/index.ts`.

| Fogalom | Modell | Mezők |
| --- | --- | --- |
| Felhasználó | `User` | `id`, `email` (egyedi), `password` (bcrypt hash), `role` (`MANAGER` vagy `PARTICIPANT`) |
| Kérdőív | `Poll` | `id`, `title`, `closesAt` |
| Kérdés | `Question` | `id`, `text`, `pollId`, `options` |
| Válaszopció | `Option` | `id`, `text`, `position`, `questionId`, `votes` |
| Szavazat | `Vote` | `id`, `userId`, `pollId`, `questionId`, `optionId` |

A kapcsolatok kaszkádolt törléssel működnek, a `Vote` táblán pedig egyedi index van a `(userId, questionId)` páron.

**A kérdőív és a kérdés szétválasztása.** A `Question` önálló tábla, amely a `pollId` idegen kulccsal kapcsolódik a `Poll`-hoz, így a modell több kérdést is képes kezelni egy kérdőíven belül. A felület jelenleg szándékosan egyszerű: a menedzser egy kérdést ad meg, a `createPoll` Server Action pedig egyetlen beágyazott írással hozza létre a `Poll`, `Question` és `Option` rekordokat.

**Lezárási idő mint értékobjektum (Value Object).** Tárolt `open`/`closed` státusz helyett csak a `closesAt` időpont létezik, a státuszt mindig ebből számítjuk:

```ts
export function isClosed(closesAt: number, now: number) {
  return now > closesAt;
}
```

Így a tárolt állapot és a valós idő nem kerülhet ellentmondásba, a kézi lezárás pedig a `closesAt` értékét az aktuális időre állítja. A logikát tiszta függvények adják a `src/lib/closingTime.ts` fájlban.

### Adatréteg és hitelesítés

- **Prisma Client (`src/lib/db.ts`):** egyetlen, újrahasznosított kliens a `better-sqlite3` driver adapterrel. Csak szerveren importálható (`server-only`).
- **NextAuth (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`):** Credentials provider, amely a `User` táblában keres, és `bcrypt.compare`-rel ellenőrzi a jelszót. JWT-munkamenet, amelybe a `jwt` és a `session` callback a felhasználó `id`-ját és `role`-ját is beleírja.
- **Proxy (`src/proxy.ts`):** a next-intl nyelvi útválasztása mellett optimista ellenőrzést végez: munkamenet-süti nélkül a nem nyilvános oldalak a `/{nyelv}/login` oldalra irányítanak.
- **Data Access Layer (`src/lib/dal.ts`):** az oldalak itt kérik le a bejelentkezett felhasználót (`requireUser`, `requireRole`) és az adatokat (`getPollSummaries`, `getPollDetail`). Ez a valódi jogosultság-ellenőrzés: a felhasználót az adatbázisból is visszaolvassa.
- **Server Actions (`src/actions/`):** `auth.ts` (regisztráció), `poll.ts` (létrehozás, lezárás) és `vote.ts` (szavazás). Mindegyik maga ellenőrzi a szerepkört, a módosítások után pedig `refresh()` hívással frissíti a kliens nézetét.
- **Időfüggő felület (`src/lib/clock.tsx`):** a nyitott/lezárt állapot és a visszaszámlálás `useSyncExternalStore` segítségével követi a böngésző óráját. Hidratáláskor a szerver renderelési idejét használja, így nem lép fel hidratálási eltérés.

### Könyvtárszerkezet

```text
prisma/         Adatbázisséma, demóadatok és seed szkript
src/
  actions/      Server Actionök: regisztráció, kérdőív, szavazás
  app/          Oldalak: főoldal, /manager, /polls/[id], /login, /register, NextAuth API
  components/   Felületi komponensek (űrlapok, KPI-kártyák, diagram, AI Insights, auth)
  lib/          Adatréteg, hitelesítés, validáció és tiszta segédfüggvények
  types/        DTO-típusok és a NextAuth típusbővítése
e2e/            Playwright end-to-end tesztek
```

## Üzleti szabályok

A szabályokat a szerver érvényesíti a Server Actionökben, adatbázis-lekérdezésekkel. A felület (például az eltűnő szavazóűrlap) csak kényelmi funkció: egy elavult vagy manipulált kérés sem kerülheti meg a szabályokat.

**Egy felhasználó, kérdésenként egy szavazat.** A `castVote` a munkamenetből veszi a felhasználót, a döntést pedig a `Vote` tábla `(userId, questionId)` egyedi indexe hozza meg: a második szavazat akkor is elutasításra kerül (`alreadyVoted`), ha két kérés egyszerre érkezik.

**Lezárt kérdőívre nem lehet szavazni.** A `castVote` a beküldés pillanatában az adatbázisból olvasott `closesAt` értéket veti össze az aktuális idővel. A határidő után beküldött szavazat ezért akkor is elutasításra kerül (`pollClosed`), ha a böngészőben még nyitva van az űrlap.

**Szerepkörök.** Kérdőívet csak `MANAGER` hozhat létre és zárhat le, szavazni csak `PARTICIPANT` tud. A választott opciónak a megadott kérdőívhez kell tartoznia.

**További szabályok.** Létrehozáskor kötelező a cím, a kérdés és legalább két válaszopció, a lezárási időnek pedig a jövőben kell lennie. Ugyanez a validáció (`src/lib/validation.ts`) fut a böngészőben azonnali visszajelzésként és a szerveren is. A kézi lezárás soha nem tolja későbbre a már elmúlt lezárási időt. A jelszó legalább 8 karakter, az e-mail-cím kisbetűsítve és egyediként tárolódik.

## AI Insights (Google Gemini)

Az eredménynézet AI-összefoglalóját a **Google Gemini API** készíti a hivatalos `@google/genai` SDK-val. A hívás kizárólag a szerveren történik, Server Actionön keresztül, így a `GEMINI_API_KEY` sosem jut el a böngészőbe.

- **Folyamat:** az `AIInsights` komponens a `generatePollInsights(pollId, locale)` Server Actiont hívja (`src/actions/insights.ts`). A szerver ellenőrzi a bejelentkezést, az adatbázisból olvassa ki a kérdést és az összesített szavazatszámokat, majd a `summarizePollResults({ pollQuestion, aggregatedResults, locale })` függvény (`src/lib/gemini.ts`) elkészíti a promptot, és meghívja a `models.generateContent` végpontot.
- **Csak összesített adat:** a modell opciónkénti szavazatszámokat és arányokat kap, egyedi szavazatokat és felhasználói adatokat nem. Mivel a böngésző csak a szavazás azonosítóját küldi, a végponton keresztül nem lehet tetszőleges promptot futtatni a kulcsunkkal.
- **Prompt:** rövid, professzionális összefoglaló egy bekezdésben, markdown nélkül, az aktív nyelven (magyar vagy angol). A rendszerutasítás szerint a kérdés és az opciók szövege adat, nem utasítás, ami véd a promptba csempészett parancsok ellen. Az esetleges markdown-jelölést a szerver eltávolítja.
- **Modellek:** a feladat `gemini-2.5-flash` modellt kért, de a Google ezt új API-kulcsoknak már nem szolgálja ki (404). Ezért a szerver a `gemini-3.8-flash` modellt próbálja, túlterhelés vagy hiba esetén pedig a `gemini-3.5-flash`-re vált. Modellenként egy gyors újrapróbálás és 12 másodperces időkorlát van. A `GEMINI_MODEL` környezeti változóval egyetlen modell rögzíthető.
- **Gyorsítótár:** azonos eredményekre (szavazás, nyelv és szavazatszámok szerint) a szerver nem hívja újra az API-t; új szavazat után új összefoglaló készül.
- **Felület:** várakozás közben pulzáló skeleton és „AI elemzés készítése...” felirat látszik, hiba esetén „Nem sikerült elkészíteni az elemzést.” üzenet és **Újrapróbálás** gomb. Szavazat nélküli kérdőívnél nincs API-hívás, helyette tájékoztató szöveg jelenik meg.
- **Tesztmód:** `AI_INSIGHTS_MODE="mock"` esetén a szerver nem hívja a Geminit, hanem a korábbi, szabályalapú összefoglalót adja vissza (`src/lib/insights.ts`). Az E2E tesztek így futnak, üres API-kulccsal, ezért nem fogyasztanak kvótát, és determinisztikus szöveget ellenőriznek. Internet nélküli bemutatón is használható.

## Futtatás

Előfeltétel: Node.js 20+ és npm.

1. Függőségek telepítése (a `postinstall` lépés a Prisma Clientet is legenerálja):

   ```bash
   npm install
   ```

2. Környezeti változók: másold le a mintát, adj meg egy véletlenszerű `NEXTAUTH_SECRET` értéket (a parancs a `.env.example` fájlban található), és a `GEMINI_API_KEY` mezőbe a Google AI Studióban létrehozott kulcsot (<https://aistudio.google.com/apikey>):

   ```bash
   cp .env.example .env
   ```

3. Az adatbázis (`dev.db`) létrehozása a séma alapján, majd a demóadatok betöltése:

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. A fejlesztői szerver indítása:

   ```bash
   npm run dev
   ```

Az alkalmazás ezután a <http://localhost:3000> címen érhető el. A seed által létrehozott demófiókok:

| Szerepkör | E-mail | Jelszó |
| --- | --- | --- |
| Menedzser | `manager@pollhub.local` | `Manager123!` |
| Résztvevő | `participant@pollhub.local` | `Participant123!` |

Az adatbázis bármikor visszaállítható a demóállapotra: `npm run db:reset`.

### Tesztek

Az end-to-end tesztek Playwrighttal futnak. Az első futtatás előtt telepíteni kell a böngészőt:

```bash
npx playwright install chromium
npm run test:e2e
```

A parancs külön tesztadatbázist hoz létre (`e2e.db`, `npx prisma db push`), elkészíti a production buildet, elindítja az alkalmazást a 3100-as porton, és mindkét nyelven lefuttatja az `e2e/` mappa tesztjeit (`AI_INSIGHTS_MODE=mock` módban, valódi Gemini-hívás nélkül). Minden teszt előtt az adatbázis visszaáll a demóállapotra, a tesztek valódi bejelentkezéssel futnak, a fejlesztői `dev.db` pedig érintetlen marad.
