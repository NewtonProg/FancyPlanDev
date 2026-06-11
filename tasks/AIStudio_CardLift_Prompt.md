# Google AI Studio – Prompt: „Anheben"-Effekt für Aktivitäts-Karten (Android / Kotlin)

> Diesen Block 1:1 in Google AI Studio einfügen. Er ergänzt **nur** einen Interaktions-Effekt
> für die Aktivitäts-Karten der FancyPlan Mobile App (Kotlin + Jetpack Compose). **Es darf sich
> nichts am bestehenden Design ändern** – keine Farben, Hintergründe, Rahmenfarben, Schriften,
> Abstände oder Layouts. Ausschließlich Bewegung/Schatten (Elevation) kommt hinzu.

---

## ZIEL

Die Desktop-Version von FancyPlan hat in der Heute-Ansicht (FToday) einen schönen Effekt:
Beim Hovern „heben sich" die Aktivitäts-Karten leicht an – sie wandern nach oben, werden
minimal größer und werfen einen stärkeren Schatten. Dieser Effekt soll **identisch wirkend**
in die Mobile-App übernommen werden.

Da Touch-Geräte **kein Hover** kennen, wird der Effekt **beim Berühren/Drücken** der Karte
ausgelöst (Pressed-State): Karte hebt sich an, solange der Finger sie drückt, und federt beim
Loslassen sanft zurück. Optional darf zusätzlich beim ersten Erscheinen einer Karte dieselbe
Anhebe-Animation einmal kurz abgespielt werden – aber nur, falls das ruhig wirkt.

---

## EXAKTE EFFEKT-WERTE (vom Desktop übernehmen)

Ruhezustand → angehoben:
- **Verschiebung nach oben:** `translationY` von `0.dp` auf **`-6.dp`**.
- **Skalierung:** `scaleX`/`scaleY` von `1.0f` auf **`1.01f`** (sehr dezent, vom Mittelpunkt aus).
- **Schatten/Elevation:** von einem ruhigen Grundschatten auf einen deutlich stärkeren,
  weicheren Schatten (z. B. `shadow`-Elevation von ca. **`2.dp`** auf ca. **`16.dp`**,
  großzügiger Radius, weiche Kante). Werte so wählen, dass es wie „abgehoben/schwebend" wirkt.
- **Animation/Easing:** weicher Übergang, Dauer **~400 ms**, Easing **`FastOutSlowInEasing`**
  (entspricht der Desktop-Kurve `cubic-bezier(0.4, 0, 0.2, 1)`).

---

## UMSETZUNG (Compose)

- An jeder Aktivitäts-Karte eine `MutableInteractionSource` verwenden und
  `interactionSource.collectIsPressedAsState()` auslesen.
- Mit `animateDpAsState` / `animateFloatAsState` (jeweils `animationSpec = tween(400, easing = FastOutSlowInEasing)`)
  die Zielwerte für `translationY`, `scale` und Elevation zwischen Ruhe- und Pressed-Zustand
  animieren.
- Transform über `Modifier.graphicsLayer { translationY = ...; scaleX = ...; scaleY = ... }`,
  Schatten über `Modifier.shadow(elevation = animierteElevation, shape = <die bereits genutzte Karten-Form>, clip = false)`.
- Reihenfolge der Modifier so, dass der Schatten zusammen mit der Karte angehoben wird
  (Schatten/Transform **vor** Hintergrund/Clip anwenden, damit nichts abgeschnitten wird).
- Die Karte muss weiterhin auf Tap reagieren (Detail/FNow öffnen) – die `interactionSource`
  am vorhandenen `clickable(...)` registrieren, damit Press-Lift und Klick zusammen funktionieren.

---

## STRIKTE EINSCHRÄNKUNGEN

- **Keine** Änderung an Farben, Hintergrund-Brushes, Rahmenfarben, Text-/Icon-Farben,
  Typografie, Eckenradien, Innen-/Außenabständen oder Inhalt der Karte.
- **Nur** die drei animierten Eigenschaften hinzufügen: `translationY`, `scale`, Schatten-Elevation.
- Schattenfarbe in den vorhandenen Theme-Schatten belassen (kein neuer Farbton); falls
  Compose `ambientColor`/`spotColor` verlangt, die Default-Werte verwenden.
- Effekt nur auf die **Aktivitäts-Karten** anwenden, nicht auf andere Komponenten.

---

## AKZEPTANZKRITERIEN

1. Beim Drücken einer Aktivitäts-Karte hebt sie sich sichtbar an (−6 dp, leicht skaliert,
   stärkerer Schatten) und federt beim Loslassen weich zurück (~400 ms, FastOutSlowIn).
2. Der Tap öffnet weiterhin das Detail (FNow) wie zuvor.
3. Farben und gesamtes übriges Design der App sind unverändert.
