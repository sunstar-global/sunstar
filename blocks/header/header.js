import { fetchPlaceholders, getMetadata } from '../../scripts/lib-franklin.js';
import buildNavTree from './nav-tree-utils.js';
import { getLanguage, getSearchWidget, fetchIndex, decorateAnchors, htmlToElement, LANGUAGES } from '../../scripts/scripts.js';

function decorateSocial(social) {
  social.classList.add('social');
  social.innerHTML = social.innerHTML.replace(/\[social\]/, '');
  social.querySelectorAll(':scope>ul>li').forEach((li) => {
    const a = li.querySelector('a');
    a.setAttribute('target', '_blank');
    if (a.innerHTML.includes('linkedin')) {
      a.setAttribute('aria-label', 'LinkedIn');
    } else if (a.innerHTML.includes('twitter')) {
      a.setAttribute('aria-label', 'Twitter');
    } else if (a.innerHTML.includes('facebook')) {
      a.setAttribute('aria-label', 'Facebook');
    } else if (a.innerHTML.includes('youtube')) {
      a.setAttribute('aria-label', 'YouTube');
    }
  });
}

async function decorateWebsitePicker(websitePicker) {
  websitePicker.classList.add('picker');
  websitePicker.classList.add('website-picker');
  websitePicker.innerHTML = websitePicker.innerHTML.replace(/\[websites\]/, '');
  const title = 'Sunstar Websites';
  websitePicker.querySelectorAll(':scope>ul>li').forEach((li) => {
    li.classList.add('picker-item');
    li.classList.add('website-picker-item');
  });

  const div = document.createElement('div');
  div.textContent = title;
  websitePicker.prepend(div);

  if (websitePicker.querySelectorAll(':scope>ul>li').length === 0 && websitePicker.querySelector('ul')) {
    websitePicker.querySelector('ul').remove();
  }
}

/* Decorate the other items - which is the items pulled from top nav */
function decorateOtherItems(otherItemsEl) {
  otherItemsEl.classList.add('other-items');

  /* Pull items from the top nav */
  document
    .querySelector('nav.nav-top')
    .querySelectorAll(':scope>ul>li')
    .forEach((li) => {
      otherItemsEl.appendChild(li.cloneNode(true));
    });

  /* Make a website picker for mobile */
  const websitePicker = document.createElement('li');
  websitePicker.classList.add('mobile-website-picker');
  const websitePickerUl = document.createElement('ul');
  const title = otherItemsEl.querySelector('.website-picker').querySelector(':scope>div');
  websitePicker.appendChild(title);
  websitePicker.appendChild(websitePickerUl);
  otherItemsEl
    .querySelector('.website-picker')
    .querySelectorAll(':scope>ul>li')
    .forEach((li) => {
      websitePickerUl.appendChild(li.cloneNode(true));
    });

  websitePicker.querySelectorAll(':scope>ul>li').forEach((li) => {
    li.classList.add('mobile-website-picker-item');
    li.classList.remove('website-picker-item');
    li.classList.remove('picker-item');
  });

  otherItemsEl.querySelector('.website-picker').replaceWith(websitePicker);

  /* Make a lang picker for mobile */
  const langPicker = document.createElement('li');
  langPicker.classList.add('mobile-lang-picker');
  const langPickerUl = document.createElement('ul');
  langPicker.appendChild(langPickerUl);
  otherItemsEl
    .querySelector('.lang-picker')
    .querySelectorAll(':scope>ul>li')
    .forEach((li) => {
      langPickerUl.appendChild(li.cloneNode(true));
    });

  langPicker.querySelectorAll(':scope>ul>li').forEach((li) => {
    li.classList.add('mobile-lang-picker-item');
    li.classList.remove('lang-picker-item');
    li.classList.remove('picker-item');
  });

  otherItemsEl.querySelector('.lang-picker').replaceWith(langPicker);

  /* Move the social icons to the bottom */
  otherItemsEl.appendChild(otherItemsEl.querySelector('.social'));
}

