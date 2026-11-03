# PollHub – Előadásvázlat és előadói jegyzetek

> **Projektvédés** · Szavazás- és kérdőívkezelő webalkalmazás (MVP)
> Ajánlott időkeret: **12–15 perc** előadás + élő demó + kérdések

---

## Tartalom

1. Bevezetés és projekt célja
2. Technológiai stack
3. Architektúra (Domain-Driven Design)
4. Komplex funkciók: vizualizáció és AI-összefoglaló
5. Kétnyelvűség (i18n)
6. Minőségbiztosítás (QA & Clean Code)
7. Az MVP korlátai és a jövő
8. Melléklet: demóforgatókönyv és várható kérdések

---

## 1. Bevezetés és projekt célja

**A probléma**

- Csapatokban és szervezetekben gyakori igény a **gyors, strukturált véleménygyűjtés** (pl. prioritások, elégedettség, döntések).
- A meglévő eszközök sokszor túlméretezettek, regisztrációhoz kötöttek, vagy nem adnak **azonnal értelmezhető** eredményt.

**A megoldás: PollHub**

- Webalkalmazás szavazások **létrehozására, kitöltésére és kiértékelésére**.
- Két szerepkör:
  - **Résztvevő** – böngészi a szavazásokat és szavaz.
  - **Menedzser** – új szavazást hoz létre, és lezárja a meglévőket.
- Az eredmények **grafikonon, táblázatban, KPI-kártyákon** és egy **szimulált AI-összefoglalóban** jelennek meg.

**Az MVP hatóköre – tudatos szűkítés**

- **1 szavazás = 1 kérdés**, több válaszlehetőséggel (legalább 2 opció).
- Felhasználónként **egy szavazat** szavazásonként.
- Időzített lezárás: minden szavazásnak van **lezárási ideje** (alapértelmezésként 7 nap).

> 🎤 **Előadói jegyzet:** Hangsúlyozd, hogy az „1 szavazás = 1 kérdés” nem korlát, hanem **tudatos MVP-döntés**: a domainmodell (lásd 3. fejezet) már most is külön entitásként kezeli a kérdést, így a többkérdéses kérdőív bővítés, nem újraírás.

---

## 2. Technológiai stack

| Réteg | Technológia | Miért? |
|---|---|---|
| Keretrendszer | **Next.js 16 (App Router)** | Szerveroldali renderelés, fájlalapú routing, lokalizált útvonalak |
| UI | **React 19** | Komponensalapú, deklaratív felület |
| Nyelv | **TypeScript** | Típusbiztonság a domainmodell szintjén |
| Stílus | **Tailwind CSS 4** | Egységes design tokenek, világos/sötét téma |
| Vizualizáció | **Recharts** | Deklaratív, reszponzív diagramok |
| i18n | **next-intl** | App Router-kompatibilis lokalizáció |
| Tesztelés | **Playwright** | Valódi böngészős E2E tesztek |

**Állapotkezelés: localStorage + React Context – miért nem backend?**

- Az MVP célja a **domainlogika és a felhasználói élmény validálása**, nem az infrastruktúráé.
- **React Context** (`PollProvider`): egyetlen, jól körülhatárolt állapottér (szavazások, kérdések, szavazatok, szerepkör).
- **localStorage**: az adatok újratöltés után is megmaradnak, **szerver és adatbázis nélkül**.
- Előnyök: nulla üzemeltetési költség, gyors iteráció, egyszerű demózhatóság.
- A perzisztencia egy **külön modulba** (`lib/storage.ts`) van zárva → később egy REST/DB réteg **ugyanazon a felületen** cserélhető.
- **Verziózott tárolókulcs** (`pollhub_state_v2`): a régi (v1) formátumot az alkalmazás biztonságosan figyelmen kívül hagyja – ezt teszt is ellenőrzi.

> 🎤 **Előadói jegyzet:** Ha rákérdeznek: a localStorage szándékosan „vékony” réteg. A komponensek nem tudják, honnan jön az adat – csak a Context API-t látják. Ez a **függőség-megfordítás** gyakorlati alkalmazása.

---

## 3. Architektúra (Domain-Driven Design)

**Entitások szétválasztása: Kérdőív (Poll) ↔ Kérdés (Question)**

