# Current Task: FancyPlan Shop Landingpage

**Datum:** 2026-04-15  
**Status:** In Entwicklung — Phase 1 abgeschlossen

---

## Ziel
Statische Landingpage für den Verkauf von FancyPlan (Windows-Tool) mit primärer Conversion-Ziel: Kauf (Monat / Jahr), sekundär: Kostenlos starten. Umsatzziel: 1.000 EUR/Monat in 6 Monaten.

---

## Abgeschlossen ✅

- [x] index.html erstellt — vollständige Landingpage mit allen Sektionen
- [x] Design aus KnowCapture-Vorlage übernommen und für FancyPlan adaptiert
- [x] Inhalt aus FP LP Content.html integriert
- [x] Responsives Layout (Mobile / Tablet / Desktop)
- [x] Sticky Navigation mit Mobile-Menu (Hamburger)
- [x] Hero-Sektion mit interaktivem UI-Mockup
- [x] Problem-Sektion (4 Karten)
- [x] Reframe-Sektion (dunkel, Vorteile)
- [x] How-It-Works (3 Schritte)
- [x] Feature-Grid (6 Features, Free vs. Pro markiert)
- [x] Use-Cases (Zielgruppen-Tags)
- [x] Pricing (3 Karten: Free / Pro Monatlich / Pro Jährlich — Jährlich highlighted)
- [x] Trust-Section (4 Vertrauenspunkte)
- [x] FAQ (7 Fragen, expandierbar)
- [x] Final CTA (dunkler Hintergrund, Druck-Closing)
- [x] Footer mit Links
- [x] Git-Repo initialisiert, erster Commit angelegt

---

## Offen / Nächste Schritte 🔲

### Lemon Squeezy — KRITISCH (blockiert Verkauf)
- [ ] **Lemon Squeezy Store einrichten** (falls noch nicht vorhanden)
- [ ] **Free-Plan Checkout-URL** eintragen → `index.html` Zeilen mit `fancyplan.lemonsqueezy.com/checkout/buy/free`
- [ ] **Pro Monatlich Checkout-URL** eintragen → `fancyplan.lemonsqueezy.com/checkout/buy/monthly`
- [ ] **Pro Jährlich Checkout-URL** eintragen → `fancyplan.lemonsqueezy.com/checkout/buy/yearly`
- [ ] **Nav-Link "Kostenlos starten"** → URL anpassen (`href="https://app.fancyplan.de"` aktuell Platzhalter)

### Deployment
- [ ] **Netlify** Projekt anlegen, Repo verknüpfen
- [ ] Custom Domain einrichten (z.B. fancyplan.de)
- [ ] `netlify.toml` konfigurieren (Redirects, Header)

### Rechtliches (Pflicht vor Go-Live)
- [ ] `impressum.html` erstellen
- [ ] `datenschutz.html` erstellen (DSGVO)
- [ ] `agb.html` erstellen

### Assets / Branding
- [ ] Logo / Icon für FancyPlan (SVG oder PNG, 32x32 + 512x512)
- [ ] Favicon (`favicon.ico` / `favicon.svg`)
- [ ] Optional: Screenshot der echten App → im Hero ersetzen (aktuell UI-Mockup in CSS)
- [ ] `og:image` für Social Sharing (1200×630 px)
- [ ] Open Graph Meta-Tags ergänzen

### Tracking / Analytics
- [ ] Plausible oder Fathom Analytics einbinden (DSGVO-konform, kein Cookie-Banner)

### Qualitätssicherung
- [ ] Browser-Test: Chrome, Firefox, Edge
- [ ] Mobile-Test: iOS Safari, Android Chrome
- [ ] Lighthouse-Audit durchführen (Performance, SEO, Accessibility)
- [ ] Alle Links prüfen (Lemon Squeezy URLs live testen)

---

## Preisstruktur (Entscheidung 2026-04-15)
| Plan | Preis | Basis |
|---|---|---|
| Free | 0 € | max. 10 Aufgaben, kein Fokus-Score |
| Pro Monatlich | 7 €/Monat | unbegrenzt, alle Features |
| Pro Jährlich | 49 €/Jahr (4,08 €/Monat) | 2 Monate gratis vs. Monatlich |

---

## Wichtige Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Hauptseite (Landingpage) |
| `tasks/current-task.md` | Dieser Status |
| `tasks/decision-log.md` | Architektur- und Designentscheidungen |
| `tasks/resume.md` | Prompt für nächste Session |
