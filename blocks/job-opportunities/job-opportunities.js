import { fetchIndex, getLanguage } from '../../scripts/scripts.js';
import { addTextEl } from '../../scripts/blocks-utils.js';
import { fetchPlaceholders } from '../../scripts/lib-franklin.js';

// detect Japanese pages robustly: path segment can be 'jp' or 'ja', or document language may start with 'ja'/'jp'
export function isPageJapanese(pathname = window.location.pathname) {
  const lang = getLanguage(pathname, true);
  const pathSeg = String(pathname || '').split('/')[1];
  const docLang = document.documentElement.lang || '';
  return (
    pathSeg === 'jp' ||
    pathSeg === 'ja' ||
    docLang.toLowerCase().startsWith('ja') ||
    docLang.toLowerCase().startsWith('jp') ||
    lang === 'jp'
  );
}

export default async function decorate(block) {
  const chunkSize = 6;
  block.innerHTML = '';
  const lang = getLanguage(window.location.pathname, true);
  const isJapanese = isPageJapanese();
  const placeholders = await fetchPlaceholders(getLanguage(window.location.pathname, true));
  const idxPrefix = lang === 'en' ? '' : `${lang}-`;
  const { data: unfilteredData } = await fetchIndex('query-index', `${idxPrefix}career-opportunities`);

  let data = (unfilteredData || []).filter((item) => {
    if (item.robots && item.robots.includes('noindex')) {
      return false;
    }
    return true;
  });

  data = data.filter((item) => {
    // Require a job title and a valid path
    if (!item.jobtitle || !item.path) return false;
    const path = String(item.path).trim();
    if (path === '' || path === '#' || path.toUpperCase().includes('CALC')) return false;
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
    <h2 class="h3">${placeholders['refine-search']}</h2>
    <div class="filter-group">
      <div class="accordion-header active">
        <h3>${placeholders['employement-function']}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${departments
            .map(
              (department) => `
          <li>
            <label>
            <input type="checkbox" name="category${department}" class="filter-checkbox" data-filter-type="department" value="${department}">
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
        <h3>${placeholders.region}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${regions
            .map(
              (region) => `
          <li>
            <label>
            <input type="checkbox" name="region${region}" class="filter-checkbox" data-filter-type="region" value="${region}">
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
        <h3>${placeholders.country}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${countries
            .map(
              (country) => `
          <li>
            <label>
            <input type="checkbox" name="country${country}" class="filter-checkbox" data-filter-type="country" value="${country}">
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
        <h3>${placeholders.city}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${cities
            .map(
              (city) => `
          <li>
            <label>
            <input type="checkbox" name="city${city}" class="filter-checkbox" data-filter-type="city" value="${city}">
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
        <h3>${placeholders.workmode}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${workModes
            .map(
              (workMode) => `
          <li>
            <label>
            <input type="checkbox" name="workmode${workMode}" class="filter-checkbox" data-filter-type="workmode" value="${workMode}">
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
        <h3>${placeholders.employementtype}</h3>
        <span class="icon icon-chevron-down"></span>
      </div>
      <div class="accordion-body open">
        <ul>
          ${employmentTypes
            .map(
              (employmentType) => `
          <li>
            <label>
            <input type="checkbox" name="employmenttype${employmentType}" class="filter-checkbox" data-filter-type="employmenttype" value="${employmentType}">
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

  const noJobsMessage = document.createElement('div');
  noJobsMessage.classList.add('no-job-listings');
  noJobsMessage.style.display = 'none';
  const noJobsCardEn = `
    <div class="no-job-listings-card">
      <div class="no-job-listings-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7H20V20H4V7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M8 7V4H16V7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 12H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 16H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="no-job-listings-content">
        <h2>No opportunities listed right now</h2>
        <p>Thank you for your interest in Sunstar. There are currently no open positions listed. Visit Sunstar's <a href="https://www.linkedin.com/company/sunstar-global/" target="_blank" rel="noopener noreferrer">LinkedIn page</a> for additional opportunities and updates.</p>
      </div>
    </div>
  `;

  const noJobsCardJa = `
    <div class="no-job-listings-card">
      <div class="no-job-listings-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7H20V20H4V7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M8 7V4H16V7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 12H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 16H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="no-job-listings-content">
        <h2>現在、公開中の求人はありません</h2>
        <p>サンスターにご関心をお寄せいただき、ありがとうございます。</p>
        <p>グローバルの最新の情報や今後の採用については<a href="https://www.linkedin.com/company/sunstar-global/" target="_blank" rel="noopener noreferrer">LinkedInページ</a>、日本の採用についてはこちらの<a href="https://sunstar.recruitment.jp/">採用情報</a>をご覧ください。</p>
        <p class="no-job-note">※本メッセージはキャリアページに掲載中の求人がない場合に表示されます。</p>
      </div>
    </div>
  `;

  noJobsMessage.innerHTML = isJapanese ? noJobsCardJa : noJobsCardEn;
  jobList.append(noJobsMessage);

  if (data.length > 0) {
    // eslint-disable-next-line no-use-before-define
    loadResults(jobList, data, currentResults, chunkSize, placeholders);
    currentResults += chunkSize;
  } else {
    // show the no-results card regardless of language; content inside is language-specific
    noJobsMessage.style.display = 'block';
  }

  if (currentResults < data.length) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.classList.add('load-more-container');

    const loadMoreButton = document.createElement('button');
    loadMoreButton.classList.add('primary');
    loadMoreButton.classList.add('button');
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.addEventListener('click', async () => {
      // eslint-disable-next-line no-use-before-define
      await loadMoreResults(jobList, data, currentResults, chunkSize, placeholders);
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
    cb.addEventListener('change', () => applyFilters(placeholders));
  });

  const noJobsNode = document.querySelector('.no-job-listings');
  if (data.length === 0 && noJobsNode) {
    noJobsNode.style.display = 'block';
  }

  document.querySelectorAll('.accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('open');
      header.classList.toggle('active');
    });
  });
}

function loadResults(container, data, startIndex, chunkSize, placeholders) {
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
      [data[i].region, data[i].country, data[i].city].filter(Boolean).join(', ') ||
      placeholders['location-not-specified'];

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
      addTextEl('p', `${placeholders['job-id']}: ${data[i].jobid}`, infoWrapper, false, 'job-id');
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
    applyNowLink.setAttribute('aria-label', `${placeholders['apply-now']}`);
    applyNowLink.href = data[i].path;

    applyNowLink.appendChild(document.createTextNode(`${placeholders['apply-now']}`));
    buttonContainer.appendChild(applyNowLink);

    if (data[i].linkedin && data[i].linkedin !== '' && data[i].linkedin.includes('linkedin.com')) {
      const linkedinLink = document.createElement('a');
      linkedinLink.target = '_blank';
      linkedinLink.rel = 'noopener noreferrer';
      linkedinLink.classList.add('button', 'primary', 'linkedin', 'hero-career-linkedin');
      linkedinLink.setAttribute('aria-label', `${placeholders['apply-on-linkedin']}`);
      linkedinLink.href = data[i].linkedin;

      const linkedinIcon = document.createElement('span');
      linkedinIcon.classList.add('icon', 'icon-linkedin');

      linkedinLink.appendChild(document.createTextNode(`${placeholders['apply-on-linkedin']}`));
      linkedinLink.append(linkedinIcon);

      buttonContainer.appendChild(linkedinLink);
    }

    div.append(contentDiv);
    container.insertBefore(div, container.lastChild);
  }
}

async function loadMoreResults(container, data, currentResults, chunkSize, placeholders) {
  loadResults(container, data, currentResults, chunkSize, placeholders);
}

function updateSelectedFiltersUI(selected, placeholders) {
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
        applyFilters(placeholders);
      });

      tag.appendChild(closeBtn);
      container.appendChild(tag);
    });
  });

  if (container.innerHTML.trim() !== '') {
    const clearAll = document.createElement('button');
    clearAll.classList.add('clear-all-filters');
    clearAll.textContent = `${placeholders['clear-all']}`;
    clearAll.addEventListener('click', () => {
      document.querySelectorAll('.filter-checkbox').forEach((cb) => {
        cb.checked = false;
      });
      // eslint-disable-next-line no-use-before-define
      applyFilters(placeholders);
    });
    container.appendChild(clearAll);
  }
}

