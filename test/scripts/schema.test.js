/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import loadSchema, { generateBreadcrumbSchema } from '../../scripts/schema.js';

function resetPage(path = '/healthy-thinking/lets-talk-oral-health') {
  document.head.innerHTML = '';
  document.body.innerHTML = '<main><h1>Test Article</h1><p>Article body</p></main>';
  window.history.pushState({}, '', path);
}

function addMeta(name, content) {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.append(meta);
  return meta;
}

function getJsonLdScripts() {
  return [...document.querySelectorAll('script[type="application/ld+json"]')];
}

function getParsedJsonLdScripts() {
  return getJsonLdScripts().map((script) => JSON.parse(script.textContent));
}

describe('Schema', () => {
  beforeEach(() => {
    resetPage();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('injects valid custom schema metadata as JSON-LD', async () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Custom schema',
    };
    addMeta('schema', JSON.stringify(schema));

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal('metadata');
    expect(JSON.parse(scripts[0].textContent)).to.deep.equal(schema);
  });

  it('uses generated schema when custom schema metadata is missing', async () => {
    addMeta('type', 'article');

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal('generated');
    expect(getParsedJsonLdScripts()[0]['@type']).to.equal('Article');
  });

  it('falls back to generated schema when custom schema metadata is malformed', async () => {
    const consoleStub = sinon.stub(console, 'error');
    addMeta('schema', '{"@context":');
    addMeta('type', 'article');

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal('generated');
    expect(getParsedJsonLdScripts()[0]['@type']).to.equal('Article');
    expect(consoleStub.calledOnce).to.be.true;
  });

  it('custom schema overrides generated and breadcrumb schema', async () => {
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = '<ul><li><a href="/healthy-thinking">Healthy Thinking</a></li><li>Article</li></ul>';
    document.body.prepend(breadcrumb);
    await generateBreadcrumbSchema(document);

    addMeta('type', 'article');
    addMeta(
      'schema',
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [],
      })
    );

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal('metadata');
    expect(getParsedJsonLdScripts()[0]['@type']).to.equal('FAQPage');
  });

  it('does not create duplicate custom schema scripts on repeated invocation', async () => {
    addMeta(
      'schema',
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'One copy',
      })
    );

    await loadSchema(document);
    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getJsonLdScripts()[0].dataset.schemaSource).to.equal('metadata');
  });

  it('preserves quotes apostrophes unicode and nested @graph JSON', async () => {
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'Oral health: "quotes", apostrophes, and 日本語',
          description: "Don't alter authored JSON-LD",
        },
      ],
    };
    addMeta('schema', JSON.stringify(schema));

    await loadSchema(document);

    expect(getParsedJsonLdScripts()[0]).to.deep.equal(schema);
  });
});
