/* ===========================
   Shared code for all pages
   - Connects to Supabase
   - Highlights the current nav tab
   - Shows/hides Admin & Login links based on login state
   - Provides helpers used by page scripts
   =========================== */

// Supabase connection details
const SUPABASE_URL = 'https://uaiesexqytyxltylzfjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaWVzZXhxeXR5eGx0eWx6ZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjY1NjMsImV4cCI6MjEwMTUwMjU2M30.AWKK5bRcaoYhrNCLgG0w8JnxTcOGSmC2kNTfBlrnxmc';
const BUCKET = 'update-images';

// Create the Supabase client (only if the library loaded)
let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Holds the current login session
let session = null;

// ---- Helpers ----

// Turn user text into safe HTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Format a timestamp: "Aug 14, 2026"
function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get the current page name from the URL
function pageName() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return path.replace('.html', '');
}

// ---- Auth ----

async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  session = data.session;
  return session;
}

// ---- Nav highlighting (no JS injection needed, links are in the HTML) ----

function highlightNav() {
  const current = pageName();
  document.querySelectorAll('.nav-link').forEach(function (link) {
    if (link.dataset.page === current) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Show/hide Admin and Login links based on login state
function updateAuthNav() {
  const adminLink = document.querySelector('.admin-link');
  const loginLink = document.querySelector('.login-link');
  if (!adminLink || !loginLink) return;

  if (session) {
    adminLink.hidden = false;
    loginLink.hidden = true;
  } else {
    adminLink.hidden = true;
    loginLink.hidden = false;
  }
}

// ---- Footer year ----

function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ---- Image upload helpers ----

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function validateImageFile(file) {
  if (!file) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only PNG, JPEG, WebP, or GIF images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 2MB or smaller.';
  return null;
}

async function uploadImage(file) {
  if (!supabase) return null;
  const ext = file.name.split('.').pop().toLowerCase();
  const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data && data.publicUrl ? data.publicUrl : null;
}

// ---- Page boot (runs on every page) ----

async function boot() {
  highlightNav();
  setYear();

  // If Supabase didn't load, still show the page with the nav
  if (!supabase) return;

  await getSession();
  updateAuthNav();

  // Keep session in sync across tabs
  supabase.auth.onAuthStateChange(function (event, newSession) {
    session = newSession;
    updateAuthNav();
    if (pageName() === 'admin' && !session) {
      window.location.href = 'login.html';
    }
  });

  // If on admin page but not logged in, redirect
  if (pageName() === 'admin' && !session) {
    window.location.href = 'login.html';
    return;
  }

  // Run the page's own startup function if it has one
  if (typeof window.pageInit === 'function') {
    window.pageInit();
  }
}

document.addEventListener('DOMContentLoaded', boot);
