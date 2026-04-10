/*

Schema strategy

- Author-controlled page type in metadata
- URL-based fallback if metadata is missing or invalid
- Separate schema generator that maps internal page type -> JSON-LD

Supported internal page types:

home
about-page
contact-page
section-landing
newsroom-landing
news
article
careers-landing
job-listing-page
job-detail
generic-content

Recommended metadata examples:

type: article
type: news
type: section-landing
type: about-page

Do NOT use section names like:
type: healthy thinking
type: newsroom
type: sustainability

Use the normalized page types above instead.

*/

import { getMetadata } from './lib-franklin.js';

const SCHEMA_CONTEXT = 'https://schema.org';
const ORGANIZATION_NAME = 'Sunstar';
const DEFAULT_IMAGE_SELECTOR = 'main img';

const PAGE_TYPES = {
  HOME: 'home',
  ABOUT: 'about-page',
  CONTACT: 'contact-page',
  SECTION_LANDING: 'section-landing',
  NEWSROOM_LANDING: 'newsroom-landing',
  NEWS: 'news',
  ARTICLE: 'article',
  CAREERS_LANDING: 'careers-landing',
  JOB_LISTING_PAGE: 'job-listing-page',
  JOB_DETAIL: 'job-detail',
  GENERIC: 'generic-content',
};

const PAGE_TYPE_ALIASES = {
  home: PAGE_TYPES.HOME,
  homepage: PAGE_TYPES.HOME,

  about: PAGE_TYPES.ABOUT,
  'about-page': PAGE_TYPES.ABOUT,
  aboutpage: PAGE_TYPES.ABOUT,

  contact: PAGE_TYPES.CONTACT,
  'contact-page': PAGE_TYPES.CONTACT,
  contactpage: PAGE_TYPES.CONTACT,

  section: PAGE_TYPES.SECTION_LANDING,
  landing: PAGE_TYPES.SECTION_LANDING,
  'section-landing': PAGE_TYPES.SECTION_LANDING,

  newsroom: PAGE_TYPES.NEWSROOM_LANDING,
  'newsroom-landing': PAGE_TYPES.NEWSROOM_LANDING,

  news: PAGE_TYPES.NEWS,
  newsarticle: PAGE_TYPES.NEWS,

  article: PAGE_TYPES.ARTICLE,

  careers: PAGE_TYPES.CAREERS_LANDING,
  'careers-landing': PAGE_TYPES.CAREERS_LANDING,

  'job-listing': PAGE_TYPES.JOB_LISTING_PAGE,
  'job-listing-page': PAGE_TYPES.JOB_LISTING_PAGE,
  'jobs-listing': PAGE_TYPES.JOB_LISTING_PAGE,

  job: PAGE_TYPES.JOB_DETAIL,
  'job-detail': PAGE_TYPES.JOB_DETAIL,
  jobposting: PAGE_TYPES.JOB_DETAIL,

  generic: PAGE_TYPES.GENERIC,
  webpage: PAGE_TYPES.GENERIC,
  'generic-content': PAGE_TYPES.GENERIC,
};

function injectScript(attrs = {}) {
  const script = document.createElement('script');

  Object.entries(attrs).forEach(([name, value]) => {
    if (name === 'content') {
      script.textContent = value;
    } else {
      script.setAttribute(name, value);
    }
  });

  document.head.appendChild(script);
}

function validateSchema(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    console.error('Invalid JSON schema:', e);
    return false;
  }
}

function normalizePageType(rawType) {
  if (!rawType) return null;
  const value = String(rawType).trim().toLowerCase();
  return PAGE_TYPE_ALIASES[value] || null;
}

function inferPageType(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return PAGE_TYPES.HOME;

  if (path === '/about') return PAGE_TYPES.ABOUT;
  if (path === '/contact') return PAGE_TYPES.CONTACT;

  if (path === '/newsroom') return PAGE_TYPES.NEWSROOM_LANDING;
  if (path.startsWith('/newsroom/')) return PAGE_TYPES.NEWS;

  if (path === '/healthy-thinking') return PAGE_TYPES.SECTION_LANDING;
  if (path.startsWith('/healthy-thinking/')) return PAGE_TYPES.ARTICLE;

  if (path === '/careers') return PAGE_TYPES.CAREERS_LANDING;
  if (path === '/careers/career-opportunities') return PAGE_TYPES.JOB_LISTING_PAGE;
  if (path.startsWith('/careers/career-opportunities/')) return PAGE_TYPES.JOB_DETAIL;

  if (path === '/innovation' || path === '/sustainability' || path === '/our-businesses') {
    return PAGE_TYPES.SECTION_LANDING;
  }

  return PAGE_TYPES.GENERIC;
}

