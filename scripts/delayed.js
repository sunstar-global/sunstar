import { sampleRUM, isInternalPage } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { getEnvType, loadConsentManager, loadScript } from './scripts.js';
// Core Web Vitals RUM collection
sampleRUM('cwv');
async function loadAdobeLaunch() {
  const adobeotmSrc = {
    dev: 'https://assets.adobedtm.com/467469cdd595/f9651373cafd/launch-a46d93f0c752-development.min.js',
    preview: 'https://assets.adobedtm.com/467469cdd595/f9651373cafd/launch-8108dcbd2d02-staging.min.js',
    live: 'https://assets.adobedtm.com/467469cdd595/f9651373cafd/launch-9e812df82057.min.js',
  };
  await loadScript(adobeotmSrc[getEnvType()]);
}
window.addEventListener('consentmanager', () => {
  if (window.uc) {
    // unblock adobe launch
    window.uc?.deactivateBlocking(['f6nkjdUL']);
  }
});

/**
 * GA Tag
 * */
function loadGAScript(url, callback) {
  const head = document.querySelector('head');
  let script = head.querySelector(`script[src="${url}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = url;
    script.async = true;
    head.append(script);
    script.onload = callback;
    return script;
  }
  return script;
}

async function loadGA() {
  const gaId = 'G-EBP844FZRJ';
  loadGAScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`, () => {
    // eslint-disable-next-line
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      // eslint-disable-next-line
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', gaId);
    // eslint-disable-next-line
    ga('send', 'pageview');
    // eslint-disable-next-line
    ga('create', gaId, 'auto');
  });
}

if (!isInternalPage()) {
  await loadConsentManager();
  await loadAdobeLaunch();
  if (getEnvType() === 'live') {
    await loadGA();
  }
}
