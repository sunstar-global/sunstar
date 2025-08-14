import { fetchIndex, getLanguage } from '../../scripts/scripts.js';
import { addTextEl } from '../../scripts/blocks-utils.js';

export default async function decorate(block) {
  const chunkSize = 6;
  block.innerHTML = '';
  const lang = getLanguage();
  const idxPrefix = lang === 'en' ? '' : `${lang}-`;
  const { data: unfilteredData } = await fetchIndex('query-index', `${idxPrefix}career-opportunities`);

  const data = unfilteredData.filter((item) => {
    if (item.robots && item.robots.includes('noindex')) {
      return false;
    }
    return true;
  });

  let currentResults = 0;

  const unique = (arr) => [...new Set(arr.filter(Boolean))];

  const countries = unique(data.map((item) => item.country));
  const regions = unique(data.map((item) => item.region));
  const cities = unique(data.map((item) => item.city));
  const departments = unique(data.map((item) => item.department).filter((dept) => dept && dept !== 0 && dept !== '0'));

  // eslint-disable-next-line no-unused-vars
  const employmentTypes = unique(data.map((item) => item.employmenttype));
  const workModes = unique(data.map((item) => item.workmode));

  const wrapper = document.createElement('div');
  wrapper.classList.add('job-opportunities-page-wrapper');

  const sidebar = document.createElement('aside');
  sidebar.classList.add('job-filter-sidebar');

  sidebar.innerHTML = `
    <h2 class="h3">Refine your search</h2>
    <div class="filter-group">
      <div class="accordion-header active">
        <h3>Department</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${departments
            .map(
              (department) => `
          <li>
            <label>
            <input type="checkbox" name="category" class="filter-checkbox" data-filter-type="department" value="${department}">
            ${department}
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

  const jobList = document.createElement('div');
  jobList.classList.add('job-list');

  // eslint-disable-next-line no-use-before-define
  loadResults(jobList, data, currentResults, chunkSize);
  currentResults += chunkSize;

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
        loadMoreButton.remove();
      }
    });

    loadMoreContainer.append(loadMoreButton);
    jobList.append(loadMoreContainer);
  }

  const selectedFiltersContainer = document.createElement('div');
  selectedFiltersContainer.classList.add('selected-filters');
  jobList.prepend(selectedFiltersContainer);

  wrapper.append(sidebar, jobList);
  block.append(wrapper);

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
    if (data[i].department !== 0 && data[i].department !== '0') {
      div.dataset.department = data[i].department;
    } else {
      div.dataset.department = '';
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('job-card-content', 'h-full');

    // place a inside h2
    const linkTitle = document.createElement('a');
    linkTitle.classList.add('job-posting-link');
    linkTitle.href = data[i].path;
    linkTitle.setAttribute('aria-label', `Apply for ${data[i].jobtitle}`);
    linkTitle.target = '_blank';
    linkTitle.rel = 'noopener noreferrer';
    linkTitle.textContent = data[i].jobtitle;

    const jobTitle = document.createElement('h2');
    jobTitle.append(linkTitle);
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

    if (data[i].jobid && data[i].jobid !== 0 && data[i].jobid !== '0') {
      addTextEl('p', `Job ID: ${data[i].jobid}`, infoWrapper, false, 'job-id');
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

    applyNowLink.appendChild(document.createTextNode('Apply now'));
    if (data[i].linkedin && data[i].linkedin !== '') {
      buttonContainer.appendChild(applyNowLink);
      const linkedinLink = document.createElement('a');
      linkedinLink.target = '_blank';
      linkedinLink.rel = 'noopener noreferrer';
      linkedinLink.classList.add('button', 'primary', 'linkedin', 'hero-career-linkedin');
      linkedinLink.setAttribute('aria-label', 'Apply on LinkedIn');
      linkedinLink.href = data[i].linkedin;

      const linkedinIcon = document.createElement('span');
      linkedinIcon.classList.add('icon', 'icon-linkedin');

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
    department: [],
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
    const matchDepartment = selected.department.length === 0 || selected.department.includes(card.dataset.department);

    card.style.display =
      matchCategory &&
      matchCountry &&
      matchCity &&
      matchRegion &&
      matchWorkMode &&
      matchEmploymentType &&
      matchDepartment
        ? 'block'
        : 'none';
  });
}