function getAbsoluteUrl(value) {
  if (!value) return undefined;

  try {
    return new URL(value, window.location.origin).href;
  } catch (e) {
    return undefined;
  }
}

function getFirstImageUrl(doc) {
  const image = doc.querySelector(DEFAULT_IMAGE_SELECTOR);
  if (!image) return undefined;
  return getAbsoluteUrl(image.getAttribute('src'));
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanObject(item)).filter((item) => item !== undefined && item !== null && item !== '');
  }

  if (value && typeof value === 'object') {
    const cleaned = {};

    Object.entries(value).forEach(([key, item]) => {
      const cleanedValue = cleanObject(item);

      if (
        cleanedValue !== undefined &&
        cleanedValue !== null &&
        cleanedValue !== '' &&
        !(Array.isArray(cleanedValue) && cleanedValue.length === 0)
      ) {
        cleaned[key] = cleanedValue;
      }
    });

    return cleaned;
  }

  return value;
}

function getCanonicalUrl(doc) {
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  return getAbsoluteUrl(canonical) || window.location.href;
}

function getPageData(doc) {
  const headline = doc.querySelector('h1')?.textContent?.trim();
  const description = getMetadata('description')?.trim();
  const author = getMetadata('author')?.trim();
  const datePublished = getMetadata('date')?.trim();
  const dateModified = getMetadata('last-modified')?.trim() || datePublished;
  const image = getAbsoluteUrl(getMetadata('image')) || getFirstImageUrl(doc);
  const url = getCanonicalUrl(doc);
  const { origin } = window.location;

  return {
    headline,
    description,
    author,
    datePublished,
    dateModified,
    image,
    url,
    origin,
  };
}

function buildOrganization(data) {
  return {
    '@type': 'Organization',
    name: ORGANIZATION_NAME,
    url: data.origin,
  };
}

function buildWebsiteSchema(data) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    name: ORGANIZATION_NAME,
    url: data.origin,
  };
}

function buildBaseWebPageSchema(data, type = 'WebPage', extra = {}) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': type,
    name: data.headline,
    headline: data.headline,
    description: data.description,
    url: data.url,
    mainEntityOfPage: data.url,
    image: data.image,
    ...extra,
  };
}

function buildHomeSchemas(data) {
  return [
    buildBaseWebPageSchema(data, 'WebPage'),
    buildWebsiteSchema(data),
    {
      '@context': SCHEMA_CONTEXT,
      ...buildOrganization(data),
    },
  ];
}

function buildAboutPageSchema(data) {
  return buildBaseWebPageSchema(data, 'AboutPage', {
    mainEntity: buildOrganization(data),
  });
}

function buildContactPageSchema(data) {
  return buildBaseWebPageSchema(data, 'ContactPage');
}

function buildCollectionPageSchema(data) {
  return buildBaseWebPageSchema(data, 'CollectionPage');
}

function buildGenericWebPageSchema(data) {
  return buildBaseWebPageSchema(data, 'WebPage');
}

function buildArticleCommon(data, type) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': type,
    headline: data.headline,
    description: data.description,
    url: data.url,
    mainEntityOfPage: data.url,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    image: data.image,
    author: data.author
      ? {
          '@type': 'Person',
          name: data.author,
        }
      : undefined,
    publisher: buildOrganization(data),
  };
}

function buildNewsArticleSchema(data) {
  return buildArticleCommon(data, 'NewsArticle');
}

function buildArticleSchema(data) {
  return buildArticleCommon(data, 'Article');
}

function getTextContent(selector, scope = document) {
  return scope.querySelector(selector)?.textContent?.trim();
}

