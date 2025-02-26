import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { cropString } from '../../scripts/scripts.js';
import { decorateButtons } from '../text/text.js';

export default function decorate(block) {
  decorateButtons(block);

  const isDisabledButton = block.classList.contains('disabled');

  if (isDisabledButton) {
    //find the h7 and create a button with disabled class
    const h6 = block.querySelectorAll('h6');

    if (h6) {
      h6.forEach((el) => {
        //if h6 is last child then add create button with disabled class
        //add several classes to the button

        if (el.nextElementSibling === null) {
          //create button-container
          const p = document.createElement('p');
          p.classList.add('button-container');
          el.parentElement.append(p);
          p.append(el);
          const button = document.createElement('button');
          button.classList.add('button', 'primary', 'branded');
          button.disabled = true;
          button.textContent = el.textContent;
          el.replaceWith(button);
        }
      });
    }
  }

  const isHero = block.classList.contains('hero-block');
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = row.innerHTML;

    const addCardChildrenClasses = (div) => {
      if (div.children.length === 1 && (div.querySelector(':scope>picture') || div.querySelector(':scope>.icon'))) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
      }
    };

    // find the first <a> deep in the <li>
    const a = li.querySelector('a');

    if (a && !block.classList.contains('nolink')) {
      // if there is an <a> tag, extract it as top level so that it contains the whole card
      // this is so that the link is clickable anywhere in the card
      // we will end up with a structure like this:
      // <li>
      //   <a href=".." title="Automotive Adhesives &amp; Sealants" className="button primary">
      //     <div className="cards-card-image">
      //       <picture/>
      //     </div>
      //     <div className="cards-card-body">
      //       <div>Automotive Adhesives &amp; Sealants</div>
      //     </div>
      //   </a>
      // </li>

      const aContent = a.innerHTML;
      const cardTitleDiv = document.createElement('div');
      cardTitleDiv.innerHTML = aContent;
      a.replaceWith(cardTitleDiv);
      a.innerHTML = '';
      a.append(...li.children);
      li.append(a);
      [...a.children].forEach(addCardChildrenClasses);
    } else {
      [...li.children].forEach(addCardChildrenClasses);
    }

    const title = li.querySelector('.title');
    if (title) {
      [title.textContent] = title.textContent.split('|');
      title.textContent = cropString(title.textContent, 65);
    }
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) =>
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, isHero, [{ width: '750' }])),
  );
  if (
    ul.querySelector('a') === null &&
    !block.classList.contains('omit-nolink-styles') &&
    block.closest('.section.cards-container')
  ) {
    block.closest('.section.cards-container').classList.add('nolink');
  }
  block.textContent = '';
  block.append(ul);
}
