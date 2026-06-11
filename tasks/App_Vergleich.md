# FancyPlan — Applikationsvergleich & Wettbewerbs-Analyse

> Stand: Juni 2026 | Ziel: Positionierung schärfen, Lücken kennen, Stärken vermarkten

---

## 1. Marktüberblick — relevante Wettbewerber

| App | Kategorie | Stärkstes Segment | Preis (ca.) |
|-----|-----------|------------------|-------------|
| **Notion** | All-in-One Wiki + Datenbank + Tasks | Teams, Freelancer, Studenten | Free / ab 10 $/Mo |
| **Obsidian** | Local-first Notes + Plugins | Wissensarbeiter, PKM | Free / Sync 8 $/Mo |
| **Todoist** | To-do-App | Privatnutzer, kleine Teams | Free / ab 4 $/Mo |
| **TickTick** | To-do + Kalender | Privatnutzer, produktivitätsfokussiert | Free / ab 3 $/Mo |
| **Things 3** | Mac/iOS To-do | Apple-Ökosystem, Design-Fokus | 50 € einmalig |
| **OmniFocus 4** | GTD Power-User | Mac/iOS Power-User | ab 100 $/Jahr |
| **Microsoft To Do** | Einfache Aufgaben | Microsoft 365 Nutzer | inklusive M365 |
| **Asana** | Projektmanagement | Kleine bis mittlere Teams | Free / ab 11 $/Mo |
| **ClickUp** | Alles-in-einem PM | Teams, Freelancer | Free / ab 7 $/Mo |
| **Linear** | Ticket-System (Dev) | Software-Entwicklungsteams | Free / ab 8 $/Mo |
| **Jira** | Enterprise Tickets | IT-Abteilungen, Agile Teams | ab 8,15 $/User/Mo |
| **Trello** | Kanban-Boards | Einfache Projektorganisation | Free / ab 5 $/Mo |

---

## 2. FancyPlan vs. Notion — Detailvergleich

### FancyPlan-Stärken gegenüber Notion

| Kriterium | FancyPlan | Notion |
|-----------|-----------|--------|
| **Datenhaltung** | ✅ Lokal, SQLite, Ihre Datei, kein Cloud-Zwang | ☁️ Cloud-only, Daten auf Notion-Servern |
| **Offline-Betrieb** | ✅ Vollständig offline, dauerhaft | ⚠️ Eingeschränkt (nur gecachte Pages) |
| **Datenverschlüsselung** | ✅ AES-256 für sensible Felder (FMyData), Challenger-Integration | ❌ Notion verschlüsselt nicht Ende-zu-Ende |
| **IMAP-Mail** | ✅ Vollständig integriert (lesen, senden, Anhänge) | ❌ Keine Mail-Integration |
| **Google Calendar Sync** | ✅ OAuth2, live getestet, Serientermine | ⚠️ Nur über Drittanbieter-Integration |
| **CalDAV-Support** | ✅ iCloud, Nextcloud, Radicale | ❌ Nicht vorhanden |
| **Kontaktverwaltung** | ✅ 99 Felder, vollständige Adressdatenbank | ❌ Rudimentär (nur Relations-DB) |
| **Aktivitäts-Tiefe** | ✅ 173 Felder, 8 Tabs, Statusautomatik | ❌ Freitext-DB, kein strukturiertes Workflow-Modell |
| **Statusautomatik (FCMStatus)** | ✅ Automatische Feldpflege bei Statuswechsel | ❌ Nur manuelle Formulas, keine Seiteneffekte |
| **MS Access Import** | ✅ Direktimport aus .accdb | ❌ Nur CSV/Markdown-Import |
| **Admin-Rechte** | ✅ Kein Admin nötig, läuft als Standardbenutzer | ✅ Web-App, kein Installer |
| **Einmalzahlung möglich** | ✅ Lemon Squeezy, kein Abo-Zwang | ❌ Nur Abo-Modell |
| **DSGVO / Datenschutz** | ✅ Daten verlassen den Rechner nicht | ⚠️ US-Server, Privacy Shield-Problematik |
| **Baumstruktur (PSP)** | ✅ 6 Ebenen, Drag & Drop, Gantt-Timeline | ⚠️ Hierarchische Pages, kein echter PSP |
| **Prioritätssystem** | ✅ 3 konfigurierbare Prio-Ebenen je Bereich | ⚠️ Nur manuelle Properties |