```
Poll (Kérdőív)          Question (Kérdés)          Vote (Szavazat)
─────────────           ─────────────────          ───────────────
id                      id                         id
title                   pollId  ──► Poll           pollId
closesAt                text                       questionId
                        options[] (Option)         optionId
                                                   userId
```

- A **Poll** a „konténer”: cím és életciklus (lezárási idő).
- A **Question** hordozza a tartalmat: kérdésszöveg és válaszopciók.
- A **Vote** mindhárom szintre hivatkozik → az eredmények kérdésszinten aggregálhatók.
- Jövőálló: több kérdés per kérdőív **sémamódosítás nélkül** támogatható (a kapcsolat már `pollId`-n keresztül adott).

**„Könnyűsúlyú Value Object”: a Lezárási idő (Closing Time)**

- Pragmatikus döntés: a lezárási idő **egyetlen primitív érték** (`closesAt`, Unix timestamp ms) – nincs külön osztály, nincs felesleges absztrakció.
- A viselkedés **tiszta függvényekben** él (`lib/closingTime.ts`):
  - `isClosed(closesAt, now)` – nyitott vagy lezárt?
  - `defaultClosingTime(now)` – alapértelmezés: +7 nap.
  - `getTimeRemaining(closesAt, now)` – hátralévő idő a legnagyobb értelmes egységben (perc / óra / nap).
- **Kulcsgondolat: az állapot származtatott, nem tárolt.**
  - Nincs `status: "open" | "closed"` mező → **nem kerülhet inkonzisztens állapotba**.
  - A menedzseri lezárás egyszerűen `closesAt = most` – ugyanaz a szabály érvényes rá.
  - Ha egy szavazás lezárási ideje lejár, a nézet **újratöltés nélkül**, magától frissül (időzítő a következő lezárásra).

**Üzleti szabályok a domain szintjén** (`castVote`)

- Lezárt szavazásra **nem** lehet szavazni.
- Egy felhasználó szavazásonként **csak egyszer** szavazhat.
- A szabályokat az állapotkezelő réteg is betartatja, nem csak a felület – egy rejtett gomb nem elég védelem.

> 🎤 **Előadói jegyzet:** A „Lightweight Value Object” mögötti érv: a DDD célja a **domain kifejezőereje**, nem az osztályok száma. A tiszta függvények könnyen tesztelhetők, és a szerveren is futtathatók.

---

## 4. Komplex funkciók: vizualizáció és AI

### 4.1 Eredményvizualizáció (Recharts)

- **Vízszintes oszlopdiagram**, szavazatszám szerint **rangsorolva**.
- **Dinamikus skálázás:** a tengely maximuma a **legnagyobb részarány**, így a vezető opció kitölti a teljes szélességet, a többi arányosan rövidebb (50% → kétszer olyan hosszú, mint 25% – ezt teszt méri).
- **Döntetlenkezelés:** a `getLeaders()` függvény **minden** holtversenyben lévő opciót vezetőként jelöl; ezek mind kiemelt színt kapnak, a KPI-kártya pedig „Holtverseny, egyenként 50%” formában jelzi.
- **Reszponzivitás:** az opciónevek a sávok fölött, teljes szélességben jelennek meg → mobilon sincs vízszintes görgetés.
- **Akadálymentesség:** ugyanaz az adat **táblázatos nézetben** is elérhető; a diagram mellett **KPI-kártyák** (összes szavazat, vezető opció, hátralévő idő).
- **Üres állapot:** szavazat nélkül nincs „üres” diagram, hanem informatív üzenet.

### 4.2 „Szimulált AI Insights” – az LLM-trükk

**A cél:** egy LLM-szerű, természetes nyelvű összefoglaló élménye – **külső API, költség és adatvédelmi kockázat nélkül**.

**Hogyan működik?**

1. **Valódi, aggregált adatokból** dolgozik (szavazatszámok opciónként) – egyedi szavazatokat soha nem lát.
2. **Determinisztikus szabályok** értelmezik az eloszlást:
   - a vezető és a második helyezett közti különbség alapján a konszenzus **erőssége**: *erős* (≥ 30 pont), *egyértelmű* (≥ 15 pont), *enyhe*;
   - **holtverseny** esetén minden vezető opció megnevezése;
   - **egyhangú** eredmény felismerése;
   - **kis minta** (< 5 szavazat) esetén óvatossági megjegyzés.
