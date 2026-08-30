/* Projects page — fetches project cards from Supabase and shows them */

async function pageInit() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  // Ask Supabase for all projects, newest first
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    grid.innerHTML = '<div class="feed-empty">No projects added yet. Check back soon.</div>';
    return;
  }

  // Build an HTML card for each project
  grid.innerHTML = data.map(function (p) {
    var tags = (p.tech_tags && p.tech_tags.length > 0)
      ? '<div class="project-tags">' + p.tech_tags.map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + '</span>';
        }).join('') + '</div>'
      : '';

    var demoLink = p.demo_url
      ? '<a href="' + escapeHtml(p.demo_url) + '" target="_blank" rel="noopener" class="project-link">&#127760; Live demo</a>'
      : '';

    return '' +
      '<div class="project-card">' +
        '<div class="project-card-top">' +
          '<span class="project-icon">&#128193;</span>' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
        '</div>' +
        '<p class="project-desc">' + escapeHtml(p.description) + '</p>' +
        tags +
        '<div class="project-links">' +
          '<a href="' + escapeHtml(p.repo_url) + '" target="_blank" rel="noopener" class="project-link">&#128279; Repository</a>' +
          demoLink +
        '</div>' +
      '</div>';
  }).join('');
}
