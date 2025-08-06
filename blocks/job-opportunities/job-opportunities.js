import { fetchIndex, getLanguage } from '../../scripts/scripts.js';
import { addTextEl } from '../../scripts/blocks-utils.js';

export default async function decorate(block) {
  // const blockCfg = readBlockConfig(block);
  const chunkSize = 6; // Set chunk size
  block.innerHTML = '';
  const lang = getLanguage();
  const idxPrefix = lang === 'en' ? '' : `${lang}-`;
  const { data } = await fetchIndex('query-index', `${idxPrefix}career-opportunities`);

  let currentResults = 0; // Track number of loaded results

  const unique = (arr) => [...new Set(arr.filter(Boolean))];

  const countries = unique(data.map((item) => item.country));
  const regions = unique(data.map((item) => item.region));
  const cities = unique(data.map((item) => item.city));

  // eslint-disable-next-line no-unused-vars
  const employmentTypes = unique(data.map((item) => item.employmenttype));
  const workModes = unique(data.map((item) => item.workmode));

  const wrapper = document.createElement('div');
  wrapper.classList.add('job-opportunities-page-wrapper');

  // Sidebar filter (2/5)
  const sidebar = document.createElement('aside');
  sidebar.style.position = 'sticky';
  sidebar.style.top = '1rem'; // adjust if needed
  sidebar.style.alignSelf = 'flex-start'; // needed for sticky to work
  sidebar.classList.add('job-filter-sidebar');

  sidebar.innerHTML = `
    <h2 class="h3">Refine your search</h2>
		<div class="filter-group">
      <div class="accordion-header active">
        <h3>Region</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${regions
            .map(
              (region) => `
          <li>
            <label>
            <input type="checkbox" name="region" class="filter-checkbox" data-filter-type="region" value="${region}">
            ${region}
            </label>
          </li>
          `
            )
            .join('')}
        </ul>
      </div>
		</div>
    <div class="filter-group">
      <div class="accordion-header active">
        <h3>Country</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${countries
            .map(
              (country) => `
          <li>
            <label>
            <input type="checkbox" name="country" class="filter-checkbox" data-filter-type="country" value="${country}">
            ${country}
            </label>
          </li>
          `
            )
            .join('')}
        </ul>
      </div>
		</div>
		<div class="filter-group">
      <div class="accordion-header active">
        <h3>City</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${cities
            .map(
              (city) => `
          <li>
            <label>
            <input type="checkbox" name="city" class="filter-checkbox" data-filter-type="city" value="${city}">
            ${city}
            </label>
          </li>
          `
            )
            .join('')}
        </ul>
      </div>
		</div>
		<div class="filter-group">
      <div class="accordion-header active">
        <h3>Work Mode</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${workModes
            .map(
              (workMode) => `
          <li>
            <label>
            <input type="checkbox" name="workmode" class="filter-checkbox" data-filter-type="workmode" value="${workMode}">
            ${workMode}
            </label>
          </li>
          `
            )
            .join('')}
        </ul>
      </div>
    </div>
    <div class="filter-group">
      <div class="accordion-header active">
        <h3>Employment Type</h3> 
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${employmentTypes
            .map(
              (employmentType) => `
          <li>
            <label>
            <input type="checkbox" name="employmenttype" class="filter-checkbox" data-filter-type="employmenttype" value="${employmentType}">
            ${employmentType}
            </label>
          </li>
          `
            )
            .join('')}
        </ul>
      </div>
    </div>
	`;

  // Job list container (3/5)
  const jobList = document.createElement('div');
  jobList.classList.add('job-list');
  jobList.style.width = '68%';

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

  const selectedFiltersContainer = document.createElement('div');
  selectedFiltersContainer.classList.add('selected-filters');
  jobList.prepend(selectedFiltersContainer);

  const title = document.createElement('h2');
  title.classList.add('h1', 'main-title');
  title.textContent = 'Job Opportunities';
  jobList.prepend(title);

  // Append layout
  wrapper.append(sidebar, jobList);
  block.append(wrapper);

  // Enable filters
  document.querySelectorAll('.filter-checkbox').forEach((cb) => {
    // eslint-disable-next-line no-use-before-define
    cb.addEventListener('change', applyFilters);
  });

  document.querySelectorAll('.accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('open');
      header.classList.toggle('active');
    });
  });
}

