# FancyPlan — Feature-Übersicht & Verkaufsargumente

> Zielgruppe: Selbstständige, Führungskräfte, Projektleiter, Freelancer, Unternehmensberater — alle, die strukturierte Tagesplanung mit Kontakten, Mail und Kalender in einer lokalen, sicheren Desktop-App suchen.

---

## ★ TOP-FEATURES — Die stärksten Verkaufsargumente

### Alles an einem Ort — Aktivitäten, Mail, Kalender, Kontakte
FancyPlan ist kein einfaches To-do-Tool. Es verbindet Aufgabenplanung, Kontaktverwaltung, IMAP-Mail und Google Calendar in einem einzigen Programm. Wer aus einer Aktivität heraus eine Mail an einen Kontakt schreibt — und die Antwort wieder zur Aktivität zurückfließt — spart täglich Minuten, die sich zu Stunden summieren.

- **Tagesansicht (FToday):** Alle heutigen Aufgaben auf einen Blick — mit Datum-Navigation, Aufgaben/Info-Filter, und automatischer Erledigt-Markierung
- **Aktivitäts-Vollformular (FNow):** 173 Felder, Tabs für Status, Zuordnung, Kontakt, Links, Protokoll, Termine und Timer — so detailliert wie Access, so schnell wie eine moderne App
- **Statusautomatik (FCMStatus):** Beim Statuswechsel werden abhängige Felder automatisch befüllt (Priorität, Kategorie, Datum) — keine manuelle Nachpflege
- **Planvarianten:** Wiederkehrende Tages-Sets als benannte Vorlage speichern und auf Knopfdruck laden

---

### Google Calendar — Live-Sync ohne App-Review
Keine Store-Freigabe, kein Warten auf Google. Die App nutzt den OAuth2-Loopback-Flow — der Nutzer verbindet seinen eigenen Google-Account direkt, ohne dass ein App-Review-Prozess durchlaufen werden muss.

- Live getestet: 91 Termine synchronisiert in einem Durchgang
- Serientermine vollständig unterstützt: anlegen, bearbeiten (einzeln oder ganze Serie), löschen — mit Ownership-Bewusstsein für geteilte Kalender
- Interne FancyPlan-Serientermine (ohne Google) als Alternative
- Zusätzlich: CalDAV-Support (iCloud, Nextcloud, Radicale) für alle, die kein Google wollen

---

### Mail-Integration — IMAP/SMTP, kein OAuth nötig
Kein Google-App-Review, kein Microsoft Azure App Registration. Zugangsdaten mit App-Passwort — fertig. Funktioniert mit Gmail, Outlook, Fastmail, GMX, eigenen Mailservern.

- Posteingang lesen, Mail verfassen, Anhänge herunterladen
- Mail direkt aus einer Aktivität oder einem Kontakt heraus vorausfüllen
- Zentrales Verkaufsargument Phase 2: Aktivität → Mail → Kontakt → Antwort zurück zur Aktivität

---

