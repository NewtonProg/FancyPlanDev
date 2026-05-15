# FancyPlan — Feature-Tracking

**Statussymbole:** 🔲 offen | ⏳ in Arbeit | ✅ erledigt | 🚫 zurückgestellt

---

## Entwicklungsstufen-Konzept

| Stufe | Bedeutung | Beispiel |
|-------|-----------|---------|
| **Stufe 1** | Built-in / hartverdrahtet — direkt in der App implementiert, kein Benutzer-Customizing möglich | Hilfe-Button öffnet fest hinterlegte .docx-Datei |
| **Stufe 2** | Benutzerkonfigurierbar — Anwender kann das Feature über FCM / Customizing selbst anpassen | Anwender verknüpft eigene Hilfedatei per FCMBtn; Anwender ändert Labels und Button-Texte |

Features ohne Stufen-Kennzeichnung sind Stufe 1. Stufe-2-Features setzen eine VIP-Lizenz und das FCM-Modul (Phase 11) voraus. Welche weiteren Features in Stufe 2 wandern, wird laufend ergänzt.

---

## Phase 0 — Projektsetup

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| P0-01 | Electron-App mit React, TypeScript und Vite aufsetzen | package.json, tsconfig, electron.vite.config | Hoch | ✅ |
| P0-02 | Apple-HIG-Design: Farben, Fonts, Schatten, abgerundete Ecken | Tailwind CSS + custom Apple-Theme (tailwind.config.js) | Hoch | ✅ |
| P0-03 | App-Shell: Sidebar-Navigation + Content-Bereich | Sidebar: Heute, Prioritäten, Aktivitäten, Kontakte, Baumstruktur, Mail, Kalender | Hoch | ✅ |
| P0-04 | Feature-Tracking-System für die Migration | tasks/FEATURES.md + tasks/current-task.md | Hoch | ✅ |
| P0-05 | Build-Konfiguration für Windows, macOS und Linux | electron-builder: NSIS (.exe), DMG (.dmg), AppImage | Mittel | ✅ |

---

## Phase 1 — Datenschicht (SQLite)

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| D1-01 | Lokale SQLite-Datenbank in der Electron-App | better-sqlite3 v12; src/main/db/database.ts | Hoch | ✅ |
| D1-02 | Renderer (React) greift sicher auf die DB zu | IPC-Bridge: ipcMain/ipcRenderer/contextBridge; src/preload/index.ts | Hoch | ✅ |
| D1-03 | Tabelle für alle Aktivitäten (173 Felder aus Access) | TAct — Kernentität der App | Hoch | ✅ |
| D1-04 | Tabellen für Prioritäts-Definitionen | TPrio1, TPrio2, TPrio3 — definieren Prio-Texte je Bereich | Hoch | ✅ |
| D1-05 | Tabelle für Kontakte / Telefonbuch (99 Felder) | TTel — Name, Adresse, Telefon, E-Mail, Social | Hoch | ✅ |
| D1-06 | Referenz-Tabellen für Bereiche, Themen, Kategorien | TArea, TTheme, TCat, TGroup1 | Hoch | ✅ |
| D1-07 | Tabelle für die Baumstruktur-Navigation | TTree — hierarchische Knoten mit Materialized Path | Mittel | ✅ |
| D1-08 | Tabellen für Mail-Cache und App-Einstellungen | TMailReceive (IMAP-Cache), TSettings (Key/Value), TCalendar (CalDAV-Cache) | Mittel | ✅ |
| D1-09 | Bestehende Access-Daten in SQLite importieren | mdb-reader liest .accdb; migrationHandlers.ts; ImportView.tsx | Hoch | ✅ |

---

