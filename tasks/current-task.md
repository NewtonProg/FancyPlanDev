# Current Task — UI-Fixes + Offene Features

## Stand: 2026-05-21

## Implementiert (diese Session)
- [x] **F5-05** ✅ AcquisitionView live getestet und abgenommen (2026-05-21)
- [x] **CalendarView** — Label "MANUELL" → "FancyPlan" (Quellen-Badge für manuelle Termine)
- [x] **PrioritiesView** ✅ — Doppelklick auf Status-Badge filtert Liste nach diesem Status (Toggle; aktiver Filter als Badge in Filterleiste mit ✕)
- [x] **PrioritiesView** ✅ — Bereich-Filter ersetzt durch dynamische Kategorie-Filter (nur Kategorien der aktuell angezeigten Aktivitäten; reagiert auf Type/Datum/Status-Filter)

---

## Zuletzt abgeschlossen (vorige Session 2026-05-20)
- [x] **F9-04** ✅ Aktivitäts-Timer UI (4 Timer-Karten in FNowModal Tab "Timer", Start/Stop/Reset, Live-Elapsed)
- [x] **F8-04** ✅ JSON Import/Export (Vollsicherung aller 25 Tabellen, ImportView.tsx)
- [x] **F6-05** ✅ Mail-Anhänge (TMailAttachment, BLOB-Speicherung, Download-Button mit Save-Dialog)
- [x] **L11-01** ✅ Lemon Squeezy Lizenzierung — licenseHandlers.ts, LicenseModal.tsx, useLicense.ts
- [x] **L11-01a** ✅ 60-Tage-Trial + Sperrbildschirm bei trialExpired
- [x] **L11-01b** ✅ Hintergrundvalidierung beim App-Start (silent, lokaler Cache bei Netzwerkfehler)
- [x] **F7-06** ✅ Google Calendar live getestet 2026-05-21 — 91 Termine synchronisiert; 4 Bugs behoben
- [x] **F9-01** ✅ Design-System finalisiert — Midnight Executive auf alle Views/Komponenten angewendet

---

## Offen — Priorität Hoch

- [ ] **F9-05: App-Test (ausführlich)** — `dist\win-unpacked\FancyPlan.exe` oder Installer; Feedback ausstehend
- [x] **S10-02** ✅ Konfigurierbarer DB-Pfad für Challenger-Integration (SettingsView)
- [x] **S10-03** ✅ Datenbank-Backup-Export + Import (SettingsView, fs.copyFile) — live getestet OK (2026-05-30)
- [x] **S10-04** ✅ FMyData: sensible persönliche Daten (Passwörter, Kontonummern), TMyData + FMyDataView
- [x] **S10-06** ✅ Interne Feldverschlüsselung für TMyData (AES-256, PBKDF2)
- [x] **U12-01** ✅ In-App Update-Prüfung (electron-updater + IPC Events)
- [x] **U12-02** ✅ Automatischer Download im Hintergrund (autoDownload=true, Fortschrittsbalken)
- [x] **U12-03** ✅ GitHub Releases als Update-Feed (package.json build.publish — owner/repo Platzhalter eintragen vor Go-Live)

## Offen — Priorität Mittel

- [x] **U12-04** ✅ Update-Sektion in SettingsView (Version, Check-Button, Fortschrittsbalken, Install-Button)
- [ ] **L11-05a** → 🚫 Phase 2 — Hilfe Built-in: hartverdrahteter Hilfe-Button pro Formular (öffnet .docx)
- [ ] **F9-06** — macOS-Build (.dmg)
- [ ] **F9-07** — Linux-Build (.AppImage)
- [ ] **F9-08** — Corporate-Tauglichkeit: Installation ohne Admin-Rechte (per-user NSIS, Library-Prüfung)
- [ ] **I18-02** — Stufe-2-Übersetzungsoverrides via FCM (TI18nOverride, nur VIP)

## Offen — Priorität Niedrig

- [ ] **L11-05b** — Hilfe benutzerkonfigurierbar via FCMBtn (eigene .docx, Wiki-URL, nur VIP)
- [ ] **L11-06** — Aktivität versenden via Firebase Firestore (Dispatch an Mobile-App)
- [ ] **L11-07** — Firestore-Sync: Status-Updates von Mobile-App empfangen
- [ ] **F9-02** — Responsive Breakpoints → 🚫 zurückgestellt (Desktop-PC-App, DPI-Skalierung via Electron)

---

## Architektur TTermin (Referenz)
- **TTermin** = einzige Quelle für alle Termine (Kalender, FToday, FNowModal)
- **window.db.termin.***: getByDate, getByDateRange, getByAct, create, update, delete, upsertFromSync
- CalendarView Day-Panel liest aus TTermin; manuelle Termine → source='manual'
- CalDAV + Google Sync → non-allDay Events → TTermin; source='caldav'/'gcal'
- FToday liest TTermin für selectedDate; TRecurring isDueToday() für Wiederholungen
- FNowModal Tab "Termine": verknüpfte TTermin-Einträge über act_id
