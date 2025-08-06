import { decorateButtons, decorateSections, getMetadata, updateSectionsStatus } from '../../scripts/lib-franklin.js';

import { getLanguage, decorateAnchors } from '../../scripts/scripts.js';

function decorateFooterTop(block) {
  const footerTop = block.querySelector('.footer-top');
  const tempDiv = footerTop.querySelector('.section-container>div');
  const children = [...footerTop.querySelector('.section-container>div').children];

  let index = 0;
  let topIndex = 0;
  tempDiv.innerHTML = '';

  while (index < children.length) {
    let topItem;
    if (topIndex < 5) {
      topItem = document.createElement('div');
      topItem.classList.add('footer-top-item');
      topIndex += 1;
    } else {
      topItem = tempDiv.querySelector('.footer-top-item:last-child');
    }

    if (children[index].tagName === 'H5') {
      const a = children[index].querySelector('a');
      if (a) {
        a.classList.add('h5-style');
        topItem.appendChild(a);
      }
    } else {
      topItem.appendChild(children[index]);
    }
    index += 1;

    while (index < children.length) {
      if (topIndex > 5) {
        topItem.appendChild(children[index]);
        index += 1;
        break;
      }
      if (children[index].tagName === 'H5') {
        if (!children[index + 1] || (children[index - 1].tagName === 'H5' && children[index + 1].tagName !== 'UL')) {
          const a = children[index].querySelector('a');
          if (a) {
            a.classList.add('h5-style');
            topItem.appendChild(a);
          }
        } else {
          break;
        }
      } else if (children[index].tagName === 'H6') {
        const h6 = children[index];
        const p = document.createElement('p');
        p.classList.add('h6-style');
        p.innerHTML = h6.innerHTML;
        topItem.appendChild(p);
      } else {
        topItem.appendChild(children[index]);
      }
      index += 1;
    }

    tempDiv.appendChild(topItem);
  }
}

function decorateFooter(block) {
  decorateFooterTop(block);
  block.parentElement.classList.add('appear');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // fetch footer content
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta || (getLanguage() === 'en' ? '/footer' : `/${getLanguage()}/footer`);
  const resp = await fetch(
    `${footerPath}.plain.html`,
    window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {}
  );

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;
    decorateSections(footer);
    updateSectionsStatus(footer);

    block.append(footer);

    decorateButtons(block);
    decorateFooter(block);
    decorateAnchors(block);
  }
}
