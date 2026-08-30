/* Home page — loads profile photo and animates the stat bars */

let profileImageUrl = null;

async function pageInit() {
  await loadProfileImage();
  setTimeout(animateBars, 100);
}

// Fetch the saved profile photo URL from Supabase
async function loadProfileImage() {
  const { data } = await supabase.from('profile').select('image_url').limit(1).maybeSingle();
  if (data && data.image_url) {
    profileImageUrl = data.image_url;
    showProfileImg(data.image_url);
  }
}

// Show the photo inside the circular frame (or a placeholder if none)
function showProfileImg(url) {
  const img = document.getElementById('profile-pic-img');
  const placeholder = document.getElementById('profile-placeholder');
  if (!img || !placeholder) return;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  }
}

// Animate the skill bars filling up
function animateBars() {
  document.querySelectorAll('.stat-fill').forEach((bar) => {
    bar.style.width = bar.dataset.target + '%';
  });
}