### Notion-Stärken — FancyPlan-Lücken

| Kriterium | Notion | FancyPlan heute |
|-----------|--------|-----------------|
| **Zusammenarbeit** | ✅ Real-Time Multi-User, Kommentare, @Mentions | ❌ Single-User only |
| **Web-Zugang** | ✅ Jeder Browser, jedes Gerät | ❌ Nur Windows Desktop |
| **Mobile Apps** | ✅ iOS + Android, vollständig | ❌ Keine (Firestore-Lösung in Planung) |
| **Block-Editor (Docs)** | ✅ Markdown, Seiten, Datenbanken, Galerien | ❌ Kein freier Seiteneditor |
| **Notion AI** | ✅ KI-Zusammenfassungen, Autovervollständigung | ❌ Keine KI-Features |
| **Kanban-Board** | ✅ Vollständig, mit Swimlanes | ❌ Nicht vorhanden |
| **Öffentliche Seiten** | ✅ Page teilen, Web-Publishing | ❌ Nicht vorhanden |
| **Templates-Marktplatz** | ✅ 10.000+ Community-Templates | ❌ Keine Templates |
| **Integrations-Ökosystem** | ✅ Zapier, Make, Slack, GitHub, 5.000+ | ❌ Keine (MCP in Planung) |
| **Datenbankformeln** | ✅ Komplex, Excel-ähnlich | ❌ Nicht vorhanden |
| **Sub-Tasks** | ✅ Verschachtelte Tasks mit Relations | ⚠️ Nur Baumknoten-Zuordnung |
| **Web Clipper** | ✅ Browser-Extension, Inhalte einklipsen | ❌ Nicht vorhanden |
| **Galerie-/Board-Ansicht** | ✅ Table, Kanban, Calendar, Gallery, Timeline | ⚠️ Nur Liste und Baum-Timeline |
| **Sprachen** | ✅ Englisch, Japanisch, Koreanisch, Französisch | ⚠️ Nur Deutsch |

---

## 3. Feature-Lücken gegenüber dem Markt (alle Wettbewerber)

### Kritisch — Blockiert Zielgruppen-Expansion

| Lücke | Betrifft | Gegner die es haben |
|-------|----------|---------------------|
| **Keine mobile App** | Alle Nutzer die unterwegs arbeiten | Todoist, TickTick, Notion, Things, OmniFocus, ClickUp |
| **Kein Web-Zugang** | Nutzer an fremden/Firmen-PCs | Notion, ClickUp, Asana, Todoist |
| **Kein Kanban-Board** | Visuell denkende Nutzer, Projektmanager | Trello, Asana, ClickUp, Notion, Linear |
| **Keine Zusammenarbeit** | Teams, Freelancer mit Kundenprojekten | Alle außer Things 3 |

### Bedeutsam — Schwächt Conversion-Rate

| Lücke | Betrifft | Gegner die es haben |
|-------|----------|---------------------|
| **Kein KI-Assistent** | Produktivitäts-affine Nutzer 2025+ | Notion AI, Copilot in M365, ClickUp AI |
| **Keine Recurring Tasks mit UI** | Nutzer mit wiederkehrenden Aufgaben | Todoist, TickTick, Things, OmniFocus |
| **Keine Aufgaben-Kommentare** | Team-Feedback-Loops | Asana, Jira, ClickUp, Linear |
| **Keine Dateianhänge an Tasks** | Dokumenten-orientierte Workflows | Notion, ClickUp, Asana |
| **Keine REST-API / Webhooks** | Entwickler, Automatisierungs-Nutzer | Notion, Linear, Asana, ClickUp |
| **Keine Zapier/Make-Integration** | Low-Code-Automatisierer | Fast alle SaaS-Tools |
| **Keine öffentlichen Templates** | Onboarding, Community-Aufbau | Notion, ClickUp, Asana |
| **Kein macOS/Linux** | Non-Windows-Nutzer | Alle Web-Apps, Things 3 (Mac only) |

### Kleiner, aber im Vergleich sichtbar

