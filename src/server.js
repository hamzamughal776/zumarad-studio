import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import { z } from 'zod';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    })
  : null;

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '20kb', type: 'application/json' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use((req, _res, next) => { req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => { const i=v.indexOf('='); return [decodeURIComponent(v.slice(0,i)), decodeURIComponent(v.slice(i+1))]; })); next(); });

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Too many submissions. Please try again later.' }
});


const adminLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false });
const adminPassword = process.env.ADMIN_PASSWORD || '';
const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';
const cookieName = 'zs_admin';
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function validSession(token) {
  if (!token || !sessionSecret) return false;
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return false;
  const expected = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return false;
  try { const data = JSON.parse(Buffer.from(body, 'base64url').toString()); return data.exp > Date.now(); } catch { return false; }
}
function requireAdmin(req, res, next) {
  if (!validSession(req.cookies?.[cookieName])) return res.status(401).json({ ok:false, message:'Admin sign-in required.' });
  next();
}
function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ok:false,message:'Origin not allowed.'}); }
    catch { return res.status(403).json({ok:false,message:'Origin not allowed.'}); }
  }
  next();
}
const projectSchema = z.object({
  slug:z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title:z.string().trim().min(2).max(160),
  category:z.string().trim().min(2).max(80),
  status:z.enum(['concept','in_progress','completed','paused']),
  summary:z.string().trim().min(10).max(1200),
  description:z.string().trim().max(6000).optional().default(''),
  coverImage:z.string().trim().max(500).optional().default(''),
  technologies:z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  gallery:z.array(z.object({src:z.string().trim().max(500),title:z.string().trim().max(160),story:z.string().trim().max(1200),alt:z.string().trim().max(240)})).max(80).optional().default([]),
  featured:z.boolean().optional().default(false), published:z.boolean().optional().default(true), sortOrder:z.number().int().min(0).max(10000).optional().default(100)
});
const planSchema = z.object({title:z.string().trim().min(2).max(180),description:z.string().trim().max(3000).optional().default(''),projectSlug:z.string().trim().max(80).optional().default(''),status:z.enum(['planned','in_progress','blocked','done']).default('planned'),priority:z.enum(['low','medium','high']).default('medium'),targetDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),sortOrder:z.number().int().min(0).max(10000).optional().default(100)});
function requireDatabase(res) { if (!pool) { res.status(503).json({ok:false,message:'PostgreSQL is not configured. Set DATABASE_URL and run src/schema.sql.'}); return false; } return true; }

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional().default(''),
  projectType: z.enum([
    'Business website', 'Web application', 'E-commerce',
    'UI/UX implementation', 'AI-powered application', 'Maintenance', 'Not sure yet'
  ]),
  budgetRange: z.string().trim().max(80).optional().default(''),
  timeline: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default('')
});

