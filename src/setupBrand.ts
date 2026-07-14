import { APP_ICON_URL, APP_NAME } from './config/brand';
import { buildRoundedFaviconFromImage } from './utils/brandIcon';

function upsertFavicon(rel: string, href: string, type = 'image/png') {
  const selector = rel === 'icon' ? 'link[rel="icon"]' : `link[rel="${rel}"]`;
  let link = document.querySelector<HTMLLinkElement>(selector);

  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.type = type;
  link.href = href;
}

export async function setupDocumentBrand() {
  document.title = APP_NAME;

  try {
    const faviconUrl = await buildRoundedFaviconFromImage(APP_ICON_URL);
    upsertFavicon('icon', faviconUrl);
  } catch {
    upsertFavicon('icon', APP_ICON_URL);
  }

  upsertFavicon('apple-touch-icon', APP_ICON_URL);
}