### Läuft in gesperrten Unternehmensumgebungen — ohne Admin-Rechte
Installation nach `%LOCALAPPDATA%\Programs\` — kein UAC-Prompt, kein IT-Helpdesk-Ticket, kein Warten. Die App läuft vollständig unter einem Windows-Standardbenutzer. Kein einziger Systempfad wird angefasst.

> **"FancyPlan läuft in gesperrten Unternehmensumgebungen ohne IT-Freigabe — kein Admin-Recht, kein Helpdesk-Ticket, kein Warten auf den IT-Admin."**

---

### Datenschutz by Design — lokale SQLite, Ihre Daten gehören Ihnen
Alle Daten liegen in einer einzigen Datei auf Ihrem Rechner (`%APPDATA%\FancyPlan\fancyplan.db`). Keine Cloud-Pflicht, kein Abo-Abo-Modell mit Server-Abhängigkeit. Der Nutzer entscheidet, wo seine Daten liegen.

- Konfigurierbarer Datenbankpfad: Integration mit externem Verschlüsselungstool Challenger möglich
- Automatische DB-Sicherung beim App-Start (7 rotierende Backups)
- Manueller Sicherungspunkt per Klick
- JSON-Vollsicherung: alle 25 Tabellen exportieren und wiederherstellen
- FMyData: Formular für sensible persönliche Daten (Passwörter, Kontonummern) — AES-256-verschlüsselt auf Feldebene

---

### Automatische App-Updates — über GitHub Releases
Updates landen direkt aus GitHub, ohne Microsoft Store, ohne Admin-Rechte. Der Nutzer sieht den Fortschrittsbalken, klickt "Jetzt installieren" — fertig.

---

### Kontaktverwaltung — vollständig, verknüpft, filterbar
99 Felder pro Kontakt (exakte Migration aus MS Access). Mehrfach-E-Mails, Mehrfach-Webseiten, Links (Datei, Netzwerk, Social). Direktes Anschreiben per Mail aus dem Kontakt oder aus der Aktivität heraus.

- Alphabet- und Kategoriefilter
- Akquisitions-Modul: Firmen und Kontakte per Copy-Paste erfassen, BCC-Mailliste auf Knopfdruck generieren

---

### Lizenzmodell — kauf einmal, nutze dauerhaft
Drei Stufen: Free (60-Tage-Trial) → Standard (alle Kern-Features) → VIP (+ Customizing-Hub FCM). Einmalzahlung oder Abo, über Lemon Squeezy. 30-Tage-Offline-Betrieb ohne Netzwerk.

---

## ◆ MITTLERE FEATURES — Solide Differenzierung

### Baumstruktur / PSP-Navigation
Hierarchischer Projektstrukturplan mit bis zu 6 Ebenen, Drag & Drop, Cross-Tree-Referenzen und Undo-Funktion. Aktivitäten werden Baumknoten zugeordnet — Überblick über alle Aufgaben je Teilprojekt auf einen Blick. Gantt-Timeline-Ansicht (Balkendiagramm) für Pl1/Pl2 direkt im Baum.

### Prioritätslisten — strukturiert nach Bereich
Drei unabhängige Prioritätsstufen (TPrio1/2/3), konfigurierbar je Formular und Profil. Filterung nach Bereich, Typ (Action/Info) und Datum. Erledigte archivieren ohne löschen.

### Kategorie-System — Bereich › Thema › Kategorie
Drei-Ebenen-Hierarchie (Bereich → Thema → Kategorie) für Aktivitäten und Kontakte. Mehrfach-Kategorien pro Aktivität (Colon-getrennt). Akkordeon-Picker für schnelle Auswahl. Filter in Tagesansicht und Aktivitätenliste.

### Vollständiges Customizing-Hub (FCM) — nur VIP
FCM: Statusautomatik konfigurieren, Werte-Listen pflegen (Bereiche, Themen, Status, Kategorien, Kostenstellen, Aufträge, Projekte), Schaltflächen-Belegung anpassen. SAP/ERP-kompatible Nummernkreise (TEXT, kein Längen-Limit).

### Aktivitäts-Timer
4 unabhängige Timer pro Aktivität — Start/Stop, Live-Elapsed-Anzeige, persistente Speicherung. Für Zeiterfassung und Stundenmeldung.

### Aktivitäten-Protokoll
Jede Feldänderung wird protokolliert (TAct_Log) wenn SDetailStat=1. Vollständige Änderungshistorie pro Aktivität. Protokolle einzeln oder vollständig löschbar.

### Import aus MS Access / Export nach CSV + JSON
Bestehende FancyPlan-Daten aus Access (.accdb) direkt importieren — kein manuelles Umtippen. CSV-Export (Excel-kompatibel) für Aktivitäten. JSON-Vollsicherung aller 25 Tabellen.

### Mehrsprachigkeit (i18n)
Alle UI-Texte übersetzbar per JSON. Deutsch als Default, weitere Sprachen einfach ergänzbar.

### Persistentes Error-Log
Alle Warnungen und Fehler in `%AppData%\FancyPlan\logs\main.log` — für Qualitätssicherung und Support ohne Rätselraten.

---

## ◇ WEITERE FEATURES — Geplant & Roadmap

### Mobile-App-Integration (Firestore) — Phase 2
Aktivitäten vom Desktop auf ein Mobilgerät dispatchen. Der Empfänger setzt den Erledigt-Status — und die Änderung fließt automatisch in die Desktop-App zurück. Differenzierungsmerkmal gegenüber klassischen Todo-Apps.

### MCP-Server / API-Zugang (VIP) — Phase 2
FancyPlan als MCP-Server: externe Tools (Claude, Automatisierungen, Skripte) können direkt auf Aktivitäten, Kontakte und Termine zugreifen. Schlüsselverwaltung in der App.

### Labels & Buttons anpassen (Stufe 2, VIP)
Alle UI-Texte, Labels und Button-Beschriftungen über das FCM-Modul ohne Programmierung überschreiben. Eigene Terminologie, eigene Unternehmenssprache.

### Eigene Hilfedateien verknüpfen (Stufe 2, VIP)
Hilfe-Button pro Formular mit eigener .docx, Firmen-Wiki-URL oder eigenem Hilfe-Formular belegen.

### White-Label / Branding (Premium-Release)
Vollständiges White-Label: eigenes Logo im Installer, eigener App-Name, eigene Icons. Für Berater und Unternehmen, die die App unter eigenem Namen ausliefern.

### macOS- und Linux-Build
electron-builder DMG (macOS) und AppImage (Linux) — technisch vorbereitet, noch nicht finalisiert.

---

## Technische Basis (kein Verkaufsargument, aber Vertrauen)

| Was | Womit |
|-----|-------|
| Plattform | Electron (Windows jetzt, macOS/Linux geplant) |
| UI | React + TypeScript + Vite |
| Datenbank | SQLite via better-sqlite3 (lokal, ohne Server) |
| Design | Midnight Executive (Dark) + Erdfarben + Tactile Precision — Theme-Switcher |
| Updates | electron-updater via GitHub Releases |
| Lizenz | Lemon Squeezy (Einmalzahlung / Abo, Free-Trial 60 Tage) |
