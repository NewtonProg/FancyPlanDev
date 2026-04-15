# Current Task: FancyPlan Shop Landingpage

**Datum:** 2026-04-15 (Tagesabschluss)
**Status:** Phase 1 abgeschlossen — bereit für Deployment

---

## Ziel
Statische Landingpage für den Verkauf von FancyPlan (Windows-Tool).
Primär: Kauf (Monat / Jahr) | Sekundär: Kostenlos starten
Umsatzziel: 1.000 EUR/Monat in 6 Monaten.

---

## Heute erledigt ✅ (2026-04-15)

### Landingpage (index.html)
- [x] Vollständige responsive Seite erstellt (alle Sektionen)
- [x] Design aus KnowCapture-Vorlage adaptiert (Teal #0d9488, Inter Font)
- [x] Inhalt aus FP LP Content.html integriert
- [x] Hero, Problem, Reframe, How-it-Works, Features, Use-Cases, Pricing, Trust, FAQ, Final CTA, Footer
- [x] Pricing: Free (0€) / Pro Monatlich (7€) / Pro Jährlich (49€, highlighted)
- [x] Mobile-Navigation mit Hamburger-Menü

### Assets & Branding
- [x] Favicon: `Fancy 16x16.ico` + `FancyPlan 256x256.ico`
- [x] Logo-Icon in Navigation: `assets/transparent/FP tr gr.png`
- [x] EU-Commission-Logo in Navigation (alle Seiten, 38px)
- [x] Hero: Echter App-Screenshot `FToday2.png` (Heute-Fokusansicht)
- [x] How-it-Works Schritt 1: Screenshot `FTreeEdit.png` (Baumstruktur)
- [x] How-it-Works Schritt 2: Screenshot `FAct_oben.png` (Aktivitäten)
- [x] How-it-Works Schritt 3: Screenshot `FToday1.png` (Fokus-Ansicht)

### Rechtliche Seiten
- [x] `impressum.html` — aus InPrimeShopDev adaptiert
- [x] `datenschutz.html` — FancyPlan-spezifisch (Windows-App, lokal, keine Cloud)
- [x] `agb.html` — Lieferung, Free-Tier, Kündigungsregelung angepasst
- [x] Alle rechtlichen Seiten: Logo-Icon + EU-Logo konsistent

### Projekt-Setup
- [x] Git-Repo initialisiert, 5 Commits angelegt
- [x] `tasks/current-task.md`, `tasks/decision-log.md`, `tasks/resume.md`

---

## Commits heute
| Hash | Beschreibung |
|---|---|
| `a0f54b8` | feat: Initial FancyPlan Shop Landingpage |
| `679e61d` | docs: Add resume.md |
| `1034b54` | feat: Add legal pages (Impressum, Datenschutz, AGB) |
| `aedfcc6` | feat: Integrate real app screenshots and brand assets |
| `d7a6c65` | style: EU-Logo auf allen Seiten um 25% vergrößert |

---

## Offen / Nächste Schritte 🔲

### KRITISCH — blockiert den Verkauf
- [ ] **Lemon Squeezy Store einrichten** und echte Checkout-URLs eintragen
  - `fancyplan.lemonsqueezy.com/checkout/buy/free` → ersetzen
  - `fancyplan.lemonsqueezy.com/checkout/buy/monthly` → ersetzen
  - `fancyplan.lemonsqueezy.com/checkout/buy/yearly` → ersetzen

### Deployment
- [ ] Netlify Projekt anlegen + Repo verknüpfen
- [ ] Custom Domain (z.B. fancyplan.de) einrichten
- [ ] `netlify.toml` erstellen (Redirects, Security-Header)

### Assets (optional / nice-to-have)
- [ ] `og:image` (1200×630 px) für Social Sharing erstellen
- [ ] Open Graph Meta-Tags in `<head>` ergänzen

### Analytics
- [ ] Plausible oder Fathom Analytics einbinden (DSGVO-konform)

### Impressum prüfen
- [ ] Firmendaten bestätigen (aktuell InPrime.Net / Tallinn)

### QA vor Go-Live
- [ ] Browser-Test: Chrome, Firefox, Edge
- [ ] Mobile-Test: iOS Safari, Android Chrome
- [ ] Lighthouse-Audit (Performance, SEO, Accessibility)
- [ ] Alle Lemon Squeezy Links live testen

---

## Preisstruktur (bestätigung ausstehend)
| Plan | Preis | Anmerkung |
|---|---|---|
| Free | 0 € | max. 10 Aufgaben, kein Fokus-Score |
| Pro Monatlich | 7 €/Monat | alle Features, jederzeit kündbar |
| Pro Jährlich | 49 €/Jahr (4,08 €/Mo) | 2 Monate gratis |

---

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Hauptseite (Landingpage) |
| `impressum.html` | Impressum |
| `datenschutz.html` | Datenschutzerklärung |
| `agb.html` | Allgemeine Geschäftsbedingungen |
| `assets/` | Screenshots, Icons, Logos |
| `tasks/decision-log.md` | Alle Architektur- und Designentscheidungen |
| `tasks/resume.md` | Prompt für nächste Session |
