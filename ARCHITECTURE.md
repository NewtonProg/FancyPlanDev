# FancyPlan — Architektur-Dokumentation

## Überblick

FancyPlan ist eine **Electron-Desktop-App** mit React-Frontend und SQLite-Backend.
Die App folgt dem klassischen Electron-Dreischichtenmodell: Main Process, Preload Bridge, Renderer.

---

## Schichtenmodell

```
┌─────────────────────────────────────────────────────────┐
│  RENDERER PROCESS (React / TypeScript / Vite)           │
│  src/renderer/src/                                      │
│  ├── views/          TodayView, ActivitiesView, ...     │
│  ├── components/     ErrorBoundary, LinkPanel, ...      │
│  └── App.tsx         Sidebar-Navigation, Routing        │
│                                                         │
│  Kein Dateisystem-Zugriff — nur window.db.* aufrufen   │
└────────────────────┬────────────────────────────────────┘
                     │ contextBridge (IPC / ipcRenderer)
┌────────────────────▼────────────────────────────────────┐
│  PRELOAD SCRIPT  src/preload/index.ts                   │
│  Exponiert window.db.* sicher an den Renderer          │
│  (contextIsolation: true, sandbox: false)               │
└────────────────────┬────────────────────────────────────┘
                     │ ipcMain.handle()
┌────────────────────▼────────────────────────────────────┐
│  MAIN PROCESS  src/main/                                │
│  ├── index.ts         App-Start, Window-Erstellung      │
│  ├── db/              SQLite-Initialisierung            │
│  │   ├── database.ts  getDb(), dbAll(), dbRun()         │
│  │   └── schema.ts    CREATE TABLE Statements           │
│  └── ipc/             Handler (je ein Modul)           │
│      ├── dbHandlers.ts          TAct, TTel, Refs        │
│      ├── settingsHandlers.ts    TSettings               │
│      ├── treeHandlers.ts        TTree                   │
│      ├── linksHandlers.ts       TLinks                  │
│      ├── planvariantHandlers.ts TPlanVariant             │
│      ├── mailHandlers.ts        IMAP/SMTP, TMailReceive │
│      ├── calendarHandlers.ts    CalDAV, TCalendar       │
│      ├── googleCalHandlers.ts   Google OAuth2           │
│      ├── exportHandlers.ts      CSV-Export              │
│      └── migrationHandlers.ts   Access-Import           │
└────────────────────┬────────────────────────────────────┘
                     │ better-sqlite3 (synchron, lokal)
┌────────────────────▼────────────────────────────────────┐
│  SQLITE DATENBANK  fancyplan.db                         │
│  Pfad: %APPDATA%\FancyPlan\fancyplan.db                 │
└─────────────────────────────────────────────────────────┘
```

---

## Datentrennung: Programmdaten vs. Benutzerdaten

### Benutzerdaten (verschlüsselbar)

