/* Admin page — manage profile photo, updates, and projects */

async function pageInit() {
  // Guard: only logged-in users can be here
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Log out button
  const logout = document.getElementById('logout-btn');
  if (logout) logout.addEventListener('click', handleLogout);

  initProfilePhoto();
  initUpdateForm();
  initProjectForm();
  loadAdminUpdates();
  loadAdminProjects();
}

async function handleLogout() {
  await supabase.auth.signOut();
  session = null;
  window.location.href = 'index.html';
}

/* ---------- Profile photo section ---------- */

function initProfilePhoto() {
  const fileInput = document.getElementById('admin-profile-file');
  if (!fileInput) return;

  // Show the current photo if one is saved
  showAdminProfileImg();

  fileInput.addEventListener('change', async function (e) {
    const file = e.target.files && e.target.files[0];
    const msg = document.getElementById('admin-profile-msg');
    if (!file) return;

    // Validate the file
    const invalid = validateImageFile(file);
    if (invalid) {
      msg.textContent = invalid;
      msg.className = 'upload-msg err';
      return;
    }

    msg.textContent = 'Uploading...';
    msg.className = 'upload-msg';

    // Upload to Supabase storage
    const url = await uploadImage(file);
    if (!url) {
      msg.textContent = 'Upload failed. Try again.';
      msg.className = 'upload-msg err';
      return;
    }

    // Save the URL in the profile table
    const { data: existing } = await supabase.from('profile').select('id').limit(1).maybeSingle();
    if (existing && existing.id) {
      await supabase.from('profile').update({ image_url: url }).eq('id', existing.id);
    } else {
      await supabase.from('profile').insert({ image_url: url });
    }

    showAdminProfileImg(url);
    msg.textContent = 'Profile photo updated!';
    msg.className = 'upload-msg ok';
    setTimeout(function () { msg.textContent = ''; msg.className = 'upload-msg'; }, 3000);
  });
}

// Display the saved profile photo in the admin preview
async function showAdminProfileImg(url) {
  const img = document.getElementById('admin-profile-img');
  const placeholder = document.getElementById('admin-profile-placeholder');
  if (!img || !placeholder) return;

  if (!url) {
    const { data } = await supabase.from('profile').select('image_url').limit(1).maybeSingle();
    url = data && data.image_url ? data.image_url : null;
  }

  if (url) {
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  }
}

/* ---------- Post an update section ---------- */

let selectedFile = null; // the image file chosen for an update (if any)

function initUpdateForm() {
  const btn = document.getElementById('up-submit');
  if (btn) btn.addEventListener('click', postUpdate);

  const imgInput = document.getElementById('up-image');
  if (imgInput) imgInput.addEventListener('change', onImagePicked);

  const removeBtn = document.getElementById('up-remove-img');
  if (removeBtn) {
    removeBtn.addEventListener('click', function () {
      selectedFile = null;
      if (imgInput) imgInput.value = '';
      const preview = document.getElementById('up-preview');
      if (preview) preview.hidden = true;
    });
  }
}

// When an image is picked for an update, validate it and show a preview
function onImagePicked(e) {
  const file = e.target.files && e.target.files[0];
  const msgEl = document.getElementById('up-msg');
  const preview = document.getElementById('up-preview');
  const previewImg = document.getElementById('up-preview-img');

  if (!file) {
    selectedFile = null;
    if (preview) preview.hidden = true;
    return;
  }

  const invalid = validateImageFile(file);
  if (invalid) {
    selectedFile = null;
    if (preview) preview.hidden = true;
    e.target.value = '';
    msgEl.textContent = invalid;
    msgEl.className = 'upload-msg err';
    return;
  }

  selectedFile = file;
  msgEl.textContent = '';
  msgEl.className = 'upload-msg';
  previewImg.src = URL.createObjectURL(file);
  preview.hidden = false;
}

// Post a new update (with optional image) to Supabase
async function postUpdate() {
  const titleEl = document.getElementById('up-title');
  const bodyEl = document.getElementById('up-body');
  const msgEl = document.getElementById('up-msg');
  const btn = document.getElementById('up-submit');

  const title = titleEl.value.trim();
  const body = bodyEl.value.trim();

  if (!title || !body) {
    msgEl.textContent = 'Please add both a title and a message.';
    msgEl.className = 'upload-msg err';
    return;
  }

  btn.disabled = true;
  msgEl.textContent = selectedFile ? 'Uploading image...' : 'Posting...';
  msgEl.className = 'upload-msg';

  let imageUrl = null;
  if (selectedFile) {
    imageUrl = await uploadImage(selectedFile);
    if (!imageUrl) {
      btn.disabled = false;
      msgEl.textContent = 'Image upload failed. Please try again.';
      msgEl.className = 'upload-msg err';
      return;
    }
    msgEl.textContent = 'Posting...';
  }

  const { error } = await supabase.from('updates').insert({
    title: title,
    body: body,
    image_url: imageUrl
  });

  btn.disabled = false;

  if (error) {
    msgEl.textContent = 'Something went wrong. Please try again.';
    msgEl.className = 'upload-msg err';
    return;
  }

  // Clear the form
  msgEl.textContent = 'Update posted!';
  msgEl.className = 'upload-msg ok';
  titleEl.value = '';
  bodyEl.value = '';
  selectedFile = null;
  const preview = document.getElementById('up-preview');
  if (preview) preview.hidden = true;
  const imgInput = document.getElementById('up-image');
  if (imgInput) imgInput.value = '';

  loadAdminUpdates();
  setTimeout(function () { msgEl.textContent = ''; msgEl.className = 'upload-msg'; }, 3000);
}

