# Zumarad Studio

Responsive public website for Zumarad Studio, built with HTML/CSS/vanilla JavaScript and a Node.js + Express API designed for PostgreSQL contact storage.

## What's included

- Premium dark navy, cyan and violet visual system.
- Responsive home, work, services, process, about, FAQ and contact sections.
- Project details for Codenix, Titan Fitness and LeadForge AI.
- Clear status labels: concept/prototype or in progress.
- Portfolio filters and accessible project detail dialogs.
- Facebook, Instagram, LinkedIn, YouTube and GitHub link configuration.
- Contact form with client-side native validation, server-side Zod validation, consent and honeypot.
- Express rate limiting, Helmet security headers, JSON body size limit and parameterized PostgreSQL insert.
- `/api/health` and `/api/public-config` endpoints.
- Privacy, terms and support-policy starter pages.
- PostgreSQL schema and environment template.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 14+ for persistent contact submissions (optional for static preview; required for saving enquiries)

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env and set DATABASE_URL to your private PostgreSQL database.
# Create the database, then apply the schema:
psql "$DATABASE_URL" -f src/schema.sql
npm run check
npm start
```

Open `http://localhost:3000`.

If `DATABASE_URL` is not configured, the website and health endpoint still run, but the contact form returns a clear `503` response and does not pretend to save enquiries.

## Environment variables

See `.env.example`. Social/contact values are intentionally blank until real profiles and contact details are provided. `DATABASE_SSL=true` enables certificate-verified TLS; use only with a database configuration that supports it.

## Social links

Set real HTTPS URLs in `.env`:

- `FACEBOOK_URL`
- `INSTAGRAM_URL`
- `LINKEDIN_URL`
- `YOUTUBE_URL`
- `GITHUB_URL`

Set `WHATSAPP_NUMBER` in international digits without `+`, spaces or punctuation. Set `PROFESSIONAL_EMAIL` to a monitored address. Do not publish placeholders as real contact methods.

## Deployment checklist

1. Deploy to a Node.js host with HTTPS.
2. Provision PostgreSQL with private network/access controls and backups.
3. Apply `src/schema.sql`.
4. Set all environment variables in the host's secret manager.
5. Use a least-privilege database role; do not expose `DATABASE_URL`.
6. Configure database TLS correctly, set `NODE_ENV=production`, and restrict database inbound access.
7. Verify `/api/health` reports `database: connected`.
8. Submit a test enquiry and confirm it appears in `contact_submissions`.
9. Test rate limiting, invalid fields, missing consent and database failure handling.
10. Review privacy, terms, support and refund/cancellation language for your actual business and target jurisdiction.
11. Configure domain, email delivery, monitoring and backup recovery testing.
12. Replace placeholders and confirm social links before launch.

## Known limitations

- No admin workspace, authentication, proposal pipeline, invoice system or lead CRM is included in this first website foundation.
- No email notification or transactional email provider is configured.
- No AI API, payment gateway, analytics tracker or third-party embed is connected.
- Project detail dialogs describe concepts and design direction; they are not full runnable demos of the three products.
- Privacy, terms and support pages are starter drafts and need owner/legal review.
- The visual font stylesheet uses Google Fonts; system fallback fonts work if Google Fonts is unavailable.
- No automated browser/device test suite is included yet.

## Project status truthfulness

The supplied project images are included as portfolio visuals. Codenix is labelled Design package complete based on supplied UI/UX assets; Titan Fitness and LeadForge AI are labelled In progress. The supplied archives contain visuals rather than app source code, so the runtime completeness of Codenix cannot be independently verified from those files alone. Update these only after checking the actual implementation and evidence.


## Project image galleries (v1.1)
Each of the three portfolio projects includes a slide gallery built from the supplied ZIP artwork. Each slide has a title and a short design-story caption, previous/next controls, selectable dots, and touch swipe support on mobile. Gallery captions describe the supplied design explorations; they do not imply that the pictured features are implemented. Gallery manifest: `public/assets/projects/gallery-manifest.json`.

The supplied archives did not contain an APK or AAB file. If one of the projects has a built Android APK, upload that APK separately to add a verified download/test path.


## v1.2 visual fixes
- Gallery assets are now grouped by their source project: Codenix assets only in Codenix, Titan Fitness assets only in Titan Fitness, and LeadForge AI assets only in LeadForge AI.
- Added a technology toolkit section, expanded FAQ entries, subtle scroll/hover/orbit animations, and animated footer ambience.
- Tightened project dialog and gallery sizing for narrow mobile screens and respected reduced-motion preferences.
- Gallery images are design artifacts; the captions explicitly avoid implying that every depicted interaction is implemented.