async function decorateLangPicker(langPicker) {
  const lang = getLanguage() || '';
  let langName = 'English'; // default to English
  langPicker.classList.add('picker');
  langPicker.classList.add('lang-picker');
  langPicker.innerHTML = langPicker.innerHTML.replace(/\[languages\]/, '');

  const currentLang = getLanguage();

  // prettier-ignore
  const currPath = currentLang === 'en' ? window.location.pathname : window.location.pathname.replace(`/${currentLang}/`, '/');
  const json = await fetchIndex('query-index');

  langPicker.querySelectorAll(':scope>ul>li').forEach((li) => {
    li.classList.add('picker-item');
    li.classList.add('lang-picker-item');
    // Update the language links to point to the current path
    let langRoot = li.querySelector('a').getAttribute('href');
    langRoot = langRoot.endsWith('/') ? langRoot.slice(0, -1) : langRoot;
    const langLink = langRoot + currPath + window.location.search;
    li.querySelector('a').setAttribute('href', langLink);

    /* Remove the current language from the list */
    if (langRoot === `/${lang}`) {
      langName = li.querySelector('a').innerHTML;
      li.remove();
    } else if (lang === 'en' && langRoot === '') {
      // Special Check added to remove english language from the list
      // if selected language is english
      li.remove();
    } else {
      const newUrl = langRoot === '' ? `${currPath}` : `${langRoot}${currPath}`;
      const urlExcludingSlash = newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
      const data = json.data.find((page) => [newUrl, urlExcludingSlash].includes(page.path));

      if (!data) {
        li.remove();
      }
    }
  });

  const div = document.createElement('div');
  div.textContent = langName;
  langPicker.prepend(div);

  if (langPicker.querySelectorAll(':scope>ul>li').length === 0 && langPicker.querySelector('ul')) {
    langPicker.querySelector('ul').remove();
  }
}

function decorateTopNav(nav) {
  nav.querySelectorAll(':scope>ul>li').forEach((li) => {
    if (li.textContent.includes('[languages]')) {
      decorateLangPicker(li);
    } else if (li.textContent.includes('[websites]')) {
      decorateWebsitePicker(li);
    } else if (li.textContent.trim() === '[social]') {
      decorateSocial(li);
    }
  });
}

function decorateMiddleNav(nav, placeholders) {
  const firstP = nav.querySelector('p');
  const logoLink = firstP?.querySelector('a');

  if (!logoLink) return;

  // Create the <div> to replace <p> on all pages
  const div = document.createElement('div');
  div.classList.add('logo-container');

  // Move the <a> into the new <div>
  div.appendChild(logoLink);

  // Replace <p> with <div>
  firstP.replaceWith(div);

  // If homepage of any language, add an <h1> for accessibility
  const path = window.location.pathname;
  const isHomepage = [...LANGUAGES].some((lang) => {
    const base = lang === 'en' ? '/' : `/${lang}/`;
    return path === base || path === `${base}index.html`;
  });
 
  if (isHomepage) {
    const h1 = document.createElement('h1');
    h1.classList.add('sr-only');
    h1.textContent = placeholders['homepage-h1'];
    nav.insertBefore(h1, div);
  }

  // Set accessibility attributes on the logo link
  logoLink.setAttribute('aria-label', 'Sunstar Home');
  logoLink.setAttribute('title', placeholders['homepage-h1']);
}

function getNavbarToggler() {
  const navbarToggl = htmlToElement(`<button class="navbar-toggler" aria-label="Menu">
  <div class="mobile-icon">
    <i></i>
    <i></i>
    <i></i>
    <i></i>
  </div>
  </button>`);

  if (window.deviceType !== 'Desktop' && window.deviceType !== 'Tablet') {
    navbarToggl.classList.add('visible');
  }
  navbarToggl.addEventListener('click', () => {
    const navBottom = document.querySelector('.nav-bottom');
    const header = document.querySelector('header');
    const { body } = document;
    if (navBottom.classList.contains('open')) {
      navBottom.classList.remove('open');
      header.classList.remove('menu-open');
      body.classList.remove('fixed');
    } else {
      navBottom.classList.add('open');
      header.classList.add('menu-open');
      body.classList.add('fixed');
    }
  });

  return navbarToggl;
}

