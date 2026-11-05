const menu = document.querySelector('.mobile-menu');
const nav = document.querySelector('#apex-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  menu.querySelector('span').textContent = open ? '＋' : '−';
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
  if (menu) menu.querySelector('span').textContent = '＋';
}));
const services = {
  strategy: { index: '01', title: 'Know what matters next.', body: 'Align goals, priorities, and practical next steps before investing time and budget in the wrong things.', tag: 'CLARITY FIRST' },
  systems: { index: '02', title: 'Make good work repeatable.', body: 'Find the friction in everyday workflows and shape practical systems that help people spend less time chasing details.', tag: 'WORK SMARTER' },
  experience: { index: '03', title: 'Make every interaction count.', body: 'Turn a complicated digital journey into a clear, accessible experience that helps people move with confidence.', tag: 'DESIGN WITH INTENT' }
};
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-service]').forEach(item => item.classList.toggle('active', item === button));
  const data = services[button.dataset.service];
  document.querySelector('.detail-index').textContent = `${data.index} / SELECTED SERVICE`;
  document.querySelector('.service-detail h3').textContent = data.title;
  document.querySelector('.service-detail p').textContent = data.body;
  document.querySelector('.detail-tag').textContent = data.tag;
}));
document.querySelector('#demo-year').textContent = new Date().getFullYear();
document.querySelector('#demo-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const name = form.elements.name.value.trim();
  const topic = form.elements.topic.value;
  document.querySelector('#demo-feedback').textContent = `Demo preview ready for ${name}. Topic: ${topic}. Nothing was sent or saved.`;
  form.querySelector('button[type="submit"]').innerHTML = 'Preview created <span>✓</span>';
});
