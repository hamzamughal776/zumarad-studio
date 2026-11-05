# Zumarad Studio v1.7 — Finalization QA

## Implemented in this package
- Public portfolio reads managed PostgreSQL project records and filters to `published = TRUE`.
- Existing seeded Codenix, Titan Fitness and LeadForge AI records default to published.
- Database migration adds `published` to an existing `studio_projects` table without dropping records.
- Private admin project form now accepts cover and gallery image files; JSON gallery editing is no longer required for normal uploads.
- Admin upload endpoint is session-protected, same-origin checked, limited to 20 raster images and 8 MB per image, and accepts JPG, PNG and WebP only.
- Uploaded files receive generated UUID filenames; no user-controlled path is used.
- Draft/publish control and published/draft labels in admin.
- Overview analytics are sourced from PostgreSQL: projects, published/drafts, completion count, enquiries by status/month, and planning tasks.
- Analytics explicitly do not claim visitor counts. No visitor tracking has been implemented.
- Existing planning and enquiry management retained.

## Automated checks
- `node --check src/server.js`
- `node --check public/admin.js`
- `node tests/verify.mjs`
- ZIP integrity checked after packaging.

## Not verified / launch requirements
- PostgreSQL runtime and real admin login require owner-provided database URL and admin secrets.
- Run `src/schema.sql` against the target PostgreSQL database before first use. The script is re-runnable and includes the `published` migration.
- Image uploads currently write to `public/uploads` on the server filesystem. This is suitable for local development and persistent-disk hosts. Ephemeral/free server filesystems may erase uploads on redeploy/restart; configure Cloudflare R2 or another persistent object store before relying on uploaded media in production.
- No R2 credentials/account bucket is configured in this package.
- No real visitor analytics/tracking or email notification provider is configured.
- Live Android browser QA, external social profile checks and production deployment have not been performed.
- Contact persistence is not verified until `/api/health` reports `database: connected` and a real test enquiry appears in the admin inbox.

## Security notes
- Set a long unique `ADMIN_PASSWORD` and a cryptographically random `ADMIN_SESSION_SECRET` (at least 32 characters).
- Use HTTPS in production; keep `.env` out of Git; use a least-privilege database user.
- Use a persistent image object store and configure backups before public production launch.
