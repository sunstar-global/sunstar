import { readBlockConfig } from '../../scripts/lib-franklin.js';
import { addTextEl } from '../../scripts/blocks-utils.js';

function deleteConfigBlock(block, firstNonCfgEl) {
  while (block.children.length > 0 && block.children[0] !== firstNonCfgEl) {
	block.children[0].remove();
  }
}

export default async function decorate(block) {
	
	const cfg = readBlockConfig(block);
	
	const container = document.createElement('div');
	container.classList.add('section', 'hero-career-container');
	const title = document.createElement('div');
	title.classList.add('hero-career-title');
	const titleContainer = document.createElement('div');
	titleContainer.classList.add('hero-career-title-container');
	block.appendChild(container);
	container.appendChild(title);
	title.appendChild(titleContainer);
	addTextEl('h1', cfg.jobtitle, titleContainer, '','hero-career-name');

	const infoWrapper = document.createElement('div');
	infoWrapper.classList.add('hero-career-info');
	title.appendChild(infoWrapper);

	// 1. Location
	const location = [cfg.region, cfg.country, cfg.city].filter(Boolean).join(', ');
	if (location) {
		addTextEl('p', location, infoWrapper, 'icon-globe', 'hero-career-location');
	}

	// 2. Work mode
	if (cfg.workmode) {
		addTextEl('p', cfg.workmode, infoWrapper, 'icon-work', 'hero-career-workmode');
	}

	// 3. Employment type
	if (cfg.employmenttype) {
		addTextEl('p', cfg.employmenttype, infoWrapper, 'icon-time', 'hero-career-employmenttype');
	}

	addTextEl('p', cfg.jobdescription, title, '', 'hero-career-description', 'lead');
	

	if (cfg.linkedin && cfg.linkedin !== '') {
		const buttonContainer = document.createElement('p');
		buttonContainer.classList.add('button-container');
		title.appendChild(buttonContainer);
		const applyNowLink = document.createElement('a');
		applyNowLink.target = '_blank';
		applyNowLink.rel = 'noopener noreferrer';
		applyNowLink.classList.add('button', 'primary', 'hero-career-applynow');
		applyNowLink.setAttribute('aria-label', 'Apply now');
		applyNowLink.href = cfg.applynow;

		// Add the link text as a text node (do NOT use textContent here)
		applyNowLink.appendChild(document.createTextNode(' Apply now'));

		buttonContainer.appendChild(applyNowLink);
		const linkedinLink = document.createElement('a');
		linkedinLink.target = '_blank';
		linkedinLink.rel = 'noopener noreferrer';
		linkedinLink.classList.add('button', 'primary', 'linkedin', 'hero-career-linkedin');
		linkedinLink.setAttribute('aria-label', 'Apply on LinkedIn');
		linkedinLink.href = cfg.linkedin;
	
		// Add the icon span
		const linkedinIcon = document.createElement('span');
		linkedinIcon.classList.add('icon', 'icon-linkedin');
		
		// Add the link text as a text node (do NOT use textContent here)
		linkedinLink.appendChild(document.createTextNode(' Apply on LinkedIn'));
		linkedinLink.append(linkedinIcon);
	
		buttonContainer.appendChild(linkedinLink);
	}

	deleteConfigBlock(block, container);

}