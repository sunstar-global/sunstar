/* eslint-disable */
(function () {
  let isAEMSitesOptimizerPreflightAppLoaded = false;
  function loadAEMSitesOptimizerPreflightApp() {
    const script = document.createElement('script');
    script.src =
      'https://experience.adobe.com/solutions/OneAdobe-aem-sites-optimizer-preflight-mfe/static-assets/resources/sidekick/client.js?source=plugin';
    script.onload = function () {
      isAEMSitesOptimizerPreflightAppLoaded = true;
    };
    script.onerror = function () {
      console.error('Error loading AEMSitesOptimizerPreflightApp.');
    };
    document.head.appendChild(script);
  }

  function handlePluginButtonClick() {
    if (!isAEMSitesOptimizerPreflightAppLoaded) {
      loadAEMSitesOptimizerPreflightApp();
    }
  }

  // The code snippet for the Sidekick V1 extension, https://chromewebstore.google.com/detail/aem-sidekick/ccfggkjabjahcjoljmgmklhpaccedipo?hl=en
  const sidekick = document.querySelector('helix-sidekick');
  if (sidekick) {
    // sidekick already loaded
    sidekick.addEventListener('custom:preflight', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener(
      'sidekick-ready',
      () => {
        document.querySelector('helix-sidekick').addEventListener('custom:preflight', handlePluginButtonClick);
      },
      { once: true }
    );
  }

  // The code snippet for the Sidekick V2 extension, https://chromewebstore.google.com/detail/aem-sidekick/igkmdomcgoebiipaifhmpfjhbjccggml?hl=en
  const sidekickV2 = document.querySelector('aem-sidekick');
  if (sidekickV2) {
    // sidekick already loaded
    sidekickV2.addEventListener('custom:preflight', handlePluginButtonClick);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener(
      'sidekick-ready',
      () => {
        document.querySelector('aem-sidekick').addEventListener('custom:preflight', handlePluginButtonClick);
      },
      { once: true }
    );
  }
})();
