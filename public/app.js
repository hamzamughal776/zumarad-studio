const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let galleryManifest = {};
let managedProjects = {};
fetch('/api/projects').then(r=>r.ok?r.json():null).then(data=>{if(data?.projects?.length){managedProjects=Object.fromEntries(data.projects.map(p=>[p.slug,p]));renderManagedProjects(data.projects);}}).catch(()=>{});
fetch('/assets/projects/gallery-manifest.json').then(r => r.ok ? r.json() : {}).then(data => { galleryManifest = data; }).catch(() => {});

const projectData = {
  codenix: {
    title: 'Codenix',
    type: 'AI coding workspace concept',
    status: 'Design package complete',
    summary: 'A premium dark-mode product concept exploring how AI-assisted coding, project organization and developer tools could live in one focused workspace.',
    problem: 'Developers often switch between tools for project setup, code assistance, snippets and project context. The concept explores a more coherent starting point.',
    decisions: ['Dark navy foundation with restrained cyan and violet accents', 'Mobile-first screen explorations and reusable UI patterns', 'Separate areas for projects, AI assistance, settings and help'],
    features: ['UI concept and screen designs', 'Proposed project and assistant workflows', 'Security and privacy screens in the design exploration'],
    limitation: 'The supplied assets are design images. They do not establish that AI generation, cloud sync, authentication, billing or other depicted interactions are implemented or connected to live services.'
  },
  titan: {
    title: 'Titan Fitness',
    type: 'Fitness web experience',
    status: 'In progress',
    summary: 'A fitness product direction with high-contrast dashboards, training-oriented information hierarchy and a bold visual identity.',
    problem: 'Fitness products need to present routines, progress and member-facing information clearly on compact screens as well as desktop layouts.',
    decisions: ['Strong visual hierarchy for training-related information', 'Reusable cards, status indicators and dashboard components', 'Responsive-first direction with accessible contrast as a goal'],
    features: ['Fitness dashboard and component concepts', 'Training and membership interface explorations', 'Multiple screen and component directions'],
    limitation: 'This project is marked in progress. The images document UI direction, not a verified production application, live membership system or connected health data.'
  },
  leadforge: {
    title: 'LeadForge AI',
    type: 'AI-assisted lead workflow concept',
    status: 'In progress',
    summary: 'A concept for helping small teams organize prospect research and outreach preparation with human review at the centre.',
    problem: 'Prospect research can become scattered across notes and browser tabs. A focused workflow could help record observations, relevance and next steps.',
    decisions: ['Structured prospect and pipeline views', 'Visual distinction between status, priority and next action', 'Human-reviewed outreach rather than automated bulk messaging'],
    features: ['Lead research dashboard concepts', 'Pipeline and workflow explorations', 'AI-assisted workflow ideas subject to validation'],
    limitation: 'This is a concept in progress. Live data enrichment, automated outreach, CRM synchronization, AI APIs and account access are not claimed as implemented.'
  }
};