const FILTER_TYPES = ['category', 'country', 'city', 'region', 'workmode', 'employmenttype', 'department'];

function getJobs() {
  return [...document.querySelectorAll('.job-posting-card')].map((el) => ({
    el,
    category: el.dataset.category,
    country: el.dataset.country,
    city: el.dataset.city,
    region: el.dataset.region,
    workmode: el.dataset.workmode,
    employmenttype: el.dataset.employmenttype,
    department: el.dataset.department,
  }));
}

function matches(job, selected, exceptType = null) {
  return FILTER_TYPES.every((t) => {
    if (t === exceptType) return true;
    const sel = selected[t];
    return sel.length === 0 || sel.includes(job[t]);
  });
}

function updateFilterStates(selected) {
  const jobs = getJobs();

  const availability = {};
  FILTER_TYPES.forEach((type) => {
    const remaining = jobs.filter((job) => matches(job, selected, type));
    availability[type] = new Set(remaining.map((job) => job[type]));
  });

  document.querySelectorAll('.filter-checkbox').forEach((cb) => {
    const type = cb.dataset.filterType;
    const allowed = availability[type].has(cb.value);
    const shouldDisable = !allowed && !cb.checked;
    cb.disabled = shouldDisable;
    cb.setAttribute('aria-disabled', shouldDisable ? 'true' : 'false');
    cb.closest('label')?.classList.toggle('is-disabled', shouldDisable);
  });
}

function applyFilters(placeholders) {
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
    selected[cb.dataset.filterType].push(cb.value);
  });

  updateSelectedFiltersUI(selected, placeholders);
  updateFilterStates(selected);

  let visibleCount = 0;
  document.querySelectorAll('.job-posting-card').forEach((card) => {
    const matchCategory = !selected.category.length || selected.category.includes(card.dataset.category);
    const matchCountry = !selected.country.length || selected.country.includes(card.dataset.country);
    const matchCity = !selected.city.length || selected.city.includes(card.dataset.city);
    const matchRegion = !selected.region.length || selected.region.includes(card.dataset.region);
    const matchWorkMode = !selected.workmode.length || selected.workmode.includes(card.dataset.workmode);
    const matchEmploymentType =
      !selected.employmenttype.length || selected.employmenttype.includes(card.dataset.employmenttype);
    const matchDepartment = !selected.department.length || selected.department.includes(card.dataset.department);

    const isVisible =
      matchCategory &&
      matchCountry &&
      matchCity &&
      matchRegion &&
      matchWorkMode &&
      matchEmploymentType &&
      matchDepartment;

    card.style.display = isVisible ? 'block' : 'none';
    if (isVisible) visibleCount += 1;
  });

  const noJobsMessage = document.querySelector('.no-job-listings');
  if (noJobsMessage) {
    if (visibleCount === 0) {
      noJobsMessage.style.display = 'block';
    } else {
      noJobsMessage.style.display = 'none';
    }
  }
}
