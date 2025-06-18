import { createOptimizedPicture, readBlockConfig } from '../../scripts/lib-franklin.js';
import { fetchIndex, getLanguage } from '../../scripts/scripts.js';

export default async function decorate(block) { 
	//const blockCfg = readBlockConfig(block);
	const chunkSize = 8; // Set chunk size
	block.innerHTML = '';
	const lang = getLanguage();
	const idxPrefix = lang === 'en' ? '' : `${lang}-`;
	const {data } = await fetchIndex('query-index', `${idxPrefix}career-opportunities`);

	console.log('Career Opportunities Data:', data);
	let currentResults = 0; // Track number of loaded results

	const jobList = document.createElement('div');
	jobList.classList.add('job-list');

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
		await loadMoreResults(jobList, data, currentResults, chunkSize, loadMoreButton);
		currentResults += chunkSize;
		if (currentResults >= data.length) {
		  loadMoreButton.remove(); // Hide button when all data is loaded
		}
	  });
  
	  loadMoreContainer.append(loadMoreButton);
	  jobList.append(loadMoreContainer);
	}
  
	block.append(jobList);
}


function loadResults(container, data, startIndex, chunkSize) {
	console.log('data:', data);
	for (let i = startIndex; i < Math.min(startIndex + chunkSize, data.length); i += 1) {
		console.log('Loading job:', data[i]);
	  const div = document.createElement('div');
	  div.classList.add('job-card');
  
	  const a = document.createElement('a');
	  a.href = data[i].path;
	  a.classList.add('job-card-link');
  
  
	  const contentDiv = document.createElement('div');
	  contentDiv.classList.add('job-card-content', 'h-full');
  
	  const bqc = document.createElement('div');
	  bqc.classList.add('job-card-bqc');
  
	  const bq = document.createElement('blockquote');
	  bq.textContent = data[i]['jobtitle'];
	  bqc.append(bq);
	  contentDiv.append(bqc);
  
	  const nm = document.createElement('h2');
	  nm.textContent = data[i].pagename;
	  contentDiv.append(nm);
  
	  const role = document.createElement('p');
	  role.textContent = data[i]['jobdescription'] || 'No job description available';
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