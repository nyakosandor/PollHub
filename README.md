# PollHub

Kérdőívek és szavazások létrehozására, kitöltésére és kiértékelésére szolgáló webalkalmazás. Next.js, React, Tailwind CSS és Recharts alapokon készült, egyetemi beadandó feladatként.

## Projekt célja

A PollHub MVP (Minimum Viable Product) egy kérdőív teljes életciklusát mutatja be: a menedzser létrehozza és lezárja a kérdőívet, a résztvevő szavaz, az eredmények pedig diagramon és szimulált LLM-összefoglalóban jelennek meg.

Az MVP kizárólag frontend alkalmazás: nincs backendje, adatbázisa és valódi felhasználókezelése. Az állapot a böngészőben, `localStorage`-ban tárolódik, a szerepkörök között pedig egy kapcsolóval lehet váltani. A tartományi modell ugyanakkor úgy épül fel, hogy később backenddel és összetettebb funkciókkal is bővíthető legyen.

## Funkciók

- **Kérdőívlista:** az összes kérdőív megjelenítése címmel, állapottal (nyitott vagy lezárt), szavazatszámmal és opciószámmal.
- **Szerepkörök:** Résztvevő (Participant) és Menedzser (Manager) nézet, a navigációs sávból váltható. A `/manager` oldalról a Résztvevő szerepkör visszakerül a főoldalra.
- **Kérdőív létrehozása (Menedzser):** cím, egy kérdés, legalább két válaszopció és lezárási idő megadása, validációval. A lezárási idő alapértéke a létrehozástól számított 7 nap.
- **Kérdőív azonnali lezárása (Menedzser):** a nyitott kérdőív egy gombbal lezárható.
- **Szavazás (Résztvevő):** egy opció kiválasztása és beküldése, a szabályokat lásd az [Üzleti szabályok](#üzleti-szabályok) fejezetben.
- **Automatikus lezárás:** a lezárási idő elérésekor a megnyitott oldal újratöltés nélkül frissül.
- **Eredmények és adatvizualizáció:**
  - KPI-kártyák: összes szavazat, vezető opció (holtversenyt is kezelve) és hátralévő idő (például „Closes in 2 days”, illetve „Closed”).
  - Reszponzív, rangsorolt sávdiagram Recharts könyvtárral: százalékos feliratok, kiemelt vezető opció és tooltip.
  - Táblázatos nézet, amely a diagram értékeit szövegesen is elérhetővé teszi.
- **AI Insights:** szimulált LLM-összefoglaló az összesített eredményekből.

A felület szövegei angol nyelvűek.

## Architektúra és DDD

### Tartományi modell

Az adatmodell a Domain-Driven Design (DDD) szemléletét követi: a fogalmak külön entitásokba kerültek, és azonosítóval hivatkoznak egymásra. A típusok helye: `src/types/index.ts`.

| Fogalom | Típus | Mezők |
| --- | --- | --- |
| Kérdőív | `Poll` (entitás) | `id`, `title`, `closesAt` |
| Kérdés | `Question` (entitás) | `id`, `pollId`, `text`, `options` |
| Válaszopció | `Option` | `id`, `text` |
| Szavazat | `Vote` (entitás) | `id`, `pollId`, `questionId`, `optionId`, `userId` |

**A kérdőív és a kérdés szétválasztása.** A `Question` önálló entitás, amely a `pollId` mezőn keresztül kapcsolódik a `Poll`-hoz. A modell így több kérdést is képes kezelni egy kérdőíven belül. A felület jelenleg szándékosan egyszerű: a menedzser egy kérdést ad meg, a `PollContext` pedig a háttérben hozza létre a hozzá tartozó `Poll` és `Question` entitást.

**Lezárási idő mint értékobjektum (Value Object).** A korábbi, tárolt `open`/`closed` státuszt a `closesAt` mező váltotta fel, amely Unix-időbélyeg ezredmásodpercben. A státuszt nem tároljuk, hanem minden alkalommal ebből számítjuk:

```ts
export function isClosed(closesAt: number, now: number) {
  return now > closesAt;
}
```

Így a tárolt állapot és a valós idő nem kerülhet ellentmondásba, és a kézi lezárás sem igényel külön állapotot: a művelet a `closesAt` értékét az aktuális időre állítja. Az értékobjektum szemlélete könnyített formában jelenik meg: az érték egy `number` típusú mező, a hozzá tartozó logikát pedig tiszta függvények adják a `src/lib/closingTime.ts` fájlban, nem külön osztály.

### Állapotkezelés

- **React Context (`src/context/PollContext.tsx`):** az alkalmazás állapotának egyetlen forrása. Külön tömbökben kezeli a `polls`, `questions` és `votes` adatokat, és itt futnak a tartományi műveletek (`createPoll`, `closePoll`, `castVote`). Egy időzítő a következő lezárási időpontban frissíti a nézeteket.
- **`localStorage` (`src/lib/storage.ts`):** az állapot perzisztenciája a `pollhub_state_v2` kulcs alatt. Az oldal újratöltése után az adatok megmaradnak, de csak az adott böngészőben.

### Könyvtárszerkezet

```text
src/
  app/          Oldalak: főoldal, /manager, /polls/[id]
  components/   Felületi komponensek (űrlapok, KPI-kártyák, diagram, AI Insights)
  context/      PollContext: állapot és tartományi műveletek
  lib/          Tiszta segédfüggvények és hookok (lezárási idő, eredmények, összefoglaló, tárolás)
  types/        Tartományi típusok
e2e/            Playwright end-to-end tesztek
```

## Üzleti szabályok

A szabályokat a `PollContext` `castVote` művelete érvényesíti, így nem csak a felületen múlnak: a tiltott szavazat akkor sem kerül be az állapotba, ha a felület valamiért felkínálná a lehetőséget.

**Egy felhasználó, egy szavazat.** Szavazás előtt a rendszer ellenőrzi, hogy az adott `userId` adott-e már le szavazatot. Az ellenőrzés jelenleg kérdőívszinten történik (`pollId` és `userId` alapján). Mivel egy kérdőívhez most egy kérdés tartozik, ez a gyakorlatban a „felhasználónként és kérdésenként egy szavazat” szabályt valósítja meg. A több kérdéses kérdőívekhez az ellenőrzést `questionId` szintre kell majd átállítani; a `Vote` entitás ehhez már tartalmazza a szükséges mezőt.

**Lezárt kérdőívre nem lehet szavazni.** A `castVote` a szavazás pillanatában az aktuális idővel ellenőrzi a `closesAt` értéket, ezért a határidő után beküldött szavazat akkor is elutasításra kerül, ha a felület még nem frissült. Lezárt kérdőívnél a szavazóűrlap helyett tájékoztató üzenet jelenik meg, az eredmények viszont továbbra is láthatók.

**További szabályok.** Létrehozáskor kötelező a cím, a kérdés és legalább két válaszopció, a lezárási időnek pedig a jövőben kell lennie. A kézi lezárás soha nem tolja későbbre a már elmúlt lezárási időt.

**Az MVP korlátai.** Mivel nincs backend és hitelesítés, a szabályok csak a kliensen érvényesülnek. A résztvevő egy rögzített, szimulált azonosító (`participant-1`), a szerepkörváltás nem jogosultságkezelés, és a `localStorage` tartalma a böngészőből módosítható. Éles rendszerben ezeket az ellenőrzéseket szerveroldalon kell elvégezni.

## LLM szimuláció (AI Insights)

A specifikáció szerint az LLM-összefoglaló **„kizárólag összesített, fiktív válaszokból”** készülhet. Az MVP ezt valódi LLM-hívás nélkül, teljesen kliensoldalon teljesíti, így nincs szükség külső szolgáltatásra, API-kulcsra vagy hálózati kapcsolatra.

- **Csak összesített adat:** a `src/lib/insights.ts` fájl `buildInsightSummary` függvénye opciónkénti szavazatszámokat és az összes szavazat számát kapja meg. Egyedi szavazatokhoz és felhasználói azonosítókhoz nem fér hozzá.
- **Fiktív adatok:** a minta-szavazatok kitaláltak, a felület pedig jelzi, hogy az összefoglaló szimulált, fiktív válaszokra épül.
- **Dinamikus generálás:** a szöveg nem rögzített, hanem az aktuális eredményekből áll össze. Figyelembe veszi a vezető opciót és annak részesedését, a második helyezettől való különbséget, a holtversenyt, a szavazat nélküli állapotot és a kis mintaméretet. Azonos eredményekhez azonos szöveg tartozik.
- **Szimulált API-késleltetés:** az eredménynézet megnyitásakor 2 másodpercig pulzáló „Generating AI insights...” töltési állapot látszik (`setTimeout`), csak utána jelenik meg a szöveg. Új szavazat után a folyamat újraindul.

A logika egy önálló függvényben van, ezért később valódi LLM API-hívásra cserélhető.

## Futtatás

Előfeltétel: Node.js és npm. Telepítés és fejlesztői szerver indítása:

```bash
npm install
npm run dev
```

Az alkalmazás ezután a <http://localhost:3000> címen érhető el.

### Tesztek

Az end-to-end tesztek Playwrighttal futnak. Az első futtatás előtt telepíteni kell a böngészőt:

```bash
npx playwright install chromium
npm run test:e2e
```

A parancs elkészíti a production buildet, elindítja az alkalmazást a 3100-as porton, és lefuttatja az `e2e/polls.spec.ts` tesztjeit.
