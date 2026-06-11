# Google AI Studio – Prompt: Aktivitäten-Screen / FactLst (Android / Kotlin)

> Diesen Block 1:1 in Google AI Studio einfügen. Er beschreibt den **Aktivitäten-Screen**
> (Form „FactLst") der FancyPlan Mobile App (Kotlin + Jetpack Compose) und den Aufruf der
> bereits deployten Cloud Functions (Firebase-Projekt `smartplan-777`, Region `europe-west3`).

---

## ROLLE & ZIEL

Du baust den Screen **„Aktivitäten"** (Form „FactLst") für die FancyPlan **Android-App
(Kotlin + Jetpack Compose)**. Der Screen ist eine **durchsuch- und filterbare Liste aller
Aktivitäten** des Nutzers. Die Daten kommen **ausschließlich über die bestehenden Cloud
Functions** – keine lokale Datenbank, keine eigene Geschäftslogik für Status/Automatik.

**Das bestehende Design / Theme der App bleibt unverändert** – verwende vorhandene Farben,
Composables, Typografie und Komponenten. Nur dieser Screen wird ergänzt.

**Oben rechts** befindet sich ein **„Zurück"-Button**, der zum **Dashboard** navigiert
(gleiches Muster wie FToday).

---

## STACK / VORGABEN

- Kotlin, Jetpack Compose, Material 3, Navigation Compose (Route `activities`).
- Architektur: `ActivitiesScreen` (Composable) + `ActivitiesViewModel` (StateFlow) +
  gemeinsamer `FancyPlanApi` (Retrofit/Ktor) + Repository.
- **Auth:** Firebase-ID-Token via `FirebaseAuth.getInstance().currentUser?.getIdToken(false)`
  als `Authorization: Bearer <token>` (zentral per OkHttp-Interceptor). Kein Key/Secret im Client.
- Basis-URL: `https://europe-west3-smartplan-777.cloudfunctions.net/<Name>`.

---

## SCREEN-AUFBAU

