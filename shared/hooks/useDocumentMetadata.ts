import { useEffect } from 'react';

interface UseDocumentMetadataProps {
  title?: string;
  faviconUrl?: string;
  defaultTitle?: string;
}

/**
 * Custom hook to dynamically update document title and favicon
 */
export const useDocumentMetadata = ({
  title,
  faviconUrl,
  defaultTitle = 'Online Ordering',
}: UseDocumentMetadataProps) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    } else if (defaultTitle) {
      document.title = defaultTitle;
    }

    // Cleanup function to restore default title on unmount
    return () => {
      if (defaultTitle) {
        document.title = defaultTitle;
      }
    };
  }, [title, defaultTitle]);

  useEffect(() => {
    // Update favicon
    if (faviconUrl) {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach((link) => link.remove());

      // Create new favicon link for standard browsers
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      faviconLink.href = faviconUrl;
      document.head.appendChild(faviconLink);

      // Create apple-touch-icon for iOS devices
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = faviconUrl;
      document.head.appendChild(appleTouchIcon);

      // Create shortcut icon for older browsers
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.href = faviconUrl;
      document.head.appendChild(shortcutIcon);
    }
  }, [faviconUrl]);
};

