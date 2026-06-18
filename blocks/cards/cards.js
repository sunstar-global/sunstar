import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { cropString } from '../../scripts/scripts.js';
import { decorateButtons } from '../text/text.js';

function isLeadershipPage() {
  const pathname = window.location.pathname.replace(/\/$/, '');
  return pathname === '/about/our-leadership';
}

function createProfileSlug(text, usedSlugs) {
  const baseSlug =
    text
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'profile';
  let slug = baseSlug;
  let counter = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function getProfileTitle(card) {
  return card.querySelector('.cards-card-body h1, .cards-card-body h2, .cards-card-body h3, .cards-card-body h4')
    ?.textContent;
}

function createProfileModal() {
  const modal = document.createElement('div');
  modal.className = 'leadership-profile-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="leadership-profile-modal-backdrop" data-profile-close></div>
    <article class="leadership-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="leadership-profile-title" tabindex="-1">
      <button class="leadership-profile-close" type="button" aria-label="Close profile" data-profile-close></button>
      <div class="leadership-profile-content"></div>
    </article>
  `;
  document.body.append(modal);
  return modal;
}

function clearHash() {
  const { pathname, search } = window.location;
  window.history.pushState(null, '', `${pathname}${search}`);
}

function decorateLeadershipProfiles(block) {
  if (!isLeadershipPage()) {
    return;
  }

  const profiles = [...block.querySelectorAll(':scope > ul > li')].filter(
    (card) => card.querySelector('.cards-card-image') && getProfileTitle(card)
  );

  if (!profiles.length) {
    return;
  }

  const usedSlugs = new Set();
  const modal = createProfileModal();
  const dialog = modal.querySelector('.leadership-profile-dialog');
  const content = modal.querySelector('.leadership-profile-content');
  let activeProfile;

  block.classList.add('leadership-profiles');

  function closeProfile({ updateUrl = true } = {}) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('leadership-profile-open');
    activeProfile?.classList.remove('active');
    activeProfile?.focus();
    activeProfile = null;

    if (updateUrl && window.location.hash) {
      clearHash();
    }
  }

  function openProfile(profile, { updateUrl = true } = {}) {
    activeProfile?.classList.remove('active');
    activeProfile = profile;
    activeProfile.classList.add('active');

    const clone = profile.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('role');
    clone.removeAttribute('tabindex');
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    content.replaceChildren(...clone.children);

    const title = content.querySelector(
      '.cards-card-body h1, .cards-card-body h2, .cards-card-body h3, .cards-card-body h4'
    );
    if (title) {
      title.id = 'leadership-profile-title';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('leadership-profile-open');
    dialog.focus();

    if (updateUrl) {
      window.history.pushState(null, '', `#${profile.id}`);
    }
  }

  function openProfileFromHash() {
    const profileId = window.location.hash.replace('#', '');
    const profile = profiles.find((card) => card.id === profileId);

    if (profile) {
      openProfile(profile, { updateUrl: false });
    } else if (activeProfile) {
      closeProfile({ updateUrl: false });
    }
  }

  profiles.forEach((profile) => {
    const title = getProfileTitle(profile);
    const slug = createProfileSlug(title, usedSlugs);
    profile.id = slug;
    profile.tabIndex = 0;
    profile.setAttribute('role', 'button');
    profile.setAttribute('aria-label', `Open profile for ${title}`);
    profile.dataset.profileUrl = `${window.location.pathname}${window.location.search}#${slug}`;

    profile.addEventListener('click', () => openProfile(profile));
    profile.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProfile(profile);
      }
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-profile-close]')) {
      closeProfile();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeProfile) {
      closeProfile();
    }
  });

  window.addEventListener('hashchange', openProfileFromHash);
  window.addEventListener('popstate', openProfileFromHash);
  openProfileFromHash();
}

export default function decorate(block) {
  decorateButtons(block);

  const isDisabledButton = block.classList.contains('disabled');

  if (isDisabledButton) {
    // find the h7 and create a button with disabled class
    const h6 = block.querySelectorAll('h6');

    if (h6) {
      h6.forEach((el) => {
        // if h6 is last child then add create button with disabled class
        // add several classes to the button

        if (el.nextElementSibling === null) {
          // create button-container
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
  const grid = block.classList.contains('grid');
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
      if (!grid) {
        title.textContent = cropString(title.textContent, 65);
      }
    }
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) =>
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, isHero, [{ width: '750' }]))
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
  decorateLeadershipProfiles(block);
}
