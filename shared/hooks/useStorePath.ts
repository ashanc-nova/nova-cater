import { useParams } from 'react-router-dom';

export const useStorePath = () => {
  const { storeName } = useParams<{ storeName?: string }>();

  return (path: string) => {
    if (!storeName) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `/store/${storeName}${normalized}`;
  };
};