**Speicherort:** `C:\Users\{Benutzer}\AppData\Roaming\FancyPlan\`

| Datei | Inhalt |
|-------|--------|
| `fancyplan.db` | Alle Benutzerdaten in einer einzigen SQLite-Datei |

**Inhalt der Datenbank:**

| Tabelle | Was drin steht |
|---------|---------------|
| TAct | Aktivitäten / Aufgaben (Kernentität, 100+ Felder) |
| TTel | Kontakte / Telefonbuch (99 Felder) |
| TTree | Baumstruktur / PSP-Hierarchie |
| TLinks | Links pro Kontakt oder Baumknoten |
| TArea, TTheme, TCat | Referenzdaten: Bereiche, Themen, Kategorien |
| TPrio1/2/3 | Prioritätsdefinitionen |
| TGroup1 | Gruppen-Referenzen |
| TPlanVariant / TPlanVariantItem | Gespeicherte Tages-Planvarianten |
| TAct_Log | Änderungsprotokoll pro Aktivität |
| TMailReceive | IMAP-Mail-Cache |
| TCalendar | CalDAV / Google Calendar Cache |
| TSettings | App-Einstellungen inkl. Zugangsdaten (siehe unten) |
| db_meta | Schema-Version |

**Besonders sensible Daten in TSettings:**
- IMAP/SMTP-Passwörter (Mail-Zugang)
- CalDAV-Passwort (Kalender-Zugang)
- Google OAuth2-Tokens (Access Token + Refresh Token)
- Google Client-ID und Client-Secret

**Fazit: Alle Benutzerdaten befinden sich in genau einer Datei** — `fancyplan.db`. Das macht externe Verschlüsselung sehr einfach.

---

### Programmdaten (nicht verschlüsseln nötig)

**Speicherort (installiert):** `C:\Program Files\FancyPlan\`

| Inhalt | Beschreibung |
|--------|-------------|
| `resources/app/out/main/index.js` | Kompilierter Main Process |
| `resources/app/out/preload/index.js` | Kompilierter Preload |
| `resources/app/out/renderer/` | React-Bundle (HTML + JS + CSS) |
| `resources/app/node_modules/` | Abhängigkeiten (better-sqlite3, React, etc.) |
| `resources/electron.asar` | Electron-Runtime |

**Speicherort (Entwicklung):**
```
FancyPlanWebDev/
├── out/              ← Kompilierte JS-Dateien (electron-vite build)
├── node_modules/     ← Abhängigkeiten
└── src/              ← TypeScript-Quellcode
```

---

## Verschlüsselungs-Strategie

### Option A — Nur Benutzerdaten verschlüsseln (empfohlen)

**Zieldatei:** `%APPDATA%\FancyPlan\fancyplan.db`

**Vorgehensweise mit externem Programm (z.B. VeraCrypt, 7-Zip, BitLocker):**

```
Verschlüsseln:  %APPDATA%\FancyPlan\fancyplan.db
Entschlüsseln:  Vor App-Start in selben Pfad zurückschreiben
```

Vorteile:
- Minimaler Aufwand — eine Datei
- App-Code bleibt unberührt und startbar
- Alle Daten inkl. Passwörter und OAuth-Tokens gesichert
- Einfaches Backup: nur eine Datei kopieren

Nachteile:
- App-Start erfordert manuelle Entschlüsselung falls Datei verschlüsselt ist
- SQLite-WAL-Journal (`fancyplan.db-wal`, `fancyplan.db-shm`) muss mitgesichert werden

**Empfehlung:** Gesamten Ordner `%APPDATA%\FancyPlan\` verschlüsseln, nicht nur die .db-Datei, damit WAL-Dateien eingeschlossen sind.

---

### Option B — Gesamte App verschlüsseln

**Zielordner:** `C:\Program Files\FancyPlan\` + `%APPDATA%\FancyPlan\`

Vorteile:
- Maximaler Schutz (Code + Daten)

Nachteile:
- Programm-Code ist ohnehin nicht geheim (öffentliche Bibliotheken)
- Deutlich mehr Aufwand, größeres Volumen
- App ist nach Verschlüsselung nicht mehr startbar ohne vollständige Entschlüsselung

---

### Sicherheitshinweise zur aktuellen Implementierung

| Punkt | Status | Hinweis |
|-------|--------|---------|
| Zugangsdaten im Klartext | ⚠️ | IMAP/CalDAV/Google-Tokens in TSettings unverschlüsselt |
| Kein Passwortschutz der DB | ⚠️ | SQLite ohne SQLCipher — DB ist direkt lesbar |
| Alle Daten in einer Datei | ✅ | Einfach zu sichern und zu verschlüsseln |
| WAL-Mode aktiv | ℹ️ | Immer auch `fancyplan.db-wal` und `fancyplan.db-shm` sichern |
| Lokale Datenhaltung | ✅ | Keine Cloud-Abhängigkeit, kein Server |

---

## Datenbankpfad im Quellcode

```
src/main/db/database.ts — Zeile ~8:
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'fancyplan.db')
```

Windows:   `C:\Users\{user}\AppData\Roaming\FancyPlan\fancyplan.db`
macOS:     `~/Library/Application Support/FancyPlan/fancyplan.db`
Linux:     `~/.config/FancyPlan/fancyplan.db`

---

## Build-Artefakte

```
npm run build       → out/          (kompiliertes JS, kein Installer)
npm run build:win   → dist/*.exe    (Windows NSIS-Installer)
npm run build:mac   → dist/*.dmg    (macOS Disk Image)
npm run build:linux → dist/*.AppImage
```

---

## IPC-Kanal-Übersicht

| Präfix | Modul | Betroffene Tabellen |
|--------|-------|-------------------|
| `db:act:*` | dbHandlers | TAct |
| `db:tel:*` | dbHandlers | TTel |
| `db:area/theme/cat/prio:*` | dbHandlers | TArea, TTheme, TCat, TPrio1-3 |
| `db:actlog:*` | dbHandlers | TAct_Log |
| `settings:*` | settingsHandlers | TSettings |
| `db:tree:*` | treeHandlers | TTree |
| `db:links:*` | linksHandlers | TLinks |
| `db:planvariant:*` | planvariantHandlers | TPlanVariant, TPlanVariantItem |
| `mail:*` | mailHandlers | TMailReceive, TSettings |
| `cal:*` | calendarHandlers | TCalendar, TSettings |
| `gcal:*` | googleCalHandlers | TSettings |
| `export:csv` | exportHandlers | — (dialog) |
| `db:migrate:fromAccess` | migrationHandlers | Alle Tabellen |

---

## Fazit zur Datentrennung

**Die Trennung ist klar und vollständig:**

- **Benutzerdaten** → 1 Datei: `%APPDATA%\FancyPlan\fancyplan.db`
- **Programmdaten** → Installationsverzeichnis (statisch, unveränderlich zur Laufzeit)

Für externe Verschlüsselung reicht es, den Ordner `%APPDATA%\FancyPlan\` zu schützen. Die App selbst muss nicht verschlüsselt werden.
