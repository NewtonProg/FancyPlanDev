# Resume-Prompt — Nächste Session

**Letzter Arbeitstag:** 2026-04-15
**Letzter Commit:** `d7a6c65` — style: EU-Logo auf allen Seiten um 25% vergrößert
**Branch:** master (5 Commits)

---

## Kontext

Du entwickelst die statische Landingpage für **FancyPlan** — ein lokales Windows-Fokus-Tool (kein Server, kein Cloud-Zwang). Entwicklungsverzeichnis:

```
C:\Users\hwleo\Documents\Daten\Shop\Pro\FancyPlan\FancyPlanDev\
```

**Dateien:**
- `index.html` — vollständige Landingpage ✅
- `impressum.html`, `datenschutz.html`, `agb.html` — rechtliche Seiten ✅
- `assets/` — Screenshots, Icons, EU-Logo (alle eingebunden)
- `tasks/current-task.md` — vollständiger Status
- `tasks/decision-log.md` — alle Designentscheidungen

**Vorlage/Design:** `C:\Users\hwleo\Documents\Daten\Shop\InPrimeShopDev\knowcapture\index.html`
**Zahlungsabwicklung:** Lemon Squeezy (URLs aktuell Platzhalter)
**Deployment-Ziel:** Netlify

---

## Was heute fertig wurde

- Vollständige Landingpage (alle Sektionen, responsiv, Vanilla HTML/CSS)
- Echte App-Screenshots im Hero und in der How-it-Works-Sektion
- FancyPlan Logo-Icon + EU-Commission-Logo in der Navigation (alle Seiten)
- Favicon (16px + 256px ICO)
- Alle 3 rechtlichen Seiten (Impressum, Datenschutz, AGB)
- 5 Git-Commits

---

## Nächste Schritte (Priorität)

### 1. KRITISCH — Lemon Squeezy URLs eintragen
In `index.html`, `impressum.html`, `datenschutz.html`, `agb.html` alle Vorkommen von Platzhaltern ersetzen:
- `fancyplan.lemonsqueezy.com/checkout/buy/free` → echter Free-Link
- `fancyplan.lemonsqueezy.com/checkout/buy/monthly` → echter Monats-Link
- `fancyplan.lemonsqueezy.com/checkout/buy/yearly` → echter Jahres-Link

### 2. Netlify Deployment
- `netlify.toml` erstellen
- Repo mit Netlify verknüpfen
- Custom Domain einrichten

### 3. Open Graph Meta-Tags
In `<head>` von `index.html` ergänzen:
```html
<meta property="og:title" content="FancyPlan | Jeden Tag wissen, was wirklich zählt." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://fancyplan.de/assets/og-image.png" />
<meta property="og:url" content="https://fancyplan.de" />
```
Dazu: `og-image.png` (1200×630 px) erstellen.

### 4. Analytics
Plausible oder Fathom einbinden (DSGVO-konform, kein Cookie-Banner).

### 5. Impressum-Firmendaten bestätigen
Aktuell steht InPrime.Net / Hans Waschinski / Tallinn drin.
Falls FancyPlan unter anderem Rechtssubjekt läuft → anpassen.

### 6. QA
Browser-Test, Mobile-Test, Lighthouse-Audit.

---

## Wichtige Entscheidungen
| # | Entscheidung |
|---|---|
| D-001 | Farbe: Teal #0d9488 |
| D-002 | Preise: 0€ / 7€/Mo / 49€/Jahr (bestätigung ausstehend) |
| D-003 | Pricing: Free \| Jährlich (featured) \| Monatlich |
| D-008 | Stack: Vanilla HTML + CSS |
| D-009 | Deployment: Netlify |

Alle Details: `tasks/decision-log.md`

---

## Regel
Das Verzeichnis `C:\Users\hwleo\Documents\Daten\Shop\` nur mit Zustimmung des Nutzers verlassen.