## Phase 2 — Kernformulare (Tagesplanung)

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F2-01 | Tagesansicht: Aktivitäten des aktuellen Tages als Liste | TodayView.tsx — SToday-Filter, Datum-Navigation, Plandatum-Balken | Hoch | ✅ |
| F2-02 | Aktivität öffnen und bearbeiten (Vollformular) | FNowModal.tsx — Tabs: Status, Control, Info, Protokoll | Hoch | ⏳ |
| F2-02g | Status-Dropdown themenabhängig — zeigt nur Status die zum gewählten Thema passen | TStatus.IDTheme: 0=alle Themen, sonst FK→TTheme.id; FNowModal filtert `visibleStatuses` reaktiv nach ThemeName→id; dbHandlers: `IDFormName=? OR IDFormName='*'`; StatusEditor in FCMValueView mit Thema-Dropdown beim Anlegen/Bearbeiten | Hoch | ✅ |
| F2-02h | Kategorie-Picker FdlgCat — Mehrfachauswahl per Doppelklick | FdlgCatModal.tsx: alle TCat-Einträge als Chips gruppiert nach CatGrp; bereits im Feld enthaltene Kategorien (Colon-getrennt) erscheinen aktiv (blau); Klick togglet; OK schreibt `:` getrennten String zurück ins Cat-Feld | Hoch | ✅ |
| F2-02i | HTML-Tags in migrierten Textfeldern bereinigt | stripHtml() in FNowModal: Com/Ltxt1/Ltxt2 werden beim Laden von `<font>`/`<div>`/`&nbsp;` bereinigt; ActivitiesView-Vorschau ebenfalls stripHtml | Mittel | ✅ |
| F2-02a | Aktivität als erledigt markieren setzt "Heute" automatisch zurück | Sdone=1 → SToday=0 in handleToggleDone | Hoch | ✅ |
| F2-02b | Tagesansicht nach Aufgaben / Infos / Alles filtern | SInfo-Flag, Toggle-Buttons in TodayView | Hoch | ✅ |
| F2-02c | Baumknoten einer Aktivität per Picker zuweisen | PSPName-Feld mit ↗-Button → TreePickerModal (Doppelklick oder Button) | Mittel | ✅ |
| F2-02d | "Zugeordnet"-Tab: Person, Abteilung, PSP-Nr dynamisch | Wartet auf Customizing-Konzept (TTel-Lookup) | Mittel | 🔲 |
| F2-02e | Änderungen an einer Aktivität protokollieren | TAct_Log — jede Feldänderung bei SDetailStat=1 | Mittel | ✅ |
| F2-02f | Protokolle löschen (alle oder gezielt pro Aktivität) | deleteByAct + deleteAll IPC-Handler | Niedrig | ✅ |
| F2-03 | Periodenplanung (Woche/Monat vorausplanen) | zurückgestellt — Ersatz durch Planvarianten (F2-05) | Mittel | 🚫 |
| F2-04 | In der Tagesansicht vor/zurück durch Tage navigieren | Datum-Pfeile in TodayView, Datum-Filter auf ActBeg | Hoch | ✅ |
| F2-05 | Wiederkehrende Tages-Sets als benannte Variante speichern | TPlanVariant + TPlanVariantItem; speichern + laden in TodayView | Hoch | ✅ |

---

## Phase 3 — Prioritätslisten

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F3-01 | Prioritätsliste anzeigen (alle Aktivitäten mit Prio-Wert) | PrioritiesView.tsx — gruppiert nach Bereich | Hoch | ✅ |
| F3-02 | Neue Priorität anlegen oder bestehende bearbeiten | Doppelklick → FNowModal; Neu-Button | Hoch | ✅ |
| F3-03 | Erledigte Prioritäten archivieren und ausblenden | Sdone-Toggle + Archiv-Filter | Mittel | ✅ |
| F3-04 | Liste nach Bereich, Typ (Action/Info) und Datum filtern | Filter-Buttons + Sortierung in PrioritiesView | Mittel | ✅ |

---

## Phase 4 — Baumstruktur-Navigation

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F4-01 | Hierarchischen Projektbaum (PSP) anzeigen | TreeView.tsx — Collapse/Expand, Kontextmenü | Hoch | ✅ |
| F4-02 | Baumknoten erstellen, umbenennen, löschen | Inline-Rename, Kontextmenü, + Root-Button | Hoch | ✅ |
| F4-03 | Knoten per Drag & Drop in einen anderen Knoten verschieben | HTML5 draggable; tree.move IPC; blauer Drag-Over-Rahmen | Mittel | ✅ |
| F4-04 | Aktivitäten eines Knotens als Liste und Gantt-Timeline anzeigen | TAct-Lookup über PSPName; Timeline-Balken (Pl1/Pl2) | Mittel | ✅ |
| F4-05 | Knoten kann auf einen anderen Teilbaum verweisen (Cross-Ref) | IDTreeRef-Feld; Klick springt zum referenzierten Knoten | Mittel | ✅ |

