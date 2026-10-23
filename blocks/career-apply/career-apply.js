import { getLanguage } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/lib-franklin.js';

const FIELD_ALIASES = {
  massage: 'message',
};

function normalizeText(value) {
  return value?.trim().replace(/\s+/g, ' ') || '';
}

function getRowLink(cells) {
  const link = cells
    .slice(1)
    .map((cell) => cell.querySelector('a[href]'))
    .find(Boolean);
  return link?.getAttribute('href') || normalizeText(cells[2]?.textContent);
}

export function readAuthoring(block) {
  const fields = {};

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = normalizeText(cells[0]?.textContent).toLowerCase();
    const key = FIELD_ALIASES[label] || label;
    if (!key || cells.length < 2) return;

    fields[key] = {
      text: normalizeText(cells[1].textContent),
      href: getRowLink(cells),
    };
  });

  return fields;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders(getLanguage());
  const authored = readAuthoring(block);
  const getText = (key, fallback) => authored[key]?.text || fallback;
  const getHref = (key, fallback) => authored[key]?.href || fallback;

  const section = document.querySelector('.section.career-apply-container');
  if (section) {
    section.classList.add('full-width');
  }

  block.replaceChildren();

  const title = document.createElement('h2');
  title.innerText = getText('title', placeholders['career-apply-title']);
  block.appendChild(title);

  const msg = document.createElement('p');
  msg.innerText = getText('message', placeholders['career-apply-msg']);
  block.appendChild(msg);

  const buttonBar = document.createElement('p');
  buttonBar.classList.add('button-container');
  const search = document.createElement('a');
  search.innerText = getText('search', placeholders['career-apply-search']);
  search.classList.add('button', 'primary');
  search.href = getHref('search', placeholders['career-apply-search-href']);
  buttonBar.appendChild(search);

  const linkedin = document.createElement('a');
  linkedin.innerText = getText('linkedin', placeholders['career-apply-linkedin']);
  linkedin.classList.add('button', 'primary', 'linkedin');
  linkedin.href = getHref('linkedin', placeholders['career-apply-linkedin-href']);
  const sprite = document.createElement('span');
  sprite.classList.add('icon', 'icon-linkedin');
  linkedin.appendChild(sprite);
  buttonBar.append(linkedin);
  block.appendChild(buttonBar);
}
