# Google AI Studio – Prompt: FToday-Screen (Android / Kotlin)

> Diesen Block 1:1 in Google AI Studio einfügen. Er beschreibt den FToday-Screen für die
> **Android-App (Kotlin + Jetpack Compose)** und den Aufruf der bereits deployten Cloud
> Functions (Firebase-Projekt `smartplan-777`, Region `europe-west3`).

---

## ROLLE & ZIEL

Du baust den Screen **„FToday"** (Heute-Ansicht) für die FancyPlan **Android-App in Kotlin
mit Jetpack Compose**. Der Screen zeigt die Aktivitäten eines Tages als Liste und füllt
diese Liste **ausschließlich über die bestehende Cloud Function `getTodayActivities`**. Es
wird keine lokale Datenbank und keine eigene Filter-/Sortierlogik gebaut – das Backend
liefert die fertig gefilterte und sortierte Liste.

**Das bestehende Design / Theme der App bleibt unverändert** – verwende die vorhandenen
Farben, Composables, Typografie und Komponenten der App. Nur dieser eine Screen wird
ergänzt und an die Cloud Functions angebunden.

**Alle FToday-Funktionen werden umgesetzt** (siehe Abschnitt „Funktionsumfang").

---

## STACK / VORGABEN

- Kotlin, Jetpack Compose, Material 3.
- Architektur: `FTodayScreen` (Composable) + `FTodayViewModel` (StateFlow für UI-State) +
  `FancyPlanApi` (Retrofit oder Ktor Client) + Repository.
- Networking: Retrofit + kotlinx.serialization (oder Moshi). Coroutines/`suspend`.
- **Auth:** Firebase Authentication ist in der App vorhanden. Hole vor jedem Request das
  ID-Token des eingeloggten Users via `FirebaseAuth.getInstance().currentUser?.getIdToken(false)`
  und sende es als `Authorization: Bearer <token>` (am besten über einen OkHttp-Interceptor).
- Kein API-Key / kein Secret im Client – Identifikation nur über das Firebase-ID-Token.

---

## SCREEN-AUFBAU (von oben nach unten)

1. **Header (TopBar, sticky):**
   - Links: Datums-Navigation – IconButton `‹`, Button „Heute" (nur sichtbar, wenn nicht der
     heutige Tag), IconButton `›`. Daneben das gewählte Datum ausgeschrieben
     (deutsches Format, z. B. „Montag, 8. Juni 2026").
   - Rechts: Suchfeld mit Lupe-Icon, Platzhalter „Aktivitäten suchen…".

2. **Filter-Reihe (3 Dropdowns nebeneinander):**
   - **Bereich** (`AreaName`), **Thema** (`ThemeName`, abhängig vom Bereich),
     **Kategorien** (`Cat`, mehrere durch `;`/`:` getrennte Werte → aufsplitten,
     abhängig von Bereich + Thema). Erste Option jeweils „Alle".
   - Werte aus dem aktuellen `getTodayActivities`-Ergebnis ableiten (alternativ via
     `getRefData`, siehe unten).

3. **Statuszeile:** „X von Y erledigt".

4. **Aktivitäten-Liste** (`LazyColumn`): Karten (siehe „ActCard"). Lade-Spinner während des
   Requests; Leerzustand „Keine Aktivitäten" bzw. „Alles erledigt"; Fehlerzustand.

5. **Footer-Sektion:**
   - 4 Umschalt-Pills: **verschoben**, **erledigt**, **bearbeitete Aktivitäten**, **geplant**.
     Aktiver Modus hervorgehoben; erneutes Tippen schaltet zurück auf `today`.
   - „Von" / „Bis" Datumsfelder (steuern die Zeitspanne für die Modi `bearbeitet` und `geplant`).

---

## ActCard (eine Aktivität)

- **Links:** Titel (`Title`, bei `Sdone == 1` durchgestrichen + gedimmt), darunter Thema
  (`ThemeName`). Aktions-Buttons: **Verschieben**, **Fertigstellen/Erledigt** (toggelt),
  **Löschen**.
- **Rechts:** Reihe mit **P1** (`Prio1`), **P2** (`Prio2`), **Tage**.
  - „Tage" = ganze Tage von heute bis `Pl1End`; kein Datum → „--"; `≤ 0` rot, `== 1` amber, sonst neutral.
  - P1/P2 antippbar → schalten Sortierung (asc/desc) auf das jeweilige Feld.
  - Darunter Status-Badge (`Status`).

---

## FUNKTIONSUMFANG (alle FToday-Funktionen umsetzen)

Jede dieser Aktionen ruft `getTodayActivities` neu auf (oder aktualisiert optimistisch):

- **Initiales Laden** (mode `today`, heutiges Datum).
- **Datum vor/zurück** und **„Heute"** → neues `date`.
- **Modus-Umschaltung** today / verschoben / erledigt / bearbeitet / geplant → `mode`.
- **Von/Bis-Zeitspanne** für `bearbeitet` und `geplant` → `from`/`to`.
- **Suche** (Titel) → `search`.
- **Filter** Bereich/Thema/Kategorie (abhängige Dropdowns) → `area`/`theme`/`cat`.
- **Sortierung** über P1/P2 (asc/desc) → `sortKey`/`sortDir`.
- **„Erledigte anzeigen"**-Umschalter → `showDone`.
- **Fertigstellen / Zurücksetzen** (Karte) → `updateActivity`.
- **Verschieben** (Karte) → `updateActivity`.
- **Löschen** (Karte, Soft-Delete) → `deleteActivity`.
- **Karte/Titel antippen → Detail (FNow)** → `getActivity` (Detail-Screen, zunächst minimal).
- **Statuswechsel** im Detail → `updateActivityStatus` (FCM-Engine läuft serverseitig).
- **Neue Aktivität** (FAB „+") → `createActivity` (origin=mobile), danach Liste neu laden.

> Hinweis: Termine, wiederkehrende Aufgaben und Planvarianten der Desktop-FToday haben
> **noch keine** Cloud-Endpunkte und sind **nicht** Teil dieses Screens (spätere Phase).

---

## CLOUD FUNCTIONS

Alle: `POST`, JSON-Body, Header `Content-Type: application/json` und
`Authorization: Bearer <Firebase ID Token>`. CORS aktiv. Basis-URL:
`https://europe-west3-smartplan-777.cloudfunctions.net/<FunktionsName>`

### `getTodayActivities` – Liste füllen
Request-Body:
```json
{
  "mode": "today",
  "date": "2026-06-08",
  "from": "2026-06-01",
  "to": "2026-06-30",
  "area": "optional",
  "theme": "optional",
  "cat": "optional",
  "search": "optional",
  "showDone": false,
  "sortKey": "Prio1",
  "sortDir": "asc"
}
```
- `mode` ∈ `today` | `verschoben` | `erledigt` | `bearbeitet` | `geplant` (Default `today`).
- `date` für `today`/`erledigt`/`verschoben`; `from`/`to` für `geplant`/`bearbeitet`.
- `sortKey` ∈ `Prio1` | `Prio2`; `sortDir` ∈ `asc` | `desc`.
- Optionale Felder nur senden, wenn gesetzt. Das Backend filtert/sortiert vollständig.

Response:
```json
{
  "ok": true,
  "mode": "today",
  "date": "2026-06-08",
  "count": 1,
  "activities": [
    {
      "id": "firestore-doc-id",
      "localId": 1234,
      "Title": "Angebot finalisieren",
      "ThemeName": "Vertrieb",
      "AreaName": "Arbeit",
      "Cat": "Kunden;Wichtig",
      "Status": "in Bearbeitung",
      "Prio1": 10, "Prio2": 20, "Prio3": null,
      "Sdone": 0, "SToday": 1,
      "Pl1Beg": "2026-06-05", "Pl1End": "2026-06-09",
      "Com": "", "Ltxt1": "", "Ltxt2": ""
    }
  ]
}
```
Felder je Aktivität: `id` (Cloud-Doc-ID, für alle weiteren Calls), `localId`, `Title`, `Com`,
`Ltxt1`, `Ltxt2`, `Prio1`/`Prio2`/`Prio3`, `AreaName`, `ThemeName`, `Cat`, `Status`,
`Sdone`, `SToday`, `SinWork`, `SInfo`, `Sdel`, `Pl1Beg`, `Pl1End`, `ActBeg`, `ActEnd`,
`dateEnd`, `TodayDone`, `TodayEdited`, `ToDayShifted`, `IDActLink`.

Fehler: `{ "ok": false, "message": "...", "error": "..." }` (HTTP 4xx/5xx).

### `updateActivity` – Speichern / Toggle / Verschieben
Body: `{ "id": "<cloud-id>", "fields": { ... } }`
- Erledigt setzen: `{ "Sdone": 1, "SToday": 0, "TodayDone": "<heute YYYY-MM-DD>" }`
- Erledigt zurücksetzen: `{ "Sdone": 0 }`
- Verschieben: `{ "SToday": 0, "ToDayShifted": "<heute>" }`

### `deleteActivity` – Soft-Delete
Body: `{ "id": "<cloud-id>" }` (setzt `Sdel=1`).

### `getActivity` – Detail (FNow)
Body: `{ "id": "<cloud-id>" }` → liefert eine einzelne Aktivität.

### `updateActivityStatus` – Statuswechsel mit FCM-Engine
Body: `{ "id": "<cloud-id>", "status": "<neuer Status>" }`. Status-Automatik läuft
serverseitig – im Client **nicht** nachbauen.

### `createActivity` – Neue Aktivität (mobile)
Body: `{ "Title": "...", "AreaName": "...", "ThemeName": "...", "Cat": "...", "Pl1End": "..." }`
(weitere Felder optional). Legt origin=mobile an.

### `getRefData` – Referenzlisten für Dropdowns (optional)
Body: `{}` → `{ ok, refData: { areas, themes, cats, status, prio1, prio2, prio3 } }`.
Nutzbar, um die Filter-Dropdowns vollständig (auch leere Tage) zu befüllen.

---

## AKZEPTANZKRITERIEN

1. Screen lädt beim Öffnen `getTodayActivities` (mode `today`, heutiges Datum) und zeigt die Karten.
2. **Alle** unter „Funktionsumfang" gelisteten Aktionen sind implementiert und lösen die
   passenden Cloud-Calls aus.
3. Bereich/Thema/Kategorie filtern (abhängige Dropdowns), P1/P2 sortieren.
4. Fertigstellen/Verschieben/Löschen/Neu/Detail/Statuswechsel funktionieren end-to-end.
5. Lade-, Leer- und Fehlerzustände werden sauber dargestellt.
6. Auth ausschließlich über das Firebase-ID-Token (Bearer); kein Key/Secret im Client.
7. Das bestehende App-Design/-Theme bleibt unverändert; nur der neue Screen kommt hinzu.