---

## Phase 5 — Kontakte & Aktivitäten

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F5-01 | Kontakte suchen (Name, Firma, E-Mail) | ContactsView.tsx — Suchfeld + Alphabet-Filter | Hoch | ✅ |
| F5-02 | Kontakt-Detailansicht anzeigen und bearbeiten | Zweispaltig: Adresse/Firma links, Telefon/E-Mail/Web rechts | Hoch | ✅ |
| F5-02a | Links (Web, Mail, Datei, Social) pro Kontakt oder Baumknoten verwalten | TLinks-Tabelle (entity_type+id); LinkPanel.tsx; Klick öffnet extern | Hoch | ✅ |
| F5-02b | Vollständige Kontakt-Detailansicht (alle Felder aus FTel-1 + FTel-2) | Alle 99 TTel-Felder in ContactsView; Checkboxes für IMAP/Sender | Mittel | ✅ |
| F5-03 | Aktivitäten suchen (Volltext über alle Felder) | ActivitiesView.tsx — Suchfeld, Bereich-Filter, Erledigt-Filter | Hoch | ✅ |
| F5-04 | Aktivitäten-Liste mit Prio, Status, Datum | Tabelle mit Doppelklick → FNowModal | Hoch | ✅ |
| F5-06 | Kompakte Aktivitätsliste (FactLst1) — Listenansicht mit Einzelklick | ActivitiesView.tsx — Toggle ⊟ Tabelle / ☰ Liste; Einzelklick → FNowModal | Hoch | ✅ |
| F5-05 | Akquisition-Modul: Firmen + Kontakte per Copy-Paste erfassen, BCC-Mailliste generieren | AcquisitionView.tsx — Alphabet-Navigation, Firmenauswahl, Schnell-Email-Erfassung, Detail-Editor (EMail, WWW, Mobil, Tel, Land, Gruppe, Prio, Quelle, Notizen); Detail-Panel rechts | Niedrig | ✅ |
| F5-05a | Mail-Liste generieren: alle Adressen der Firma dedupliziert in Clipboard kopieren (BCC-ready, Semikolon-getrennt); Toast zeigt Anzahl kopierter Adressen | AcquisitionView.tsx — handleBccCopy, Set-Deduplizierung, Toast-State | Niedrig | ✅ |

---

## Phase 6 — Mail-Integration

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F6-01 | Mail-Zugang mit App-Passwort konfigurieren (kein OAuth) | IMAP + SMTP; jeder Anbieter; kein Google-App-Review nötig | Hoch | ✅ |
| F6-02 | Posteingang anzeigen: Liste + E-Mail-Inhalt lesen | MailView.tsx — Inbox-Liste links, Detail/iframe rechts | Hoch | ✅ |
| F6-03 | E-Mail verfassen und senden | ComposePanel: An, CC, Betreff, Body → nodemailer SMTP | Hoch | ✅ |
| F6-04 | Neue Nachrichten vom IMAP-Server abrufen (Sync) | imapflow: fetch envelope, Body on-demand via mailparser | Hoch | ✅ |
| F6-05 | E-Mail-Anhänge herunterladen | IMAP BODYSTRUCTURE — noch nicht implementiert | Mittel | 🔲 |
| F6-06 | IMAP/SMTP-Zugangsdaten in der App konfigurieren | SettingsView.tsx — Gmail/Outlook-Preset, Test-Button | Hoch | ✅ |

---

