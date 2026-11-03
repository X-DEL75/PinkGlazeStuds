/**
 * PinkGlaze — Main frontend
 */

const SUPABASE_URL = 'https://bhxyymcfyaqkcttviaxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0c5uos8BpsDfydClLiKTuA_U39p7-F2';

let supabase = null;

async function initSupabase() {
  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE')) {
    console.info('[PinkGlaze] Supabase not configured yet.');
    return null;
  }
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (err) {
    console.warn('Supabase SDK load failed', err);
    return null;
  }
}

const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');
const loader = document.getElementById('loader');
const portfolioGrid = document.getElementById('portfolioGrid');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const postModal = document.getElementById('postModal');
const themeToggle = document.getElementById('themeToggle');
const panels = document.querySelectorAll('.panel');

let posts = [];
let currentFilter = 'newest';

window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 700);
  startTypewriter();
});

function showPanel(id) {
  const target = (id || '#home').replace('#', '') || 'home';
  panels.forEach(p => {
    p.classList.toggle('active', p.id === target);
  });
  const active = document.getElementById(target);
  if (active) active.scrollTop = 0;
  history.replaceState(null, '', '#' + target);
}

function toggleNav(open) {
  const isOpen = open ?? !navOverlay.classList.contains('open');
  navOverlay.classList.toggle('open', isOpen);
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  navOverlay.setAttribute('aria-hidden', !isOpen);
}

hamburger.addEventListener('click', () => toggleNav());

document.querySelectorAll('[data-nav]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const href = link.getAttribute('href') || '#home';
    showPanel(href);
    toggleNav(false);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    toggleNav(false);
    closeModal();
  }
});

const startHash = location.hash || '#home';
showPanel(startHash);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pg-theme', theme);
  if (themeToggle) {
    const label = themeToggle.querySelector('.theme-label');
    if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
}

const savedTheme = localStorage.getItem('pg-theme') || 'dark';
applyTheme(savedTheme);

themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

function startTypewriter() {
  const el = document.querySelector('.typewriter .typed');
  if (!el) return;
  const text = 'PinkGlaze';
  let i = 0;
  el.textContent = '';
  const tick = () => {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(tick, 120);
    }
  };
  setTimeout(tick, 400);
}

function initCustomSelect(root) {
  if (!root) return;
  const trigger = root.querySelector('.custom-select-trigger');
  const options = root.querySelector('.custom-select-options');
  const valueEl = root.querySelector('.custom-select-value');
  const hidden = root.querySelector('input[type="hidden"]');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = root.classList.toggle('open');
    options.hidden = !open;
    trigger.setAttribute('aria-expanded', open);
  });

  options.querySelectorAll('[role="option"]').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value ?? '';
      const label = opt.textContent.trim();
      valueEl.textContent = label;
      if (hidden) hidden.value = val;
      options.querySelectorAll('[role="option"]').forEach(o => o.removeAttribute('aria-selected'));
      opt.setAttribute('aria-selected', 'true');
      root.classList.remove('open');
      options.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', () => {
    root.classList.remove('open');
    options.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });
}

initCustomSelect(document.getElementById('serviceSelect'));

async function loadPosts() {
  if (!supabase) {
    renderPosts([]);
    return;
  }
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    posts = data || [];
    applyFilter(currentFilter);
  } catch (err) {
    console.error('Failed to load posts', err);
    renderPosts([]);
  }
}

function applyFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  let sorted = [...posts];
  if (filter === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (filter === 'oldest') {
    sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  renderPosts(sorted);
}

function renderPosts(list) {
  portfolioGrid.querySelectorAll('.portfolio-item').forEach(el => el.remove());
  if (!list.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  list.forEach(post => {
    const item = document.createElement('article');
    item.className = 'portfolio-item';
    item.innerHTML = `
      <img src="${escapeAttr(post.image_url)}" alt="${escapeAttr(post.title || 'PinkGlaze work')}" loading="lazy" />
      <div class="overlay">
        <h4>${escapeHtml(post.title || 'Untitled')}</h4>
        <p>${escapeHtml((post.caption || '').slice(0, 60))}${(post.caption || '').length > 60 ? '…' : ''}</p>
      </div>
    `;
    item.addEventListener('click', () => openModal(post));
    portfolioGrid.appendChild(item);
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
});

function openModal(post) {
  document.getElementById('modalImg').src = post.image_url || '';
  document.getElementById('modalTitle').textContent = post.title || 'Untitled';
  document.getElementById('modalCaption').textContent = post.caption || '';
  const date = post.created_at ? new Date(post.created_at).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';
  document.getElementById('modalMeta').textContent = [post.category, date].filter(Boolean).join(' · ');
  postModal.classList.add('open');
  postModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  postModal.classList.remove('open');
  postModal.setAttribute('aria-hidden', 'true');
}

postModal?.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', closeModal);
});

document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('name')?.value || '';
  const phone = document.getElementById('phone')?.value || '';
  const service = document.getElementById('service')?.value || '';
  const message = document.getElementById('message')?.value || '';
  const text = encodeURIComponent(
    `Hi PinkGlaze,\nName: ${name}\nPhone: ${phone}\nService: ${service}\nMessage: ${message}`
  );
  window.open(`https://wa.me/2348022916775?text=${text}`, '_blank');
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

(async () => {
  await initSupabase();
  await loadPosts();
})();
