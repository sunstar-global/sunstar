/* global describe it */

import { expect } from '@esm-bundle/chai';

import { readAuthoring } from '../../../blocks/career-apply/career-apply.js';

describe('Career Apply', () => {
  it('reads authored text and links from the block table', () => {
    const block = document.createElement('div');
    block.innerHTML = `
      <div><div>career-apply (inverted)</div></div>
      <div><div>Title</div><div>Ready to make a difference?</div></div>
      <div><div>Massage</div><div>People make Sunstar the company it is.</div></div>
      <div><div>Search</div><div><a href="/careers/career-opportunities">Search Global Job Opportunities</a></div></div>
      <div><div>LinkedIn</div><div><a href="https://www.linkedin.com/company/sunstar-global">Follow us on LinkedIn</a></div></div>
    `;

    const fields = readAuthoring(block);

    expect(fields.title.text).to.equal('Ready to make a difference?');
    expect(fields.message.text).to.equal('People make Sunstar the company it is.');
    expect(fields.search.text).to.equal('Search Global Job Opportunities');
    expect(fields.search.href).to.equal('/careers/career-opportunities');
    expect(fields.linkedin.text).to.equal('Follow us on LinkedIn');
    expect(fields.linkedin.href).to.equal('https://www.linkedin.com/company/sunstar-global');
  });

  it('supports a plain URL in a third column', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div><div>Search</div><div>Search jobs</div><div>/careers/jobs</div></div>';

    const fields = readAuthoring(block);

    expect(fields.search.text).to.equal('Search jobs');
    expect(fields.search.href).to.equal('/careers/jobs');
  });
});