## Phase 7 — Kalender-Integration

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F7-01 | Kalender via CalDAV verbinden (iCloud, Nextcloud, Radicale, …) | tsdav + App-Passwort; kein Google-OAuth nötig | Mittel | ✅ |
| F7-02 | Monatskalender mit Terminen anzeigen | CalendarView.tsx — 7-Spalten-Raster, Terminpunkte, Tagesansicht rechts | Mittel | ✅ |
| F7-03 | Neuen Termin erstellen (Titel, Datum, Zeit, Ort, Notiz) | NewEventModal → lokal + CalDAV-Push | Mittel | ✅ |
| F7-04 | Termine vom CalDAV-Server synchronisieren | tsdav fetchCalendarObjects → node-ical parse → TCalendar SQLite-Cache | Mittel | ✅ |
| F7-05 | Termin löschen | Lokal + CalDAV DELETE | Niedrig | ✅ |
| F7-06 | Google Calendar verbinden (OAuth2, kein App-Review nötig) | googleCalHandlers.ts — loopback OAuth2-Server, googleapis, Sync in TCalendar (source=gcal); SettingsView: Client-ID/Secret + Verbinden-Flow | Hoch | ✅ |

### Architektur-Entscheidungen Terminplanung (beschlossen 2026-05-07)

- **TAct bleibt datumsorientiert** (Planbeginn/PlanEnde ohne Uhrzeit) — keine Uhrzeiten in TAct
- **TTermin** = eigene Tabelle für Besprechungen/Kalender-Termine mit Uhrzeit; Felder: `id, title, date, time_start, time_end, calendar_uid, calendar_source (google|caldav), act_id (FK→TAct nullable)`
- **Kein FTermin-Formular** — CalendarView ist die primäre Termin-Verwaltung
- **FToday** zeigt heutige TTermin-Einträge mit Uhrzeit — nur wenn vorhanden
- **FNowModal** bekommt Tab "Termine" — zeigt verknüpfte TTermin-Einträge zur Aktivität
- **Periodische Kalender-Termine** (RRULE) kommen expandiert aus Google/CalDAV — FancyPlan berechnet nichts selbst
- **Periodische FancyPlan-Aufgaben** (TRecurring) sind kalenderunabhängig — Funktion `isDueToday()` prüft tägliche Fälligkeit
- **Keine Teilnehmer in TTermin** — Teilnehmer stehen immer in der externen Kalender-Einladung

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F7-07 | TTermin — Tabelle + IPC-Handler | Schema: TTermin (id, title, date, time_start, time_end, calendar_uid, calendar_source, act_id); terminHandlers.ts: CRUD + getByDate(date) + getByAct(actId); Preload-Bridge | Hoch | 🔲 |
| F7-08 | FToday — heutige Termine anzeigen | FToday liest TTermin für today via getByDate(); zeigt Uhrzeit + Titel kompakt; nur wenn Einträge vorhanden; oberhalb der Aufgabenliste | Mittel | 🔲 |
| F7-09 | FNowModal — Tab "Termine" (Aktivitäts-Bezug) | Neuer Tab in FNowModal: Liste verknüpfter TTermin-Einträge (Datum, Uhrzeit, Betreff); verknüpfen/trennen per act_id | Mittel | 🔲 |
| F7-10 | Kalender-Sync schreibt in TTermin | CalDAV + Google Sync: eingehende Events → TTermin anlegen/updaten (calendar_uid als Dedup-Key); periodische Termine werden durch Kalender-RRULE expandiert | Hoch | 🔲 |
| F7-11 | TRecurring — periodische FancyPlan-Aufgaben | Schema: TRecurring (id, title, recurrence_type: daily/weekly/monthly/yearly, recurrence_value, act_id nullable, last_shown); isDueToday()-Funktion; FToday zeigt fällige Einträge; Erfassung/Löschen direkt in FToday | Mittel | 🔲 |

---

## Phase 8 — Import / Export

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F8-01 | Access-Datenbank (.accdb) importieren | ImportView.tsx — Datei auswählen, mdb-reader liest Tabellen, SQLite-Insert | Hoch | ✅ |
| F8-02 | Aktivitäten als CSV exportieren (Excel-kompatibel) | "↓ CSV"-Button in ActivitiesView; BOM-Header; dialog.showSaveDialog | Mittel | ✅ |
| F8-03 | Bestehende Bestandsdaten migrieren | Abgedeckt durch F8-01 (Access → SQLite per mdb-reader) | Hoch | ✅ |
| F8-04 | JSON-Import/Export | Noch nicht implementiert | Niedrig | 🔲 |