function renderManagedProjects(projects) {
  const grid = $('#project-grid'); if (!grid) return;
  const label = s => ({concept:'Concept project',in_progress:'In progress',completed:'Completed',paused:'Paused'}[s] || s);
  grid.innerHTML = projects.map((p,i)=>`<article class="project-card ${p.featured?'project-featured':''}" data-category="${escapeHtml(p.category)}">
    <a class="project-image" href="#project-${encodeURIComponent(p.slug)}" data-open-managed="${escapeHtml(p.slug)}" aria-label="View ${escapeHtml(p.title)} project details"><img src="${escapeHtml(p.cover_image||'/assets/favicon.svg')}" alt="${escapeHtml(p.title)} project preview" loading="lazy"><span class="image-top-tag">${String(i+1).padStart(2,'0')} / ${escapeHtml(label(p.status).toUpperCase())}</span><span class="image-open">↗</span></a>
    <div class="project-meta"><span class="project-type">${escapeHtml(p.category)}</span><span class="project-status">${escapeHtml(label(p.status))}</span></div>
    <h3><a href="#project-${encodeURIComponent(p.slug)}" data-open-managed="${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.summary)}</p>
    <div class="tag-row">${(p.technologies||[]).slice(0,4).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><a class="text-link" href="#project-${encodeURIComponent(p.slug)}" data-open-managed="${escapeHtml(p.slug)}">Explore project <span>↗</span></a></article>`).join('');
  $$('[data-open-managed]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openProject(a.dataset.openManaged)}));
  const count=$('#project-count'); if(count) count.textContent=`${String(projects.length).padStart(2,'0')} projects`;
}

function openProject(key) {
  const managed = managedProjects[key];
  const project = managed ? {title:managed.title,type:managed.category, status:managed.status, summary:managed.summary, problem:managed.description || managed.summary, decisions:managed.technologies || [], features:(managed.gallery||[]).slice(0,5).map(x=>x.title), limitation:'Project content is maintained by Zumarad Studio. Gallery images document the supplied design work and do not by themselves prove production functionality.'} : projectData[key];
  if (!project) return;
  const dialog = $('#project-dialog');
  const content = $('#dialog-content');
  const gallery = managed?.gallery?.length ? managed.gallery : (galleryManifest[key] || []);
  const galleryMarkup = gallery.length ? `<section class="project-gallery" aria-label="${escapeHtml(project.title)} image gallery"><div class="gallery-heading"><div><span class="dialog-eyebrow">VISUAL STORY</span><h3>Behind the screens</h3></div><span class="gallery-counter" id="gallery-counter">01 / ${String(gallery.length).padStart(2,'0')}</span></div><div class="gallery-frame"><img id="gallery-image" src="${gallery[0].src}" alt="${escapeHtml(gallery[0].alt)}"><button class="gallery-arrow gallery-prev" type="button" aria-label="Previous image">‹</button><button class="gallery-arrow gallery-next" type="button" aria-label="Next image">›</button></div><div class="gallery-story" aria-live="polite"><span class="gallery-step" id="gallery-step">SCREEN 01</span><h4 id="gallery-title">${escapeHtml(gallery[0].title)}</h4><p id="gallery-caption">${escapeHtml(gallery[0].story)}</p></div><div class="gallery-dots" id="gallery-dots" aria-label="Choose an image">${gallery.map((item,i)=>`<button type="button" class="gallery-dot ${i===0?'active':''}" data-gallery-index="${i}" aria-label="Show image ${i+1}: ${escapeHtml(item.title)}" aria-pressed="${i===0}"></button>`).join('')}</div></section>` : '';
  content.innerHTML = `
    <div class="dialog-eyebrow">ZUMARAD STUDIO / PROJECT NOTE</div>
    <h2 id="dialog-title">${escapeHtml(project.title)}</h2>
    <div class="dialog-meta"><span>${escapeHtml(project.type)}</span><span>${escapeHtml(project.status)}</span><span>Studio portfolio</span></div>
    <p>${escapeHtml(project.summary)}</p>
    ${galleryMarkup}
    <h3 class="dialog-section-title">Problem space</h3><p>${escapeHtml(project.problem)}</p>
    <h3 class="dialog-section-title">Design direction</h3><ul class="dialog-list">${project.decisions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3 class="dialog-section-title">What is represented</h3><ul class="dialog-list">${project.features.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <p class="dialog-note">${escapeHtml(project.limitation)}</p>
    <a class="button button-primary" href="#contact" data-dialog-contact>Discuss a similar project <span>↗</span></a>`;
  if (gallery.length) setupGallery(gallery);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function setupGallery(items) {
  let index = 0;
  const render = next => {
    index = (next + items.length) % items.length;
    const item = items[index];
    $('#gallery-image').src = item.src;
    $('#gallery-image').alt = item.alt;
    $('#gallery-title').textContent = item.title;
    $('#gallery-caption').textContent = item.story;
    $('#gallery-counter').textContent = `${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
    $('#gallery-step').textContent = `SCREEN ${String(index+1).padStart(2,'0')}`;
    $$('.gallery-dot').forEach((dot,i) => { dot.classList.toggle('active',i===index); dot.setAttribute('aria-pressed',String(i===index)); });
  };
  $('.gallery-prev')?.addEventListener('click', () => render(index-1));
  $('.gallery-next')?.addEventListener('click', () => render(index+1));
  $$('.gallery-dot').forEach(dot => dot.addEventListener('click', () => render(Number(dot.dataset.galleryIndex))));
  const frame = $('.gallery-frame');
  let startX = null;
  frame?.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, {passive:true});
  frame?.addEventListener('touchend', event => { if (startX === null) return; const delta = event.changedTouches[0].clientX-startX; if (Math.abs(delta)>45) render(index+(delta<0?1:-1)); startX=null; }, {passive:true});
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

$$('[href^="#project-"]').forEach(link => link.addEventListener('click', event => {
  const key = link.getAttribute('href').replace('#project-', '');
  if (projectData[key]) { event.preventDefault(); openProject(key); }
}));
$('.dialog-close')?.addEventListener('click', () => $('#project-dialog').close());
$('#project-dialog')?.addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
$('#project-dialog')?.addEventListener('click', event => {
  if (event.target.closest('[data-dialog-contact]')) $('#project-dialog').close();
});

const filters = $$('.filter-button');
filters.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filters.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  let count = 0;
  $$('.project-card').forEach(card => {
    const category = card.dataset.category;
    const show = filter === 'all' || category === filter || (filter === 'website' && ['website','ecommerce'].includes(category)) || (filter === 'application' && ['application','web_application','mobile_app'].includes(category)) || (filter === 'ai' && ['ai','automation'].includes(category)) || (filter === 'uiux' && ['uiux','ui_ux'].includes(category));
    card.classList.toggle('hidden', !show);
    if (show) count += 1;
  });
  $('#project-count').textContent = `${String(count).padStart(2, '0')} project${count === 1 ? '' : 's'}`;
}));

const menuToggle = $('.menu-toggle');
const nav = $('.primary-nav');
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  nav.classList.toggle('open', !expanded);
});
$$('.primary-nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}));
$('#year').textContent = String(new Date().getFullYear());

async function loadPublicConfig() {
  try {
    const response = await fetch('/api/public-config', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const config = await response.json();
    const email = config.email;
    const emailLink = $('[data-contact="email"]');
    if (email) {
      emailLink.href = `mailto:${email}`;
      $('[data-value="email"]').textContent = email;
      $$('[data-social="email"]').forEach(link => link.href = `mailto:${email}`);
    }
    const whatsapp = String(config.whatsapp || '').replace(/\D/g, '');
    const whatsappLink = $('[data-contact="whatsapp"]');
    if (whatsapp) {
      whatsappLink.href = `https://wa.me/${whatsapp}`;
      whatsappLink.hidden = false;
      whatsappLink.target = '_blank';
      whatsappLink.rel = 'noopener noreferrer';
    } else if (email) {
      emailLink.hidden = false;
    }
    const socialKeys = ['facebook', 'instagram', 'linkedin', 'youtube', 'github'];
    let visibleSocials = 0;
    socialKeys.forEach(key => {
      const url = config.socials?.[key];
      $$(`[data-social="${key}"]`).forEach(link => {
        if (url && isSafeHttpsUrl(url)) {
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.hidden = false;
          visibleSocials++;
        }
      });
    });
    if (visibleSocials) $('#social-note').textContent = 'Follow Zumarad Studio on social platforms.';
  } catch {
    // Keep contact placeholders visible; never invent contact details.
  }
}
function isSafeHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
loadPublicConfig();

const form = $('#contact-form');
const formStatus = $('#form-status');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submit = $('.submit-button', form);
  submit.disabled = true;
  submit.style.opacity = '.65';
  formStatus.dataset.state = '';
  formStatus.textContent = 'Sending your enquiry…';
  const values = Object.fromEntries(new FormData(form).entries());
  values.consent = $('[name="consent"]', form).checked;
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || 'Could not send the enquiry.');
    formStatus.dataset.state = 'success';
    formStatus.textContent = result.message;
    form.reset();
  } catch (error) {
    formStatus.dataset.state = 'error';
    formStatus.textContent = error.message || 'Contact service is unavailable. Please try again later.';
  } finally {
    submit.disabled = false;
    submit.style.opacity = '';
  }
});


// Progressive reveal animation: if IntersectionObserver is unavailable, content stays visible.
try {
  const revealTargets = document.querySelectorAll('.section-heading, .project-card, .service-card, .technology-card, .process-list li, .about-copy, .faq-list details, .contact-form');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((el, index) => { el.classList.add('js-reveal'); el.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`; });
    const revealObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  }
} catch { /* Progressive enhancement only; page remains usable without animation. */ }
