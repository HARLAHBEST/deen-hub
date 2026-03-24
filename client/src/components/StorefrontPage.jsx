import { useCallback } from 'react';
import { useStaticPage } from './loadStaticPage';

export default function StorefrontPage() {
  const transformDocument = useCallback((documentFragment) => {
    documentFragment.querySelector('#adminPanel')?.remove();
    documentFragment.querySelector('#fileInput')?.remove();
    documentFragment.querySelector('#apToast')?.remove();
    documentFragment.querySelector('.admin-fab')?.remove();
    documentFragment.querySelectorAll('script').forEach((script) => script.remove());
  }, []);

  const htmlContent = useStaticPage({
    pageUrl: '/storefront.html',
    scriptUrl: '/original-app.js',
    transformDocument,
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className="storefront-shell"
      style={{ width: '100%', minHeight: '100vh' }}
    />
  );
}
