# Decision Log — FancyPlan Shop Landingpage

---

## 2026-04-15

### D-001: Farbschema
**Entscheidung:** Primärfarbe Teal (#0d9488) — nicht Indigo wie bei KnowCapture  
**Begründung:** FancyPlan ist ein eigenständiges Produkt im InPrime-Portfolio. Teal/Smaragdgrün signalisiert Fokus, Klarheit und Produktivität. Differenziert visuell von KnowCapture (#6366f1 Indigo).  
**Alternative verworfen:** Gelb/Amber (zu wenig professionell für IT-Zielgruppe), Blau (zu generisch).

---

### D-002: Preisstruktur
**Entscheidung:**
- Free: 0 € (max. 10 Aufgaben)
- Pro Monatlich: 19 €/Monat (LS Variant-ID: 1536198)
- Pro Jährlich: 180 €/Jahr (= 15 €/Monat, spart 48 €) (LS Variant-ID: 1536243)

**Begründung:** Preise vom Eigentümer über Lemon Squeezy Produkte festgelegt und bestätigt (2026-04-15). Ursprünglicher Entwurf (7 €/19 €) wurde durch die echten LS-Produktdaten ersetzt. Sparanreiz: 19 € × 12 = 228 € vs. 180 € = 48 € gespart.

---

### D-003: Layout — Pricing-Reihenfolge
**Entscheidung:** Reihenfolge Pricing-Cards: Free | Jährlich (featured) | Monatlich  
**Begründung:** Jährlich in der Mitte = höchste Aufmerksamkeit (F-Pattern). „Empfohlen"-Badge erzeugt Druck Richtung Jahresabo. Primäres Conversion-Ziel ist Kauf, sekundär Free. Monatlich rechts = Alternative für preissensible Nutzer.

---

### D-004: Hero — UI-Mockup statt Screenshot
**Entscheidung:** Hero-Visual als CSS-generiertes UI-Mockup, kein echtes App-Screenshot.  
**Begründung:** Kein Screenshot der echten App verfügbar. CSS-Mockup funktioniert responsiv ohne Bilddateien, zeigt den Kernnutzen (Fokus-Ansicht, 3 priorisierte Tasks, Fokus-Score) visuell und lädt sofort. Soll durch echten Screenshot ersetzt werden, sobald verfügbar.

---

### D-005: Lemon Squeezy URL-Platzhalter
**Entscheidung:** Lemon Squeezy Checkout-URLs als semantische Platzhalter gesetzt (`fancyplan.lemonsqueezy.com/checkout/buy/free` etc.)  
**Begründung:** Echte URLs aus dem Lemon Squeezy Dashboard waren zum Entwicklungszeitpunkt nicht verfügbar. Platzhalter sind eindeutig benannt und einfach auszutauschen. Vor Go-Live müssen alle 3 URLs (free, monthly, yearly) ersetzt werden.

---

### D-006: Rechtliche Seiten als separate Dateien
**Entscheidung:** `impressum.html`, `datenschutz.html`, `agb.html` als separate Dateien verlinkt — noch nicht erstellt.  
**Begründung:** Pflichtangaben nach deutschem Recht (TMG, DSGVO). Da Inhalte individuell und rechtlich geprüft sein müssen, werden diese separat erstellt. Aktuell verlinkt aber noch nicht angelegt (kein roter Link, da statisch).

---

### D-007: Analytics
**Empfehlung:** Plausible Analytics oder Fathom (statt Google Analytics)  
**Begründung:** DSGVO-konform, kein Cookie-Banner erforderlich, ideal für deutsche Zielgruppe. Entscheidung und Einbindung steht noch aus.

---

### D-008: Technologie-Stack
**Entscheidung:** Reines HTML + CSS (Vanilla), keine externen Frameworks außer Google Fonts Inter  
**Begründung:** Maximale Ladegeschwindigkeit, keine JS-Abhängigkeiten, Lighthouse-Score-freundlich. Design-Vorlage (KnowCapture) arbeitet ebenfalls mit Vanilla CSS. Einzige externe Ressource: Google Fonts (Inter).

---

### D-009: Deployment-Ziel
**Entscheidung:** Netlify als Deployment-Plattform (analog zu KnowCapture)  
**Begründung:** Bereits im InPrime-Stack vorhanden (KnowCapture-Vorlage referenziert Netlify). Statisches Hosting, automatische HTTPS, CI/CD über Git. Konfiguration steht noch aus.

---

### D-010: Kontakt-E-Mail
**Entscheidung:** `sapco.cslt@gmail.com` als Support-/Kontakt-E-Mail verwendet.  
**Begründung:** Keine dedizierte FancyPlan-Kontaktadresse bekannt. Vor Go-Live ggf. durch eine produktspezifische Adresse ersetzen (z.B. hello@fancyplan.de).

---

## 2026-04-16

### D-011: Kostenlos-Download über eigene Seite (nicht LS)
**Entscheidung:** Free-Version wird über `download.html` auf Netlify bereitgestellt, kein Lemon Squeezy Free-Produkt.  
**Begründung:** Lemon Squeezy unterstützt keine echten kostenlosen Produkte ohne Workarounds. Eigene Download-Seite ist einfacher, schneller und braucht kein Payment-Gateway. Alle „Kostenlos starten"-CTAs zeigen auf `download.html`.

---

### D-012: Lizenzschlüssel-Infrastruktur (CSV/Webhook) — gebaut, aber nicht aktiv für v1
**Entscheidung:** Webhook-Handler (`ls-webhook.js`), CSV-Dateien und Netlify Blobs wurden gebaut und committed, werden für v1 aber nicht aktiv genutzt.  
**Begründung:** FancyPlan verwendet hardwaregebundene Lizenzkeys (CPU-ID-basiert). Keys können daher nicht vorgeneriert werden — der CSV-Ansatz ist mit diesem Modell nicht kompatibel. Infrastruktur bleibt im Repo für v2.

---

### D-013: Lizenzkey-Vergabe v1 — manueller Flow
**Entscheidung:** Pro-Keys werden in v1 manuell vergeben.  
**Flow:**
1. User kauft auf Website (Lemon Squeezy)
2. User öffnet FancyPlan → In-App-Dialog → sendet CPU-ID per E-Mail an Entwickler
3. Entwickler generiert Key manuell aus CPU-ID → sendet per E-Mail zurück
4. User gibt Key im App-Dialog ein → Pro aktiv

**Begründung:** Hardwaregebundene Keys (CPU-ID) lassen sich nicht automatisiert vorgenerieren. Manueller Flow ist für den Start (<20 Verkäufe/Monat) vertretbar. Automatisierung wird in v2 angegangen.

---

### D-014: Lizenzkey-Automatisierung — verschoben auf v2
**Entscheidung:** Vollautomatische Key-Vergabe über Lemon Squeezy Native Keys wird auf v2 verschoben.  
**Ziel v2:** App-seitige Validierung von CPU-ID-Bindung auf LS Native Keys umschreiben → LS generiert und versendet Keys nach Kauf automatisch, keine manuelle Intervention.  
**Begründung:** Erfordert App-Code-Änderung. Entwickler kennt die Lizenz-Key-Programmierung gut → Aufwand in v2 überschaubar. Auslöser: wenn ~20 Verkäufe/Monat erreicht werden und manueller Flow zum Engpass wird.
