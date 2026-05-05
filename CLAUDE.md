# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview production build locally
npm run lint     # run ESLint
```

No test suite exists in this project.

## Architecture

Single-page React 19 app built with Vite. Two routes:

- `/` → [src/App.jsx](src/App.jsx) — full homepage (hero carousel, models catalog, about, brands, testimonials, blog, footer)
- `/car/:id` → [src/CarPage.jsx](src/CarPage.jsx) — individual car detail page (gallery, specs, terms tabs, similar cars)

**Routing** is set up in [src/main.jsx](src/main.jsx) using `BrowserRouter`. A `ScrollToTop` component handles smooth hash scrolling (e.g. `/#models`) and scroll-to-top on route changes. Vercel SPA rewrites (`vercel.json`) ensure deep links work on refresh.

**Data** lives entirely in [src/cars-data.js](src/cars-data.js) — the `OLIMP_CARS` array is the single source of truth for all car listings. Add, remove, or edit cars here. Each car object needs: `id`, `name`, `tagline`, `category` (one of `business`, `family`, `adventure`, `wedding`), `price`, `priceUnit`, `seats`, `gearbox`, `luggage`, `year`, `engine`, `hp`, `topSpeed`, `mileage`, `drivetrain`, `img`, `gallery` (array of 5 paths), `description`, `features` (array of strings).

**Hero carousel** in App.jsx uses a separate hardcoded `heroData` array (3 entries) and `heroImages` array — these are not driven by `OLIMP_CARS`. Update both arrays together when changing hero cars.

**Images** live in `public/assets/` and are referenced as `assets/foo.jpg` (without leading slash) in App.jsx component style props, but with a leading slash (`/assets/foo.jpg`) in CarPage.jsx. This is intentional — App renders at root, CarPage renders at `/car/:id`.

**Animations** use GSAP + ScrollTrigger throughout App.jsx. Each section has its own `ScrollTrigger` (triggered once on enter). Car card animations re-run on filter change via a dedicated `useEffect` that kills the previous GSAP context first. GSAP contexts are cleaned up on unmount via `ctx.revert()`.

**Modal** ([src/Modal.jsx](src/Modal.jsx)) is a client-only contact form (name + phone). No backend — submission just shows a success state.

**CSS** is split across three files: `index.css` (CSS custom properties, resets, shared utilities), `App.css` (homepage sections), `CarPage.css` (car detail page). CSS variables for theming are: `--accent`, `--ink`, `--display`, `--radius-md`, `--radius-lg`.

**Edit mode** is an iframe-based theming bridge. App listens for `postMessage` events (`__activate_edit_mode`, `__deactivate_edit_mode`, `__edit_mode_set_keys`) and exposes a tweaks panel when active. The `TWEAK_DEFAULTS` object is delimited by `/*EDITMODE-BEGIN*/` / `/*EDITMODE-END*/` comments — an external tool uses these markers to parse and patch the defaults in source.
