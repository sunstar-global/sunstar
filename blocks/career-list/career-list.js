import { createOptimizedPicture, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { fetchIndex, getLanguage } from '../../scripts/scripts.js';

export function filterIncompleteEntries(json) {
  return json.data.filter((e) => e.image !== '' && e['career-quote'] !== '0' && e['career-jobtitle'] !== '0');
}

export default async function decorate(block) {
  const lang = getLanguage();
  const placeholders = await fetchPlaceholders(lang);

  const idxPrefix = lang === 'en' ? '' : `${lang}-`;
  const json = await fetchIndex('query-index', `${idxPrefix}career-testimonials`);
  const data = filterIncompleteEntries(json);

  const careerGrid = document.createElement('div');
  careerGrid.classList.add('career-grid');

  const slideDivs = [];
  for (let i = 0; i < data.length; i += 1) {
    const div = document.createElement('div');
    div.classList.add('career-card');

    const a = document.createElement('a');
    a.href = data[i].path;
    a.classList.add('career-card-link');

    const pic = createOptimizedPicture(data[i].image, data[i].pagename);
    pic.classList.add('career-card-image');
    a.append(pic);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('career-card-content', 'h-full');

    const bqc = document.createElement('div');
    bqc.classList.add('career-card-bqc');

    const bq = document.createElement('blockquote');
    bq.textContent = data[i]['career-quote'];
    bqc.append(bq);
    contentDiv.append(bqc);

    const nm = document.createElement('h2');
    nm.textContent = data[i].pagename;
    contentDiv.append(nm);

    const role = document.createElement('p');
    role.textContent = data[i]['career-jobtitle'];
    contentDiv.append(role);

    a.append(contentDiv); // Append content inside the card

    // 🌟 Footer: Button
    const footer = document.createElement('div');
    footer.classList.add('career-card-footer');



    a.append(footer);

    div.append(a);
    careerGrid.append(div);
    slideDivs.push(div);
  }


  block.append(careerGrid);

}

