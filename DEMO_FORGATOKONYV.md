# PollHub – Élő demó forgatókönyv

> **Cél:** a PollHub minden fő funkciójának, üzleti szabályának, technikai megoldásának és tesztjének hibátlan bemutatása a bírálóknak.
> **Időtartam:** kb. **12–15 perc** (az opcionális részek nélkül kb. 10 perc)
> **Jelölések:**
> - **Félkövér** = amire kattintani kell / amit be kell gépelni
> - *Dőlt* = amit mondani kell (előadói szöveg)
> - `Kód` = pontos felirat, URL vagy parancs
> - [ ] = pipáld ki gyakorlás közben

---

## 0. Technikai konfiguráció és előkészületek (a bemutató előtt, ~10 perc)

### 0.1 A technológiai stack (ezt érdemes egy mondatban elmondani)

| Réteg | Technológia | Szerep |
| --- | --- | --- |
| Keretrendszer | **Next.js 16** (App Router), React 19, TypeScript | Szerveroldali renderelés, Server Actions |
| Adatbázis | **Prisma 7 + SQLite** (`dev.db`) | Relációs adatmodell: `User`, `Poll`, `Question`, `Option`, `Vote` |
| Hitelesítés | **NextAuth 4** (Credentials provider) + **bcrypt** | Regisztráció, bejelentkezés, JWT-munkamenet szerepkörrel |
| AI | **Google Gemini API** (`@google/genai`) | Valódi LLM-összefoglaló az összesített eredményekből |
| Felület | Tailwind CSS 4, Recharts, lucide ikonok | Reszponzív UI, világos/sötét téma, diagram |
| Nyelvek | **next-intl** | Magyar és angol felület, `/hu/...` és `/en/...` útvonalak |
| Tesztek | **Playwright** | 84 end-to-end teszt (42 × 2 nyelv) valódi adatbázison |

### 0.2 Telepítés (egyszer kell megcsinálni)

- [ ] Nyiss egy terminált a projekt gyökérkönyvtárában (`PollHub`).
- [ ] Függőségek: **`npm install`**
  - A `postinstall` lépés automatikusan legenerálja a Prisma Clientet (`src/generated/prisma`).
- [ ] Környezeti változók: másold le a mintát: **`copy .env.example .env`** (Windows) vagy **`cp .env.example .env`** (macOS/Linux).
- [ ] Töltsd ki a `.env` fájlt:

| Változó | Jelentés | Demóhoz |
| --- | --- | --- |
| `DATABASE_URL` | Az SQLite-fájl helye | `"file:./dev.db"` (maradhat) |
| `NEXTAUTH_SECRET` | A munkamenet-tokenek aláíró kulcsa | Véletlen érték, a parancs a `.env.example`-ben |
| `NEXTAUTH_URL` | Az alkalmazás címe | `"http://localhost:3000"` |
| `SHOW_DEMO_ACCOUNTS` | A bejelentkezési oldal kiírja a demófiókokat | `"true"` |
| `GEMINI_API_KEY` | Google Gemini API-kulcs (<https://aistudio.google.com/apikey>) | **kötelező** a valódi AI-hoz |
| `GEMINI_MODEL` | *(opcionális)* egyetlen modell rögzítése | üresen hagyva: `gemini-3.8-flash`, majd `gemini-3.5-flash` |
| `AI_INSIGHTS_MODE` | *(opcionális)* `"mock"` = nincs Gemini-hívás, szabályalapú szöveg | csak internet nélküli demóhoz |

> 🔒 **A `.env` soha nem kerül Gitbe** (a `.gitignore` kizárja). A Gemini-kulcs csak a szerveren él, a böngészőbe nem jut el.

- [ ] Adatbázis létrehozása a séma alapján: **`npx prisma db push`** → létrejön a `dev.db`.
- [ ] Demóadatok betöltése: **`npx prisma db seed`**
  - Két felhasználó, négy „háttérszavazó”, két mintaszavazás és négy szavazat jön létre.

**Demófiókok:**

| Szerepkör | E-mail | Jelszó |
| --- | --- | --- |
| Menedzser | `manager@pollhub.local` | `Manager123!` |
| Résztvevő | `participant@pollhub.local` | `Participant123!` |

### 0.3 Közvetlenül a bemutató előtt

- [ ] **Tiszta kiinduló állapot:** állítsd le a szervert (**Ctrl+C**), majd: **`npm run db:reset`**
  - Törli a `dev.db`-t, újra létrehozza (`db push`) és feltölti (`db seed`).
  - ⚠️ Futó szerver mellett Windowson a `dev.db` zárolva lehet, ezért előbb állítsd le.
  - A reset után a korábbi bejelentkezések érvénytelenek, újra be kell lépni.
- [ ] Szerver indítása: **`npm run dev`** → várd meg a `✓ Ready` üzenetet → `http://localhost:3000`.
  - A `.env` módosítása után a szervert **mindig újra kell indítani**.
  - 💡 Simább demóhoz (Next.js „N” ikon és fejlesztői hibaablak nélkül): **`npm run build`**, majd **`npm start`**.
- [ ] **Két böngészőablak** (a munkamenet sütiben él, így két külön felhasználó lehet egyszerre bejelentkezve):
  - **A ablak (normál):** ide lép be a **Menedzser**.
  - **B ablak (inkognitó, Ctrl+Shift+N):** ide lép be a **Résztvevő**.
  - Mindkettőben nyisd meg: **`http://localhost:3000/hu`**
- [ ] **AI előmelegítése:** a B ablakban jelentkezz be résztvevőként, nyisd meg az **`Onboarding feedback`** szavazást, és várd meg az AI elemzést. Utána **jelentkezz ki**.
  - A szerver gyorsítótárazza az összefoglalót (szavazás + nyelv + szavazatszámok szerint), így a bemutatón ez azonnal megjelenik.
  - Ha a magyar mellett az angolt is mutatod, váltsd át egyszer az `EN` nyelvre is.
- [ ] Böngésző nagyítása **100%**, felesleges lapok és értesítések bezárva.

---

## 1. Hitelesítés: védett oldalak, regisztráció, bejelentkezés – ~2 perc

- [ ] **A ablak:** nyisd meg a **`http://localhost:3000/hu`** címet bejelentkezés nélkül.
  - Az alkalmazás átirányít: **`/hu/login?callbackUrl=%2Fhu`** – cím: **`Üdv újra!`**
  - *„Minden szavazási oldal bejelentkezést igényel. Az átirányítást egy proxy végzi még az oldal renderelése előtt; az oldalak és a Server Actionök ezen felül a szerveren, az adatbázisból is ellenőrzik a felhasználót.”*

- [ ] **Hibás jelszó:** írd be a `manager@pollhub.local` címet és egy rossz jelszót → **`Bejelentkezés`**.
  - Hibaüzenet: **`Hibás e-mail-cím vagy jelszó.`**
  - *„Nem létező e-mail-címre ugyanez az üzenet jelenik meg, így nem lehet kifürkészni, kinek van fiókja. A jelszavakat bcrypt-hash formában tároljuk, sosem olvasható alakban.”*

- [ ] **(Opcionális, 1 perc) Regisztráció:** kattints a **`Regisztrálj`** linkre → **`Fiók létrehozása`** oldal.
  - Mutasd meg a **`Fiók típusa`** választót: **`Résztvevő`** / **`Menedzser`**.
  - Próbáld ki: eltérő jelszavak → **`A két jelszó nem egyezik.`**; foglalt e-mail (`participant@pollhub.local`) → **`Ezzel az e-mail-címmel már létezik fiók.`**
  - Sikeres regisztráció után az új felhasználó **azonnal be van jelentkezve**.
  - *„A validáció a böngészőben azonnali visszajelzést ad, de a szerver ugyanazokkal a szabályokkal újra ellenőriz.”*
  - Ezután **`Kijelentkezés`**, és vissza a bejelentkezéshez.

- [ ] **Bejelentkezés menedzserként:** `manager@pollhub.local` / `Manager123!` → **`Bejelentkezés`**.
  - A navigációs sávban: az **e-mail-cím**, a lila **`Menedzser`** jelvény és a **`Kijelentkezés`** gomb, valamint a **`Menedzser irányítópult`** link.
  - *„A régi szerepkör-kapcsoló helyett most valódi fiókok vannak: a szerepkört a munkamenet hordozza, amit a szerver ír alá.”*

- [ ] **B ablak:** jelentkezz be résztvevőként: `participant@pollhub.local` / `Participant123!`
  - Kék **`Résztvevő`** jelvény; a `Menedzser irányítópult` link **nem** látszik.

---

## 2. Kezdőképernyő és kétnyelvűség (UI & i18n) – ~1 perc

- [ ] **A ablak – kezdőoldal** (`/hu` – `Szavazások`).
  - *„A szavazások kártyákon jelennek meg: státusz – `Nyitott` vagy `Lezárva` –, cím, szavazatok és opciók száma. Az adatok már az adatbázisból, szerveroldali rendereléssel érkeznek.”*
  - Vidd az egeret egy kártya fölé: *„A kártyák finoman megemelkednek – ez jelzi, hogy kattinthatók.”*

- [ ] **Nyelvváltás:** kattints az **`EN`** gombra.
  - URL: `/hu` → **`/en`**, cím: `Szavazások` → **`Polls`**, státuszok: `Open` / `Closed`.
  - *„A nyelv az URL része, így minden oldal közvetlenül linkelhető egy adott nyelven. A felület szövegei fordítódnak, a felhasználói tartalom értelemszerűen nem.”*
- [ ] Vissza a **`HU`** gombbal. *„A választást az alkalmazás megjegyzi.”*

- [ ] **(Opcionális, 15 mp) Téma:** **hold ikon** (`Sötét téma`), majd **monitor ikon** (`Rendszertéma`).
  - *„Világos és sötét téma, ellenőrzött kontraszttal; alapból az operációs rendszert követi, és oldalbetöltéskor sem villan fel rossz színnel.”*

---

## 3. Kérdőív létrehozása (Menedzser, A ablak) – ~2 perc

- [ ] Kattints a **`Menedzser irányítópult`** linkre → `/hu/manager`.
  - *„Ezt az oldalt csak menedzser érheti el. Ha egy résztvevő begépeli a címet, a szerver a kezdőoldalra irányítja.”*
  - *(Opcionális bizonyíték: a B ablakban írd be a `/hu/manager` címet → visszakerül a `/hu` oldalra.)*

- [ ] **Validáció:** kattints üres űrlappal a **`Szavazás létrehozása`** gombra → **`Add meg a szavazás címét.`**
  - *„Az űrlap lépésről lépésre validál: cím, kérdés, legalább két válaszlehetőség, jövőbeli lezárási idő.”*

- [ ] **Töltsd ki az űrlapot:**
  - **`Cím`**: **`Csapatépítő időpontja`**
  - **`Kérdés`**: **`Melyik napon legyen a csapatépítő?`**
  - **`1. opció`**: **`Péntek`** · **`2. opció`**: **`Szombat`** · **`Opció hozzáadása`** → **`3. opció`**: **`Vasárnap`**

- [ ] **Lezárási idő:** mutass a **`Lezárási idő`** mezőre.
  - *„Alapértelmezetten 7 nappal a létrehozás után zárul, de módosítható; múltbeli időpontot a rendszer nem fogad el. A lezárási idő értékobjektum: a nyitott/lezárt állapot ebből számítódik, nincs külön tárolt státusz, így nem kerülhet ellentmondásba.”*

- [ ] **`Szavazás létrehozása`** → **`A szavazás sikeresen létrejött!`**
  - Az új szavazás az **`Összes szavazás`** lista tetején: `Nyitott`, `0 szavazat · 3 opció`.
  - *„A háttérben egy Server Action fut: menedzseri jogosultságot ellenőriz, újra validál, majd egyetlen beágyazott írással hozza létre a `Poll`, a `Question` és az `Option` rekordokat. A modell így a többkérdéses kérdőívekre is fel van készítve.”*

---

## 4. Szavazás és üzleti szabályok (Résztvevő, B ablak) – ~2 perc

- [ ] **B ablak:** frissítsd a kezdőoldalt (**F5**) → megjelenik a **`Csapatépítő időpontja`**.
  - *„A menedzser által létrehozott szavazás azonnal látszik a másik felhasználónál is – közös adatbázisból dolgozunk, nem a böngésző tárolójából.”*

- [ ] Nyisd meg a szavazást → **`Add le a szavazatod`** kártya.
  - *„A `Szavazat leadása` gomb inaktív, amíg nincs kiválasztott opció.”*
- [ ] Válaszd a **`Szombat`** opciót → **`Szavazat leadása`**.
  - Visszajelzés: **`Köszönjük a szavazatod! Már szavaztál — az eredményeket lent láthatod.`**
  - A KPI-kártyák és a diagram frissülnek, az AI elemzés új összefoglalót kér.

- [ ] ⭐ **KULCSPONT – „egy felhasználó, kérdésenként egy szavazat”:**
  - **F5** → ismét: **`Már szavaztál — az eredményeket lent láthatod.`**, választógombok nincsenek.
  - *„A szabályt a szerver tartatja be: a `Vote` táblán egyedi index van a felhasználó és a kérdés párosán. Ha valaki egy régi, még nyitott lapról próbálna újra szavazni, a szerver elutasítja – ezt automatizált teszt is ellenőrzi, két böngészőlappal.”*

- [ ] **`Vissza a szavazásokhoz`** → a kártyán: **`Szavaztál`** címke, `1 szavazat · 3 opció`.

---

## 5. Eredmények és valódi AI (Google Gemini) – ~3 perc

> 💡 A gazdagabb diagramhoz a mintaszavazást használd, amelyben 4 szavazat van. (Ezt előmelegítetted a 0.3 pontban.)

- [ ] **B ablak:** nyisd meg az **`Onboarding feedback`** szavazást (`Lezárva`).

- [ ] **KPI-kártyák:**
  - **`Összes szavazat`**: `4` – `4 opció között`
  - **`Vezető opció`**: `Very satisfied` – `A szavazatok 50%-a`
  - **`Hátralévő idő`**: `Lezárva` – `A szavazás véget ért`
  - *„Holtversenynél a vezető opció kártyája minden holtversenyben lévő opciót megnevez.”*

- [ ] **Recharts oszlopdiagram:** az opciók szavazatszám szerint rangsorolva, a vezető kék kiemeléssel.
  - Vidd az egeret a **`Very satisfied`** sávra → tooltip: `50%` · `2 szavazat`.
  - **`Megtekintés táblázatként`** → akadálymentes táblázat (`Opció / Szavazat / Arány`).

- [ ] ⭐ **AI elemzés** (a diagram alatt, alcím: `Az összesített szavazatszámok összefoglalója, a Google Gemini generálta`):
  - Olvass fel 1–2 mondatot a generált szövegből. *(A szöveg minden futtatásnál kissé más lehet – ez valódi nyelvi modell.)*
  - *„Ez már nem szimuláció: a szöveget a Google Gemini nyelvi modell írja, valós időben.”*
  - **Hogyan működik – ezt mondd el:**
    1. *„A böngésző csak a szavazás azonosítóját és a nyelvet küldi el egy Server Actionnek.”*
    2. *„A szerver ellenőrzi a bejelentkezést, majd **az adatbázisból** olvassa ki a kérdést és az összesített szavazatszámokat. Egyedi szavazatok és felhasználói adatok nem jutnak el a modellhez – csak az aggregátum.”*
    3. *„A promptot a szerver állítja össze, a Gemini API-kulcs a szerveren marad, a böngészőbe sosem kerül. Mivel a böngésző nem küldhet saját szöveget, a végpontot nem lehet ingyenes chatbotként kihasználni.”*
    4. *„A rendszerutasítás szerint a kérdés és az opciók szövege adat, nem utasítás – ez véd a promptba csempészett parancsok ellen.”*
    5. *„A válasz gyorsítótárba kerül: azonos eredményekre nem fizetünk újra. Új szavazatnál új összefoglaló készül.”*
    6. *„Ha egy modell túlterhelt vagy nem elérhető, a szerver röviden újrapróbálja, majd egy második Flash modellre vált.”*

- [ ] **Nyelvi bizonyíték:** kattints az **`EN`** gombra.
  - Rövid **`Generating AI insights...`** állapot után az elemzés **angolul** jelenik meg.
  - *„A nyelvet a szerver adja át a modellnek, így az összefoglaló mindig az aktív nyelven készül.”*
  - Vissza a **`HU`** gombbal.

- [ ] **Betöltési és hibaállapot (szóban, vagy ha épp előfordul):**
  - Várakozás közben: **`AI elemzés készítése...`** + pulzáló skeleton.
  - Ha az API nem válaszol: **`Nem sikerült elkészíteni az elemzést. Kérjük, próbáld újra később.`** + **`Újrapróbálás`** gomb.
  - *„A hiba nem dönti össze az oldalt: a diagram és a KPI-k működnek tovább, az elemzés pedig egy kattintással újrakérhető.”*

- [ ] **(Opcionális) Reszponzív nézet:** **F12** → **Ctrl+Shift+M** → **iPhone SE** (375 px).
  - *„Mobilon a KPI-kártyák egymás alá kerülnek, a diagram igazodik, nincs vízszintes görgetés.”* → **F12**.

---

## 6. Szavazás lezárása (lezárási szabály, két ablakkal) – ~2 perc

- [ ] **B ablak (Résztvevő):** nyisd meg a **`Next quarter priorities`** szavazást, és **jelölj be egy opciót, de még ne küldd be**.
- [ ] **A ablak (Menedzser):** nyisd meg ugyanezt a szavazást → **`Szavazás lezárása`**.
  - A gomb: **`Szavazás lezárva`** (inaktív); státusz: `Nyitott` → **`Lezárva`**; KPI: **`Lezárva`**.
  - *„A lezárás a lezárási időt a jelenlegi pillanatra állítja – ugyanaz a szabály érvényes rá, mint a lejáratra. Menedzser nem szavaz, ezért nála nincs szavazóűrlap.”*
- [ ] ⭐ **B ablak:** most kattints a **`Szavazat leadása`** gombra.
  - Hibaüzenet: **`A szavazás lezárult, ezért a szavazatod nem került rögzítésre.`**
  - *„A résztvevő lapja még nyitott űrlapot mutatott, de a szerver a beküldés pillanatában az adatbázisból ellenőrzi a lezárási időt, és elutasítja a szavazatot. A felület csak kényelmi funkció, a szabály a szerveren dől el.”*
- [ ] **F5** a B ablakban → **`Ez a szavazás lezárult. Szavazni már nem lehet.`**, az eredmények továbbra is láthatók.

- [ ] **(Alternatíva – automatikus lezárás, ha van 2–3 perc):**
  - Menedzserként hozz létre egy szavazást **1–2 perccel** későbbi `Lezárási idő`-vel; résztvevőként nyisd meg, és ne kattints semmire.
  - A lezárási időpontban a státusz **magától** `Lezárva`-ra vált, a szavazóűrlap eltűnik – **újratöltés nélkül**.
  - *„A felület a következő lezárási időpontra időzít; a szerver renderelési idejéből indul, így betöltéskor sincs eltérés a szerver és a böngésző nézete között.”*

- [ ] **Kijelentkezés:** **A ablak** → **`Kijelentkezés`** → visszakerülsz a bejelentkezési oldalra; a `/hu/manager` cím ismét a bejelentkezéshez irányít.

---

## 7. Automatizált tesztek (Playwright E2E) – ~1,5 perc

- [ ] *„Minden bemutatott szabályt és folyamatot automatizált end-to-end tesztek ellenőriznek, valódi böngészőben és valódi adatbázison.”*

**Futtatás** (első alkalommal előtte: **`npx playwright install chromium`**):

```bash
npm run test:e2e
```

- [ ] Mondd el, mi történik:
  - *„A tesztek **külön adatbázist** használnak (`e2e.db`): a parancs törli és a séma alapján újra létrehozza (`npx prisma db push`), így a fejlesztői `dev.db` érintetlen marad.”*
  - *„Production buildet készít, és a 3100-as porton indítja el az alkalmazást.”*
  - *„**Minden teszt előtt** az adatbázis visszaáll a demóállapotra, a teszt pedig valódi bejelentkezéssel indul (menedzserként vagy résztvevőként). Mivel a tesztek közös adatbázist használnak, egymás után futnak.”*
  - *„A tesztek az eredményt az adatbázisban is ellenőrzik, például hogy a szavazat a bejelentkezett felhasználóhoz került, vagy hogy a jelszó bcrypt-hash.”*
  - *„**Gemini-hívás nincs:** a tesztszerver `AI_INSIGHTS_MODE=mock` módban fut, ekkor a szerver determinisztikus, szabályalapú összefoglalót ad vissza, és a Gemini-kulcs üres. Így a tesztek nem fogyasztanak fizetős kvótát, és minden futásnál ugyanazt a szöveget várhatják. A betöltési és a hibaállapotot a teszt a hálózati kérés feltartásával, illetve 500-as hibára cserélésével vizsgálja.”*
  - *„Az egész csomag **mindkét nyelven** lefut: 84 teszt (42 × magyar és angol), kb. 5 perc.”*

- [ ] **Mit fednek le a tesztek** (ha kérdezik):

| Terület | Példák |
| --- | --- |
| Hitelesítés | Átirányítás bejelentkezésre és vissza, hibás jelszó, regisztráció szerepkörrel, kijelentkezés, külső `callbackUrl` elutasítása |
| Jogosultság | Résztvevő nem éri el a `/manager` oldalt, menedzser nem szavaz |
| Üzleti szabályok | Egy szavazat kérdésenként (két lapról is), lezárt szavazásra nincs szavazat, lezárás = `closesAt` most |
| Űrlapok | Kérdőív-validáció, alapértelmezett 7 napos lezárás, egyéni lezárási idő |
| Eredmények | KPI-k, holtverseny, diagram arányai és színei, táblázat, mobilnézet |
| AI elemzés | Betöltési állapot, hibaüzenet és újrapróbálás, üres eredmény |
| Felület | Nyelvváltás és -megjegyzés, 404 oldal, téma villanás nélkül, nincs hidratálási hiba |

- [ ] **(Opcionális, élő bemutató, ~1 perc):** csak a hitelesítési tesztek, látható böngészővel, magyarul:

```bash
npx playwright test e2e/auth.spec.ts --project=chromium-hu --headed
```

> ⚠️ A tesztek a 3100-as portot használják; ha ott már fut egy korábbi tesztszerver, azt újrahasznosítják. A fejlesztői szerver (3000) mellett nyugodtan futtathatók.

---

## 8. Zárás (~30 mp)

- [ ] *„Összefoglalva: láttuk a teljes folyamatot – regisztráció és bejelentkezés, létrehozás, szavazás, eredmények, valódi AI-elemzés és lezárás –, két nyelven, két valódi szerepkörrel. Az adatok relációs adatbázisban vannak, a szabályokat a szerver tartatja be, az AI-kulcs a szerveren marad, és mindezt 84 automatizált teszt ellenőrzi, a fizetős API terhelése nélkül.”*
- [ ] Térj vissza a prezentációhoz (`ELOADAS_VAZLAT.md`).

---

## Vészhelyzeti teendők (Troubleshooting)

| Probléma | Megoldás |
|---|---|
| Az oldal angolul nyílik meg | Kattints a **`HU`** gombra, vagy nyisd meg a **`/hu`** címet. |
| Minden oldal a bejelentkezéshez irányít | Ez a helyes működés kijelentkezve. Lépj be egy demófiókkal. |
| `Hibás e-mail-cím vagy jelszó.` a demófiókkal | Az adatbázis nincs feltöltve: **Ctrl+C** → **`npm run db:reset`** → **`npm run dev`**. |
| A demó közben „elrontott” adatok | Szerver leállítása → **`npm run db:reset`** → újraindítás → újra bejelentkezés. |
| Nem látszik a `Menedzser irányítópult` link | Résztvevőként vagy bejelentkezve; jelentkezz be a menedzserfiókkal (A ablak). |
| Mindkét ablakban ugyanaz a felhasználó | A B ablak legyen **inkognitó** (Ctrl+Shift+N) – a munkamenet sütiben él. |
| Az AI elemzés sokáig tölt | A Gemini túlterhelt lehet (akár 30–40 mp). Közben mutasd a diagramot; vagy mutasd az előmelegített `Onboarding feedback` szavazást. |
| `Nem sikerült elkészíteni az elemzést.` | Kattints az **`Újrapróbálás`** gombra. Ha tartósan fennáll: ellenőrizd a `GEMINI_API_KEY`-t a `.env`-ben, és indítsd újra a szervert. |
| Nincs internet / nincs API-kulcs a helyszínen | `.env`: **`AI_INSIGHTS_MODE="mock"`** → szerver újraindítása. Ekkor szabályalapú összefoglaló jelenik meg (mondd el, hogy ez a tesztmód). |
| A `.env` módosítása nem hat | A szervert újra kell indítani (**Ctrl+C** → **`npm run dev`**). |
| `npm run db:reset` hibát ad (`EBUSY`) | A futó szerver zárolja a `dev.db`-t: előbb állítsd le. |
| A szerver nem indul („Another next dev server…”) | Használd a már futó szervert, vagy állítsd le a kiírt `taskkill` paranccsal. |
| Piros „Issue” jelzés fejlesztői módban | Használd az éles buildet: `npm run build` → `npm start`. |

---

## Gyakorlási ellenőrzőlista

- [ ] A `.env` ki van töltve (`NEXTAUTH_SECRET`, `GEMINI_API_KEY`), a szerver ezzel indult
- [ ] `npm run db:reset` a bemutató előtt lefutott, mindkét demófiókkal sikerül a belépés
- [ ] Két ablak kész: A = Menedzser (normál), B = Résztvevő (inkognitó)
- [ ] Az AI elemzés előmelegítve (`Onboarding feedback`, HU és EN)
- [ ] A teljes demó legalább **kétszer** végigment hiba nélkül, **15 percen belül**
- [ ] A ⭐ kulcspontok gördülékenyek: egy szavazat szabálya, valódi AI magyarázata, lezárás nyitott űrlap mellett
- [ ] `npm run test:e2e` egyszer lefutott a gépen (kb. 5 perc), az eredmény ismert