3. A mondatok **ICU üzenetformátumú sablonokból** épülnek fel az **aktív nyelven** (HU/EN), helyes többes számmal és nyelvhelyes felsorolással („A és B” / „A and B”).
4. **Mesterséges késleltetés (2 másodperc)** + **skeleton-animáció** → hihető „gondolkodó” LLM-élmény.
5. Új szavazat után az elemzés **újrafut** a friss adatokon.

**Miért jó mérnöki döntés?**

- **0 Ft API-költség**, nincs hálózati függőség, **100%-ban reprodukálható** → tesztelhető (a teszt pontosan 2 másodpercet mér).
- A komponens interfésze olyan, hogy egy valódi LLM-hívás **ugyanide** beköthető.

> 🎤 **Előadói jegyzet:** Légy átlátható: ez **szimuláció**, és a felület ezt fel is tünteti („Szimulált összefoglaló…”). Az érték a **termékélmény prototipizálásában** van: validálható, hogy a felhasználóknak hasznos-e az ilyen összefoglaló, mielőtt valódi LLM-költséget vállalnánk.

---

## 5. Kétnyelvűség (i18n)

- Átállás egy saját, Context-alapú fordítási megoldásról a **next-intl** könyvtárra.
- **Lokalizált útvonalak:** `/hu/...` és `/en/...` (alapértelmezett: **magyar**).
- **Automatikus nyelvfelismerés** a böngésző beállítása alapján; nem támogatott nyelvnél magyar a tartalék.
- A nyelvválasztó **ugyanazon az oldalon** marad (pl. `/hu/polls/1` → `/en/polls/1`), és **megjegyzi** a választást.
- Minden felületi szöveg **üzenetfájlokban** (`messages/hu.json`, `messages/en.json`) – a kódban nincs beégetett szöveg.
- **ICU formátum:** többes szám, `select`, lokalizált dátum- és számformázás (pl. „2026. szept. 17.” vs. „Sep 17, 2026”, illetve „1155 nap” vs. „1,155 days”).
- Next.js 16-specifikus megoldás: a nyelvfelismerés a **`proxy.ts`**-ben fut (a korábbi `middleware.ts` utódja).

> 🎤 **Előadói jegyzet:** Demóban érdemes egy szavazás oldalán nyelvet váltani: az URL, a felület **és az AI-összefoglaló** is azonnal átvált.

---

## 6. Minőségbiztosítás (QA & Clean Code)

**Playwright E2E tesztcsomag**

- **20 alap üzleti teszt**, amelyek valódi böngészőben, a felhasználó szemszögéből ellenőrzik a működést.
- Kiegészítve **4 i18n-** és **4 témateszttel** → **28 forgatókönyv**.
- Minden teszt **mindkét nyelven** lefut (magyar és angol böngészőprofillal) → **56 tesztfuttatás**, éles (production) buildre.

**Lefedett üzleti szabályok – példák**

- ✅ **Egy felhasználó = egy szavazat**, és a szavazat újratöltés után is megmarad.
- ✅ **Lezárt szavazásra nem lehet szavazni**, de az eredmények láthatók.
- ✅ A lezárás **`closesAt`-ot állít**, nem külön státuszmezőt (az adattárolást is ellenőrzi).
- ✅ Egy nyitott szavazás **magától lezárul**, amikor lejár az ideje – interakció nélkül.
- ✅ **Űrlapvalidáció:** cím, kérdés, min. 2 opció, jövőbeli lezárási idő.
- ✅ A Résztvevő **nem érheti el** a menedzseri felületet; ismeretlen oldalra **lokalizált 404**.
- ✅ Diagram: rangsor, százalékok, **döntetlen**, arányos sávhosszak; az AI-összefoglaló **pontosan 2 mp** után jelenik meg (a teszt virtuális órával mér).
- ✅ **Mobilnézet:** nincs vízszintes görgetés 375 px szélességen.

**Tesztelési elvek**

- **Stabil szelektorok:** `data-testid` és akadálymentes szerepkörök (`getByRole`, `getByLabel`) a CSS-osztályok helyett → a vizuális átdolgozás egyetlen tesztet sem tört el.
- Az elvárt szövegeket a tesztek **ugyanazokból az üzenetfájlokból** fordítják, mint az alkalmazás.
- Hidratációs hibák figyelése (konzolhibák gyűjtése).

**Clean Code**