// Load all existing updates (with delete buttons)
async function loadAdminUpdates() {
  const feed = document.getElementById('feed');
  if (!feed) return;

  const { data } = await supabase
    .from('updates')
    .select('id, title, body, image_url, created_at')
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    feed.innerHTML = '<div class="feed-empty">No updates yet.</div>';
    return;
  }

  feed.innerHTML = data.map(function (u) {
    var image = u.image_url
      ? '<img class="update-image" src="' + escapeHtml(u.image_url) + '" alt="' + escapeHtml(u.title) + '" loading="lazy" />'
      : '';

    return '' +
      '<div class="update-item" data-id="' + u.id + '">' +
        '<div class="head">' +
          '<h4>' + escapeHtml(u.title) + '</h4>' +
          '<span class="date">' + formatDate(u.created_at) + '</span>' +
        '</div>' +
        '<div class="body">' + escapeHtml(u.body) + '</div>' +
        image +
        '<button class="del" data-del="' + u.id + '">Delete</button>' +
      '</div>';
  }).join('');

  // Wire up each delete button
  feed.querySelectorAll('[data-del]').forEach(function (btn) {
    btn.addEventListener('click', function () { deleteUpdate(btn.dataset.del); });
  });
}

async function deleteUpdate(id) {
  await supabase.from('updates').delete().eq('id', id);
  loadAdminUpdates();
}

/* ---------- Manage projects section ---------- */

function initProjectForm() {
  const btn = document.getElementById('proj-submit');
  if (btn) btn.addEventListener('click', addProject);
}

// Add a new project to Supabase
async function addProject() {
  const titleEl = document.getElementById('proj-title');
  const descEl = document.getElementById('proj-desc');
  const repoEl = document.getElementById('proj-repo');
  const demoEl = document.getElementById('proj-demo');
  const tagsEl = document.getElementById('proj-tags');
  const msgEl = document.getElementById('proj-msg');
  const btn = document.getElementById('proj-submit');

  const title = titleEl.value.trim();
  const repo = repoEl.value.trim();

  if (!title || !repo) {
    msgEl.textContent = 'Please add at least a title and repo URL.';
    msgEl.className = 'upload-msg err';
    return;
  }

  btn.disabled = true;
  msgEl.textContent = 'Adding...';
  msgEl.className = 'upload-msg';

  // Split the tags input into an array
  var tags = tagsEl.value.trim()
    ? tagsEl.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    : [];

  const { error } = await supabase.from('projects').insert({
    title: title,
    description: descEl.value.trim() || null,
    repo_url: repo,
    demo_url: demoEl.value.trim() || null,
    tech_tags: tags
  });

  btn.disabled = false;

  if (error) {
    msgEl.textContent = 'Something went wrong. Please try again.';
    msgEl.className = 'upload-msg err';
    return;
  }

  // Clear the form
  msgEl.textContent = 'Project added!';
  msgEl.className = 'upload-msg ok';
  titleEl.value = '';
  descEl.value = '';
  repoEl.value = '';
  demoEl.value = '';
  tagsEl.value = '';

  loadAdminProjects();
  setTimeout(function () { msgEl.textContent = ''; msgEl.className = 'upload-msg'; }, 3000);
}

// Load all projects (with delete buttons)
async function loadAdminProjects() {
  const list = document.getElementById('projects-admin-list');
  if (!list) return;

  const { data } = await supabase.from('projects').select('*').order('sort_order', { ascending: true });

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="feed-empty">No projects yet. Add one above.</div>';
    return;
  }

  list.innerHTML = data.map(function (p) {
    var tags = (p.tech_tags && p.tech_tags.length > 0)
      ? '<div class="project-tags">' + p.tech_tags.map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + '</span>';
        }).join('') + '</div>'
      : '';

    var demoLink = p.demo_url
      ? '<a href="' + escapeHtml(p.demo_url) + '" target="_blank" rel="noopener" class="project-link">&#127760; Demo</a>'
      : '';

    return '' +
      '<div class="update-item" data-id="' + p.id + '">' +
        '<div class="head"><h4>' + escapeHtml(p.title) + '</h4></div>' +
        '<div class="body">' + escapeHtml(p.description || '') + '</div>' +
        tags +
        '<div class="admin-proj-links">' +
          '<a href="' + escapeHtml(p.repo_url) + '" target="_blank" rel="noopener" class="project-link">&#128279; Repo</a>' +
          demoLink +
        '</div>' +
        '<button class="del" data-del-proj="' + p.id + '">Delete</button>' +
      '</div>';
  }).join('');

  list.querySelectorAll('[data-del-proj]').forEach(function (btn) {
    btn.addEventListener('click', function () { deleteProject(btn.dataset.delProj); });
  });
}

async function deleteProject(id) {
  await supabase.from('projects').delete().eq('id', id);
  loadAdminProjects();
}
