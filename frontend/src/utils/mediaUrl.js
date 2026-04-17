const LOCAL_BACKEND_HOSTS = new Set([
  "localhost:5000",
  "127.0.0.1:5000",
  "0.0.0.0:5000",
]);

export function normalizeMediaUrl(value, fallback = "") {
  const rawUrl =
    typeof value === "string"
      ? value
      : value?.secure_url || value?.url || value?.path || "";

  if (!rawUrl) return fallback;

  if (rawUrl.startsWith("/uploads/")) return rawUrl;
  if (rawUrl.startsWith("uploads/")) return `/${rawUrl}`;
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  try {
    const url = new URL(rawUrl, window.location.origin);

    if (LOCAL_BACKEND_HOSTS.has(url.host) && url.pathname.startsWith("/uploads/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.href;
  } catch {
    return rawUrl;
  }
}
