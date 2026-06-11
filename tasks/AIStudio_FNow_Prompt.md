# Google AI Studio – Prompt: FNow-Screen (Android / Kotlin)

> Diesen Block 1:1 in Google AI Studio einfügen. Er beschreibt den **FNow-Screen**
> (Aktivitäts-Detail/-Bearbeitung) der FancyPlan **Android-App (Kotlin + Jetpack Compose)**
> und den Aufruf der bereits deployten Cloud Functions (Firebase-Projekt `smartplan-777`,
> Region `europe-west3`).

---

## ROLLE & ZIEL

Du baust den Screen **„FNow"** (Detail-/Bearbeitungsansicht **einer** Aktivität) für die
FancyPlan **Android-App in Kotlin mit Jetpack Compose**. Der Screen wird aus FToday bzw. dem
Aktivitäten-Screen mit einer Aktivitäts-ID geöffnet, lädt die Aktivität **ausschließlich über
die bestehende Cloud Function `getActivity`** und speichert Änderungen über
**`updateActivity`**. Statuswechsel laufen über **`updateActivityStatus`** – die
**Status-Automatik (FCM-Engine) läuft serverseitig** und wird im Client **nicht** nachgebaut.

Es wird **keine lokale Datenbank** und **keine eigene Status-/Prio-/Datums-Logik** gebaut –
das Backend liefert und berechnet alles. Nach jedem Statuswechsel wird die Aktivität neu
geladen, um die serverseitig gesetzten Werte (Prioritäten, Daten, Texte, Kategorie)
anzuzeigen.

**Das bestehende Design / Theme der App bleibt unverändert** – verwende die vorhandenen
Farben, Composables, Typografie und Komponenten. Nur dieser eine Screen wird ergänzt.

---

## STACK / VORGABEN

- Kotlin, Jetpack Compose, Material 3, Navigation Compose (Route `fnow/{activityId}`).
- Architektur: `FNowScreen` (Composable) + `FNowViewModel` (StateFlow für UI-State) +
  gemeinsamer `FancyPlanApi` (Retrofit oder Ktor Client) + Repository.
- Networking: Retrofit + kotlinx.serialization (oder Moshi). Coroutines/`suspend`.
- **Auth:** Firebase-ID-Token via `FirebaseAuth.getInstance().currentUser?.getIdToken(false)`
  als `Authorization: Bearer <token>` (zentral per OkHttp-Interceptor). Kein Key/Secret im Client.
- Basis-URL: `https://europe-west3-smartplan-777.cloudfunctions.net/<Name>`.

---

## SCREEN-AUFBAU (von oben nach unten)

1. **Header (TopBar, sticky):**
   - **Titel-Eingabefeld** (`Title`) – inline editierbar, nimmt die Breite ein.
   - Rechts: **Speichern** (primär), **Abbrechen** (zurück), **Löschen** (Icon, Soft-Delete).
   - „Zurück"/„Abbrechen" navigiert ohne Speichern zurück; „Speichern" schreibt via
     `updateActivity` und navigiert zurück.

2. **Hauptbereich (scrollbar):**
   - **Plan-Zeile** (nur sichtbar wenn `Pl1Beg` gesetzt): „Plan: von – bis", ggf. „Zeit".
   - **Kommentar** (`Com`) – mehrzeiliges Textfeld (Plain-Text).
   - **Text 1** (`Ltxt1`) – mehrzeiliges Notizfeld. Aktion „Datum einfügen" stellt das heutige
     Datum (Format `dd.MM.yyyy`) als neue erste Zeile voran.
   - **Text 2** (`Ltxt2`) – analog zu Text 1.

