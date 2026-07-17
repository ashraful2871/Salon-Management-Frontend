# Salon Management Frontend - UI Update Plan

## Phase 1: Global Design System & Configuration

- [x] Define the new color palette, spacing, and typography in `tailwind.config.ts`.
- [ ] Update global CSS variables in the main stylesheet (e.g., `src/app/globals.css`).
- [ ] Validate `components.json` to ensure UI component library configurations (like shadcn/ui) align with the new design.

## Phase 2: Layout & Navigation

- [ ] Refactor the main layout wrapper (`src/app/layout.tsx`) for the new responsive structure.
- [ ] Redesign the global Navigation/Header component.
- [ ] Redesign the global Footer component.

## Phase 3: Core Page Updates (Iterative)

- [x] Overhaul the Home/Landing page UI (`src/app/page.tsx`). - Build a Hero Section with a clean banner, strong headline, and CTA buttons. - Build a Services section using a CSS Grid layout with pixel-perfect cards. - Build a Testimonials section with subtle background shading.
- [ ] Update the Services/Booking flow interfaces.
- [ ] Update the Customer Dashboard view.

## Phase 4: Polish & Type Verification

- [ ] Run type checks across all updated `.tsx` files to ensure no TypeScript interfaces were broken during the UI changes.
- [ ] Audit all new Tailwind classes for mobile-first responsiveness.
- [ ] Verify interactive states (hover, focus, active).