## Social profile configuration

Facebook, Instagram, LinkedIn, and YouTube links supplied by the studio owner are preconfigured in the public config defaults and `.env.example`. Environment variables can override these defaults. GitHub remains unset until the studio owner supplies its URL.


## v1.5 launch polish notes

- Supabase and Firebase are listed in the technology toolkit as supported options, not as integrations already connected to this public website.
- The four supplied social profile URLs are embedded directly in the footer links, so the links do not depend on `/api/public-config` loading.
- Mobile CSS includes additional intrinsic-width and footer/grid safeguards for narrow Android viewports.
- External profile URLs were syntax-checked in source. Automated external-site verification was unavailable because the platforms throttled/blocked automated requests; tap each profile link on-device before launch.
- Contact form submissions still require a configured PostgreSQL `DATABASE_URL`; do not publish the form as operational until `/api/health` reports `database: connected` and a real test submission is received.


## Private admin workspace (v1.6)

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a private PostgreSQL database connection string.
3. Set `ADMIN_PASSWORD` to a long unique password and `ADMIN_SESSION_SECRET` to a random secret of at least 32 characters. Keep `.env` private and never commit it.
4. Run the SQL in `src/schema.sql` against that database. It creates the contact inbox, project content, planning items, and seeds the three supplied portfolio projects with their correctly grouped gallery manifests. Existing slugs are not overwritten on re-run.
5. Run `npm install`, then `npm start`. Open `/admin.html` to sign in.
6. Check `/api/health`; it must report `database: connected`. Submit a real test enquiry and confirm it appears under Enquiries before launch.

### Admin capabilities
- Projects: create, edit and delete portfolio records, including category, status, summary, technologies, cover image, gallery JSON, featured state and order. When PostgreSQL has managed project records, the public portfolio reads those records from `/api/projects`.
- Planning: create, edit, prioritize, date and track tasks/milestones, link them to project slugs, and mark blocked/done.
- Enquiries: view private contact submissions and update their status.

Admin sessions use signed, eight-hour HTTP-only, SameSite=Strict cookies. Mutating admin requests validate same-origin requests. Use HTTPS in production. Do not expose the admin password or session secret in frontend code.

## v1.7 — portfolio publishing, uploads and analytics

### Project publishing
- Public `/api/projects` returns only records where `published = TRUE`.
- The private dashboard provides a Publish on public portfolio toggle. Drafts remain private to the admin API.
- The schema adds `published BOOLEAN NOT NULL DEFAULT TRUE`; re-running `src/schema.sql` safely adds this column to an existing project table without deleting records.

### No-code project image upload
- Sign in at `/admin.html`, open Projects, and choose Add project.
- Enter title, summary, description and technologies; choose a cover image and gallery images; choose Draft or Publish; then Save project.
- JPG, PNG and WebP are accepted. Maximum 8 MB per image and 20 files per save (cover included).
- Images are written to `public/uploads` using server-generated filenames. The public portfolio uses the returned image paths automatically.
- Editing a project keeps its existing gallery and appends newly uploaded gallery images. Deleting a project does not delete uploaded files automatically, to avoid accidental shared-file deletion.

### Analytics
- Overview displays actual PostgreSQL counts for projects, published/drafts, completed projects, enquiries by status/month and planning tasks.
- Visitor/page-view analytics are intentionally not claimed or displayed. They require a separate privacy-reviewed tracking implementation.

### Storage and free hosting warning
The current upload adapter writes to the Node server filesystem. This works locally and on hosts with persistent disks. Many free serverless/free web-service filesystems are ephemeral; uploaded files can disappear after restart or redeploy. Before relying on uploads in production, connect Cloudflare R2 (or another persistent object store) and configure backups. No R2 account or credentials are included or assumed here. Keep PostgreSQL and image storage credentials server-side only.

### Upgrade from v1.6
1. Back up the PostgreSQL database and existing project media.
2. Replace the project files with this v1.7 package while preserving your private `.env`.
3. Run `npm install` to install the new `multer` dependency.
4. Apply the updated `src/schema.sql` to the existing database; the published-column migration is non-destructive.
5. Run `npm run check` and `npm test`.
6. Configure a persistent media storage adapter before production uploads on an ephemeral host.