3. **Status-/Eigenschaften-Bereich** (eigener Abschnitt oder Tab „Status"):
   - **Priorität 1** (`Prio1`) und **Priorität 2** (`Prio2`) als Dropdown
     (Wert + Bezeichnung aus `getRefData` → `prio1`/`prio2`); leer = „—".
   - **Plan von** (`Pl1Beg`) und **Plan bis** (`Pl1End`) als Datumsfelder.
     - Beim Setzen von „Plan von" auf einen Wert nach „Plan bis" wird „Plan bis" mit angehoben.
     - Aktion „auf Heute" für beide Felder (entspricht Desktop-Doppelklick): „Plan von → Heute"
       verschiebt zusätzlich „Plan bis" um die gleiche Intervalllänge, falls es in der
       Vergangenheit lag.
   - **Resttage**: ganze Tage von heute bis `Pl1End`; kein Datum → „—"; `≤ 0` rot, `== 1`
     amber, sonst neutral (read-only Anzeige).
   - **Status** (`Status`) als Dropdown (Werte aus `getRefData` → `status`, gefiltert nach
     Thema sofern vorhanden). **Auswahl löst `updateActivityStatus` aus**, danach `getActivity`
     neu laden → serverseitig veränderte Felder erscheinen.
   - **Bereich** (`AreaName`) → **Thema** (`ThemeName`, abhängig vom Bereich) → **Kategorie**
     (`Cat`, abhängig von Thema). Abhängige Dropdowns; Kategorie zusätzlich frei editierbar
     (mehrere Werte durch `;`/`:` getrennt).

4. **Steuerung** (Abschnitt/Tab „Steuerung"):
   - Checkbox **Heute anzeigen** (`SToday`).
   - Checkbox **Erledigt** (`Sdone`) – beim Aktivieren `SToday=0` und `dateEnd=<heute>`,
     beim Deaktivieren `dateEnd=null`.
   - Checkbox **In Arbeit** (`SinWork`).
   - Checkbox **Aktivität ist Info** (`SInfo`).

---

## FUNKTIONSUMFANG (alle FNow-Kernfunktionen umsetzen)

- **Detail laden** beim Öffnen → `getActivity` (mit `id` aus der Navigation).
- **Referenzlisten laden** für Dropdowns → `getRefData` (Bereiche, Themen, Kategorien, Status,
  Prio1, Prio2).
- **Titel / Kommentar / Text1 / Text2 bearbeiten** → im UI-State, beim Speichern `updateActivity`.
- **Prioritäten / Plan-Daten / Bereich / Thema / Kategorie ändern** → `updateActivity`.
- **Statuswechsel** → `updateActivityStatus` (FCM serverseitig), danach `getActivity` neu laden.
- **Steuerungs-Flags** (`SToday`, `Sdone`, `SinWork`, `SInfo`) → `updateActivity`.
- **Speichern** → `updateActivity` mit allen geänderten Feldern, dann zurück.
- **Löschen** (Soft-Delete) → `deleteActivity`, dann zurück.
- **Lade-, Speicher- und Fehlerzustände** sauber darstellen (Spinner, Snackbar bei Fehlern).

> Hinweis: Die Desktop-FNow-Tabs **Kontakte/Ansprechpartner, Links, Zugeordnet,
> Termine, Timer, Folgeaktivität, Baum-Knoten und das Änderungs-Log** haben **noch keine**
> Cloud-Endpunkte und sind **nicht** Teil dieses Screens (spätere Phase). Dieser Screen
> deckt die über die Cloud synchronisierten Aktivitäts-Felder ab.

---

## CLOUD FUNCTIONS

Alle: `POST`, JSON-Body, Header `Content-Type: application/json` und
`Authorization: Bearer <Firebase ID Token>`. CORS aktiv. Basis-URL:
`https://europe-west3-smartplan-777.cloudfunctions.net/<FunktionsName>`

### `getActivity` – Aktivität laden
Request-Body: `{ "id": "<cloud-id>" }`

Response (eine Aktivität):
```json
{
  "ok": true,
  "activity": {
    "id": "firestore-doc-id",
    "localId": 1234,
    "Title": "Angebot finalisieren",
    "Com": "",
    "Ltxt1": "", "Ltxt2": "",
    "Prio1": 10, "Prio2": 20, "Prio3": null,
    "AreaName": "Arbeit", "ThemeName": "Vertrieb", "Cat": "Kunden;Wichtig",
    "Status": "in Bearbeitung",
    "Sdone": 0, "SToday": 1, "SinWork": 0, "SInfo": 0, "Sdel": 0,
    "Pl1Beg": "2026-06-05", "Pl1End": "2026-06-09",
    "ActBeg": null, "ActEnd": null, "dateEnd": null,
    "TodayDone": null, "TodayEdited": null, "ToDayShifted": null,
    "IDActLink": null
  }
}
```
Felder je Aktivität: `id` (Cloud-Doc-ID, für alle weiteren Calls), `localId`, `Title`, `Com`,
`Ltxt1`, `Ltxt2`, `Prio1`/`Prio2`/`Prio3`, `AreaName`, `ThemeName`, `Cat`, `Status`,
`Sdone`, `SToday`, `SinWork`, `SInfo`, `Sdel`, `Pl1Beg`, `Pl1End`, `ActBeg`, `ActEnd`,
`dateEnd`, `TodayDone`, `TodayEdited`, `ToDayShifted`, `IDActLink`.

Fehler: `{ "ok": false, "message": "...", "error": "..." }` (HTTP 4xx/5xx).

### `updateActivity` – Speichern / Felder ändern
Body: `{ "id": "<cloud-id>", "fields": { ... } }`
- Speichern Hauptfelder: `{ "Title": "...", "Com": "...", "Ltxt1": "...", "Ltxt2": "...",
  "Prio1": 10, "Prio2": 20, "Pl1Beg": "2026-06-05", "Pl1End": "2026-06-09",
  "AreaName": "...", "ThemeName": "...", "Cat": "..." }`
- Erledigt setzen: `{ "Sdone": 1, "SToday": 0, "dateEnd": "<heute YYYY-MM-DD>" }`
- Erledigt zurücksetzen: `{ "Sdone": 0, "dateEnd": null }`
- Heute-Flag: `{ "SToday": 0|1 }`; In-Arbeit: `{ "SinWork": 0|1 }`; Info: `{ "SInfo": 0|1 }`
- Nur tatsächlich geänderte Felder senden. Antwort: `{ "ok": true }` (oder aktualisierte Activity).

### `updateActivityStatus` – Statuswechsel mit FCM-Engine
Body: `{ "id": "<cloud-id>", "status": "<neuer Status>" }`. Die Status-Automatik (Prio-,
Datums-, Text-, Kategorie-Regeln) läuft **serverseitig** – im Client **nicht** nachbauen.
**Nach dem Call `getActivity` neu laden**, um die geänderten Werte anzuzeigen.

### `deleteActivity` – Soft-Delete
Body: `{ "id": "<cloud-id>" }` (setzt `Sdel=1`). Danach zurücknavigieren.

### `getRefData` – Referenzlisten für Dropdowns
Body: `{}` → `{ ok, refData: { areas, themes, cats, status, prio1, prio2, prio3 } }`.
- `areas`: `[{ AreaName }]`
- `themes`: `[{ ThemeName, IDArea }]` (Thema → Bereich-Zuordnung für abhängige Auswahl)
- `cats`: `[{ Cat, CatGrp }]` (`CatGrp` = `ThemeName` für Thema → Kategorie-Filter)
- `status`: `[{ Status }]`
- `prio1` / `prio2` / `prio3`: `[{ value, label }]` (Wert + Bezeichnung fürs Dropdown)

---

## ABHÄNGIGE DROPDOWNS

- **Bereich → Thema:** nur Themen anzeigen, deren `IDArea` zum gewählten Bereich passt
  (oder `IDArea == 0` = global). Bereichswechsel, der das aktuelle Thema ungültig macht,
  setzt das Thema zurück.
- **Thema → Kategorie:** Kategorien anzeigen, deren `CatGrp == ThemeName`. Kategorie bleibt
  zusätzlich frei editierbar (mehrere `;`/`:`-getrennte Werte).

---

## AKZEPTANZKRITERIEN

1. Screen lädt beim Öffnen `getActivity` (per ID) und `getRefData` und zeigt alle Felder.
2. Titel, Kommentar, Text1/Text2, Prioritäten, Plan-Daten, Bereich/Thema/Kategorie und die
   Steuerungs-Flags sind editierbar und werden per `updateActivity` gespeichert.
3. **Statuswechsel** ruft `updateActivityStatus` auf und lädt anschließend die Aktivität neu;
   die serverseitig veränderten Werte erscheinen. Keine FCM-Logik im Client.
4. **Löschen** ruft `deleteActivity` (Soft-Delete) auf und navigiert zurück.
5. Abhängige Dropdowns (Bereich → Thema → Kategorie) funktionieren; Resttage-Anzeige korrekt
   eingefärbt (`≤ 0` rot, `== 1` amber).
6. Lade-, Speicher- und Fehlerzustände werden sauber dargestellt.
7. Auth ausschließlich über das Firebase-ID-Token (Bearer); kein Key/Secret im Client.
8. Das bestehende App-Design/-Theme bleibt unverändert; nur der neue Screen kommt hinzu.
