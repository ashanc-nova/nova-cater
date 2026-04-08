export const parseFileNameFromHeader = (contentDisposition?: string, fallback?: string) => {
  if (!contentDisposition) {
    return fallback || 'invoice.pdf';
  }

  const filenameStarMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (filenameStarMatch?.[1]) {
    return decodeURIComponent(filenameStarMatch[1].trim());
  }

  const filenameMatch = /filename="([^"]+)"/i.exec(contentDisposition);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim();
  }

  const fallbackMatch = /filename=([^;]+)/i.exec(contentDisposition);
  if (fallbackMatch?.[1]) {
    return fallbackMatch[1].replace(/["']/g, '').trim();
  }

  return fallback || 'invoice.pdf';
};