- **Tiszta függvények** a domainlogikára (`closingTime`, `results`, `insights`) – a komponensek vékonyak.
- Egységes **design tokenek** és megosztott UI-osztályok (`lib/ui.ts`); világos / sötét / rendszertéma, villanás nélküli betöltéssel.
- **WCAG AA kontraszt** mindkét témában, automatizált ellenőrzéssel validálva.
- Szigorú **TypeScript** és **ESLint**, tiszta `next build`.

> 🎤 **Előadói jegyzet:** Kulcsüzenet: a tesztek **üzleti szabályokat** írnak le, nem implementációs részleteket – ezért élték túl a DDD-refaktort, az i18n-migrációt és a teljes UI-átdolgozást is.

---

## 7. Az MVP korlátai és a jövő

**Őszinte korlátok**

- **Szimulált hitelesítés:** a résztvevő egy rögzített azonosító (`userId: "participant-1"`), a szerepkör pedig egy kapcsolóval váltható. Ez **demóra alkalmas, élesben nem biztonságos**.
- **Kliensoldali adattárolás:** az adatok böngészőnként külön élnek, nincs közös adatbázis; a szabályokat a kliens tartatja be, ami manipulálható.
- **Egy kérdés szavazásonként:** a modell felkészült a bővítésre, a felület még nem.
- **Szimulált AI:** szabályalapú, nem valódi nyelvi modell.
- **Csak E2E tesztek:** egységtesztek még nincsenek; terhelés alatt néhány navigációs teszt **időzítésre érzékeny**, ennek stabilizálása folyamatban van.

**Következő lépések**

1. **Valódi backend:** REST/Server Actions + relációs adatbázis (pl. PostgreSQL) – a `storage` modul cseréjével.
2. **Valódi hitelesítés és jogosultságkezelés** (pl. OAuth / Auth.js), szerveroldali szerepkör-ellenőrzés.
3. **Szerveroldali üzleti szabályok:** egy szavazat / felhasználó adatbázis-megszorítással (egyedi index).
4. **Többkérdéses kérdőívek** a meglévő Poll ↔ Question modellre építve.
5. **Valódi LLM-integráció** a szimulált összefoglaló helyére – csak aggregált adatokkal, adatvédelmi szempontból is.
6. **Egységtesztek** a tiszta domainfüggvényekre és CI-pipeline.

> 🎤 **Előadói jegyzet:** Zárásként: az MVP **validálta a domaint és a felhasználói élményt** minimális infrastruktúrával. A rétegzett felépítés miatt az éles rendszer felé vezető út **bővítés, nem újraírás**.

---

## 8. Melléklet

### 8.1 Élő demó forgatókönyv (~3 perc)

1. **Kezdőlap** (`/hu`) – szavazások listája, nyitott/lezárt státusz.
2. **Szavazás Résztvevőként** – opció kiválasztása → visszaigazolás → KPI-k és diagram frissülnek → AI-összefoglaló „gondolkodik”, majd megjelenik.
3. **Újratöltés** – a szavazat megmaradt, újra szavazni nem lehet.
4. **Nyelvváltás** EN-re ugyanazon az oldalon – az AI-szöveg is angolra vált.
5. **Menedzser szerepkör** – új szavazás létrehozása (validációs hiba bemutatása, majd sikeres mentés).
6. **Szavazás lezárása** – a státusz azonnal „Lezárva”, a szavazás nem elérhető.
7. **Sötét téma** bekapcsolása – egységes megjelenés mindkét témában.

### 8.2 Várható kérdések és rövid válaszok

- **„Miért nincs backend?”** → Az MVP a domaint és az UX-et validálta; a perzisztencia egy cserélhető modulba van zárva.
- **„Biztonságos a szavazás?”** → MVP-szinten nem: a hitelesítés szimulált. Élesben szerveroldali ellenőrzés és adatbázis-megszorítás kell (7. fejezet).
- **„Miért nem valódi LLM?”** → Költség, reprodukálhatóság és tesztelhetőség; az interfész kész a valódi integrációra.
- **„Mitől DDD ez, ha nincsenek osztályok?”** → A DDD a domain fogalmainak és szabályainak pontos modellezése; ezt tiszta függvényekkel és explicit entitáshatárokkal értük el.
- **„Hogyan garantálható, hogy a refaktorok nem törtek el semmit?”** → Az üzleti szabályokat leíró E2E tesztek minden lépés után, mindkét nyelven lefutottak.
