import { createOptimizedPicture, readBlockConfig } from '../../scripts/lib-franklin.js';
import { fetchIndex, getLanguage } from '../../scripts/scripts.js';

export function filterIncompleteEntries(json) {
  return json.data.filter((e) => e.image !== '' && e['career-quote'] !== '0' && e['career-jobtitle'] !== '0');
}

export default async function decorate(block) {
  const blockCfg = readBlockConfig(block);
  const chunkSize = parseInt(blockCfg.chunk, 10) || 8; // Set chunk size
  block.innerHTML = '';
  const lang = getLanguage();
  const idxPrefix = lang === 'en' ? '' : `${lang}-`;

  const json = await fetchIndex('query-index', `${idxPrefix}career-testimonials`);
  const data = filterIncompleteEntries(json);
  let currentResults = 0; // Track number of loaded results

  const careerGrid = document.createElement('div');
  careerGrid.classList.add('career-grid');

  // **Load Initial Results**
  loadResults(careerGrid, data, currentResults, chunkSize);
  currentResults += chunkSize;

  // **Load More Button**
  if (currentResults < data.length) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.classList.add('load-more-container');

    const loadMoreButton = document.createElement('button');
    loadMoreButton.classList.add('primary');
    loadMoreButton.classList.add('button');
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.addEventListener('click', async () => {
      await loadMoreResults(careerGrid, data, currentResults, chunkSize, loadMoreButton);
      currentResults += chunkSize;
      if (currentResults >= data.length) {
        loadMoreButton.remove(); // Hide button when all data is loaded
      }
    });

    loadMoreContainer.append(loadMoreButton);
    careerGrid.append(loadMoreContainer);
  }

  block.append(careerGrid);
}

// **Load Specific Results**
function loadResults(container, data, startIndex, chunkSize) {
  for (let i = startIndex; i < Math.min(startIndex + chunkSize, data.length); i += 1) {
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

    a.append(contentDiv);
    div.append(a);
    container.insertBefore(div, container.lastChild); // Ensure it inserts before "Load More"
  }
}

// **Load More Results**
async function loadMoreResults(container, data, currentResults, chunkSize, button) {
  loadResults(container, data, currentResults, chunkSize);
}