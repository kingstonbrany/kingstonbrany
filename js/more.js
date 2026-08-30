/* More page — loads the list of updates from Supabase */

async function pageInit() {
  const feed = document.getElementById('feed');
  if (!feed) return;

  // Ask Supabase for all updates, newest first
  const { data, error } = await supabase
    .from('updates')
    .select('id, title, body, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    feed.innerHTML = '<div class="feed-empty">No updates yet.</div>';
    return;
  }

  // Build an HTML block for each update
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
      '</div>';
  }).join('');
}
