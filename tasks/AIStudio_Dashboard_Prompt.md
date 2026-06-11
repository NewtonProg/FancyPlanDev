# Google AI Studio – Prompt: Dashboard & Navigation (Android / Kotlin)

> Diesen Block 1:1 in Google AI Studio einfügen. Er beschreibt das **Dashboard**
> (Navigations-Hub) und den **App-Flow** der FancyPlan Mobile App (Kotlin + Jetpack
> Compose). Der FToday-Screen wird in einem separaten Prompt definiert.

---

## ROLLE & ZIEL

Du baust den **Navigations-Rahmen** der FancyPlan **Android-App (Kotlin + Jetpack Compose)**
mit einem **Dashboard** als zentralem Einstiegspunkt zu den Formularen ("Forms").

**Das bestehende Design / Theme der App bleibt unverändert** – verwende vorhandene Farben,
Composables, Typografie und Komponenten. Es wird nur die Navigation + das Dashboard ergänzt.

---

## APP-FLOW (Navigation)

Verwende **Navigation Compose** mit folgenden Routen: `login`, `dashboard`, `ftoday`, `activities`.

1. **Start / Auth:** Ist kein Firebase-User eingeloggt → `login`. Nach erfolgreichem Login
   wird **direkt `ftoday` (FToday)** angezeigt – **nicht** das Dashboard.
2. **FToday → Dashboard:** Im FToday-Screen gibt es **oben rechts einen „Zurück"-Button**
   (IconButton, z. B. `arrow_back` oder `apps`/`grid_view`). Antippen navigiert zum
   **`dashboard`**.
3. **Dashboard:** zeigt die verfügbaren Formulare als Kacheln/Liste. **Aktuell nur drei
   Einträge:**
   - **Heute** → navigiert zu `ftoday`.
   - **Aktivitäten** → navigiert zu `activities`.
   - **Abmelden** (Logoff) → Firebase-Logout, danach zurück zu `login`.
4. **Zurück-Verhalten:** Aus `ftoday`/`activities` führt der Geräte-Zurück-Button bzw. ein
   TopBar-Zurück zum `dashboard`; aus dem `dashboard` zurück beendet die App (oder bleibt auf
   dem Dashboard – kein Sprung zurück in `login`, solange eingeloggt).

---

## DASHBOARD-SCREEN

- **TopBar:** App-Titel/Logo (z. B. „FancyPlan"). Kein Zurück-Button auf dem Dashboard selbst.
- **Inhalt:** drei große, gut antippbare Kacheln (oder Listeneinträge) mit Icon + Label,
  im bestehenden App-Stil:
  - **Heute** – Icon `today` → Route `ftoday`.
  - **Aktivitäten** – Icon `list` / `checklist` → Route `activities`.
  - **Abmelden** – Icon `logout` → Logoff (siehe unten); optisch als Aktion abgesetzt
    (z. B. unten oder farblich dezenter).
- Erweiterbar gehalten: später kommen weitere Formulare als zusätzliche Kacheln hinzu.

### Abmelden (Logoff)
- `FirebaseAuth.getInstance().signOut()` aufrufen.
- Lokal zwischengespeicherte Tokens/States löschen.
- Navigation: `navController.navigate("login")` und den Back-Stack leeren
  (`popUpTo(0) { inclusive = true }`), damit man nicht per Zurück wieder eingeloggt landet.
- Kein eigener Cloud-Function-Aufruf nötig – Logoff ist rein clientseitig (Firebase Auth).

---

## ZIEL-SCREENS (Kurz – Details in separaten Prompts)

- **`ftoday` (Heute):** FToday-Screen – Heute-Liste der Aktivitäten. Lädt seine Daten über
  die Cloud Function `getTodayActivities` (siehe separater FToday-Prompt). **Oben rechts der
  „Zurück"-Button → `dashboard`.**
- **`activities` (Aktivitäten):** Listenansicht aller Aktivitäten (Form „FactLst"). Lädt
  seine Daten ebenfalls über `getTodayActivities` (z. B. mit Modus/Filtern/Suche, ohne
  Tagesbindung) und nutzt die gleichen Aktions-Funktionen (`updateActivity`,
  `updateActivityStatus`, `deleteActivity`, `getActivity`, `createActivity`). **Oben rechts
  der „Zurück"-Button → `dashboard`.** (Detaillierter Screen-Aufbau in eigenem Prompt;
  hier nur als Navigationsziel anlegen – ein einfacher Platzhalter genügt zunächst.)

---

## AUTH (gemeinsam für alle Cloud-Calls)

- Firebase Authentication ist in der App vorhanden. Vor jedem Cloud-Request das ID-Token via
  `FirebaseAuth.getInstance().currentUser?.getIdToken(false)` holen und als
  `Authorization: Bearer <token>` senden (am besten zentral per OkHttp-Interceptor).
- Basis-URL der Cloud Functions: `https://europe-west3-smartplan-777.cloudfunctions.net/<Name>`.
- Kein API-Key / Secret im Client – Identifikation ausschließlich über das Firebase-ID-Token.

---

## STACK / VORGABEN

- Kotlin, Jetpack Compose, Material 3, Navigation Compose.
- Architektur: `MainActivity` mit `NavHost`, je Screen ein Composable + ViewModel
  (StateFlow für UI-State).
- Firebase Auth für Login/Logout; Retrofit/Ktor + Coroutines für die Cloud-Calls.

---

## AKZEPTANZKRITERIEN

1. Nach Login wird **direkt FToday** angezeigt (nicht das Dashboard).
2. Der „Zurück"-Button oben rechts in FToday öffnet das **Dashboard**.
3. Das Dashboard enthält **genau** die drei Einträge **Heute**, **Aktivitäten**, **Abmelden**.
4. „Heute" → FToday, „Aktivitäten" → Aktivitäten-Screen, „Abmelden" → Firebase-Logout +
   zurück zum Login mit geleertem Back-Stack.
5. Das bestehende App-Design/-Theme bleibt unverändert; nur Navigation + Dashboard kommen hinzu.