---

## Phase 9 — Design-Polish & Deployment

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F9-01 | Design-System finalisieren (Icons, Farben, endgültig) | Tailwind-Theme — bewusst zurückgestellt; wird nach funktionalem Abschluss aller Features gemacht; blockiert nicht F9-05 | Mittel | 🔲 |
| F9-02 | Layout skaliert mit der Fenstergröße | Desktop-PC-App — keine mobilen Breakpoints geplant; Windows-DPI-Skalierung (125%/150%/200%) läuft automatisch über Electron/Chromium; Mindestauflösung ca. 1440×900 | Niedrig | 🚫 |
| F9-03 | Render-Fehler in einer View stürzen die App nicht ab | React ErrorBoundary pro View; zeigt Fehlertext + Reset-Button | Mittel | ✅ |
| F9-04 | Aktivitäts-Timer starten und stoppen | Timer1–4-Felder in TAct vorhanden; UI noch nicht implementiert | Niedrig | 🔲 |
| F9-05 | Windows-Installer (.exe) bauen | electron-builder --win (NSIS); Output: `dist\FancyPlan Setup 0.1.0.exe`; Standard-Electron-Icon (kein icon.ico); Voraussetzung: Windows Developer Mode aktiv (Symlink-Rechte); 4 typografische Anführungszeichen in de.json gefixt (JSON-Parse-Fehler) | Hoch | ✅ |
| F9-06 | macOS-Build (.dmg) | electron-builder --mac | Mittel | 🔲 |
| F9-07 | Linux-Build (.AppImage) | electron-builder --linux | Mittel | 🔲 |
| F9-08 | Corporate-Tauglichkeit: Installation + Betrieb ohne Admin-Rechte | NSIS perMachine:false (per-user Install nach %LOCALAPPDATA%) + Prüfung ob alle Runtime-Libraries admin-frei laufen (SQLite, Google API, IMAP etc.) — Status offen, da noch nicht alle Libraries bekannt; Laufzeit bereits admin-frei (nur %APPDATA%-Zugriff) | Niedrig | 🔲 |

---

## Phase 10 — Sicherheit & Datenschutz

Hintergrund: Alle Benutzerdaten liegen in einer einzigen Datei (`%APPDATA%\FancyPlan\fancyplan.db`). Programmdaten und Benutzerdaten sind klar getrennt.
Externes Verschlüsselungstool: **Challenger** (verschlüsselt verzeichnisweise oder einzelne Dateien).
Interner Schutzbedarf: Formular FMyData speichert sensible Nutzerdaten (Passwörter, Kontonummern) — benötigt interne Verschlüsselung.

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| S10-01 | Zugangsdaten via keytar im OS-Credential-Store | Konzept noch offen — zurückgestellt bis Sicherheitskonzept steht | Hoch | 🚫 |
| S10-02 | Konfigurierbarer DB-Pfad für Challenger-Integration | Einstellung in SettingsView: "Datenbankpfad"; App öffnet DB aus Challenger-verschlüsseltem Verzeichnis statt AppData-Default | Hoch | 🔲 |
| S10-03 | Datenbank-Backup-Export — fancyplan.db an beliebigen Ort kopieren | "Backup erstellen"-Button in SettingsView; fs.copyFile zum user-gewählten Zielordner | Mittel | 🔲 |
| S10-04 | FMyData — Formular für sensible persönliche Daten (Passwörter, Kontonummern) | Neue Tabelle TMyData; eigene View FMyDataView; Felder verschlüsselt gespeichert (field-level encryption oder separates SQLCipher-Volume) | Hoch | 🔲 |
| S10-05 | Hinweis in der App auf externe Challenger-Verschlüsselung (Doku) | ARCHITECTURE.md + Info-Text in SettingsView: welcher Pfad verschlüsselt werden soll | Hoch | ✅ |
| S10-06 | Interne Feldverschlüsselung für TMyData | AES-256 auf Feldebene in Main Process; Schlüssel per App-Passwort abgeleitet (PBKDF2) | Hoch | 🔲 |

---

