# PollHub – Élő demó forgatókönyv

> **Cél:** a PollHub minden fő funkciójának, üzleti szabályának és UI-részletének hibátlan bemutatása a bírálóknak.
> **Időtartam:** kb. **8–10 perc**
> **Jelölések:**
> - **Félkövér** = amire kattintani kell / amit be kell gépelni
> - *Dőlt* = amit mondani kell (előadói szöveg)
> - `Kód` = pontos felirat, URL vagy parancs
> - [ ] = pipáld ki gyakorlás közben

---

## 0. Előkészületek (a bemutató előtt, ~5 perc)

### 0.1 Szerver indítása

- [ ] Nyiss egy terminált a projekt gyökérkönyvtárában (`PollHub`).
- [ ] Ha még nem történt meg: **`npm install`**
- [ ] Indítsd el a fejlesztői szervert: **`npm run dev`**
- [ ] Várd meg a `✓ Ready` üzenetet → az alkalmazás a `http://localhost:3000` címen fut.

> ⚠️ **Ha a terminál azt írja: „Another next dev server is already running”** – egy korábbi szerver még fut. Használd azt (ugyanaz a cím), vagy állítsd le a kiírt `taskkill /PID … /F` paranccsal, és indítsd újra.

> 💡 **Tipp a legsimább demóhoz:** a fejlesztői mód bal alsó sarkában megjelenik a Next.js „N” ikonja. Ha ezt el szeretnéd kerülni, használd az éles buildet: **`npm run build`**, majd **`npm start`** (szintén `http://localhost:3000`).

### 0.2 Böngésző előkészítése

- [ ] Nyisd meg **közvetlenül** a magyar nyelvű címet: **`http://localhost:3000/hu`**
  - (A gyökér `/` cím a böngésző nyelve vagy a legutóbb választott nyelv alapján irányít át – ezért érdemes a `/hu`-val indulni.)
- [ ] **Demóadatok visszaállítása** (tiszta kiinduló állapot):
  1. **F12** → **Console** fül
  2. Gépeld be: **`localStorage.clear()`** → **Enter**
  3. **F5** (újratöltés)
- [ ] Ellenőrizd a kiinduló állapotot:
  - Szerepkör: **`Résztvevő`** aktív
  - Két mintaszavazás látható: **`Next quarter priorities`** (`Nyitott`) és **`Onboarding feedback`** (`Lezárva`)
- [ ] Állítsd a böngésző nagyítását **100%**-ra, és zárd be a felesleges lapokat / értesítéseket.
- [ ] Zárd be a DevToolst (F12), hacsak nem a reszponzív nézetet mutatod (4. fejezet).

> 💡 **Fontos tudnivaló:** az adatok a böngésző **localStorage**-ában élnek. Teljes oldal-újratöltés után a lista egy pillanatra csak a két mintaszavazást mutatja, majd **megjelennek a saját szavazások is**. Újratöltés után várj egy másodpercet, mielőtt kattintasz – az alkalmazáson belüli navigációnál ez nem fordul elő.

---

## 1. Kezdőképernyő és kétnyelvűség (UI & i18n) – ~1,5 perc

- [ ] **Mutasd be a kezdőoldalt** (`/hu` – `Szavazások`).
  - *„Ez a PollHub kezdőoldala. A szavazások kártyákon jelennek meg: látható a státusz – `Nyitott` vagy `Lezárva` –, a cím, a szavazatok és az opciók száma.”*
  - Vidd az egeret egy kártya fölé.
  - *„A kártyák finoman megemelkednek, az árnyék erősödik – ezek a mikrointerakciók jelzik, hogy az elem kattintható.”*

- [ ] **Mutasd meg a navigációs sávot** (jobb felső sarok).
  - *„Itt három kapcsoló található: a szerepkör (`Résztvevő` / `Menedzser`), a nyelv (`HU` / `EN`) és a téma (rendszer / világos / sötét).”*

- [ ] **Nyelvváltás:** kattints az **`EN`** gombra.
  - Figyeld meg: az URL `/hu` → **`/en`**, a cím `Szavazások` → **`Polls`**, a státuszok `Open` / `Closed`.
  - *„A kétnyelvűséget a next-intl könyvtár adja. A nyelv az URL része, így minden oldal közvetlenül linkelhető egy adott nyelven, és a nyelvváltás ugyanazon az oldalon marad.”*
  - *„A felület szövegei fordítódnak, a felhasználói tartalom – például a szavazások címe – értelemszerűen nem.”*

