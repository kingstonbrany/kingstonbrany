/* Login page — sign in or create an account */

let authMode = 'signin'; // which tab is active

async function pageInit() {
  // If already logged in, go straight to admin
  if (session) {
    window.location.href = 'admin.html';
    return;
  }

  // Tab switching: Sign In vs Create Account
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      authMode = tab.dataset.tab;

      const submit = document.getElementById('auth-submit');
      const msg = document.getElementById('auth-msg');
      if (submit) submit.textContent = authMode === 'signin' ? 'Sign In' : 'Create Account';
      if (msg) { msg.textContent = ''; msg.className = 'auth-msg'; }
    });
  });

  // Submit handler for the form
  const form = document.getElementById('auth-form');
  if (form) form.addEventListener('submit', handleAuth);
}

// Runs when the sign-in / sign-up form is submitted
async function handleAuth(e) {
  e.preventDefault();

  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value;
  const msg = document.getElementById('auth-msg');
  const btn = document.getElementById('auth-submit');

  if (!email || !pass) {
    msg.textContent = 'Please enter both email and password.';
    msg.className = 'auth-msg err';
    return;
  }

  btn.disabled = true;
  msg.textContent = authMode === 'signin' ? 'Signing in...' : 'Creating account...';
  msg.className = 'auth-msg';

  let result;
  if (authMode === 'signin') {
    result = await supabase.auth.signInWithPassword({ email: email, password: pass });
  } else {
    result = await supabase.auth.signUp({ email: email, password: pass });
  }

  btn.disabled = false;

  if (result.error) {
    msg.textContent = 'Could not sign in. Check your email and password.';
    msg.className = 'auth-msg err';
    return;
  }

  msg.textContent = 'Success! Redirecting...';
  msg.className = 'auth-msg ok';
  session = result.data.session;

  // Head to the admin dashboard after a brief pause
  setTimeout(function () { window.location.href = 'admin.html'; }, 600);
}
