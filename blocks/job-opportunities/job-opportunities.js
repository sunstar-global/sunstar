import { fetchIndex, getLanguage } from '../../scripts/scripts.js';
import { addTextEl } from '../../scripts/blocks-utils.js';

export default async function decorate(block) {
  // const blockCfg = readBlockConfig(block);
  const chunkSize = 8; // Set chunk size
  block.innerHTML = '';
  const lang = getLanguage();
  const idxPrefix = lang === 'en' ? '' : `${lang}-`;
  const { data } = await fetchIndex('query-index', `${idxPrefix}career-opportunities`);

  let currentResults = 0; // Track number of loaded results

  const unique = (arr) => [...new Set(arr.filter(Boolean))];

  const locations = unique(data.map((item) => item.country));
  const regions = unique(data.map((item) => item.region));

  // eslint-disable-next-line no-unused-vars
  const employmentTypes = unique(data.map((item) => item.employmenttype));
  const workModes = unique(data.map((item) => item.workmode));

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.gap = '2rem';

  // Sidebar filter (2/5)
  const sidebar = document.createElement('aside');
  sidebar.style.width = '40%';
  sidebar.style.position = 'sticky';
  sidebar.style.top = '1rem'; // adjust if needed
  sidebar.style.alignSelf = 'flex-start'; // needed for sticky to work
  sidebar.classList.add('job-filter-sidebar');

  sidebar.innerHTML = `
		<div class="filter-group">
		<h3>Region</h3>
		<ul>
			${regions
        .map(
          (region) => `
			<li>
				<label>
				<input type="checkbox" class="filter-checkbox" data-filter-type="region" value="${region}">
				${region}
				</label>
			</li>
			`
        )
        .join('')}
		</ul>
		</div>
		<div class="filter-group">
		<h3>Location</h3>
		<ul>
			${locations
        .map(
          (location) => `
			<li>
				<label>
				<input type="checkbox" class="filter-checkbox" data-filter-type="country" value="${location}">
				${location}
				</label>
			</li>
			`
        )
        .join('')}
		</ul>
		</div>
		<div class="filter-group">
		<h3>Location</h3>
		<ul>
			${workModes
        .map(
          (workMode) => `
			<li>
				<label>
				<input type="checkbox" class="filter-checkbox" data-filter-type="workMode" value="${workMode}">
				${workMode}
				</label>
			</li>
			`
        )
        .join('')}
		</ul>
		</div>
	`;

  // Job list container (3/5)
  const jobList = document.createElement('div');
  jobList.classList.add('job-list');
  jobList.style.width = '60%';

  // eslint-disable-next-line no-use-before-define
  loadResults(jobList, data, currentResults, chunkSize);
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
      // eslint-disable-next-line no-use-before-define
      await loadMoreResults(jobList, data, currentResults, chunkSize, loadMoreButton);
      currentResults += chunkSize;
      if (currentResults >= data.length) {
        loadMoreButton.remove(); // Hide button when all data is loaded
      }
    });

    loadMoreContainer.append(loadMoreButton);
    jobList.append(loadMoreContainer);
  }

  // Append layout
  wrapper.append(sidebar, jobList);
  block.append(wrapper);

  // Enable filters
  document.querySelectorAll('.filter-checkbox').forEach((cb) => {
    // eslint-disable-next-line no-use-before-define
    cb.addEventListener('change', applyFilters);
  });
}

function loadResults(container, data, startIndex, chunkSize) {
  for (let i = startIndex; i < Math.min(startIndex + chunkSize, data.length); i += 1) {
    const div = document.createElement('div');
    div.classList.add('job-posting-card');

    div.dataset.workmode = data[i].workmode || '';
    div.dataset.employmenttype = data[i].employmenttype || '';
    div.dataset.region = data[i].region || '';
    div.dataset.location = data[i].country || '';
    div.dataset.city = data[i].city || '';

    const a = document.createElement('a');
    a.href = data[i].path;
    a.classList.add('job-card-link');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('job-card-content', 'h-full');

    const jobTitle = document.createElement('h2');
    jobTitle.textContent = data[i].jobtitle;
    contentDiv.append(jobTitle);

    const infoWrapper = document.createElement('div');
    infoWrapper.classList.add('job-card-info');
    contentDiv.append(infoWrapper);

    const location =
      [data[i].region, data[i].country, data[i].city].filter(Boolean).join(', ') || 'Location not specified';

    if (location) {
      addTextEl('p', location, infoWrapper, 'icon-globe', 'job-location');
    }

    if (data[i].workmode) {
      addTextEl('p', data[i].workmode, infoWrapper, 'icon-work', 'job-workmode');
    }

    if (data[i].employmenttype) {
      addTextEl('p', data[i].employmenttype, infoWrapper, 'icon-time', 'job-employmenttype');
    }

    a.append(contentDiv);
    div.append(a);
    container.insertBefore(div, container.lastChild); // Ensure it inserts before "Load More"
  }
}

// **Load More Results**
async function loadMoreResults(container, data, currentResults, chunkSize) {
  loadResults(container, data, currentResults, chunkSize);
}

function applyFilters() {
  const selected = {
    category: [],
    country: [],
  };

  document.querySelectorAll('.filter-checkbox:checked').forEach((cb) => {
    const type = cb.dataset.filterType;
    selected[type].push(cb.value);
  });

  document.querySelectorAll('.job-posting-card').forEach((card) => {
    const matchCategory = selected.category.length === 0 || selected.category.includes(card.dataset.category);
    const matchCountry = selected.country.length === 0 || selected.country.includes(card.dataset.country);
    card.style.display = matchCategory && matchCountry ? 'block' : 'none';
  });
}
