import { useCallback } from 'react';
import { useStaticPage } from './loadStaticPage';

export default function AdminPage() {
  const transformDocument = useCallback((documentFragment) => {
    documentFragment.querySelectorAll('script').forEach((script) => script.remove());
  }, []);

  const htmlContent = useStaticPage({
    pageUrl: '/admin.html',
    scriptUrl: '/original-app.js',
    bodyClassName: 'admin-mode',
    transformDocument,
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className="admin-shell"
      style={{ width: '100%', minHeight: '100vh' }}
    />
  );
}
