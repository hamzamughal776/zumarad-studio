# Cloudflare Pages deployment (static preview)

This repository currently contains a Node.js/Express + PostgreSQL application.
It is **not** a Cloudflare Workers backend yet. Do not use `npx wrangler deploy`
or the Worker deploy flow for this package: the current API uses Express,
PostgreSQL (`pg`), and local filesystem uploads (`multer`).

## Safe static preview deployment

Use Cloudflare Pages with the GitHub repository `hamzamughal776/zumarad-studio`.

- Framework preset: `None`
- Production branch: `main`
- Build command: leave empty
- Build output directory: `public`
- Root directory: `/`

This publishes the static portfolio pages and bundled image galleries. It does
not activate the Express API, admin dashboard data, PostgreSQL contact storage,
or project uploads. The portfolio has bundled seed content so the public
project gallery remains visible without the API.

## Before treating the site as production-ready

The following backend services still need a deliberate migration and verification:

1. Replace Express routes with Cloudflare Worker handlers.
2. Migrate PostgreSQL schema/queries to D1 (or use a supported managed database
   connection through an appropriate Cloudflare service).
3. Replace local `multer` disk uploads with R2 object storage.
4. Rebuild and test admin authentication, same-origin protections, rate limits,
   project CRUD, planning, enquiries, and analytics in the Worker runtime.
5. Run a real contact submission and confirm it is stored and visible in admin.

Do not expose `.env`, database URLs, admin passwords, session secrets, or API
tokens in GitHub. Keep the real `.env` out of the repository.

## Local checks

```sh
npm install
npm run check
npm test
```

Cloudflare Pages can deploy the static preview from GitHub without installing
Wrangler on Android/Termux. Wrangler's native package currently rejects the
Android `arm64` platform; that is a local CLI platform limitation, not a
failure in the website source.
