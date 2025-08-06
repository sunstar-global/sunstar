// media query match that indicates mobile/tablet width
export default function decorate(block) {
  [...block.children].forEach((row, r) => {
    if (r > 0) {
      const nexticondiv = document.createElement('div');
      nexticondiv.style.left = [...row.children][1].textContent;
      nexticondiv.style.top = [...row.children][2].textContent;
      nexticondiv.setAttribute('data', [...row.children][0].textContent.split(':')[1]);
      nexticondiv.setAttribute('data-city', [...row.children][0].textContent.split('\n')[2].split(':')[0]);
      nexticondiv.addEventListener('click', () => {
        nexticondiv.classList.toggle('onclick');
        nexticondiv.classList.toggle('onclick');
      });
      row.after(nexticondiv);
      row.remove();
    }
  });
}