function loadResults(container, data, startIndex, chunkSize) {
  for (let i = startIndex; i < Math.min(startIndex + chunkSize, data.length); i += 1) {
    const div = document.createElement('div');
    div.classList.add('job-posting-card');

    div.dataset.workmode = data[i].workmode || '';
    div.dataset.employmenttype = data[i].employmenttype || '';
    div.dataset.region = data[i].region || '';
    div.dataset.country = data[i].country || '';
    div.dataset.city = data[i].city || '';

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

    if (data[i].jobdescription && data[i].jobdescription !== '') {
      const jobDescription = document.createElement('p');
      jobDescription.textContent = data[i].jobdescription;
      contentDiv.append(jobDescription);
    }

    const buttonContainer = document.createElement('p');
    buttonContainer.classList.add('button-container');
    contentDiv.appendChild(buttonContainer);
    const applyNowLink = document.createElement('a');
    applyNowLink.target = '_blank';
    applyNowLink.rel = 'noopener noreferrer';
    applyNowLink.classList.add('button', 'primary', 'hero-career-applynow');
    applyNowLink.setAttribute('aria-label', 'Apply now');
    applyNowLink.href = data[i].path;

    // Add the link text as a text node (do NOT use textContent here)
    applyNowLink.appendChild(document.createTextNode('Apply now'));
    if (data[i].linkedin && data[i].linkedin !== '') {
      buttonContainer.appendChild(applyNowLink);
      const linkedinLink = document.createElement('a');
      linkedinLink.target = '_blank';
      linkedinLink.rel = 'noopener noreferrer';
      linkedinLink.classList.add('button', 'primary', 'linkedin', 'hero-career-linkedin');
      linkedinLink.setAttribute('aria-label', 'Apply on LinkedIn');
      linkedinLink.href = data[i].linkedin;

      // Add the icon span
      const linkedinIcon = document.createElement('span');
      linkedinIcon.classList.add('icon', 'icon-linkedin');

      // Add the link text as a text node (do NOT use textContent here)
      linkedinLink.appendChild(document.createTextNode('Apply on LinkedIn'));
      linkedinLink.append(linkedinIcon);

      buttonContainer.appendChild(linkedinLink);
    }

    div.append(contentDiv);
    container.insertBefore(div, container.lastChild);
  }
}

async function loadMoreResults(container, data, currentResults, chunkSize) {
  loadResults(container, data, currentResults, chunkSize);
}

function updateSelectedFiltersUI(selected) {
  const container = document.querySelector('.selected-filters');
  container.innerHTML = '';

  if (Object.values(selected).some((values) => values.length > 0)) {
    container.classList.add('active');
  } else {
    container.classList.remove('active');
  }

  Object.entries(selected).forEach(([type, values]) => {
    values.forEach((value) => {
      const tag = document.createElement('span');
      tag.classList.add('filter-tag');
      tag.textContent = value;

      const closeBtn = document.createElement('button');
      closeBtn.classList.add('remove-filter');
      closeBtn.innerHTML = '<span class="icon icon-close" aria-hidden="true"></span><span class="sr-only">Close</span>';
      closeBtn.setAttribute('aria-label', `Remove filter ${value}`);

      closeBtn.addEventListener('click', () => {
        document.querySelectorAll(`.filter-checkbox[data-filter-type="${type}"]`).forEach((cb) => {
          if (cb.value === value) cb.checked = false;
        });
        // eslint-disable-next-line no-use-before-define
        applyFilters();
      });

      tag.appendChild(closeBtn);
      container.appendChild(tag);
    });
  });

  if (container.innerHTML.trim() !== '') {
    const clearAll = document.createElement('button');
    clearAll.classList.add('clear-all-filters');
    clearAll.textContent = 'Clear all';
    clearAll.addEventListener('click', () => {
      document.querySelectorAll('.filter-checkbox').forEach((cb) => {
        cb.checked = false;
      });
      // eslint-disable-next-line no-use-before-define
      applyFilters();
    });
    container.appendChild(clearAll);
  }
}

function applyFilters() {
  const selected = {
    category: [],
    country: [],
    city: [],
    region: [],
    workmode: [],
    employmenttype: [],
  };

  document.querySelectorAll('.filter-checkbox:checked').forEach((cb) => {
    const type = cb.dataset.filterType;
    selected[type].push(cb.value);
  });

  updateSelectedFiltersUI(selected);

  document.querySelectorAll('.job-posting-card').forEach((card) => {
    const matchCategory = selected.category.length === 0 || selected.category.includes(card.dataset.category);
    const matchCountry = selected.country.length === 0 || selected.country.includes(card.dataset.country);
    const matchCity = selected.city.length === 0 || selected.city.includes(card.dataset.city);
    const matchRegion = selected.region.length === 0 || selected.region.includes(card.dataset.region);
    const matchWorkMode = selected.workmode.length === 0 || selected.workmode.includes(card.dataset.workmode);
    const matchEmploymentType =
      selected.employmenttype.length === 0 || selected.employmenttype.includes(card.dataset.employmenttype);

    card.style.display =
      matchCategory && matchCountry && matchCity && matchRegion && matchWorkMode && matchEmploymentType
        ? 'block'
        : 'none';
  });
}
