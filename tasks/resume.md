# Resume-Prompt — Nächste Session

**Zuletzt bearbeitet:** 2026-04-15  
**Aktueller Commit:** `a0f54b8` — feat: Initial FancyPlan Shop Landingpage  
**Branch:** master

---

## Kontext

Du entwickelst die statische Landingpage für **FancyPlan** — ein lokales Windows-Fokus-Tool (kein Server, kein Cloud-Zwang). Die Seite liegt in:
```
C:\Users\hwleo\Documents\Daten\Shop\Pro\FancyPlan\FancyPlanDev\
```

Hauptdatei: `index.html` — vollständige Landingpage, Phase 1 abgeschlossen.

Vorlage/Design: `C:\Users\hwleo\Documents\Daten\Shop\InPrimeShopDev\knowcapture\index.html`  
Content-Quelle: `C:\Users\hwleo\Documents\Daten\Shop\Pro\FancyPlan\FPContent\FP LP Content.html`

Zahlungsabwicklung: **Lemon Squeezy** (Checkout-URLs noch als Platzhalter)  
Deployment-Ziel: **Netlify**

---

## Was heute erledigt wurde

- index.html vollständig erstellt (alle Sektionen, responsiv, Vanilla HTML/CSS, Inter Font)
- Farbschema: Teal (#0d9488) — differenziert von KnowCapture (Indigo)
- Preisstruktur festgelegt: Free (0€), Pro Monatlich (7€), Pro Jährlich (49€)
- tasks/current-task.md aktualisiert
- tasks/decision-log.md erstellt (10 Entscheidungen dokumentiert)
- Git-Repo: erster Commit `a0f54b8`

---

## Nächste Schritte (Priorität)

### 1. KRITISCH — Lemon Squeezy URLs eintragen
Sobald der LS-Store eingerichtet ist, in `index.html` alle 3 Platzhalter ersetzen:
- `fancyplan.lemonsqueezy.com/checkout/buy/free` → echter Free-Checkout-Link
- `fancyplan.lemonsqueezy.com/checkout/buy/monthly` → echter Monats-Checkout-Link
- `fancyplan.lemonsqueezy.com/checkout/buy/yearly` → echter Jahres-Checkout-Link
- Nav-Link `https://app.fancyplan.de` → richtiger Download-/App-Link

### 2. Rechtliche Seiten erstellen (vor Go-Live Pflicht)
```
impressum.html
datenschutz.html
agb.html
```
Vorlage aus `C:\Users\hwleo\Documents\Daten\Shop\InPrimeShopDev\` nutzen falls vorhanden.

### 3. Netlify Deployment
- `netlify.toml` erstellen (404-Redirect, HTTP-Security-Header)
- Repo mit Netlify verknüpfen
- Custom Domain konfigurieren

### 4. Assets / Favicon
- `favicon.ico` und `favicon.svg` anlegen
- Open Graph Meta-Tags in `<head>` ergänzen (og:title, og:description, og:image)
- Wenn ein echter App-Screenshot verfügbar: Hero-Mockup ersetzen

### 5. Analytics
- Plausible oder Fathom einbinden (DSGVO-konform, kein Cookie-Banner)

### 6. QA
- Browser-Test: Chrome, Firefox, Edge
- Lighthouse-Audit
- Mobile-Test

---

## Wichtige Entscheidungen (Kurzfassung)

| # | Entscheidung |
|---|---|
| D-001 | Farbe: Teal #0d9488 (kein Indigo wie KnowCapture) |
| D-002 | Preise: 0€ / 7€/Mo / 49€/Jahr (bestätigung ausstehend) |
| D-003 | Pricing-Reihenfolge: Free | Jährlich (featured) | Monatlich |
| D-004 | Hero-Visual als CSS-Mockup (kein Screenshot verfügbar) |
| D-005 | LS-URLs als Platzhalter → vor Go-Live ersetzen |
| D-008 | Stack: Vanilla HTML + CSS, keine Frameworks |
| D-009 | Deployment: Netlify |

Details in: `tasks/decision-log.md`

---

## Wichtige Regel
Du verlässt das Verzeichnis `C:\Users\hwleo\Documents\Daten\Shop\` nur mit Zustimmung des Nutzers.
