export function decorateButtons(block) {
  const isButton =
    block.classList.contains('button') ||
    block.classList.contains('button-outline') ||
    block.classList.contains('button-secondary') ||
    block.classList.contains('button-primary');

  if (isButton) {
    const a = block.querySelectorAll('a');
    if (a) {
      a.forEach((el) => {
        el.classList.add('button');
        const p = el.closest('p');

        if (p) {
          p.classList.add('button-container');
        } else {
          const parent = el.parentElement;
          parent.classList.add('button-container');
        }

        if (block.classList.contains('button-secondary')) {
          el.classList.add('secondary');
        }

        if (block.classList.contains('button-outline')) {
          el.classList.add('outline');
        }

        if (block.classList.contains('button-primary')) {
          el.classList.add('primary');
        }

        const href = el.getAttribute('href');

        if (href.includes('podcasts.apple.com')) {
          el.classList.add('branded');
          el.innerHTML += '<span class="icon icon-apple-podcasts brand"></span>';
        }

        if (href.includes('spotify.com')) {
          el.classList.add('branded');
          el.innerHTML += '<span class="icon icon-spotify brand"></span>';
        }
      });
    }
  }
}

export default function decorate(block) {
  // check if the section has class button and add the button class to a tag check if it has button-secondary class and add secondary class to a tag, check if section has button-branded and check the a href to map the brand (fro example apple.com add icon <span class="icon icon-apple"></span> after the text in a)
  // section is the first div with classes on the the first div
  decorateButtons(block);
}
