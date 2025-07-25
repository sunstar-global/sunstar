export function createTabs(block, text) {
  const ul = block.querySelector('ul');
  if (!ul) return null;

  const tabs = [...ul.querySelectorAll('li')].map((li) => {
    const title = li.textContent;
    const name = title.toLowerCase().trim();
    return {
      title,
      name,
      tabButton: li,
    };
  });

  const panel = document.createElement('div');
  panel.classList.add('hero-horiz-tabs-panel');
  if (text) panel.appendChild(text);

  const nav = document.createElement('nav');
  nav.classList.add('hero-horiz-tabs-nav');

  nav.replaceChildren(ul);
  panel.appendChild(nav);
  block.replaceChildren(panel);

  // search referenced sections and move them inside the tab-container
  const wrapper = block.parentElement;
  const container = wrapper.parentElement;
  const sections = document.querySelectorAll('[data-tab]');

  // move the tab's sections before the tab riders.
  [...sections].forEach((tabContent) => {
    const name = tabContent.dataset.tab.toLowerCase().trim();

    const tab = tabs.find((t) => t.name === name);
    if (tab) {
      const sectionWrapper = document.createElement('div');

      // copy the classes from the section to the wrapper
      [...tabContent.classList].forEach((c) => {
        sectionWrapper.classList.add(c);
      });

      const tabDiv = document.createElement('div');
      tabDiv.classList.add('tab-item');
      tabDiv.append(...tabContent.children);
      sectionWrapper.append(tabDiv);
      container.insertBefore(sectionWrapper, wrapper);

      // remove it from the dom
      tabContent.remove();
      tab.content = tabDiv;
    }
  });
  return tabs;
}

export function addTabs(tabs, block) {
  tabs.forEach((tab, index) => {
    const button = document.createElement('button');
    const { tabButton, title, name } = tab;
    button.textContent = title.split(',');
    button.classList.add('tab');

    tabButton.replaceChildren(button);

    tabButton.addEventListener('click', () => {
      const activeButton = block.querySelector('button.active');

      if (activeButton !== tabButton) {
        activeButton.classList.remove('active');
        // remove active class from parent li
        activeButton.parentElement.classList.remove('active');
        button.classList.add('active');
        // add active class to parent li
        tabButton.classList.add('active');

        tabs.forEach((t) => {
          if (name === t.name) {
            t.content.classList.add('active');
          } else {
            t.content.classList.remove('active');
          }
        });
      }
    });

    if (index === 0) {
      button.classList.add('active');
      // add active class to parent li
      tabButton.classList.add('active');
      if (tab.content) {
        tab.content.classList.add('active');
      }
    }
  });
}

export function getTagName() {
  const urlPathName = window.location.pathname;
  let tagName = '';
  const tagRegex = /(^\/healthy-thinking\/tag)\/(.+)/;
  if (tagRegex.test(urlPathName)) {
    const pathArr = urlPathName.replace(tagRegex, '$2');
    tagName = pathArr.endsWith('/') ? pathArr.slice(0, -1) : pathArr;
  }
  return tagName;
}

export function addTextEl(tag, txt, parent, icon, ...classes) {

  //if there is an icon create a span with the icon class and add it to the p element and add to the p element the class has-icon
  
  if (tag === 'p') {
    const wrapper = document.createElement('div');
    classes.forEach((c) => wrapper.classList.add(c));
  
    if (Array.isArray(txt)) {
      txt.forEach((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        wrapper.appendChild(p);
      });
    } else {
      const p = document.createElement('p');
      p.textContent = txt;
      wrapper.appendChild(p);
    }
    
    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.classList.add(icon);
      iconSpan.classList.add('icon');
      wrapper.classList.add('has-icon');
      wrapper.prepend(iconSpan);
    }
  
    parent.appendChild(wrapper);
    return;
  }
  
  if (Array.isArray(txt)) {
    txt.forEach((t) => {
      const el = document.createElement(tag);
      el.textContent = t;
      classes.forEach((c) => el.classList.add(c));
      parent.appendChild(el);
    });
    return;
  }
  
  const el = document.createElement(tag);
  el.textContent = txt;
  classes.forEach((c) => el.classList.add(c));
  parent.appendChild(el);
}