1. **TopBar:** Titel „Aktivitäten". **Rechts:** „Zurück"-Button → `dashboard`.
2. **Toolbar:**
   - **Suchfeld** (Titel/Inhalt), mit Debounce (~300 ms), Löschen-Icon.
   - **Status-Umschalter** (Segmented): **Offen** | **Alle** | **Erledigt**.
   - **Anzahl** der Treffer („X Einträge").
   - **Ansichts-Umschalter:** **Tabelle** | **Liste**.
   - **Neu** (Button „+") → neue Aktivität.
   - **Löschen** (nur sichtbar bei Auswahl) → markierte löschen.
3. **Filter** (z. B. ausklappbares Panel oder Bottom-Sheet, mobilgerecht):
   - **Bereich → Thema → Kategorie** (abhängige Auswahl; Kategorie kann mehrere durch `;`/`:`
     getrennte Werte enthalten – aufsplitten).
   - **„Plan ab Datum"** (nur Aktivitäten mit `Pl1Beg ≥ Datum`).
   - **Aktive Filter** als entfernbare Chips anzeigen; „Alle Filter löschen".
4. **Inhalt:**
   - **Liste-Ansicht:** je Zeile Titel + Bereich · Thema, rechts P1/P2, Status-Badge, „Tage".
   - **Tabelle-Ansicht:** Spalten **Titel · P1 · P2 · Status · Tage**, Spaltenköpfe sortierbar
     (auf/ab). Erledigte Zeilen gedimmt.
   - **Mehrfachauswahl** per Checkbox (inkl. „alle auswählen" im Tabellenkopf) für Bulk-Löschen.
   - Lade-/Leer-/Fehlerzustände sauber darstellen.
5. **Detail:** Tippen auf eine Zeile öffnet den **FNow-Detail-Screen** (`getActivity`).

### „Tage"-Logik
„Tage" = ganze Tage von heute bis `Pl1End`; kein Datum → „—"; `≤ 0` rot, `== 1` amber, sonst neutral.

### Status-Farben (anhand `Status`-Text, case-insensitive)
„arbeit/aktiv" → Primär · „warte" → Tertiär · „erledigt" → Sekundär · „info" → Primär ·
„neu" → Tertiär · sonst neutral.

---

## FUNKTIONSUMFANG (alle FactLst-Funktionen umsetzen)

- **Laden / Aktualisieren** der Liste (siehe Datenquelle unten).
- **Suche** (Debounce) → `search`.
- **Status-Filter** Offen/Alle/Erledigt.
- **Bereich/Thema/Kategorie**-Filter (abhängig) + **„Plan ab Datum"**.
- **Sortierung** über Spaltenköpfe: Titel, P1, P2, Status, Tage (asc/desc).
- **Ansicht** Tabelle ↔ Liste.
- **Mehrfachauswahl** + **Bulk-Löschen** (mit Bestätigungsdialog) → je `deleteActivity`.
- **Neu anlegen** („+") → `createActivity`, danach Detail (FNow) öffnen / Liste neu laden.
- **Detail öffnen** (Zeile) → `getActivity`.
- **Speichern / Statuswechsel** im Detail → `updateActivity` / `updateActivityStatus`.
- **Zurück** (oben rechts) → `dashboard`.

> CSV-Export der Desktop-Version ist auf Mobile **nicht** Teil dieses Screens (optional, spätere Phase).

---

## DATENQUELLE (Cloud Functions)

Alle: `POST`, JSON-Body, `Content-Type: application/json`, `Authorization: Bearer <ID-Token>`.

### Liste laden – `getActivities`
Der Aktivitäten-Screen nutzt den **dedizierten** Listen-Endpoint `getActivities` (volle,
**datum­unabhängige** Liste – 1:1-Gegenstück zur Desktop-FactLst). Das Backend übernimmt
**Filtern und vollständige Sortierung** (inkl. `Status`/`Tage`/`Titel`):
```json
{
  "search": "optional",
  "area": "optional",
  "theme": "optional",
  "cat": "optional",
  "doneFilter": "open",
  "planFrom": "2026-01-01",
  "sortKey": "Prio1",
  "sortDir": "asc"
}
```
- `doneFilter` ∈ `open` | `done` | `all` (Default `open`) – direkt der Status-Umschalter.
- `search` durchsucht **Titel, Thema, Bereich und Inhalt (Com)** (wie die Desktop-Suche).
- `planFrom` = „Plan ab Datum" (nur Aktivitäten mit `Pl1Beg ≥ planFrom`).
- `sortKey` ∈ `Title` | `Prio1` | `Prio2` | `Status` | `Tage`; `sortDir` ∈ `asc` | `desc`.
  „Tage" wird serverseitig aus `Pl1End` vs. heute berechnet (kein Datum → sortiert ans Ende).
- Optionale Felder nur senden, wenn gesetzt.
- Response: `{ ok, count, activities: [ … ] }` – Felder je Aktivität wie im FToday-Prompt
  (`id` = Cloud-Doc-ID, `localId`, `Title`, `Com`, `Prio1/2/3`, `AreaName`, `ThemeName`,
  `Cat`, `Status`, `Sdone`, `Pl1Beg`, `Pl1End`, …). Basis: nur nicht gelöschte (`Sdel != 1`).

### Aktionen
- **Neu:** `createActivity` – Body `{ "Title": "", "Sdone": 0 }` (weitere Felder optional).
- **Detail:** `getActivity` – `{ "id": "<cloud-id>" }`.
- **Speichern:** `updateActivity` – `{ "id": "<cloud-id>", "fields": { … } }`.
- **Statuswechsel:** `updateActivityStatus` – `{ "id": "<cloud-id>", "status": "<neuer Status>" }`
  (FCM-Engine läuft serverseitig).
- **Löschen (Soft):** `deleteActivity` – `{ "id": "<cloud-id>" }`.
- **Dropdown-Referenzwerte** (Bereich/Thema/Kategorie/Status) optional via `getRefData` (`{}`).

---

## AKZEPTANZKRITERIEN

1. Screen lädt beim Öffnen die Aktivitätenliste über `getActivities`.
2. Suche, Status-Filter, Bereich/Thema/Kategorie, „Plan ab Datum" und Spalten-Sortierung wirken.
3. Tabelle ↔ Liste umschaltbar; erledigte Einträge gedimmt.
4. Mehrfachauswahl + Bulk-Löschen (mit Bestätigung) funktioniert.
5. Neu/Detail/Speichern/Statuswechsel/Löschen laufen end-to-end über die Cloud Functions.
6. „Zurück" oben rechts navigiert zum Dashboard.
7. Auth ausschließlich über das Firebase-ID-Token; kein Key/Secret im Client.
8. Das bestehende App-Design/-Theme bleibt unverändert.