- [ ] Kattints vissza a **`HU`** gombra → URL ismét **`/hu`**.
  - *„Az alkalmazás megjegyzi a választást: a következő látogatáskor is ezen a nyelven nyílik meg.”*

- [ ] **(Opcionális, 15 mp) Téma:** kattints a **hold ikonra** (`Sötét téma`), majd vissza a **monitor ikonra** (`Rendszertéma`).
  - *„Világos és sötét témát is támogatunk, mindkettőben ellenőrzött, akadálymentes kontraszttal. Alapból az operációs rendszer beállítását követi.”*

---

## 2. Kérdőív létrehozása (Menedzser munkafolyamat) – ~2 perc

- [ ] **Szerepkörváltás:** kattints a **`Menedzser`** gombra a navigációs sávban.
  - Megjelenik egy új menüpont: **`Menedzser irányítópult`**.
  - *„A szerepkör az MVP-ben egy kapcsoló – a valós hitelesítést a jövőbeli fejlesztések között tárgyalom.”*

- [ ] Kattints a **`Menedzser irányítópult`** linkre → URL: `/hu/manager`.

- [ ] **Validáció bemutatása:** kattints üres űrlappal a **`Szavazás létrehozása`** gombra.
  - Piros hibaüzenet: **`Add meg a szavazás címét.`**
  - *„Az űrlap lépésről lépésre validál: cím, kérdés, legalább két válaszlehetőség, és jövőbeli lezárási idő.”*

- [ ] **Töltsd ki az űrlapot:**
  - **`Cím`** mező: **`Csapatépítő időpontja`**
  - **`Kérdés`** mező: **`Melyik napon legyen a csapatépítő?`**
  - **`Válaszlehetőségek`**:
    - **`1. opció`**: **`Péntek`**
    - **`2. opció`**: **`Szombat`**
    - Kattints az **`Opció hozzáadása`** gombra → **`3. opció`**: **`Vasárnap`**
  - *„A válaszlehetőségek száma dinamikus; kettő fölött a kuka ikonnal törölhetők is.”*

- [ ] **Lezárási idő bemutatása:** mutass a **`Lezárási idő`** mezőre.
  - *„A lezárási idő alapértelmezetten **7 nappal** a létrehozás után van, de tetszőlegesen módosítható. Múltbeli időpontot a rendszer nem fogad el.”*
  - *(Opcionális, ha van idő)* Állíts be egy múltbeli dátumot → **`Szavazás létrehozása`** → hibaüzenet: **`A lezárási időnek a jövőben kell lennie.`** – majd állítsd vissza egy jövőbeli időpontra.
  - *„Architekturálisan a lezárási idő egy könnyűsúlyú Value Object: a szavazás nyitott vagy lezárt állapota **ebből származik**, nincs külön tárolt státuszmező, így nem kerülhet ellentmondásos állapotba.”*

- [ ] Kattints a **`Szavazás létrehozása`** gombra.
  - Zöld visszajelzés: **`A szavazás sikeresen létrejött!`**, az űrlap kiürül.
  - Az új szavazás **az `Összes szavazás` lista tetején** jelenik meg, `Nyitott` státusszal, `0 szavazat · 3 opció` adattal.
  - *„A háttérben a Kérdőív és a Kérdés két külön entitásként jön létre – a domainmodell így felkészült a többkérdéses kérdőívekre.”*

---

## 3. Szavazás és üzleti szabályok (Résztvevő munkafolyamat) – ~2 perc

- [ ] **Szerepkörváltás:** kattints a **`Résztvevő`** gombra.
  - Az alkalmazás automatikusan a **kezdőoldalra** irányít.
  - *„A menedzseri irányítópultot Résztvevő nem érheti el – a rendszer átirányít.”*

- [ ] Kattints az új szavazás kártyájára: **`Csapatépítő időpontja`**.
  - Megjelenik az **`Add le a szavazatod`** kártya a kérdéssel és a három opcióval.
  - *„Figyeljék meg: a `Szavazat leadása` gomb **inaktív**, amíg nincs kiválasztott opció.”*

- [ ] Válaszd ki a **`Szombat`** opciót.
  - A kiválasztott opció kiemelt keretet és hátteret kap.

- [ ] Kattints a **`Szavazat leadása`** gombra.
  - Visszajelzés: **`Köszönjük a szavazatod! Már szavaztál — az eredményeket lent láthatod.`**
  - Az eredmények azonnal frissülnek (KPI-kártyák, diagram), az AI-elemzés **újraindul**.