## Phase I18 — Internationalisierung

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| I18-01 | Alle UI-Texte, Labels und Buttons übersetzbar (Deutsch default, weitere Sprachen per JSON ergänzbar) — **Stufe 1:** hartverdrahtet in de.json | react-i18next; src/renderer/src/i18n/index.ts; src/renderer/src/i18n/locales/de.json — alle Views und Komponenten auf useTranslation()/t()-Aufrufe umgestellt; ErrorBoundary via withTranslation() HOC | Hoch | ✅ |
| I18-02 | **[Stufe 2]** Anwender kann Labels und Button-Texte über FCM/Customizing überschreiben — ohne Programmierung, direkt in der App | FCM-Modul (Phase 11): Übersetzungs-Overrides in TSettings oder eigener Tabelle TI18nOverride; App prüft zur Laufzeit ob Override vorhanden, sonst Fallback auf de.json; nur bei VIP-Lizenz | Mittel | 🔲 |

---

## Phase 11 — Lizenzmodell & Customizing (FCM / FCMBTN)

Hintergrund: Die App ist grundsätzlich Single-User — der Benutzer ist gleichzeitig sein eigener Admin.
Kein klassisches Multi-User-System, kein Netzwerk-Login. Die **Lizenz** entscheidet, welche Features freigeschaltet sind.

**Lizenz-Tiers:**

| Tier | Zahlungsmodell | Was ist freigeschaltet |
|------|---------------|----------------------|
| `free` | Kostenlos (kein Schlüssel nötig) | Sehr begrenzt: Tagesansicht, Aktivitäten lesen, kein Customizing, kein Mail, kein Kalender |
| `standard` | Einmalzahlung ODER Abo | Alle Kern-Features: FAct, FToday, Kontakte, Mail, Kalender, CSV-Export — festes Standard-Layout |
| `vip` | Einmalzahlung ODER Abo | Alles aus Standard + FCM/FCMBtn (Profil-basierte Schaltflächenbelegung), FMyData |

**Lizenzvalidierung:** Lemon Squeezy API — Schlüssel wird nach Kauf per E-Mail zugestellt. App validiert beim Start im Hintergrund. Offline-Betrieb via lokalem Cache (Grace-Period 30 Tage). `license_tier` wird im Main Process gehalten, Renderer fragt per IPC.