function attachWindowResizeListeners(nav) {
  const header = document.querySelector('header');
  const { body } = document;
  window.addEventListener(
    'viewportResize',
    (event) => {
      const toggler = nav.querySelector('.navbar-toggler');
      if (event.detail.deviceType === 'Desktop' || event.detail.deviceType === 'Tablet') {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          header.classList.remove('menu-open');
          body.classList.remove('fixed');
        }
        if (toggler.classList.contains('visible')) {
          toggler.classList.remove('visible');
        }
        const visibleMegaDrop = nav.querySelector('.mega-dropdown.visible');
        if (visibleMegaDrop) {
          visibleMegaDrop.classList.remove('visible');
        }
        const backButton = nav.querySelector('.menu-back-btn');
        if (backButton) {
          backButton.remove();
        }
      } else {
        toggler.classList.add('visible');
      }
    },
    true,
  );
}

function decorateBottomNav(nav, placeholders, navTreeJson) {
  
  const navTree = buildNavTree(navTreeJson, placeholders);
  
  nav.append(getNavbarToggler());
  nav.append(navTree);
  nav.append(getSearchWidget(placeholders));
  
  const otherItemsEl = document.createElement('li');
  decorateOtherItems(otherItemsEl);
  
  nav.querySelector(':scope .menu-level-1').append(otherItemsEl);
  attachWindowResizeListeners(nav);
}

const navDecorators = {
  'nav-top': decorateTopNav,
  'nav-middle': decorateMiddleNav,
  'nav-bottom': decorateBottomNav,
};

const addRemoveFixedClass = (navBottom) => {
  const { offsetHeight } = document.querySelector('nav.nav-top');
  const scroll = offsetHeight + document.querySelector('nav.nav-middle').offsetHeight;
  const megaDropdowns = document.querySelectorAll('.mega-dropdown');

  if (document.documentElement.scrollTop > scroll) {
    navBottom.classList.add('fixed');
    megaDropdowns?.forEach((megaDropdown) => {
      megaDropdown.classList.add('fixed');
    });
  } else {
    navBottom.classList.remove('fixed');
    megaDropdowns?.forEach((megaDropdown) => {
      megaDropdown.classList.remove('fixed');
    });
  }
};

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content

  const navMeta = getMetadata('nav');
  const navPath = navMeta || (getLanguage() === 'en' ? '/nav' : `/${getLanguage()}/nav`);
  const resp = await fetch(`${navPath}.plain.html`);
  const navTreeResp = await fetch(`/nav-tree.json?sheet=${getLanguage()}`);
  const navTreeJson = await navTreeResp.json();
  if (resp.ok) {
    const placeholders = await fetchPlaceholders(getLanguage());
    block.innerHTML = '';
    const html = await resp.text();
    const fetchedNav = document.createElement('div');
    fetchedNav.innerHTML = html;
    const navClasses = ['nav-top', 'nav-middle'];
    navClasses.forEach((navClass, index) => {
      const nav = document.createElement('nav');
      nav.classList.add(navClass);
      nav.innerHTML = fetchedNav.querySelectorAll(':scope>div')[index].innerHTML;
      if (navClass === 'nav-middle') {
        //find h6 and conert it to p with h6 class
        nav.querySelectorAll('h6').forEach((h6) => {
          const p = document.createElement('p');
          p.classList.add('h6-style');
          p.innerHTML = h6.innerHTML;
          h6.replaceWith(p);
        });
      }
      navDecorators[navClass](nav, placeholders);
      block.appendChild(nav);
    });
    const nav = document.createElement('nav');
    nav.classList.add('nav-bottom');
    navDecorators['nav-bottom'](nav, placeholders, navTreeJson);
    block.appendChild(nav);

    window.addEventListener('scroll', () => {
      const navBottom = document.querySelector('.nav-bottom');
      addRemoveFixedClass(navBottom);
    });

    const backdrop = document.createElement('div');
    backdrop.classList.add('backdrop');
    document.body.appendChild(backdrop);

    decorateAnchors(block);
  }

  block.parentElement.classList.add('appear');
}