app.get('/api/health', async (_req, res) => {
  let database = 'not_configured';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch {
      database = 'unavailable';
    }
  }
  res.status(database === 'unavailable' ? 503 : 200).json({
    ok: database !== 'unavailable',
    service: 'zumarad-studio',
    database
  });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: 'Please check the required fields and try again.',
      fields: parsed.error.issues.map(issue => ({ field: issue.path[0], message: issue.message }))
    });
  }
  const data = parsed.data;
  // Honeypot field: silently accept bot-like submissions without storing them.
  if (data.website) return res.status(201).json({ ok: true, message: 'Thanks. Your request has been received.' });
  if (!pool) {
    return res.status(503).json({
      ok: false,
      message: 'The contact service is not configured yet. Please use the published email or WhatsApp contact.'
    });
  }
  try {
    await pool.query(
      `INSERT INTO contact_submissions
       (name, email, company, project_type, budget_range, preferred_timeline, message, consent_to_contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [data.name, data.email, data.company || null, data.projectType, data.budgetRange || null,
       data.timeline || null, data.message, data.consent]
    );
    return res.status(201).json({ ok: true, message: 'Thanks. Your project enquiry has been received.' });
  } catch (error) {
    console.error('Contact submission failed:', error?.code || 'database_error');
    return res.status(500).json({ ok: false, message: 'We could not save your request. Please try again later.' });
  }
});


// Public portfolio data: only published project fields are exposed.
app.get('/api/projects', async (_req,res) => {
  if (!pool) return res.json({ok:true, projects:[]});
  try { const r=await pool.query('SELECT slug,title,category,status,summary,description,cover_image,technologies,gallery,featured,sort_order FROM studio_projects WHERE published=TRUE ORDER BY featured DESC,sort_order,updated_at DESC'); res.set('Cache-Control','no-store').json({ok:true,projects:r.rows}); }
  catch(e){ console.error('Public projects read:',e.code||'db_error'); res.status(500).json({ok:false,message:'Portfolio data is temporarily unavailable.'}); }
});

// Private studio workspace: password-protected, signed, HTTP-only admin session.
app.post('/api/admin/login', adminLoginLimiter, sameOrigin, (req, res) => {
  if (!adminPassword || !sessionSecret) return res.status(503).json({ok:false,message:'Admin credentials are not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.'});
  if (!safeEqual(req.body?.password || '', adminPassword)) return res.status(401).json({ok:false,message:'Incorrect password.'});
  const token = signSession({ exp: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${isProduction ? '; Secure' : ''}`);
  res.json({ok:true});
});
app.post('/api/admin/logout', sameOrigin, (_req,res) => { res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isProduction ? '; Secure' : ''}`); res.json({ok:true}); });
app.get('/api/admin/me', requireAdmin, (_req,res) => res.json({ok:true,admin:true}));

app.get('/api/admin/projects', requireAdmin, async (_req,res) => {
  if (!requireDatabase(res)) return;
  try { const r=await pool.query('SELECT * FROM studio_projects ORDER BY featured DESC, sort_order, updated_at DESC'); res.json({ok:true,projects:r.rows}); }
  catch(e){ console.error('Admin projects read:',e.code||'db_error'); res.status(500).json({ok:false,message:'Could not load projects.'}); }
});
app.post('/api/admin/projects', requireAdmin, sameOrigin, async (req,res) => {
  if (!requireDatabase(res)) return; const v=projectSchema.safeParse(req.body); if(!v.success) return res.status(400).json({ok:false,message:'Check project fields.'}); const d=v.data;
  try { const r=await pool.query(`INSERT INTO studio_projects(slug,title,category,status,summary,description,cover_image,technologies,gallery,featured,sort_order,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING *`,[d.slug,d.title,d.category,d.status,d.summary,d.description,d.coverImage,d.technologies,JSON.stringify(d.gallery),d.featured,d.sortOrder,d.published]); res.status(201).json({ok:true,project:r.rows[0]}); }
  catch(e){ res.status(e.code==='23505'?409:500).json({ok:false,message:e.code==='23505'?'That project slug already exists.':'Could not save project.'}); }
});
app.put('/api/admin/projects/:id', requireAdmin, sameOrigin, async (req,res) => {
  if (!requireDatabase(res)) return; const v=projectSchema.safeParse(req.body); if(!v.success) return res.status(400).json({ok:false,message:'Check project fields.'}); const d=v.data;
  try { const r=await pool.query(`UPDATE studio_projects SET slug=$1,title=$2,category=$3,status=$4,summary=$5,description=$6,cover_image=$7,technologies=$8,gallery=$9::jsonb,featured=$10,sort_order=$11,published=$12,updated_at=NOW() WHERE id=$13 RETURNING *`,[d.slug,d.title,d.category,d.status,d.summary,d.description,d.coverImage,d.technologies,JSON.stringify(d.gallery),d.featured,d.sortOrder,d.published,req.params.id]); if(!r.rowCount)return res.status(404).json({ok:false,message:'Project not found.'}); res.json({ok:true,project:r.rows[0]}); }
  catch(e){ res.status(e.code==='23505'?409:500).json({ok:false,message:e.code==='23505'?'That project slug already exists.':'Could not update project.'}); }
});
app.delete('/api/admin/projects/:id', requireAdmin, sameOrigin, async (req,res) => { if(!requireDatabase(res))return; try{const r=await pool.query('DELETE FROM studio_projects WHERE id=$1',[req.params.id]); if(!r.rowCount)return res.status(404).json({ok:false,message:'Project not found.'});res.json({ok:true});}catch(e){res.status(500).json({ok:false,message:'Could not delete project.'});} });

// Admin-only image uploads. Raster formats only; filenames are generated by the server.
const uploadDir = path.join(__dirname, '../public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}.${({ 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' })[file.mimetype] || 'bin'}`)
});
const imageUpload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024, files: 20 }, fileFilter: (_req, file, cb) => {
  if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(new Error('Only JPG, PNG and WebP images are allowed.'));
  cb(null, true);
} });
app.post('/api/admin/uploads', requireAdmin, sameOrigin, (req,res) => {
  imageUpload.array('images', 20)(req,res,err => {
    if (err) return res.status(400).json({ok:false,message:err.code==='LIMIT_FILE_SIZE'?'Each image must be 8 MB or smaller.':err.message || 'Upload failed.'});
    const files = (req.files || []).map(f => ({ url:`/uploads/${f.filename}`, name:f.originalname.replace(/[\\/\\\\]/g,'').slice(0,120), size:f.size, mimeType:f.mimetype }));
    res.status(201).json({ok:true,files});
  });
});

