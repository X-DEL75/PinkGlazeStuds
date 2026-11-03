/**
 * PinkGlaze — Main frontend
 * Supabase keys will be plugged in later.
 */

// ========== SUPABASE PLACEHOLDERS ==========
// Replace these after you create the project and tables.
const SUPABASE_URL = 'https://bhxyymcfyaqkcttviaxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0c5uos8BpsDfydClLiKTuA_U39p7-F2';

// Expected table: posts
// Columns: id (uuid), title (text), caption (text), image_url (text),
//          category (text), created_at (timestamptz default now())
// Storage bucket: portfolio (public or with policy)

let supabase = null;

async function initSupabase() {
  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE')) {
    console.info('[PinkGlaze] Supabase not configured yet — portfolio will stay empty until keys are added.');
    return null;
  }
  // Dynamic import so the site still works without the SDK if offline
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (err) {
    console.warn('Supabase SDK load failed', err);
    return null;
  }
}

// ========== DOM ==========
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');
const loader = document.getElementById('loader');
const portfolioGrid = document.getElementById('portfolioGrid');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const postModal = document.getElementById('postModal');
const yearEl = document.getElementById('year');

let posts = [];
let currentFilter = 'newest';

// ========== Loader ==========
window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 700);
});

// ========== Header scroll ==========
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

// ========== Hamburger / Nav ==========
function toggleNav(open) {
  const isOpen = open ?? !navOverlay.classList.contains('open');
  navOverlay.classList.toggle('open', isOpen);
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  navOverlay.setAttribute('aria-hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

hamburger.addEventListener('click', () => toggleNav());

document.querySelectorAll('[data-nav]').forEach(link => {
  link.addEventListener('click', () => toggleNav(false));
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    toggleNav(false);
    closeModal();
  }
});

// ========== Year ==========
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ========== Portfolio ==========
async function loadPosts() {
  if (!supabase) {
    // Demo mode: leave empty (admin must upload)
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
  // 'all' keeps current order (newest by default from query)

  renderPosts(sorted);
}

function renderPosts(list) {
  // Clear previous items but keep empty state element
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

// ========== Modal ==========
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
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  postModal.classList.remove('open');
  postModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

postModal.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', closeModal);
});

// ========== Contact form (placeholder) ==========
document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  alert('Thank you. This form is a front-end placeholder.\nConnect it to email, Formspree, or WhatsApp when ready.');
  e.target.reset();
});

// ========== Helpers ==========
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

// ========== Init ==========
(async () => {
  await initSupabase();
  await loadPosts();
})();
