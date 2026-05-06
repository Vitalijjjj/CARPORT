# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build — also run before committing to update dist/
npm run lint     # run ESLint
node server.js   # run Express server locally (needs DB env vars)
```

No test suite exists. After frontend changes, always `npm run build` and `git add dist/` — Hostinger does not install devDependencies so Vite is unavailable on the server.

## Hostinger Deployment

Live at `https://plum-snake-808731.hostingersite.com`. Deployed from the `main` branch on GitHub (auto-deploy on push).

- **Server**: `server.js` — Express app serving both API routes and the React SPA from `dist/`
- **Database**: MySQL on the same host (Unix socket `/tmp/mysql.sock`). Tables auto-created by `initDb()` on startup.
- **Admin credentials**: `admin@carrai.com` / `adminplumcar2026`
- **Env vars quirk**: Hostinger escapes `#` as `\#` in env vars. The password `Bobok#2005` arrives as `Bobok\#2005` — server.js strips it with `.replace(/\\#/g, '#')`.
- **dist/ is committed**: Must commit updated `dist/` after any React code change.

## Architecture

**Frontend** — React 19 SPA built with Vite, served from `dist/` by Express.

Public routes (see [src/main.jsx](src/main.jsx)):
- `/` → [src/App.jsx](src/App.jsx) — homepage (hero carousel, catalog, about, brands, testimonials, footer)
- `/cars` → [src/CatalogPage.jsx](src/CatalogPage.jsx) — full catalog with filters
- `/car/:id` → [src/CarPage.jsx](src/CarPage.jsx) — car detail (gallery, specs, tabs, similar cars)
- `/admin/login` → [src/admin/pages/AdminLoginPage.jsx](src/admin/pages/AdminLoginPage.jsx)
- `/admin/*` → admin panel (auth-guarded via [src/admin/AdminGuard.jsx](src/admin/AdminGuard.jsx))

**Backend** — [server.js](server.js) (Express, ES modules):
- `GET /api/cars.php` — public car listing (available only), supports `?limit`, `?brand`, `?fuel_type` filters
- `GET /api/cars.php?id=N` — single car
- `POST/PUT/PATCH/DELETE /api/cars.php` — admin CRUD (JWT required)
- `POST /api/auth.php` / `DELETE /api/auth.php` — login / logout
- `POST /api/leads.php` — contact form submission (public)
- `GET /api/leads.php` — leads list (JWT required)
- `POST /api/quiz.php` — quiz lead capture (public)
- `POST /api/upload.php` — image upload (JWT required)
- `GET /api/health.php` — DB connectivity check

**Admin API client**: [src/admin/adminApi.js](src/admin/adminApi.js) calls `/api/*.php`. Set `VITE_MOCK_ADMIN=true` in `.env.local` to run with mock data (login: `test@test.com` / `test123`).

**Data flow**: The homepage catalog and car pages fetch data from the live `/api/cars.php` endpoint. The static `OLIMP_CARS` array in [src/cars-data.js](src/cars-data.js) is legacy and no longer the source of truth.

**Images** live in `public/assets/` locally; uploaded images go to `/uploads/` on the server (served by Express). Referenced as `assets/foo.jpg` (no leading slash) in App.jsx style props, `/assets/foo.jpg` in CarPage.jsx — intentional, App is at root, CarPage is at `/car/:id`.

**Animations** use GSAP + ScrollTrigger throughout App.jsx. Car card animations re-run on filter change; GSAP contexts are cleaned up via `ctx.revert()` on unmount.

**CSS** is split across `index.css` (variables, resets), `App.css` (homepage), `CarPage.css` (detail page). CSS variables: `--accent`, `--ink`, `--display`, `--radius-md`, `--radius-lg`.
