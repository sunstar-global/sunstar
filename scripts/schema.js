import { getMetadata } from './lib-franklin.js';

/**
 * Generate and inject breadcrumb schema into <head> if breadcrumbs are rendered.
 * @param {Document} doc The document object
 */
export function generateBreadcrumbSchema(doc) {
  const breadcrumbElements = doc.querySelectorAll('.breadcrumb ul li');

  if (!breadcrumbElements) return;

  const breadcrumbItems = [];

  breadcrumbElements.forEach((node) => {
    if (node.querySelector('a')) {
      const anchor = node.querySelector('a');
      breadcrumbItems.push({
        '@type': 'ListItem',
        name: anchor.textContent.trim(),
        item: anchor.href,
      });
    } else {
      const text = node.textContent.trim();

      breadcrumbItems.push({
        '@type': 'ListItem',
        name: text,
        item: window.location.href,
      });
    }
  });

  if (breadcrumbItems.length === 0) return;

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      ...item,
      position: index + 1,
    })),
  };

  const breadcrumbScript = doc.createElement('script');
  breadcrumbScript.type = 'application/ld+json';
  breadcrumbScript.textContent = JSON.stringify(breadcrumbList);

  doc.head.appendChild(breadcrumbScript);
}

export default function loadSchema(document) {
  // Check if manual schema exists in metadata
  const manualSchema = getMetadata('schema');

  if (manualSchema) {
    try {
      JSON.parse(manualSchema);

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = manualSchema;

      document.head.appendChild(script);

      return;
    } catch (e) {
      console.error('Invalid manual schema JSON:', e);
    }
  }

  // Determine page type
  const allowedTypes = ['article', 'newsroom'];
  const pageType = getMetadata('pagetype')?.toLowerCase();
  const isNewsroomPath = window.location.pathname.includes('/newsroom');

  if (pageType && !allowedTypes.includes(pageType) && !isNewsroomPath) {
    return;
  }

  // Collect page data
  const headline = document.querySelector('h1')?.textContent?.trim();
  const description = getMetadata('description');
  const author = getMetadata('author');
  const datePublished = getMetadata('date');
  const image = document.querySelector('main img')?.src;

  // Choose schema type
  const schemaType = pageType === 'newsroom' || isNewsroomPath ? 'NewsArticle' : 'Article';

  // Build schema object
  const schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline,
    description,
    mainEntityOfPage: window.location.href,
    url: window.location.href,
    datePublished,
    dateModified: datePublished,
    author: author
      ? {
          '@type': 'Person',
          name: author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Sunstar',
      url: window.location.origin,
    },
    image,
  };

  // Remove empty fields
  Object.keys(schema).forEach((key) => {
    if (!schema[key]) delete schema[key];
  });

  // Inject schema into <head>
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);

  console.log('Auto-generated schema injected', schema);
}