Für zukünftige Mobile-App-Integration (Aktivitäten versenden/empfangen, Status setzen) wird Firebase Firestore genutzt — das ist eine separate Applikation, nicht dieser Desktop-Client.

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| L11-01 | Lizenzschlüssel eingeben — FdlgLicenseInput | Dialog: Textfeld für Schlüssel, Buttons "Lizenz-anfordern" + OK; Lemon Squeezy API gibt Variant zurück → bestimmt Tier (free/standard/vip); speichert `license_key` (AES-verschlüsselt) + `license_tier` + `license_validated_at` in TSettings; unterstützt Einmalzahlung + Abo | Hoch | 🔲 |
| L11-01a | Free-Tier — 60-Tage-Trial, danach gesperrt | Beim Start: kein Schlüssel → `license_tier = free`; `trial_start` (Erststart-Datum) in TSettings; nach 60 Tagen: App zeigt Sperrbildschirm mit Upgrade-Hinweis, keine Nutzung mehr möglich; während Trial: Mail, Kalender, Customizing, FMyData gesperrt | Hoch | 🔲 |
| L11-01b | Lizenz-Hintergrundvalidierung beim App-Start | Main Process prüft Lemon Squeezy API silent; bei Abo: `license_valid_until` prüfen; bei Ablauf: Grace-Period 30 Tage dann Downgrade auf Free; bei Einmalzahlung: unbegrenzt gültig nach einmaliger Validierung | Hoch | 🔲 |
| L11-02 | FCM — Einstellungs-Hub | FCMView mit 3 Hub-Buttons: → FCMBtn (Schaltflächen-Steuerung), → Formular-Steuerung (Platzhalter), → Werte (Platzhalter); Bottom-Tabs: Profile (CRUD eigener Profile), Anwendung (= globale App-Settings / SettingsView), System (Admin-Funktionen, Platzhalter), Hilfe (Doku zu FCM, öffnet DE_FCM_Customizing.docx); nur bei VIP-Lizenz | Hoch | ✅ |
| L11-02a | FCM Tab "Profile" — eigene Arbeitsprofile anlegen | User legt eigene Profile an (z.B. "Reisen", "Business", "Privat"); CRUD-Liste in FCMView; Tabelle TFCMProfile (id, form_name, profile_name); Profile stehen dann in FCMBtn als Dropdown zur Verfügung | Hoch | ✅ |
| L11-03 | FCMBtn — Profil-basierte Schaltflächensteuerung für komplexe Formulare | Gilt NUR für komplexe Formulare (FAct, FTreeEdit — nicht einfache Listen). Split-View: links Aktives-Profil-Liste (Nr, Profil, Bezeichnung, Methode), rechts Ziel-Formular-Profil (Formular, letztes Profil, Profil, Abfrage, Bereich, Thema, Kategorie). Dropdowns: Aktives Formular + Profil. Buttons: neu, Profil, Kopieren, Design, speichern. Tabellen: TFCMBtn, TFCMProfile | Hoch | ✅ |
| L11-04 | FCMbtnDetail — Detailkonfiguration einer Schaltfläche | Modal-Dialog: Formular, Profil, Schaltfläche-Nr, Status, Filter, Filtertext, Sub-Form1/2, sichtbar, nicht schliessen, neuen Datensatz erlauben, User-Funktion, kein Parameter, Aktion, Parameter-1/2/3, Hyper-Link, Pic-Path, Hilfetext | Hoch | ✅ |
| L11-05 | Customizing-Schutz — FCM nur bei VIP-Lizenz sichtbar | useLicense-Hook liest `license_tier` aus TSettings; Sidebar-Eintrag + FCMView nur bei tier='vip'; Platzhalter-Default 'vip' bis L11-01 implementiert; Sperrbildschirm bei Standard/Free | Hoch | ✅ |
| L11-05c | FCMValue — Werte bearbeiten (Hub + Sub-Editoren) | Hub-Seite mit 4-spaltigem Grid (wie FCMValue-Screenshot); aktivierbare Sub-Editoren: Bereiche (TArea), Themen (TTheme), Bereich-Thema Zuordnung (TAreaTheme), Prio 1/2/3 (TPrio1-3 pro Formular+Profil), Status zum Thema (TStatus), Kategorie zur Gruppe (TCat), Land (TLand), Gruppen 1-8 (TGroupValues); Kombinationsfelder als Platzhalter; neue DB-Tabellen TAreaTheme/TStatus/TLand/TGroupValues; FCMValueView.tsx, env.d.ts, dbHandlers.ts, preload; Live-Test ✅ Prio1/2/3 erreichbar | Hoch | ✅ |
| L11-05d | FCMValue — Kontierungselemente (Kostenstellen, Aufträge, Projekte) | Expert-Feature (nicht Standard): Kostenstellen, Aufträge und Projekte als pflegbare Wertelisten (TKostenstelle, TAuftrag, TProjekt); erscheinen in FCMValue unter "Kontierungsobjekte" neben Land; können später Aktivitäten (FAct) zugeordnet werden für Abrechnung/Stundenmeldung. **Feldformate (wichtig für Abrechnung):** KS-Nr. alphanumerisch (TEXT, keine Einschränkung); Auftragsnummer alphanumerisch (TEXT, alle Zeichen erlaubt); Projektnummer beliebiges Format z.B. `Werk.123.456/789/xyz` (TEXT, kein Längenlimit — SQLite TEXT unbegrenzt, 20+ Stellen problemlos); alle Nummernfelder in UI als Freitext-Input ohne Validierung — vollständige Kompatibilität mit SAP/ERP-Nummernkreisen gewährleistet | Niedrig | ✅ |
| L11-05a | **[Stufe 1]** Hilfe Built-in — hartverdrahteter Hilfe-Button pro Formular | Jedes Formular hat einen fest verdrahteten Hilfe-Button; öffnet die zugehörige .docx aus dem Help-Ordner via shell.openPath() (FAct → DE_FAct_Aktivität.docx, FCM → DE_FCM_Customizing.docx etc.); kein Customizing-Eintrag nötig; funktioniert auch ohne VIP-Lizenz | Mittel | 🔲 |
| L11-05b | **[Stufe 2]** Hilfe benutzerkonfigurierbar — Anwender verknüpft eigene Hilfedateien via FCMBtn | Vertriebsargument VIP: User kann den Hilfe-Button pro Formular über FCMBtn überschreiben oder ergänzen — eigene .docx, Firmen-Wiki-URL, oder eigenes Hilfe-Formular hinterlegen (Hyper-Link oder Pic-Path in FCMbtnDetail); ermöglicht vollständig eigene Betriebsdokumentation ohne Programmierung; nur VIP-Lizenz | Niedrig | 🔲 |
| L11-06 | Aktivität versenden — Dispatch an Mobile-App via Firebase Firestore | TAct-Datensatz in Firestore schreiben (source: desktop, status: dispatched); Mobile-App empfängt und kann Erledigt-Status zurückschreiben | Mittel | 🔲 |
| L11-07 | Firestore-Sync — Status-Updates von Mobile-App empfangen | Listener auf Firestore-Collection; eingehende Statusänderungen (z.B. Sdone=1) in lokale TAct übernehmen | Mittel | 🔲 |
| L11-08 | FCMStatus — Automatische Feldpflege bei Status-Wechsel (FAct / FNow / FToday) | Gilt für Formulare FAct, FNow, FToday: sobald der Anwender einen Status einträgt und das Feld verlässt (onBlur), ruft `applyFCMStatus()` die TFCMStatus-Regel für diesen Status ab und befüllt abhängige Felder automatisch. **TFCMStatus** (40 Felder): Status, StatusGrp, Aktion, Points, relevant, Kategorie, UserExit, SortNr; katFind/katReplace (Kategorie-Substitution, Semikolon-Paare); p1–p3 je Lt/Eq/Gt mit LtVal/LtSet/LtNoop, EqVal/EqSet/EqNoop, GtVal/GtSet/GtNoop (numerische Schwellwert-Regeln für Prio1-3); setIstVon/setIstBis/setPlanVon/setPlanBis (Datums-Flags); setInfo; titelText. **FCMStatusView.tsx** (3-Spalten-Layout): Links — scrollbare Status-Liste; Mitte — Eigenschaften-Formular; Rechts — Automatik-Konfiguration (PrioSection 1–3, Kategorie-Substitution, Datumscheckboxen, Info, TitelText). **Runtime**: `applyFCMStatus(status)` in FNowModal.tsx auf onBlur des Status-Feldes. Live-Test steht aus | Hoch | ⏳ |

