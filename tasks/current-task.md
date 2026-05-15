# Current Task — Phase 9: Deployment + Konzeptklärungen

## Stand: 2026-05-07 (aktualisiert)

## Implementiert (diese Session)
- [x] Phase 6: Mail (IMAP + SMTP, kein OAuth, alle Anbieter via App-Passwort)
- [x] Phase 7: Kalender (CalDAV: iCloud, Nextcloud, Radicale)
- [x] F7-06: Google Calendar OAuth2 (googleCalHandlers.ts, SettingsView) — Live-Test steht aus
- [x] F8-02: CSV-Export in ActivitiesView (↓ CSV Button)
- [x] F9-03: React ErrorBoundary um jede View
- [x] F4-03: Drag & Drop in TreeView (HTML5, kein externe Bibliothek)
- [x] F2-02c: PSP-Knoten-Picker in FNowModal
- [x] F5-06: FactLst1 als Listenansicht in ActivitiesView (Toggle ⊟/☰)
- [x] ARCHITECTURE.md erstellt (Datentrennung, Challenger-Hinweis)
- [x] Phase 10 Sicherheit + Phase 11 Lizenz/Customizing in FEATURES.md erfasst
- [x] F2-02g: Status-Dropdown themenabhängig (TStatus.IDTheme, StatusEditor, FNowModal-Filter) ✅
- [x] F2-02h: FdlgCat Kategorie-Picker (Mehrfachauswahl, Colon-getrennt, CatGrp-Gruppierung) ✅
- [x] F2-02i: stripHtml für Com/Ltxt1/Ltxt2 in FNowModal + ActivitiesView-Vorschau ✅
- [x] F2-02j: FdlgAct Folgeaktivität-Picker + Navigation (↗ springt in verknüpfte Aktivität, ← zurück) ✅
- [x] F9-08: Automatische DB-Sicherung beim App-Start (max. 7 Dateien, %APPDATA%/FancyPlan/backups/) ✅
- [x] F9-09: Manueller Sicherungspunkt via 💾-Button im TreeView-Header ✅
- [x] F9-10: Undo für Tree-Drag & Drop (↩-Button, undoStack, mehrfach rückgängig) ✅

## Konzept-Klärungen offen (Entscheidung erforderlich)

### Lizenzmodell — Lemon Squeezy (offen, L11-01)
- Präferenz: Lemon Squeezy als Lizenzplattform (automatische Kaufabwicklung)
- Vorteil: Kauf → Lizenzschlüssel → App-Validierung in einem Prozess
- Offen: API-Integration, Offline-Validierung, Schlüsselformat
- Nächster Schritt: Lemon Squeezy-Konto prüfen, API-Doku lesen, dann L11-01 implementieren

### FCM Profil-Konzept — Abstimmung Details (L11-02/03)
- Profile gelten nur für komplexe Formulare (FAct und ähnliche), NICHT für einfache Listen
- Profil = Arbeitskontext: "Privat" (Urlaub, Reisen…), "Business" (geschäftliche Aktionen…)
- Profil-Umschaltung lädt andere Schaltflächenbelegung für dasselbe Formular
- Offen: Welche weiteren Formulare (außer FAct) bekommen Profile?

## Offen — Priorität Hoch
- [x] **F9-05: Windows Installer** — Build ✅ `dist\FancyPlan Setup 0.1.0.exe`; Schnelltest OK
- [ ] **F9-05: App-Test (ausführlich)** — `dist\win-unpacked\FancyPlan.exe` oder Installer; Feedback ausstehend
- [ ] **F7-06: Google Calendar live testen** — echte Google Credentials erforderlich

## Offen — Priorität Mittel
- [ ] F6-05: Mail-Anhänge (IMAP BODYSTRUCTURE, Download-Button)
- [ ] F2-02d: "Zugeordnet"-Tab in FNowModal (TTel-Lookup, wartet auf Customizing-Konzept)
- [ ] F9-01: Design-System finalisieren (Icons, Farben)
- [ ] F9-02: Responsive Breakpoints
- [ ] F9-04: Aktivitäts-Timer UI (Timer1–4 Felder bereits in Schema)

## Offen — Priorität Niedrig
- [x] F5-05: Akquisition-Modul — überarbeitet: EMail1, WWW, Mobil, Tel, Land, Textarea txt1, Detail-Panel rechts
- [x] FCMValue (L11-05c): Werte bearbeiten — Hub + Sub-Editoren (Bereiche, Themen, Bereich-Thema, Prio1/2/3, Status, Kategorie, Land, Gruppen 1-8); neue DB-Tabellen TAreaTheme/TStatus/TLand/TGroupValues; Live-Test ✅ (Werte + Prio1/2/3 erreichbar)
- [x] L11-05d: Kontierungselemente (TKostenstelle, TAuftrag, TProjekt) — Wertelisten unter FCMValue; Felder KSNr/AuftragNr/ProjektNr als TEXT (kein Längenlimit, SAP/ERP-kompatibel)
- [x] TGroupValues: IDFormName-Spalte ergänzt (Migration per ALTER TABLE); GroupEditor mit Formular-Filter-Input (* = alle)
- [x] L11-08: FCMStatus-Steuerung — TFCMStatus (40 Felder), FCMStatusView.tsx (3-Spalten: Liste/Eigenschaften/Automatik), applyFCMStatus() in FNowModal onBlur; gilt für FAct/FNow/FToday; Live-Test steht aus
- [x] F2-02g: Status-Dropdown themenabhängig (TStatus.IDTheme, StatusEditor mit Thema-Dropdown, FNowModal-Filter) ✅ getestet
- [x] F2-02h: FdlgCat Kategorie-Picker (Mehrfachauswahl, Colon-getrennt, CatGrp-Gruppierung) ✅ getestet
- [x] F2-02i: stripHtml für Com/Ltxt1/Ltxt2 in FNowModal + ActivitiesView-Vorschau ✅ getestet
- [ ] F8-04: JSON-Import/Export
- [ ] F9-06: macOS-Build
- [ ] F9-07: Linux-Build
