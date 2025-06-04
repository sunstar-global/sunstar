import { createOptimizedPicture, fetchPlaceholders, getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';
import { getLanguage } from '../../scripts/scripts.js';

function deleteConfigBlock(block, firstNonCfgEl) {
  while (block.children.length > 0 && block.children[0] !== firstNonCfgEl) {
	block.children[0].remove();
  }
}

function addTextEl(tag, txt, parent, ...classes) {
  const newDiv = document.createElement(tag);
	newDiv.textContent = txt;
//check if txt is an array and if so create 2 elements
  if (Array.isArray(txt)) {
	txt.forEach((t) => {
	  const el = document.createElement(tag);
	  el.textContent = t;
	  classes.forEach((c) => el.classList.add(c));
	  parent.appendChild(el);
	});
	return;
  }
  classes.forEach((c) => newDiv.classList.add(c));
  parent.appendChild(newDiv);
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
	deleteConfigBlock(block, heroDiv);
	//append the title to the block

}