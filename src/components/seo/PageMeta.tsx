import { useEffect } from 'react';
import { APP_NAME, DEFAULT_SEO, SITE_URL } from '../../config/brand';

type PageMetaProps = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export function PageMeta({ title, description, path = '', noIndex = false }: PageMetaProps) {
  useEffect(() => {
    const seoTitle = title ? `${title} | ${APP_NAME}` : DEFAULT_SEO.title;
    const pageDescription = description ?? DEFAULT_SEO.description;
    const canonical = `${SITE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    const imageUrl = `${SITE_URL.replace(/\/$/, '')}/icon.png`;

    document.title = APP_NAME;
    document.documentElement.lang = 'id';

    upsertMeta('description', pageDescription);
    upsertMeta('keywords', DEFAULT_SEO.keywords);
    upsertMeta('author', APP_NAME);
    upsertMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('theme-color', '#2563eb');

    upsertMeta('og:title', seoTitle, 'property');
    upsertMeta('og:description', pageDescription, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:locale', DEFAULT_SEO.locale, 'property');
    upsertMeta('og:site_name', APP_NAME, 'property');
    upsertMeta('og:url', canonical, 'property');
    upsertMeta('og:image', imageUrl, 'property');

    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', seoTitle);
    upsertMeta('twitter:description', pageDescription);
    upsertMeta('twitter:image', imageUrl);

    upsertLink('canonical', canonical);
  }, [title, description, path, noIndex]);

  return null;
}
