export function normalizeEventBanner(event?: { bannerUrl?: string | null; coverImage?: string | null } | null) {
  if (!event) return null;
  return event.bannerUrl || event.coverImage || null;
}

export function getEventBannerUrl(event?: { bannerUrl?: string | null; coverImage?: string | null } | null) {
  return normalizeEventBanner(event);
}
