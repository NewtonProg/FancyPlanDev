# Resume — FancyPlan WebDev

Stand: 2026-05-07 (aktualisiert)

## App starten
```
npm run dev
```
Öffnet Electron + Vite Dev Server. SQLite-DB liegt in `%APPDATA%/fancyplan/fancyplan.db`.

---

## Was fertig ist

Alle Phasen 0–8 sind größtenteils implementiert:

| Phase | Inhalt | Status |
|-------|--------|--------|
| 0 | Electron + React + TypeScript + Vite + Tailwind | ✅ |
| 1 | SQLite-Schema (TAct, TTel, TTree, TSettings, TMailReceive, TCalendar, TLinks…) | ✅ |
| 2 | Tagesansicht (TodayView), FNowModal (Tabs), Planvarianten | ✅ (F2-02 ⏳) |
| 3 | Prioritätslisten (PrioritiesView) | ✅ |
| 4 | Baumstruktur (TreeView, Drag & Drop, Timeline, Cross-Ref, Undo, Sicherungspunkt) | ✅ |
| 5 | Kontakte (ContactsView), Aktivitäten-Suche (ActivitiesView), TLinks | ✅ |
| 6 | Mail: IMAP-Sync + SMTP-Senden (nodemailer + imapflow), SettingsView | ✅ |
| 7 | Kalender: CalDAV-Sync + Erstellen + Löschen (tsdav + node-ical) | ✅ |
| 8 | Access-Import (mdb-reader), CSV-Export | ✅ |
| 9 | ErrorBoundary, Build-Config | ⏳ |

---

## Was als nächstes zu tun ist

### 1. Google Calendar (F7-06) — wichtig, offen
- OAuth2 im Testing-Mode: kein Google-Review nötig, bis 100 Test-User
- Flow: SettingsView → "Google Calendar verbinden" → loopback OAuth-Server → Token in TSettings
- Live-Test mit echten Google Credentials erforderlich

### 2. FNowModal vervollständigen (F2-02)
- F2-02d: "Zugeordnet"-Tab — Person aus TTel per Dropdown auswählen

### 3. FCMStatus live testen (L11-08)
- Status in FCMValue anlegen → in FAct auswählen → onBlur prüfen ob Felder befüllt werden

### 4. Lizenzmodell (L11-01)
- Lemon Squeezy-Konto, API-Doku lesen, dann Implementierung

### 5. Datensicherung (fertig)
- Auto-Backup beim Start: `%APPDATA%/FancyPlan/backups/` (max. 7 Dateien)
- Manuell: 💾-Button im Tree-Header
- Undo Tree-D&D: ↩-Button (orange, erscheint nach erstem Zug)

---

## Schlüsseldateien

| Zweck | Pfad |
|-------|------|
| IPC-Handler registrieren | src/main/index.ts |
| SQLite-Schema | src/main/db/schema.ts |
| IPC-Handlers | src/main/ipc/*.ts |
| Preload Bridge | src/preload/index.ts |
| TypeScript-Typen für window.db | src/renderer/src/env.d.ts |
| App-Shell + Navigation | src/renderer/src/App.tsx |
| Views | src/renderer/src/views/*.tsx |
| Feature-Tracking | tasks/FEATURES.md |
| Aktuelle Aufgaben | tasks/current-task.md |

---

## Wichtige Entscheidungen (nicht ändern ohne Grund)
- **Kein Google OAuth für Mail** — IMAP/SMTP + App-Passwort (funktioniert mit Gmail, Outlook, etc.)
- **CalDAV statt Google Calendar API** — für iCloud/Nextcloud (kein OAuth nötig)
- **Google Calendar separat** — OAuth2 Testing-Mode reicht für Eigenbedarf
- **HTML5 Drag & Drop** — kein extra Paket für TreeView
- **`crypto.randomUUID`** — kein `uuid`-npm-Paket nötig (Node built-in)
- **better-sqlite3** — synchron, kein async/await in DB-Handlers nötig
- **PC-only App** — kein Responsive/Mobile-Design (F9-02 zurückgestellt)
- **DB-Backup** — SQLite-Datei kopieren (kein Dump, kein VACUUM); max. 7 Dateien; Backups unter `%APPDATA%/FancyPlan/backups/`
