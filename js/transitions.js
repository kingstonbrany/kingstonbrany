/* ===========================
   Page Transitions Handler
   Smooth fade transitions on navigation
   =========================== */

function handleNavigation(event) {
  const link = event.target.closest('.nav-link');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#' || href.startsWith('http')) return;

  // Prevent default navigation
  event.preventDefault();

  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Check if navigating to a different page
  if (href === currentPage) return;

  // Start transition
  document.body.classList.add('transitioning');

  // Navigate after fade out
  setTimeout(() => {
    window.location.href = href;
  }, 300);
}

// Initialize transitions on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  // Add loaded class for initial fade in
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 50);

  // Attach click handlers to all nav links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', handleNavigation);
  });

  // Handle browser back/forward buttons
  window.addEventListener('pageshow', function () {
    document.body.classList.remove('transitioning');
    document.body.classList.add('loaded');
  });

  window.addEventListener('pagehide', function () {
    document.body.classList.add('transitioning');
  });
});
