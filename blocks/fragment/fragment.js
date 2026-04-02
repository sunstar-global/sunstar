/*
 * Fragment Block
 * Include content from one Helix page in another.
 * https://www.hlx.live/developer/block-collection/fragment
 */
import { loadFragment } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      const fragmentSectionContainer = fragmentSection.querySelector('.section-container');
      if (fragmentSectionContainer) {
        block.closest('.fragment-wrapper').replaceWith(...fragmentSectionContainer.childNodes);
      } else {
        block.closest('.fragment-wrapper').replaceWith(...fragmentSection.childNodes);
      }
    }
  }
}

export function getLoadablePathFromCell(cell, marker = 'fragment') {
  if (!cell) return null;

  const directDivs = [...cell.querySelectorAll(':scope > div')];

  const markerIndex = directDivs.findIndex((div) => div.textContent.trim().toLowerCase() === marker.toLowerCase());

  if (markerIndex === -1) return null;

  const nextDiv = directDivs[markerIndex + 1];
  const nextLink = nextDiv?.querySelector('a');

  if (nextLink) {
    return nextLink.getAttribute('href');
  }

  const fallbackLink = cell.querySelector('a');
  return fallbackLink?.getAttribute('href') || null;
}

export async function processLoadableCells(
  block,
  { marker = 'fragment', load, onMatch, cellSelector = ':scope > div > div' } = {}
) {
  if (!block || typeof load !== 'function' || typeof onMatch !== 'function') {
    return;
  }

  const cells = [...block.querySelectorAll(cellSelector)];

  await Promise.all(
    cells.map(async (cell) => {
      const path = getLoadablePathFromCell(cell, marker);

      if (!path) return;

      const loadedContent = await load(path, cell);

      if (!loadedContent) return;

      await onMatch({
        block,
        cell,
        path,
        loadedContent,
      });
    })
  );
}
