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
- Free: 0 € (max. 10 Aufgaben, kein Fokus-Score)
- Pro Monatlich: 7 €/Monat
- Pro Jährlich: 49 €/Jahr (= 4,08 €/Monat, 2 Monate gratis)

**Begründung:** Preise wurden nicht in der Content-Vorlage festgelegt. 7 €/Monat liegt im typischen Bereich für Productivity-Tools (Todoist: 4–6 €, Notion: 10 €). 49 €/Jahr schafft einen Saving-Anreiz (≈ 35 % Rabatt vs. monatlich). Umsatzziel 1.000 €/Monat erreichbar mit ca. 143 Monatsabos oder 21 Jahresabos/Monat.

**Offen:** Preise müssen vom Eigentümer vor Go-Live final bestätigt werden.

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
**Entscheidung:** `sapco.cslt@gmail.com` aus dem User-Profil als Support-/Kontakt-E-Mail verwendet.  
**Begründung:** Keine dedizierte FancyPlan-Kontaktadresse bekannt. Vor Go-Live ggf. durch eine produktspezifische Adresse ersetzen (z.B. hello@fancyplan.de).
