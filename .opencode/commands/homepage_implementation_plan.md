# Homepage Implementation Plan (Trimly Theme)

This document outlines the step-by-step, phase-wise implementation plan to build the Salon Management homepage. The design will perfectly match the "Trimly" theme (pixel-perfect) while using your own content, ensuring professional aesthetics, mobile responsiveness, and strict type safety (TypeScript).

## Technical Decisions

> [!TIP]
> - **Assets:** All images, icons, and static assets from the theme will be placed in the Next.js `public/assets/` directory for optimal loading.
> - **Animations:** We will use **Framer Motion** to handle scroll animations and hover effects, replacing the theme's default animate.css/wow.js to provide smoother, React-native performance.

## Proposed Changes

---

### Phase 1: Setup & Configuration
**Goal:** Establish the foundation, brand colors, typography, global styles, and animation setup.

#### [MODIFY] `tailwind.config.ts`
- Update `colors` to match theme: 
  - `primary`: `#be8644`
  - `secondary`: `#ffffff`
  - `accent`: `#f8f3ec`
  - `smoke`: `#2a2a2a`
  - `text-body`: `#6a6a6a`
- Update `fontFamily`:
  - `body`: `["Inter", "sans-serif"]`
  - `heading`: `["Teko", "sans-serif"]`

#### [MODIFY] `package.json`
- Add `framer-motion` dependency.

#### [MODIFY] `src/app/globals.css`
- Add global base styles and typography overrides for `h1` to `h6` using the `Teko` font.

#### [MODIFY] `src/app/layout.tsx`
- Load Google Fonts (`Inter` and `Teko`) via `next/font/google`.

#### [NEW] `public/assets/`
- Copy all necessary images (`banner-img1.png`, `logo.png`, vectors) into this directory.

---

### Phase 2: Global Components
**Goal:** Build reusable UI components (Header, Footer, Buttons).

#### [NEW] `src/components/layout/Topbar.tsx`
- The promotional top bar ("Flat 15% Off...").

#### [NEW] `src/components/layout/Header.tsx`
- Responsive navigation menu (Logo, Links, "Book Appointment" button, Mobile Hamburger toggle).

#### [NEW] `src/components/ui/Button.tsx`
- Reusable, type-safe Button component styled identically to the theme's `.primary_btn`, utilizing Framer Motion for hover states.

---

### Phase 3: Hero / Banner Section
**Goal:** The visually striking first impression.

#### [NEW] `src/components/sections/Hero.tsx`
- Background image/shapes layout pulling from `/assets/`.
- "Sharp Looks. Timeless Style." large heading.
- Staggered entrance animations using Framer Motion.

---

### Phase 4: About Section
**Goal:** "The Trimly Experience" section.

#### [NEW] `src/components/sections/About.tsx`
- Split grid layout (Image left, Content right).
- Include the "15+ Years of Trusted Hair Expertise" badge overlay on the image.
- Scroll-triggered reveal animations via Framer Motion's `whileInView`.

---

### Phase 5: Grooming Services Section
**Goal:** Service cards display.

#### [NEW] `src/components/sections/Services.tsx`
- 3-column grid for Men, Women, and Add-on services.
- Hover effects on service cards.
- Integrated icons from `/assets/`.

---

### Phase 6: Booking Form Section
**Goal:** "Book Your Appointment" form area with background shape.

#### [NEW] `src/components/sections/BookingCTA.tsx`
- Type-safe React Hook Form implementation.
- Inputs: Name, Email, Service Select, Phone, Barber Select, Date/Time picker, Notes.

---

### Phase 7: Gallery & Filter Section
**Goal:** Interactive portfolio gallery.

#### [NEW] `src/components/sections/Gallery.tsx`
- "Featured Styles" header.
- Filter tabs (All, Haircuts, Beards, Styling).
- Smooth layout transitions using Framer Motion's `<AnimatePresence>` for filtering images.

---

### Phase 8: Pricing Section
**Goal:** "Transparent Pricing" menu.

#### [NEW] `src/components/sections/Pricing.tsx`
- List format displaying service names, features, and price points.
- Categorized by Men's and Women's services.

---

### Phase 9: Final Assembly & Visual Testing
**Goal:** Assemble components into the homepage and conduct pixel-perfect validation.

#### [MODIFY] `src/app/page.tsx`
- Import and stack all section components sequentially.
- Pass required mock content as props.

## Verification Plan

### Automated Tests
- Run `bun run dev` to ensure no compile errors or React hydration mismatches.
- Run `bun run lint` to verify strict TypeScript adherence.

### Manual Verification
1. **Visual Comparison:** Open the static theme `index.html` side-by-side with the Next.js `localhost:3000` to verify pixel-perfect spacing, font sizes, and colors.
2. **Responsiveness:** Test using browser DevTools on Mobile and Tablet viewports.
3. **Animations:** Verify that Framer Motion scroll and hover animations correctly replicate the theme's feel.
