import { getMetadata } from './lib-franklin.js';

export default function loadSchema(document) {
  console.log('Schema function running');

  // Check if manual schema exists in metadata
  const manualSchema = getMetadata('schema');

  if (manualSchema) {
    try {
      JSON.parse(manualSchema);

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = manualSchema;

      document.head.appendChild(script);
      console.log('Manual schema injected');
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
    console.log('Skipping schema: not a supported page type');
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
