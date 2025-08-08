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
  addTextEl('h1', cfg.jobtitle, titleContainer, '', 'hero-career-name');

  const infoWrapper = document.createElement('div');
  infoWrapper.classList.add('hero-career-info');
  title.appendChild(infoWrapper);

  const location = [cfg.region, cfg.country, cfg.city].filter(Boolean).join(', ');
  if (location) {
    addTextEl('p', location, infoWrapper, 'icon-globe', 'hero-career-location');
  }

  if (cfg.workmode) {
    addTextEl('p', cfg.workmode, infoWrapper, 'icon-work', 'hero-career-workmode');
  }

  if (cfg.employmenttype) {
    addTextEl('p', cfg.employmenttype, infoWrapper, 'icon-time', 'hero-career-employmenttype');
  }

  if (cfg.jobid) {
    addTextEl('p', `Job ID: ${cfg.jobid}`, infoWrapper, '', false, 'hero-career-job-id');
  }

  if (cfg.jobdescription) {
    addTextEl('p', cfg.jobdescription, title, '', 'hero-career-description', 'lead');
  }

  if (cfg.email || cfg.linkedin || cfg.externallink) {
    const buttonContainer = document.createElement('p');
    buttonContainer.classList.add('button-container');
    title.appendChild(buttonContainer);

    if (cfg.email) {
      const emailLink = document.createElement('a');
      emailLink.target = '_blank';
      emailLink.rel = 'noopener noreferrer';
      emailLink.classList.add('button', 'primary', 'email');
      emailLink.setAttribute('aria-label', 'Apply by Email');
      emailLink.href = `mailto:${cfg.email}?subject=${encodeURIComponent(`Job Application: ${cfg.jobtitle || ''}`)}&body=${encodeURIComponent('Please provide your CV and motivation letter.')}`;
      emailLink.appendChild(document.createTextNode('Apply by Email'));
      buttonContainer.appendChild(emailLink);
    }

    if (cfg.externallink) {
      const externalLink = document.createElement('a');
      externalLink.target = '_blank';
      externalLink.rel = 'noopener noreferrer';
      externalLink.classList.add('button', 'primary', 'externallink');
      externalLink.setAttribute('aria-label', 'Apply on an external site');
      externalLink.href = cfg.externallink;
      externalLink.appendChild(document.createTextNode('Apply on'));
      buttonContainer.appendChild(externalLink);

      const externalLinkIcon = document.createElement('span');
      externalLinkIcon.classList.add('icon', 'icon-link-white');
      externalLink.appendChild(externalLinkIcon);
    }

    if (cfg.linkedin) {
      const linkedinLink = document.createElement('a');
      linkedinLink.target = '_blank';
      linkedinLink.rel = 'noopener noreferrer';
      linkedinLink.classList.add('button', 'primary', 'linkedin');
      linkedinLink.setAttribute('aria-label', 'Apply on LinkedIn');
      linkedinLink.href = cfg.linkedin;

      const linkedinIcon = document.createElement('span');
      linkedinIcon.classList.add('icon', 'icon-linkedin');

      linkedinLink.appendChild(document.createTextNode(' Apply on LinkedIn'));
      linkedinLink.append(linkedinIcon);

      buttonContainer.appendChild(linkedinLink);
    }
  }

  deleteConfigBlock(block, container);
}
