import { useEffect, useState } from 'react';

const SHARED_ASSETS = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap' },
  { rel: 'stylesheet', href: '/original-style.css' },
];

function mountAssets() {
  const mounted = [];

  SHARED_ASSETS.forEach((asset) => {
    const selector = `link[rel="${asset.rel}"][href="${asset.href}"]`;
    let element = document.head.querySelector(selector);

    if (!element) {
      element = document.createElement('link');
      element.rel = asset.rel;
      element.href = asset.href;
      document.head.appendChild(element);
      mounted.push(element);
    }
  });

  return () => {
    mounted.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  };
}

export function useStaticPage({ pageUrl, scriptUrl, bodyClassName, transformDocument }) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const cleanupAssets = mountAssets();
    let cancelled = false;

    fetch(pageUrl)
      .then((response) => response.text())
      .then((html) => {
        if (cancelled) {
          return;
        }

        const parser = new DOMParser();
        const documentFragment = parser.parseFromString(html, 'text/html');

        if (typeof transformDocument === 'function') {
          transformDocument(documentFragment);
        }

        document.title = documentFragment.title || document.title;
        setHtmlContent(documentFragment.body.innerHTML);
      })
      .catch((error) => {
        console.error(`Failed to load static page: ${pageUrl}`, error);
      });

    return () => {
      cancelled = true;
      cleanupAssets();
    };
  }, [pageUrl, transformDocument]);

  useEffect(() => {
    if (!htmlContent) {
      return undefined;
    }

    if (bodyClassName) {
      document.body.classList.add(bodyClassName);
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (bodyClassName) {
        document.body.classList.remove(bodyClassName);
      }

      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [bodyClassName, htmlContent, scriptUrl]);

  return htmlContent;
}