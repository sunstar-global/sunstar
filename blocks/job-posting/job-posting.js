import { createOptimizedPicture, fetchPlaceholders, getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';
import { getLanguage } from '../../scripts/scripts.js';

function deleteConfigBlock(block, firstNonCfgEl) {
  while (block.children.length > 0 && block.children[0] !== firstNonCfgEl) {
	block.children[0].remove();
  }
}

function addTextEl(tag, txt, parent, ...classes) {
	if (tag === 'p') {
	  const wrapper = document.createElement('div');
	  classes.forEach((c) => wrapper.classList.add(c));
  
	  if (Array.isArray(txt)) {
		txt.forEach((t) => {
		  const p = document.createElement('p');
		  p.textContent = t;
		  wrapper.appendChild(p);
		});
	  } else {
		const p = document.createElement('p');
		p.textContent = txt;
		wrapper.appendChild(p);
	  }
  
	  parent.appendChild(wrapper);
	  return;
	}
  
	if (Array.isArray(txt)) {
	  txt.forEach((t) => {
		const el = document.createElement(tag);
		el.textContent = t;
		classes.forEach((c) => el.classList.add(c));
		parent.appendChild(el);
	  });
	  return;
	}
  
	const el = document.createElement(tag);
	el.textContent = txt;
	classes.forEach((c) => el.classList.add(c));
	parent.appendChild(el);
}

export default async function decorate(block) {
	//remove the html
	const placeholders = await fetchPlaceholders(getLanguage());
	const cfg = readBlockConfig(block);
	console.log(cfg);
	const title = document.createElement('div');
	title.classList.add('hero-career-title');
	block.appendChild(title);
	addTextEl('h1', cfg.jobtitle, title, 'hero-career-name');
	addTextEl('p', cfg.jobdescription, title, 'hero-career-description');
	
	if (cfg.linkedin && cfg.linkedin !== '') {
		//wrap in p.button-container
		const buttonContainer = document.createElement('p');
		buttonContainer.classList.add('button-container');
		title.appendChild(buttonContainer);
		const linkedinLink = document.createElement('a');
		linkedinLink.target = '_blank';
		linkedinLink.rel = 'noopener noreferrer';
		linkedinLink.classList.add('button', 'primary');
		linkedinLink.setAttribute('aria-label', 'Apply on LinkedIn');
		linkedinLink.href = cfg.linkedin;
		linkedinLink.textContent = "Apply on LinkedIn";
		linkedinLink.classList.add('hero-career-linkedin');
		buttonContainer.appendChild(linkedinLink);
	}

	deleteConfigBlock(block, heroDiv);

}