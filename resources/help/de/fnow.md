# Aktivität bearbeiten (FNow)

Dieses Formular zeigt alle Details einer Aktivität und ermöglicht die vollständige Bearbeitung.

---

## Hauptbereich (linke Spalte)

### Titel
Der Titel der Aktivität. Frei editierbar — erscheint in allen Listen und der Tagesplanung.

### Kommentar
Kurzer Freitext zur Aktivität. Für schnelle Notizen ohne Formatierung.

### Text 1 und Text 2
Formatierbare Langtextfelder (Rich Text). Ideal für ausführliche Beschreibungen, Protokolle oder Verlaufsdokumentation.

**Tipp:** Doppelklick auf die Feldbezeichnung **Text 1** bzw. **Text 2** fügt automatisch das heutige Datum am Textanfang ein — praktisch für chronologische Einträge.

---

## Seitenleiste — Tabs

### Tab: Status

**Priorität 1 / Priorität 2**
Dropdown-Felder für die Einordnung der Aktivität nach Priorität. Die verfügbaren Werte sind im Customizing (FCM → Werte) formularspezifisch konfiguriert. Nur Werte, die für dieses Formular oder global (`*`) freigegeben sind, werden angezeigt.

**Plan von / Plan bis**
Zeitraum, in dem die Aktivität geplant ist (Plandatum 1 = Beginn, Plandatum 2 = Ende).

- **Doppelklick auf „Plan von"** setzt das Startdatum auf heute. Falls das Enddatum bereits in der Vergangenheit liegt, wird es automatisch proportional verschoben.

**Verbleibende Tage**
Wird automatisch aus Plan-bis berechnet. Farbanzeige:
- Rot: Fälligkeitsdatum überschritten (≤ 0 Tage)
- Gelb: morgen fällig (1 Tag)
- Normal: noch ausreichend Zeit

**Status**
Workflow-Status der Aktivität. Die Auswahl kann automatisch weitere Felder befüllen (Datum, Priorität, Text) — konfigurierbar im Customizing über FCM-Status-Regeln.

**Bereich / Thema / Kategorie**
Dreistufige Einordnung:
1. **Bereich** — oberste Gliederungsebene (filtert Themen)
2. **Thema** — Untergliederung (filtert Kategorien)
3. **Kategorie** — Feinstklassifikation; öffnet einen Auswahldialog (↗-Button)

**Baumstruktur**
Verknüpft die Aktivität mit einem Knoten im Projektbaum (FTree). Auswahl über den ↗-Button.

**Folgeaktivität**
Verweist auf eine andere Aktivität, die als Nachfolger gilt. Klick auf ↗ öffnet entweder die verknüpfte Aktivität direkt (Navigation) oder den Auswahldialog.

---

### Tab: Kontakt

Zeigt alle manuell verknüpften Ansprechpartner sowie Kontakte, die über die gewählte Kategorie automatisch zugeordnet werden.

- **Doppelklick** auf einen Kontakt öffnet dessen Detailformular.
- Pro Verknüpfung kann ein kurzer Kommentar hinterlegt werden.
- Neue Kontakte werden über das Suchfeld am Ende der Liste hinzugefügt.

---

### Tab: Links

Externe Verknüpfungen der Aktivität: Webseiten, Dateipfade, Netzlaufwerke, E-Mail-Adressen oder Social-Media-Profile. Verwaltung über das Link-Panel.

---

### Tab: Control

Steuerungsflags für den Workflow:

| Flag | Bedeutung |
|------|-----------|
| **Heute anzeigen** | Aktivität erscheint in der Tagesplanung |
| **Erledigt** | Markiert die Aktivität als abgeschlossen (deaktiviert „Heute anzeigen") |
| **In Arbeit** | Kennzeichnet aktive Bearbeitung |
| **Nur Info** | Aktivität ist eine reine Information, keine Aufgabe |
| **Detail-Log** | Zeichnet Feldänderungen in der Verlaufshistorie auf |

---

### Tab: Zugeordnet

Organisatorische Zuordnung der Aktivität:

- **Kostenstelle** — interne Kostenstelle
- **Delegiert an** — Auftrag / Verantwortlicher
- **Auftragsnummer** — Externe Referenznummer
- **Projektname** — Zugehöriges Projekt

---

### Tab: Termine

Verknüpft Kalendertermine mit der Aktivität.

- Oben: bereits verknüpfte Termine (mit Abtrenn-Button)
- Unten: Datumssuche — Datum wählen → **Suchen** → Termin aus der Ergebnisliste wählen

---

### Tab: Timer

Bis zu 4 unabhängige Zeiterfassungs-Timer pro Aktivität.

- **Start/Stopp** — startet bzw. stoppt die Zeiterfassung
- **Gesamt** — akkumulierte Gesamtzeit aller Sitzungen
- **Zurücksetzen** — löscht alle Timer-Daten (nicht rückgängig machbar)

Die Timer laufen auch wenn das Formular geschlossen ist, solange die App offen bleibt.

---

## Aktionen (Header)

| Schaltfläche | Funktion |
|---|---|
| **Speichern** | Speichert alle Änderungen und schließt das Formular |
| **Abbrechen** | Verwirft alle nicht gespeicherten Änderungen |
| **← Zurück** | Erscheint nur bei Navigation von einer Folgeaktivität — kehrt zur vorherigen Aktivität zurück |