---

## Phase 9 — Datensicherung & Stabilität

| ID | Was es tut | Implementierung | Prio | Status |
|----|-----------|----------------|------|--------|
| F9-03 | React ErrorBoundary um jede View | ErrorBoundary HOC + withTranslation() — jede View einzeln gekapselt | Mittel | ✅ |
| F9-05 | Windows Installer | `npm run build:win` → NSIS Installer; `dist\FancyPlan Setup 0.1.0.exe` | Hoch | ✅ |
| F9-06 | macOS-Build | electron-builder DMG | Niedrig | 🔲 |
| F9-07 | Linux-Build | electron-builder AppImage | Niedrig | 🔲 |
| F9-08 | Automatische DB-Sicherung beim App-Start | `backupDb()` in database.ts kopiert `fancyplan.db` mit Timestamp in `%APPDATA%/FancyPlan/backups/`; max. 7 Dateien (älteste wird automatisch gelöscht); Aufruf in main/index.ts nach `initDb()` | Hoch | ✅ |
| F9-09 | Manueller Sicherungspunkt (Tree-Header) | 💾-Button im TreeView-Header → `window.db.backup.create()` → IPC → `backupDb()`; Bestätigungsmeldung 3 Sek. sichtbar | Hoch | ✅ |
| F9-10 | Undo für Tree-Drag & Drop | `undoStack` State in TreeView; vor jedem Move wird `{nodeId, oldParentId}` gespeichert; ↩-Button erscheint orange wenn Stack > 0; Klick stellt letzten Zug wieder her (`tree.move` mit altem Parent); mehrfach rückgängig möglich | Hoch | ✅ |