function buildJobPostingSchema(data, doc) {
  const location = getTextContent('.hero-career-location p', doc);
  const workMode = getTextContent('.hero-career-workmode p', doc);
  const employmentType = getTextContent('.hero-career-employmenttype p', doc);
  const jobIdRaw = getTextContent('.hero-career-job-id p', doc);
  const description = doc.querySelector('.hero-career-description')?.textContent?.trim() || data.description;

  const schema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'JobPosting',
    title: data.headline,
    description,
    url: data.url,
    datePosted: data.datePublished,
    identifier: jobIdRaw
      ? {
          '@type': 'PropertyValue',
          name: 'Job ID',
          value: jobIdRaw.replace(/^Job ID:\s*/i, '').trim(),
        }
      : undefined,
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      sameAs: data.origin,
    },
    jobLocation: location
      ? {
          '@type': 'Place',
          name: location,
        }
      : undefined,
    jobLocationType: workMode || undefined,
  };

  return schema;
}

const PAGE_TYPE_TO_SCHEMA_GENERATOR = {
  [PAGE_TYPES.HOME]: (data) => buildHomeSchemas(data),
  [PAGE_TYPES.ABOUT]: (data) => [buildAboutPageSchema(data)],
  [PAGE_TYPES.CONTACT]: (data) => [buildContactPageSchema(data)],
  [PAGE_TYPES.SECTION_LANDING]: (data) => [buildCollectionPageSchema(data)],
  [PAGE_TYPES.NEWSROOM_LANDING]: (data) => [buildCollectionPageSchema(data)],
  [PAGE_TYPES.NEWS]: (data) => [buildNewsArticleSchema(data)],
  [PAGE_TYPES.ARTICLE]: (data) => [buildArticleSchema(data)],
  [PAGE_TYPES.CAREERS_LANDING]: (data) => [buildCollectionPageSchema(data)],
  [PAGE_TYPES.JOB_LISTING_PAGE]: (data) => [buildCollectionPageSchema(data)],
  [PAGE_TYPES.JOB_DETAIL]: (data, doc) => [buildJobPostingSchema(data, doc)],
  [PAGE_TYPES.GENERIC]: (data) => [buildGenericWebPageSchema(data)],
};

/**
 * Generate and inject breadcrumb schema into <head> if breadcrumbs are rendered.
 * @param {Document} doc The document object
 */
export async function generateBreadcrumbSchema(doc) {
  const breadcrumbElements = doc.querySelectorAll('.breadcrumb ul li');

  if (!breadcrumbElements || breadcrumbElements.length === 0) return;

  const breadcrumbItems = [];

  breadcrumbElements.forEach((node) => {
    const anchor = node.querySelector('a');

    if (anchor) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        name: anchor.textContent.trim(),
        item: getAbsoluteUrl(anchor.href),
      });
    } else {
      breadcrumbItems.push({
        '@type': 'ListItem',
        name: node.textContent.trim(),
        item: window.location.href,
      });
    }
  });

  if (breadcrumbItems.length === 0) return;

  const breadcrumbList = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      ...item,
      position: index + 1,
    })),
  };

  injectScript({
    type: 'application/ld+json',
    content: JSON.stringify(cleanObject(breadcrumbList)),
  });
}

export default async function loadSchema(doc) {
  const manualSchema = getMetadata('schema');

  if (manualSchema) {
    if (validateSchema(manualSchema)) {
      return;
    }

    doc.head.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      if (script.textContent.trim() === manualSchema.trim()) {
        script.remove();
      }
    });

    console.error('Invalid manual schema JSON:', manualSchema);
  }

  const metadataType = normalizePageType(getMetadata('type'));
  const inferredType = inferPageType(window.location.pathname);
  const pageType = metadataType || inferredType || PAGE_TYPES.GENERIC;

  if (!metadataType) {
    console.warn(`No valid page type specified in metadata. Inferred page type: ${pageType}`);
  }

  const pageData = getPageData(doc);
  const schemaFactory = PAGE_TYPE_TO_SCHEMA_GENERATOR[pageType] || PAGE_TYPE_TO_SCHEMA_GENERATOR[PAGE_TYPES.GENERIC];

  const schemas = schemaFactory(pageData)
    .map((schema) => cleanObject(schema))
    .filter((schema) => schema && Object.keys(schema).length > 0);

  schemas.forEach((schema) => {
    injectScript({
      type: 'application/ld+json',
      content: JSON.stringify(schema),
    });
  });
}