- [ ] ⭐ **KULCSPONT – „egy felhasználó = egy szavazat” szabály:**
  - *„Próbáljunk meg újra szavazni.”* – mutasd meg, hogy **nincs mire kattintani**: a választógombok és a beküldő gomb **eltűntek**, helyettük csak a visszaigazolás látható.
  - Nyomj **F5**-öt (újratöltés).
  - Az üzenet ismét: **`Már szavaztál — az eredményeket lent láthatod.`**
  - *„A szabályt nem csak a felület kényszeríti ki: az állapotkezelő réteg is elutasítja a második szavazatot, és a szavazat újratöltés után is megmarad. Ezt automatizált E2E teszt is ellenőrzi.”*

- [ ] Kattints a **`Vissza a szavazásokhoz`** linkre.
  - A kártyán megjelent a **`Szavaztál`** címke, és `1 szavazat · 3 opció`.

---

## 4. Vizualizáció és AI-szimuláció (Eredmények) – ~2,5 perc

> 💡 Az eredmények a szavazás oldalán, a szavazókártya **alatt** találhatók. A gazdagabb diagramhoz használd a mintaszavazást, amelyben már 4 szavazat van.

- [ ] Kattints az **`Onboarding feedback`** kártyára (`Lezárva`).

- [ ] ⭐ **AI-elemzés – időzítés:** **azonnal** görgess le az **`AI elemzés`** kártyához.
  - 2 másodpercig: **`AI elemzés készítése...`** + pulzáló skeleton-sávok.
  - *„Ez a betöltési animáció pontosan **2 másodpercig** tart – egy valódi nyelvi modell válaszidejét szimulálja.”*
  - (Ha lekésted: válts nyelvet és vissza, vagy töltsd újra az oldalt – **F5** –, és újra lefut.)

- [ ] **Olvasd fel a generált szöveget** (kb.):
  - *„Összesen 4 összesített válasz alapján a szimulált konszenzus **egyértelműen** ezt az opciót részesíti előnyben: „Very satisfied”, a szavazatok 50%-ával. Az eloszlás alapján a fő alternatíva: „Satisfied” (25%), 25 százalékponttal lemaradva. Ilyen kevés válasz mellett ezt csak korai jelzésként érdemes kezelni.”*
  - *„Ez nem előre megírt szöveg: a valós, **összesített** szavazatokból, szabályok alapján épül fel. A vezető és a második helyezett közti különbségből adódik az erősség – `erőteljesen`, `egyértelműen` vagy `enyhén` –, felismeri a holtversenyt és az egyhangú eredményt, kis mintánál pedig figyelmeztet. Külső API nincs, így nincs költség és nincs adatvédelmi kockázat.”*

- [ ] **Nyelvi bizonyíték:** kattints az **`EN`** gombra.
  - Az AI-elemzés újra „gondolkodik”, majd **angolul** jelenik meg: *„Based on the 4 aggregated responses, the simulated consensus clearly favors…”*
  - *„Ugyanaz az elemzés, az aktív nyelven, helyes többes számmal és nyelvhelyes felsorolással.”*
  - Kattints vissza a **`HU`** gombra.

- [ ] **KPI-kártyák** (a diagram fölött):
  - **`Összes szavazat`**: `4` – `4 opció között`
  - **`Vezető opció`**: `Very satisfied` – `A szavazatok 50%-a`
  - **`Hátralévő idő`**: `Lezárva` – `A szavazás véget ért` (nyitott szavazásnál: pl. `7 nap múlva zárul`)
  - *„A KPI-kártyák egy pillantással összefoglalják a lényeget. Holtversenynél a vezető opció kártyája minden holtversenyben lévő opciót megnevez.”*

- [ ] **Recharts oszlopdiagram** (`Eredmények` kártya):
  - *„Az opciók szavazatszám szerint **rangsorolva** jelennek meg. A vezető opció kék kiemelést kap.”*
  - *„A skálázás dinamikus: a leghosszabb sáv a vezető részaránya, így az 50% pontosan kétszer olyan hosszú, mint a 25%.”*
  - Vidd az egeret a **`Very satisfied`** sávra → **tooltip**: `50%` · `Very satisfied` · `2 szavazat`.

- [ ] **Táblázatos nézet:** kattints a **`Megtekintés táblázatként`** feliratra.
  - Megjelenik az `Opció / Szavazat / Arány` táblázat.
  - *„Ugyanaz az adat akadálymentes táblázatként is elérhető – képernyőolvasóval is használható.”*

