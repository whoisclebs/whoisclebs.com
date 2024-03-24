import * as params from '@params';

const mode = document.getElementById('mode');

if (mode !== null) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute(params.darkModeTheme, '');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.removeAttribute(params.darkModeTheme);
    }
  })

  mode.addEventListener('click', () => {
    document.documentElement.toggleAttribute(params.darkModeTheme);
    localStorage.setItem('theme', document.documentElement.hasAttribute(params.darkModeTheme) ? 'dark' : 'light');
    changeGiscusIframeTheme();
  });

  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute(params.darkModeTheme, '');
  } else {
    document.documentElement.removeAttribute(params.darkModeTheme);
  }
}

function changeGiscusIframeTheme () {
  const giscusIframe = document.querySelector('.giscus-frame');
  console.log(giscusIframe);
  if (giscusIframe !== null) {
    giscusIframe.contentWindow.postMessage({ giscus: { setConfig: {theme: document.documentElement.hasAttribute(params.darkModeTheme) ? 'dark' : 'light' }} }, 'https://giscus.app');
  }
}