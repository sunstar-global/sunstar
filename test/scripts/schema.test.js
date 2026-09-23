/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import loadSchema from '../../scripts/schema.js';

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

function addJsonLd(data, source) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  if (source) script.dataset.schemaSource = source;
  script.textContent = typeof data === 'string' ? data : JSON.stringify(data);
  document.head.append(script);
  return script;
}

function getJsonLdScripts() {
  return [...document.querySelectorAll('script[type="application/ld+json"]')];
}

function getParsedJsonLdScripts() {
  return getJsonLdScripts().map((script) => JSON.parse(script.textContent));
}

function getScriptsBySource(source) {
  return getJsonLdScripts().filter((script) => script.dataset.schemaSource === source);
}

describe('Schema', () => {
  beforeEach(() => {
    resetPage();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('uses native EDS JSON-LD when it already exists', async () => {
    const nativeSchema = {
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'Article', headline: 'Native schema' }],
    };
    addMeta('type', 'article');
    addJsonLd(nativeSchema);

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal(undefined);
    expect(JSON.parse(scripts[0].textContent)).to.deep.equal(nativeSchema);
  });

  it('lets native EDS JSON-LD win over legacy schema metadata', async () => {
    const nativeSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Native schema',
    };
    addJsonLd(nativeSchema);
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
    expect(scripts[0].dataset.schemaSource).to.equal(undefined);
    expect(getParsedJsonLdScripts()[0]).to.deep.equal(nativeSchema);
    expect(document.querySelector('meta[name="schema"]')).to.exist;
  });

  it('removes previously generated schema when native EDS JSON-LD exists', async () => {
    const nativeSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Native schema',
    };
    addJsonLd(nativeSchema);
    addJsonLd({ '@context': 'https://schema.org', '@type': 'Article', headline: 'Generated' }, 'generated');

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getScriptsBySource('generated')).to.have.length(0);
    expect(getParsedJsonLdScripts()[0]).to.deep.equal(nativeSchema);
  });

  it('removes previously injected legacy schema when native EDS JSON-LD exists', async () => {
    const nativeSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Native schema',
    };
    addJsonLd(nativeSchema);
    addJsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }, 'metadata');

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getScriptsBySource('metadata')).to.have.length(0);
    expect(getParsedJsonLdScripts()[0]).to.deep.equal(nativeSchema);
  });

  it('injects legacy schema metadata when native EDS JSON-LD is absent', async () => {
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

  it('falls back to generated schema when legacy schema metadata is malformed', async () => {
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

  it('uses generated schema when custom schema is absent', async () => {
    addMeta('type', 'article');

    await loadSchema(document);

    const scripts = getJsonLdScripts();
    expect(scripts).to.have.length(1);
    expect(scripts[0].dataset.schemaSource).to.equal('generated');
    expect(getParsedJsonLdScripts()[0]['@type']).to.equal('Article');
  });

  it('does not create duplicate generated schema scripts on repeated invocation', async () => {
    addMeta('type', 'article');

    await loadSchema(document);
    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getJsonLdScripts()[0].dataset.schemaSource).to.equal('generated');
  });

  it('does not create duplicate legacy schema scripts on repeated invocation', async () => {
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

  it('does not let unrelated third-party JSON-LD suppress generated schema', async () => {
    addMeta('type', 'article');
    addJsonLd({ '@context': 'https://example.com/context', widget: 'third-party' });

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(2);
    expect(getScriptsBySource('generated')).to.have.length(1);
    expect(getScriptsBySource('generated')[0].textContent).to.contain('"@type":"Article"');
  });

  it('ignores malformed third-party JSON-LD safely', async () => {
    addMeta('type', 'article');
    addJsonLd('{"@context":');

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(2);
    expect(getScriptsBySource('generated')).to.have.length(1);
  });

  it('detects schema.org context with a trailing slash as native JSON-LD', async () => {
    addMeta('type', 'article');
    addJsonLd({ '@context': 'https://schema.org/', '@type': 'Article' });

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getScriptsBySource('generated')).to.have.length(0);
  });

  it('detects http schema.org context as native JSON-LD', async () => {
    addMeta('type', 'article');
    addJsonLd({ '@context': 'http://schema.org', '@type': 'Article' });

    await loadSchema(document);

    expect(getJsonLdScripts()).to.have.length(1);
    expect(getScriptsBySource('generated')).to.have.length(0);
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