| Lücke | Betrifft | Gegner die es haben |
|-------|----------|---------------------|
| **Keine Inline-Markdown-Eingabe** | Note-taker, Markdown-Gewöhnte | Obsidian, Notion, ClickUp |
| **Kein Dark/Light-Mode-Toggle pro View** | UI-Präferenz-Nutzer | Notion, Obsidian, ClickUp |
| **Kein Time-Tracking-Report** | Freelancer (Abrechnung) | TickTick, ClickUp, Toggl-Integration |
| **Kein Web Clipper** | Recherche-Workflows | Notion, Obsidian |
| **Keine Multi-Sprachen außer DE** | Internationaler Markt | Alle großen Apps |
| **Kein Whiteboard / Mindmap** | Brainstorming-Workflows | Notion (basic), Miro, ClickUp |

---

## 4. FancyPlan-Alleinstellungsmerkmale — niemand macht das besser

Diese Features hat kein direkter Wettbewerber in dieser Kombination:

| USP | Warum einzigartig |
|-----|------------------|
| **Lokal + Mail + Kalender + Kontakte in einem** | Notion hat kein Mail. Todoist hat keinen echten Kalender. Thunderbird hat keine Aufgaben. FancyPlan verbindet alles. |
| **Kein Admin-Recht nötig** | Für Unternehmenseinzelarbeitsplätze ohne IT-Freigabe — kein anderes Tool positioniert sich explizit so |
| **MS Access Migration** | Tausende Access-Nutzer suchen einen Nachfolger — niemand außer FancyPlan migriert .accdb direkt |
| **Statusautomatik (FCMStatus)** | Workflow-Automation auf Feldebene ohne Code, ohne Zapier — integriert und offline |
| **AES-256 für sensible Felder** | Passwörter + Kontonummern in der gleichen App wie Aufgaben — DSGVO-konform, lokal |
| **Corporate-Deploy ohne UAC** | FancyPlan läuft in gesperrten Windows-Umgebungen — kein Wettbewerber ist so explizit für diesen Case gebaut |
| **3 konfigurierbare Prio-Ebenen** | Komplexes Prioritätenmodell (TPrio1/2/3) mit themenabhängigen Statuslisten — weit über "Hoch/Mittel/Niedrig" hinaus |

---

## 5. Positionierung — Wer ist die Zielgruppe?

FancyPlan ist **kein Notion-Konkurrent für Teams**. FancyPlan ist der Nachfolger von MS Access-basierter Einzelplatzverwaltung für:

- **Mittelstand-Einzelarbeitsplätze:** Controller, Projektsteuerer, Selbstständige, die komplexe Access-Lösungen betreiben
- **Freelancer & Berater** die Kundenprojekte, Kontakte und Mail strukturiert verwalten wollen — lokal und DSGVO-konform
- **Power-User in gesperrten IT-Umgebungen** die kein SaaS installieren dürfen oder wollen
- **Deutschsprachiger Markt** mit spezifischen Anforderungen: Kostenstellen, Aufträge, Projekte, PSP-Strukturen

---

## 6. Empfehlung — Nächste Schritte Vermarktung & Verkauf

### Schritt 1 — Positionierung schärfen (sofort, 1–2 Wochen)

**Botschaft auf den Punkt bringen:**
> "FancyPlan ist der einzige lokale Desktop-Planer, der Aufgaben, Kontakte, Mail und Kalender verbindet — ohne Cloud, ohne Admin-Rechte, ohne Abo-Zwang."

- Landing Page erstellen (Lemon Squeezy bietet einfache Produkt-Pages; besser: eigene statische Seite mit GitHub Pages oder Netlify)
- Die 3 Top-USPs in jeder Headline: **Lokal. Privat. Vollständig.**
- Konkret auf den MS Access-Nachfolger-Case eingehen: "Sie nutzen noch MS Access für Ihre Planung?" als Headline-Einstieg

### Schritt 2 — Zielgruppen-Kanäle öffnen (Woche 2–4)

**Deutschsprachige Kanäle:**
- **LinkedIn (DE):** Artikel "Warum ich meine Access-Planung durch ein modernes Desktop-Tool ersetzt habe" — persönlich, kein Werbetext
- **XING-Gruppen:** Gruppen für Selbstständige, Projektmanager, Unternehmensberater
- **Reddit r/productivity, r/selfhosted:** Englischsprachig, aber hohe organische Reichweite für "local-first" Tools
- **Hacker News (Show HN):** "Show HN: FancyPlan — local-first task manager with mail + calendar, no admin rights needed" — ideal für die corporate-use-case Story

