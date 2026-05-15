---
name: Midnight Executive
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181c23'
  surface-container: '#1c2028'
  surface-container-high: '#272a32'
  surface-container-highest: '#31353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e0e2ed'
  inverse-on-surface: '#2d3039'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#ffb595'
  on-tertiary: '#571e00'
  tertiary-container: '#ef6719'
  on-tertiary-container: '#4c1a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#10131b'
  on-background: '#e0e2ed'
  surface-variant: '#31353d'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  edge_margin: 20px
  gutter: 16px
---

## Brand & Style

This design system is built for high-stakes professional environments where precision and luxury are paramount. The aesthetic merges **Corporate Modernism** with **Glassmorphism**, creating a sense of depth and digital craftsmanship. It targets a sophisticated user base that values clarity, speed, and a premium tactile feel.

The emotional response is one of calm authority. By utilizing a deep, rich color palette and sharp typography, the UI recedes to let the data shine, while vibrant border accents provide immediate, high-contrast feedback. The interface should feel like a high-end physical tool—weighty, expensive, and impeccably engineered.

## Colors

The palette is anchored in a monochromatic navy spectrum to maintain a professional "Black Tie" atmosphere. 

- **Surface:** The foundation is a deep, near-black navy (#031427) to minimize eye strain and maximize the richness of the display.
- **Containers:** Interactive and grouping elements use a slightly elevated navy (#0b1c30) to create a clear visual hierarchy through tonal shifts.
- **Accents:** Vibrant, high-saturation status indicators are used sparingly but boldly. These are applied primarily as 1.5px or 2px borders to signal state changes (Success, Error, Warning) without overwhelming the dark theme.
- **Saturation:** Colors are kept deep and saturated to ensure the UI feels "premium" rather than "washed out."

## Typography

The typography system utilizes **Outfit**, a high-precision geometric sans-serif. It is designed for maximum legibility in data-heavy mobile environments.

- **Precision:** Use medium and semi-bold weights for interactive elements to ensure they feel "clickable" against the dark background.
- **Scaling:** For mobile, headlines should never exceed 32px to preserve screen real estate. 
- **Hierarchy:** Use the `label-caps` style for section headers and metadata to provide a technical, architectural feel. 
- **Coloration:** Primary text should be Pure White (#FFFFFF) for maximum contrast, while secondary text uses a 60% opacity white to maintain hierarchy.

## Layout & Spacing

This design system follows a **Fluid Grid** model specifically optimized for mobile devices. 

- **The 4px Rule:** All spacing increments are multiples of 4px to ensure perfect alignment and mathematical rhythm.
- **Safe Zones:** Use a 20px margin on the left and right edges of the screen to prevent "content hugging" on curved mobile displays.
- **Vertical Rhythm:** Group related items using `sm` (12px) spacing, and separate distinct sections using `xl` (32px) spacing.
- **Density:** Maintain a high-density layout for data lists, but provide ample whitespace around call-to-action buttons to ensure accessibility.

## Elevation & Depth

Elevation is achieved through **Tonal Layers** and **Subtle Glassmorphism** rather than traditional drop shadows.

- **Stacking:** The `surface` is the lowest point. `containers` sit one level above. Modals and popovers sit at the highest level, utilizing a `backdrop-filter: blur(20px)` and a 20% transparent navy fill to create a glass effect.
- **Soft Shadows:** When shadows are required for floating action buttons or high-priority cards, use a very large blur radius (24px+) with a low-opacity navy tint (#000000 at 40% opacity) to avoid a "muddy" appearance.
- **Edge Highlighting:** Every container should have a 1px inner border (top and left) at 10% white opacity to simulate a light source, adding to the tactile, physical feel of the interface.

## Shapes

The shape language is defined by a consistent **12px radius**, providing a balance between friendly modernism and professional structure.

- **Standard Elements:** Buttons, input fields, and small cards use the `rounded-md` (8px) or `rounded-lg` (12px) tokens.
- **Large Containers:** Full-width cards and bottom sheets should use a 24px top-corner radius to soften the transition into the screen edges.
- **Consistency:** Ensure that nested elements (like a chip inside a card) have a slightly smaller radius than their parent to maintain visual concentricity.

## Components

- **Buttons:** Primary buttons use a subtle gradient from the primary navy to a slightly lighter shade, finished with a 1px white-alpha stroke. Labels are semi-bold Outfit.
- **Inputs:** Text fields are semi-transparent with a 1px border. Upon focus, the border transitions to the primary blue with a subtle outer glow.
- **Status Accents:** For alerts or status lists, use a 3px thick left-hand border in the corresponding status color (Success, Warning, Error). This provides instant scannability.
- **Glass Cards:** Use for overlays. Require a background blur of 16px and a 1px border at 15% white opacity to define the shape against the dark surface.
- **Chips:** Small, highly rounded (pill-shaped) elements with a 10% opacity white fill. These should be used for filtering and categorizing data without adding visual bulk.
- **Navigation:** Use a bottom navigation bar with a glassmorphic background to allow content to scroll subtly underneath, maintaining a sense of depth.