app.get('/api/admin/analytics', requireAdmin, async (_req,res) => {
  if (!requireDatabase(res)) return;
  try {
    const [projects, enquiries, monthly, planning] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE published)::int AS published, COUNT(*) FILTER (WHERE NOT published)::int AS drafts, COUNT(*) FILTER (WHERE status='completed')::int AS completed FROM studio_projects`),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='new')::int AS new, COUNT(*) FILTER (WHERE status='replied')::int AS replied FROM contact_submissions`),
      pool.query(`SELECT TO_CHAR(date_trunc('month',created_at),'Mon YYYY') AS month, COUNT(*)::int AS enquiries FROM contact_submissions WHERE created_at >= date_trunc('month',NOW()) - INTERVAL '5 months' GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)`),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='done')::int AS done, COUNT(*) FILTER (WHERE status='blocked')::int AS blocked FROM planning_items`)
    ]);
    res.set('Cache-Control','no-store').json({ok:true,projects:projects.rows[0],enquiries:enquiries.rows[0],monthly:monthly.rows,planning:planning.rows[0],note:'Visitor analytics are not enabled; these are database-backed operational metrics.'});
  } catch(e) { console.error('Analytics read:',e.code||'db_error'); res.status(500).json({ok:false,message:'Could not load analytics.'}); }
});

app.get('/api/admin/planning', requireAdmin, async (_req,res) => { if(!requireDatabase(res))return; try{const r=await pool.query("SELECT * FROM planning_items ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, sort_order, created_at DESC");res.json({ok:true,items:r.rows});}catch(e){res.status(500).json({ok:false,message:'Could not load planning items.'});} });
app.post('/api/admin/planning', requireAdmin, sameOrigin, async (req,res) => { if(!requireDatabase(res))return;const v=planSchema.safeParse(req.body);if(!v.success)return res.status(400).json({ok:false,message:'Check planning fields.'});const d=v.data;try{const r=await pool.query('INSERT INTO planning_items(title,description,project_slug,status,priority,target_date,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[d.title,d.description,d.projectSlug||null,d.status,d.priority,d.targetDate||null,d.sortOrder]);res.status(201).json({ok:true,item:r.rows[0]});}catch(e){res.status(500).json({ok:false,message:'Could not save planning item.'});} });
app.put('/api/admin/planning/:id', requireAdmin, sameOrigin, async (req,res) => { if(!requireDatabase(res))return;const v=planSchema.safeParse(req.body);if(!v.success)return res.status(400).json({ok:false,message:'Check planning fields.'});const d=v.data;try{const r=await pool.query('UPDATE planning_items SET title=$1,description=$2,project_slug=$3,status=$4,priority=$5,target_date=$6,sort_order=$7,updated_at=NOW() WHERE id=$8 RETURNING *',[d.title,d.description,d.projectSlug||null,d.status,d.priority,d.targetDate||null,d.sortOrder,req.params.id]);if(!r.rowCount)return res.status(404).json({ok:false,message:'Planning item not found.'});res.json({ok:true,item:r.rows[0]});}catch(e){res.status(500).json({ok:false,message:'Could not update planning item.'});} });
app.delete('/api/admin/planning/:id', requireAdmin, sameOrigin, async (req,res) => {if(!requireDatabase(res))return;try{const r=await pool.query('DELETE FROM planning_items WHERE id=$1',[req.params.id]);if(!r.rowCount)return res.status(404).json({ok:false,message:'Planning item not found.'});res.json({ok:true});}catch(e){res.status(500).json({ok:false,message:'Could not delete planning item.'});}});
app.get('/api/admin/enquiries', requireAdmin, async (_req,res) => {if(!requireDatabase(res))return;try{const r=await pool.query('SELECT id,name,email,company,project_type,budget_range,preferred_timeline,message,status,created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 200');res.json({ok:true,enquiries:r.rows});}catch(e){res.status(500).json({ok:false,message:'Could not load enquiries.'});}});
app.patch('/api/admin/enquiries/:id', requireAdmin, sameOrigin, async (req,res) => {if(!requireDatabase(res))return;const status=z.enum(['new','reviewed','replied','archived']).safeParse(req.body?.status);if(!status.success)return res.status(400).json({ok:false,message:'Invalid enquiry status.'});try{const r=await pool.query('UPDATE contact_submissions SET status=$1 WHERE id=$2 RETURNING id,status',[status.data,req.params.id]);if(!r.rowCount)return res.status(404).json({ok:false,message:'Enquiry not found.'});res.json({ok:true,enquiry:r.rows[0]});}catch(e){res.status(500).json({ok:false,message:'Could not update enquiry.'});}});

app.get('/api/public-config', (_req, res) => {
  const socials = {
    facebook: process.env.FACEBOOK_URL || 'https://www.facebook.com/share/19avqwiMhR/',
    instagram: process.env.INSTAGRAM_URL || 'https://www.instagram.com/zumaradstudio?cplk=NXdoNXU4bW9mdmI3',
    linkedin: process.env.LINKEDIN_URL || 'https://www.linkedin.com/in/zumarad-studio-715539410?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    youtube: process.env.YOUTUBE_URL || 'https://www.youtube.com/@zumaradstudio',
    github: process.env.GITHUB_URL || ''
  };
  res.set('Cache-Control', 'no-store').json({
    email: process.env.PROFESSIONAL_EMAIL || '',
    whatsapp: process.env.WHATSAPP_NUMBER || '',
    socials
  });
});

app.use(express.static(path.join(__dirname, '../public'), {
  extensions: ['html'],
  maxAge: isProduction ? '1h' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req, res) => res.status(404).json({ ok: false, message: 'Not found' }));
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ok:false,message:'Upload rejected. Check file count and size.'});
  console.error('Unhandled request error:', err?.message || 'unknown_error');
  res.status(500).json({ ok: false, message: 'Unexpected server error.' });
});

const server = app.listen(port, () => {
  console.log(`Zumarad Studio running on http://localhost:${port}`);
  if (!pool) console.warn('DATABASE_URL is not set; contact form submissions will not be stored.');
});
async function shutdown() {
  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
