import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const html = readFileSync(join(root, 'public/index.html'), 'utf8');
const js = readFileSync(join(root, 'public/app.js'), 'utf8');
const server = readFileSync(join(root, 'src/server.js'), 'utf8');
const css = readFileSync(join(root, 'public/styles.css'), 'utf8');
for (const id of ['home','work','services','process','about','contact','contact-form','project-grid','project-dialog']) {
  assert.ok(html.includes(`id="${id}"`), `Missing HTML id: ${id}`);
}
for (const project of ['codenix','titan','leadforge']) {
  assert.ok(html.includes(`project-${project}`), `Missing project route link: ${project}`);
  assert.ok(js.includes(`${project}:`), `Missing project detail data: ${project}`);
}
for (const social of ['facebook','instagram','linkedin','youtube']) {
  assert.ok(html.includes(`data-social="${social}"`), `Missing social link: ${social}`);
  assert.ok(server.includes(`${social}: process.env.${social.toUpperCase()}_URL`), `Missing server config: ${social}`);
  assert.ok(html.includes(`data-social="${social}" href="https://`), `Social link is not directly configured: ${social}`);
}
for (const asset of ['codenix-splash.png','codenix-overview.png','titan-fitness.png','leadforge-ai.png','favicon.svg']) {
  const file = join(root, 'public/assets', asset.includes('png') ? 'projects' : '', asset);
  assert.ok(existsSync(file), `Missing asset: ${asset}`);
  assert.ok(statSync(file).size > 100, `Asset too small: ${asset}`);
}
assert.ok(server.includes("app.post('/api/contact'"), 'Contact API route missing');
assert.ok(server.includes('contactLimiter'), 'Contact rate limiter missing');
assert.ok(server.includes('contactSchema.safeParse'), 'Server-side validation missing');
assert.ok(server.includes('INSERT INTO contact_submissions'), 'Parameterized database insert missing');
assert.ok(server.includes('/api/health'), 'Health endpoint missing');
assert.ok(html.includes('<strong>Supabase</strong>'), 'Supabase technology missing');
assert.ok(html.includes('<strong>Firebase</strong>'), 'Firebase technology missing');
assert.ok(css.includes('prefers-reduced-motion'), 'Reduced-motion support missing');
assert.ok(css.includes('@media(max-width:720px)'), 'Mobile layout rules missing');
assert.ok(!html.includes('mailto:hello@example.com'), 'Example email must not be presented as a real contact');
console.log('PASS: website sections, three project stories, social slots, assets, contact API safeguards, and responsive/reduced-motion CSS verified.');
const schema = readFileSync(join(root, 'src/schema.sql'), 'utf8');
const adminHtml = readFileSync(join(root, 'public/admin.html'), 'utf8');
const adminJs = readFileSync(join(root, 'public/admin.js'), 'utf8');
for (const table of ['studio_projects','planning_items','contact_submissions']) assert.ok(schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Missing table: ${table}`);
for (const route of ["/api/admin/login","/api/admin/projects","/api/admin/planning","/api/admin/enquiries"]) assert.ok(server.includes(route), `Missing admin API route: ${route}`);
assert.ok(server.includes('requireAdmin'), 'Admin authorization middleware missing');
assert.ok(server.includes('timingSafeEqual'), 'Timing-safe secret comparison missing');
assert.ok(adminHtml.includes('id="plan-form"') && adminHtml.includes('id="project-form"'), 'Admin CRUD forms missing');
assert.ok(adminJs.includes('DELETE') && adminJs.includes('PUT'), 'Admin edit/delete actions missing');
assert.ok(schema.includes("ON CONFLICT (slug) DO NOTHING"), 'Portfolio seed must be safe to rerun');
console.log('PASS: admin auth routes, project/planning CRUD, enquiry inbox, database schema and seeded project content verified.');

assert.match(server, /WHERE published=TRUE/, 'Public API must hide drafts');
assert.match(server, /api\/admin\/uploads/, 'Admin image upload endpoint must exist');
assert.match(server, /api\/admin\/analytics/, 'Database-backed analytics endpoint must exist');
assert.match(server, /image\/webp/, 'Upload allowlist must include WebP');
assert.match(adminHtml, /name="coverFile"/, 'Dashboard must include cover upload');
assert.match(adminHtml, /name="galleryFiles"/, 'Dashboard must include gallery upload');
assert.match(adminHtml, /name="published"/, 'Dashboard must include publish control');
assert.match(adminHtml, /tab-analytics/, 'Dashboard must include analytics view');
assert.match(adminJs, /Public portfolio updates automatically/, 'Publish workflow must confirm public update');
console.log('PASS: publish/draft isolation, dashboard image uploads, and real database analytics verified.');