**Communities mit konkretem Bedarf:**
- MS Access User Groups (FAUG, diverse LinkedIn-Gruppen)
- "Local-first software" Community (localfirstweb.dev, Discord)
- Obsidian/PKM-Community (Nutzer die lokale Tools schätzen)

### Schritt 3 — Demo-Content erstellen (Woche 3–6)

Die stärksten Features brauchen visuelle Beweise:

| Content | Botschaft | Format |
|---------|-----------|--------|
| Screen-Recording: Mail aus Aktivität senden | "Alles in einem — ohne Tab-Wechsel" | 60-Sek-Video |
| Screen-Recording: Google Calendar Sync | "91 Termine in Sekunden — ohne App-Review" | 30-Sek-GIF |
| Screen-Recording: Installation ohne UAC | "Kein IT-Helpdesk, kein Warten" | 45-Sek-Video |
| Vergleichsgrafik FancyPlan vs. Notion | "Lokal gewinnt" | Infografik |
| MS Access → FancyPlan Import | "Ihre Daten. Jetzt modern." | Artikel + GIF |

### Schritt 4 — Product Hunt Launch vorbereiten (Woche 4–8)

Product Hunt ist der Standard-Launchpad für Desktop-Apps. Vorbereitung:
- Hunter finden (jemand mit Follower-Basis der das Produkt einreicht)
- Launch-Tag: Dienstag oder Mittwoch (höchste Aktivität)
- Tagline: "Local-first task manager: activities, contacts, mail & calendar — no cloud, no admin rights"
- First Comment: die Geschichte ("migrated from MS Access after 15 years")

### Schritt 5 — Conversion-Optimierung (laufend)

- **Trial-Dauer prüfen:** 60 Tage Trial ist lang — gut für organisches Wachstum, aber: Onboarding-E-Mail-Sequenz (Lemon Squeezy unterstützt das) um Trial-Nutzer zur Aktivierung zu führen
- **Feedback früh sammeln:** In-App-Feedback-Button (öffnet mailto: direkt) einbauen — wertvolles Signal in der Early-Phase
- **Testimonials:** Die ersten zahlenden Nutzer aktiv um Bewertung bitten (G2, Capterra, AppSumo)

### Schritt 6 — AppSumo-Deal prüfen (Monat 2–3)

AppSumo ist für Einmalzahlungs-Desktop-Apps ein starker Kanal:
- Große Reichweite bei "lifetime deal"-affinen Käufern
- Einmalzahlung passt zum FancyPlan-Modell
- Risiko: Nutzer-Volumina können Prioritätenliste beeinflussen — erst nach stabilem Release angehen
- Alternative: Gumroad oder eigene Lifetime-Deal-Aktion auf der Landing Page

### Schritt 7 — Feature-Lücken priorisieren (parallel, nach Launch)

Aus der Delta-Liste die wichtigsten Lücken angehen — Reihenfolge nach Marktdruck:

| Priorität | Feature | Warum jetzt |
|-----------|---------|-------------|
| 1 | **Mobile-App (Firestore)** | Größte Einzellücke vs. alle Wettbewerber; Firestore-Grundlage ist geplant |
| 2 | **Kanban-Board-Ansicht** | Visuelle Nutzer, die Trello/Notion kennen, erwarten das |
| 3 | **REST-API / MCP-Server** | Differenzierungsmerkmal für Power-User + AI-Integration (Claude etc.) |
| 4 | **Aufgaben-Kommentare** | Einfachste Kollaboration-Geste; senkt Hemmschwelle für Freelancer |
| 5 | **macOS-Build finalisieren** | Erschließt zweite große Desktop-Plattform |

---

## Zusammenfassung der Kernbotschaft für alle Kanäle

> **"FancyPlan macht, was Notion, Todoist und Outlook zusammen nicht können: alles lokal, kein Cloud-Zwang, kein Admin-Recht, kein Abo — Ihre Daten gehören Ihnen."**
