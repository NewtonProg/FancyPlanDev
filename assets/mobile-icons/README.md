# FancyPlan – Mobile App Icons

Aus dem textlosen Master-Logo `src/renderer/public/brand-icons/fp-no-text-tr.png`
(1563×1563, transparent) abgeleitet. Skalierung: HighQualityBicubic, Alpha erhalten.
Markenblau: **#5271FF**.

Pro Anwendungsfall ein kompletter Android-Dichte-Satz (mdpi 1× … xxxhdpi 4×).
Bei Android: jeweils in den passenden `res/mipmap-<dichte>/`-Ordner ablegen
(oder als Compose-Drawable nach Bedarf einbinden).

## login/ — Anmeldebildschirm (100 dp, Vollfarbe)
Zentrales High-Contrast-Logo. Dateien: 100 / 150 / 200 / 300 / 400 px.

## dashboard/ — Dashboard Welcome Card (75 dp, Vollfarbe)
Begrüßungs-Logo der Willkommens-Karte. Dateien: 75 / 112 / 150 / 225 / 300 px.

## topbar/ — Top-Bar Navigation (24 dp, einfarbig #5271FF)
Vereinfachte Brand-Mark als reine Blau-Silhouette (Grau-Schatten entfernt),
damit sie bei 24 dp razor-sharp und kontrastreich bleibt.
Dateien: 24 / 36 / 48 / 72 / 96 px.

## fp_mono_master_1563px.png
Einfarbige Master-Silhouette (#5271FF) — Quelle für die Top-Bar und für den
Vektor-Trace.

## vector/ — skalierbare Vektor-Fassung (einfarbig)
Aus der Mono-Silhouette getracet (Marching-Squares + Douglas-Peucker, evenOdd-Füllung).
- `fp-logo-mono.svg` — Standard-SVG (viewBox 0 0 512 512), z. B. für Web/Compose-Coil.
- `fp_topbar.xml` — Android **VectorDrawable** (24dp), verlustfrei skalierbar.
  Ideal als Top-Bar-Brand-Mark statt der PNG-Dichten. `fillType="evenOdd"` (API 24+).
Reproduzierbar via `_work/trace.mjs`.

## android-res/ — Launcher-Icon (Adaptive Icon, fertige res-Struktur)
Direkt in das `app/src/main/res/`-Verzeichnis der Mobile-App kopierbar.
- `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml` — Adaptive-Icon
  (background = weiße Farbe, foreground = Vollfarb-Logo, monochrome = Themed-Icon Android 13+).
- `values/ic_launcher_background.xml` — Hintergrundfarbe `#FFFFFF`.
- `drawable/ic_launcher_monochrome.xml` — monochrome Themed-Icon-Ebene (Vektor, auf 62 % der
  108dp-Safe-Zone skaliert; System tönt nach Theme).
- `mipmap-<dichte>/ic_launcher_foreground.png` — Vordergrund (108dp, Logo auf 62 % zentriert).
- `mipmap-<dichte>/ic_launcher.png` + `ic_launcher_round.png` — Legacy-Launcher (48dp,
  weißer Hintergrund, abgerundetes Quadrat bzw. Kreis) für Android < 8.

Im App-Manifest auf `@mipmap/ic_launcher` (und ggf. `roundIcon=@mipmap/ic_launcher_round`) verweisen.
