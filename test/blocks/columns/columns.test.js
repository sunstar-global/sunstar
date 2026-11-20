/* eslint-disable no-unused-expressions */
/* global describe before afterEach it */

import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';

const scripts = {};

document.write(await readFile({ path: './columns.plain.html' }));

describe('Columns Block', () => {
  before(async () => {
    const mod = await import('../../../blocks/columns/columns.js');
    Object.keys(mod).forEach((func) => {
      scripts[func] = mod[func];
    });
  });

  it('Handles split percentages', () => {
    const block = document.querySelector('.columns.split-testratio1');

    scripts.applySplitPercentages(block);

    const ca = block.querySelector('#column-a');
    expect(ca.style.flexBasis).to.equal('80%');
    const cb = block.querySelector('#column-b');
    expect(cb.style.flexBasis).to.equal('20%');
    const cx = block.querySelector('#column-x');
    expect(cx.style.flexBasis).to.equal('80%');
    const cy = block.querySelector('#column-y');
    expect(cy.style.flexBasis).to.equal('20%');
  });

  it('No split percentages if not requested', () => {
    const block = document.querySelector('.columns.other');

    scripts.applySplitPercentages(block);

    const cc = block.querySelector('#column-c');
    expect(cc.style.flexBasis).to.equal('');
    const cd = block.querySelector('#column-d');
    expect(cd.style.flexBasis).to.equal('');
  });

  it('Applies alignment to non-text cells', () => {
    const block = document.querySelector('.columns.split-testratio1');

    scripts.applyCellAlignment(block);

    const ca = block.querySelector('#column-a');
    expect(ca.style.display).to.equal('flex');
    expect(ca.style.alignSelf).to.equal('center');

    const cb = block.querySelector('#column-b');
    expect(cb.style.display).to.equal('flex');
    expect(cb.style.alignSelf).to.equal('flex-end');

    const cx = block.querySelector('#column-x');
    expect(cx.style.display).to.equal('flex');
    expect(cx.style.justifyContent).to.equal('center');

    const cy = block.querySelector('#column-y');
    expect(cy.style.display).to.equal('flex');
    expect(cy.style.justifyContent).to.equal('right');
  });

  it('Applies alignment to text cells', () => {
    const block = document.querySelector('.columns.split-testratio2');

    scripts.applyCellAlignment(block);

    const t1 = block.querySelector('#column-t1');
    expect(t1.style.display).to.not.equal('flex');
    expect(t1.style.textAlign).to.equal('');

    const t2 = block.querySelector('#column-t2');
    expect(t2.style.display).to.not.equal('flex');
    expect(t1.style.textAlign).to.equal('');

    const t3 = block.querySelector('#column-t3');
    expect(t3.style.display).to.not.equal('flex');
    expect(t3.style.textAlign).to.equal('center');

    const t4 = block.querySelector('#column-t4');
    expect(t4.style.display).to.not.equal('flex');
    expect(t4.style.textAlign).to.equal('right');
  });

  it('Applies default alignment', () => {
    const block = document.querySelector('.columns.other');

    scripts.applyCellAlignment(block);

    const cc = block.querySelector('#column-c');
    expect(cc.style.display).to.equal('flex');
    expect(cc.style.alignSelf).to.equal('flex-start');

    const cd = block.querySelector('#column-d');
    expect(cd.style.display).to.not.equal('flex');

    const cd2 = block.querySelector('#column-d');
    expect(cd2.style.display).to.not.equal('flex');
    expect(cd2.style.textAlign).to.equal('');
  });

  it('Adds arbitrary labels from an authored label marker', () => {
    const block = document.createElement('div');
    block.className = 'columns';
    block.innerHTML = `
      <div>
        <div>
          <h3>Use of low environmental impact materials in products and packaging (Japan)</h3>
          <p>Labels: Reduce, Renew</p>
          <p>Body copy</p>
        </div>
      </div>
    `;

    scripts.decorateLabels(block);

    const labels = [...block.querySelectorAll('.content-label')].map((label) => label.textContent);
    expect(labels).to.deep.equal(['Reduce', 'Renew']);
    expect(block.querySelector('h3 > .content-labels')).to.exist;
    expect(block.textContent).to.not.include('Labels:');
  });

  it('Supports labels that are not part of a predefined category list', () => {
    const block = document.createElement('div');
    block.className = 'cards';
    block.innerHTML = `
      <div>
        <div>
          <div>Use of low environmental impact materials in products and packaging (Japan)</div>
          <p>Labels: Research, Employee wellbeing, Other</p>
          <p>Body copy</p>
        </div>
      </div>
    `;

    scripts.decorateLabels(block);

    const labels = [...block.querySelectorAll('.content-label')].map((label) => label.textContent);
    expect(labels).to.deep.equal(['Research', 'Employee wellbeing', 'Other']);
    expect(block.textContent).to.not.include('Labels:');
  });

  it('Adds labels when the title renders as paragraph text', () => {
    const block = document.createElement('div');
    block.className = 'columns';
    block.innerHTML = `
      <div>
        <div>
          <p>Use of low environmental impact materials in products and packaging (Japan)</p>
          <p>Labels: Reuse, Recycle, Decarbonize</p>
          <p>Body copy</p>
        </div>
      </div>
    `;

    scripts.decorateLabels(block);

    const labels = [...block.querySelectorAll('.content-label')].map((label) => label.textContent);
    expect(labels).to.deep.equal(['Reuse', 'Recycle', 'Decarbonize']);
    expect(block.querySelector('p > .content-labels')).to.exist;
  });

  describe('Careers FAQ answers', () => {
    let fixture;

    before(async () => {
      await new Promise((resolve, reject) => {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = '/blocks/columns/columns.css';
        stylesheet.onload = resolve;
        stylesheet.onerror = reject;
        document.head.append(stylesheet);
      });
    });

    afterEach(() => fixture?.remove());

    async function createFixture({ careers = true, sectionId = 'faqs-careers-at-sunstar' } = {}) {
      fixture = document.createElement('main');
      fixture.innerHTML = `
        ${careers ? '<div class="hero-banner careers"></div>' : ''}
        <div class="section">
          <h2 id="${sectionId}">FAQs</h2>
          <div class="columns plain-links top-down collapse">
            <div><div>
              <h3>What jobs are available?</h3>
              <p class="intro">Sunstar offers career opportunities, including:</p>
              <ul><li>Research and Development</li><li>Marketing</li></ul>
              <p class="closing">Opportunities vary by country.</p>
              <h3>Do you offer training?</h3>
              <ul><li>Yes, we offer training.</li></ul>
            </div></div>
          </div>
        </div>
      `;
      document.body.append(fixture);
      const block = fixture.querySelector('.columns');
      await scripts.default(block);
      return block;
    }

    it('Toggles the intro paragraph, bullets and closing paragraph together', async () => {
      const block = await createFixture();
      const question = block.querySelector('h3');
      const answer = question.nextElementSibling;
      expect(answer.className).to.equal('faq-answer');
      expect([...answer.children].map((element) => element.tagName)).to.deep.equal(['P', 'UL', 'P']);
      expect(answer.querySelector('.intro').closest('li')).to.equal(null);
      expect(answer.hidden).to.equal(true);
      expect(getComputedStyle(answer).display).to.equal('none');

      question.click();
      expect(answer.hidden).to.equal(false);
      expect(getComputedStyle(answer).display).to.equal('block');
      expect(getComputedStyle(answer.querySelector('ul')).display).to.equal('block');
      expect(getComputedStyle(answer.querySelector('li')).listStyleType).to.equal('disc');

      question.click();
      expect(answer.hidden).to.equal(true);
      expect(getComputedStyle(answer).display).to.equal('none');
    });

    it('Keeps separate answers independent and single-item answers unbulleted', async () => {
      const block = await createFixture();
      const questions = block.querySelectorAll('h3');
      const answers = block.querySelectorAll('.faq-answer');
      expect(answers.length).to.equal(2);
      expect(answers[0].querySelector('h3')).to.equal(null);
      questions[1].click();
      expect(answers[0].hidden).to.equal(true);
      expect(answers[1].hidden).to.equal(false);
      expect(getComputedStyle(answers[1].querySelector('li')).listStyleType).to.equal('none');
    });

    it('Preserves accordion behavior on other pages', async () => {
      const block = await createFixture({ careers: false });
      expect(block.querySelector('.faq-answer')).to.equal(null);
      const question = block.querySelector('h3');
      question.click();
      expect(question.nextElementSibling.classList.contains('active')).to.equal(true);
    });

    it('Preserves other accordion sections on the careers page', async () => {
      const block = await createFixture({ sectionId: 'another-faq' });
      expect(block.querySelector('.faq-answer')).to.equal(null);
    });
  });
});
