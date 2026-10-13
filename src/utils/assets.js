/**
 * Helper to resolve public assets correctly across both local dev server
 * and GitHub Pages subpaths (e.g., https://username.github.io/repo-name/).
 */
export function getAssetUrl(path, cacheBust = false) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const base = import.meta.env.BASE_URL || './';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let fullUrl = base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;

  if (cacheBust || import.meta.env.DEV) {
    const buildTag = typeof __APP_BUILD_TIME__ !== 'undefined' ? encodeURIComponent(__APP_BUILD_TIME__) : '1';
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}_v=${buildTag}`;
  }

  return fullUrl;
}