- [ ] **(Opcionális) Reszponzív nézet:**
  - **F12** → **Ctrl+Shift+M** (eszköz mód) → válassz pl. **iPhone SE** (375 px).
  - *„Mobilon a KPI-kártyák egymás alá kerülnek, a diagram a képernyőhöz igazodik, és nincs vízszintes görgetés. A navigációs sávban a szerepkör-kapcsoló ikonos formára vált.”*
  - Zárd be a DevToolst (**F12**).

---

## 5. Szavazás lezárása (lezárási szabály) – ~1,5 perc

- [ ] Kattints a **`Vissza a szavazásokhoz`** linkre, majd nyisd meg a **`Csapatépítő időpontja`** szavazást.

- [ ] **Szerepkörváltás:** kattints a **`Menedzser`** gombra (maradj ugyanezen az oldalon).
  - A szavazókártya eltűnik, helyette megjelenik a **`Szavazás lezárása`** gomb.
  - *„Menedzserként nem szavazunk, hanem kezeljük a szavazást.”*

- [ ] Kattints a **`Szavazás lezárása`** gombra.
  - A gomb felirata: **`Szavazás lezárva`**, és **inaktívvá** válik.
  - A státusz: `Nyitott` → **`Lezárva`**; a `Hátralévő idő` KPI: **`Lezárva`** – `A szavazás véget ért`.
  - *„A lezárás technikailag annyit jelent, hogy a lezárási idő a jelenlegi időpontra áll – ugyanaz a szabály érvényes rá, mint a lejáratra.”*

- [ ] **Szerepkörváltás:** kattints a **`Résztvevő`** gombra (ugyanezen az oldalon).
  - A szavazóűrlap helyén: **`Ez a szavazás lezárult. Szavazni már nem lehet.`**
  - Nincsenek választógombok, nincs beküldő gomb – **az eredmények viszont továbbra is láthatók**.
  - *„Lezárt szavazásra semmilyen módon nem lehet szavazni – ezt is az állapotkezelő réteg tartatja be, nem csak a felület.”*

- [ ] **(Alternatíva – automatikus lezárás, ha van 2–3 perc):**
  - Menedzserként hozz létre egy szavazást, amelynek **`Lezárási idő`**-je **1–2 perccel** a jelenlegi időpont után van.
  - Résztvevőként nyisd meg, és **ne kattints semmire**.
  - A lezárási időpont elérésekor a státusz **magától** `Lezárva`-ra vált, a szavazóűrlap eltűnik – **újratöltés nélkül**.
  - *„Az alkalmazás időzítővel figyeli a következő lezárási időpontot, így a nézet magától frissül.”*

---

## 6. Zárás (~30 mp)

- [ ] *„Összefoglalva: láttuk a teljes folyamatot – létrehozás, szavazás, eredmények, AI-elemzés és lezárás –, két nyelven, két szerepkörrel. Minden bemutatott üzleti szabályt automatizált Playwright E2E tesztek ellenőriznek, mindkét nyelven.”*
- [ ] Térj vissza a prezentációhoz (`ELOADAS_VAZLAT.md`, 7. fejezet: korlátok és továbbfejlesztés).

---

## Vészhelyzeti teendők (Troubleshooting)

| Probléma | Megoldás |
|---|---|
| Az oldal angolul nyílik meg | Kattints a **`HU`** gombra, vagy nyisd meg a **`/hu`** címet. |
| Hiányzik a saját szavazás a listából | Teljes újratöltés után várj 1 másodpercet – a localStorage betöltése után megjelenik. |
| A demó közben „elrontott” adatok | Console: **`localStorage.clear()`** → **F5** (a szerepkör is visszaáll `Résztvevő`-re). |
| Nem látszik a `Menedzser irányítópult` link | Előbb kattints a **`Menedzser`** szerepkörre. |
| Lekésted a 2 mp-es AI-betöltést | **F5** vagy nyelvváltás – az elemzés újra lefut. |
| A szerver nem indul („Another next dev server…”) | Használd a már futó szervert, vagy állítsd le a kiírt `taskkill` paranccsal. |
| Hibaüzenet-ablak (piros „Issue” jelzés) fejlesztői módban | Használd az éles buildet: `npm run build` → `npm start`. |

---

## Gyakorlási ellenőrzőlista

- [ ] A teljes demó legalább **kétszer** végigment hiba nélkül
- [ ] Időtartam **10 percen belül**
- [ ] A demóadatok visszaállítása (`localStorage.clear()`) a bemutató előtt megtörtént
- [ ] A ⭐ jelölt kulcspontok (egy szavazat szabálya, AI-időzítés) gördülékenyek
